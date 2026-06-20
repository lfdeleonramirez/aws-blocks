import { api, authApi, adminApi } from 'aws-blocks';
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Divider,
  Alert,
  Link,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { onAuthChange } from '@aws-blocks/blocks/ui';
import config from './auth.config.json';
import Layout from './layout';
import Admin from './admin';

type AuthView = 'signIn' | 'signUp' | 'confirmSignUp' | 'mfaCode' | 'mfaSetup' | 'mfaSelectType';

// Traduce errores del backend a mensajes claros
function parseAuthError(message: string, view: AuthView): string {
  const lower = message.toLowerCase();

  if (lower.includes('password') && (lower.includes('length') || lower.includes('short') || lower.includes('at least'))) {
    return 'La contraseña es muy corta. Revisa los requisitos mínimos.';
  }
  if (lower.includes('invalidpassword') || lower.includes('invalid password')) {
    return 'La contraseña no cumple con la política. Debe tener al menos 8 caracteres y un número.';
  }
  if (lower.includes('password') && (lower.includes('digit') || lower.includes('number'))) {
    return 'La contraseña debe incluir al menos un número (0-9).';
  }
  if (lower.includes('password') && lower.includes('uppercase')) {
    return 'La contraseña debe incluir al menos una letra mayúscula (A-Z).';
  }
  if (lower.includes('password') && lower.includes('special')) {
    return 'La contraseña debe incluir al menos un carácter especial (!@#$).';
  }
  if (lower.includes('invalidcredentials') || lower.includes('invalid credentials') || lower.includes('notauthorized') || lower.includes('incorrect')) {
    return view === 'signIn'
      ? 'Email o contraseña incorrectos. ¿No tienes cuenta? Crea una abajo.'
      : 'Credenciales inválidas.';
  }
  if (lower.includes('useralreadyexists') || lower.includes('already exists')) {
    return 'Ya existe una cuenta con ese email. Intenta iniciar sesión.';
  }
  if (lower.includes('usernotfound') || lower.includes('user not found') || lower.includes('usernotfound')) {
    return 'No existe una cuenta con ese email. ¿Quieres crear una?';
  }
  if (lower.includes('invalidcode') || lower.includes('codemismatch') || (lower.includes('code') && lower.includes('invalid'))) {
    return 'Código incorrecto o expirado. Intenta de nuevo.';
  }
  if (lower.includes('notconfirmed') || lower.includes('not confirmed') || lower.includes('unconfirmed')) {
    return 'Tu cuenta necesita confirmación. Ingresa el código de verificación.';
  }
  if (lower.includes('limit') || lower.includes('too many') || lower.includes('throttl')) {
    return 'Demasiados intentos. Espera un momento.';
  }

  // Fallback
  if (message.length > 0 && message.length < 200) return message;
  return 'Ocurrió un error. Intenta de nuevo.';
}

function App() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [view, setView] = useState<AuthView>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [currentPath, setCurrentPath] = useState('/overview');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaSession, setMfaSession] = useState<any>(null);
  const [mfaTypes, setMfaTypes] = useState<string[]>([]);

  const c = config.auth;

  // En modo dev, pide el código de verificación al backend y lo muestra
  const fetchDevCode = async () => {
    try {
      const result = await adminApi.getLastCode();
      if (result?.code) {
        setDevCode(result.code);
      }
    } catch {
      // No pasa nada si falla — solo es para dev
    }
  };

  useEffect(() => {
    document.title = config.app.title;
    // Verificar estado actual de auth al cargar
    authApi.getAuthState().then((state: any) => {
      if (state?.state === 'signedIn' && state.user) {
        setUser({ username: state.user.username });
        api.getProfile().then(setProfile).catch(() => {});
      }
      setInitializing(false);
    }).catch(() => setInitializing(false));
    const unsubscribe = onAuthChange(authApi, (u) => {
      setUser(u ? { username: u.username } : null);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const result = await authApi.setAuthState({ action: 'signIn', username: email, password });
      console.log('[AUTH DEBUG] signIn result:', JSON.stringify(result));

      if (result?.error) {
        const errMsg = parseAuthError(result.error, 'signIn');
        setError(errMsg);
        if (result.error.toLowerCase().includes('usernotfound') || result.error.toLowerCase().includes('user not found')) {
          setInfo('¿No tienes cuenta? Haz clic en "Crear cuenta" abajo.');
        }
      } else if (result?.state === 'signedIn' && result.user) {
        setUser({ username: result.user.username });
        api.getProfile().then(setProfile).catch(() => {});
      } else if (result?.state === 'confirmingSignIn') {
        // MFA challenge — guardar session y determinar tipo
        setMfaSession(result);
        const actions = result.actions || [];
        const hasTotp = actions.some((a: any) => a.name === 'confirmSignIn' && a.fields?.some((f: any) => f.name === 'code'));
        const hasMfaType = actions.some((a: any) => a.fields?.some((f: any) => f.name === 'mfaType'));

        if (hasMfaType) {
          // Necesita elegir tipo de MFA
          const mfaAction = actions.find((a: any) => a.fields?.some((f: any) => f.name === 'mfaType'));
          const mfaField = mfaAction?.fields?.find((f: any) => f.name === 'mfaType');
          setMfaTypes((mfaField as any)?.options || ['TOTP', 'SMS', 'EMAIL']);
          setView('mfaSelectType');
        } else if ((result as any).sharedSecret || actions.some((a: any) => a.fields?.some((f: any) => f.name === 'sharedSecret'))) {
          // MFA Setup (TOTP primera vez)
          setMfaSecret((result as any).sharedSecret || '');
          setView('mfaSetup');
          setInfo('Configura tu aplicación de autenticación.');
        } else {
          // Pedir código MFA normal
          setView('mfaCode');
          setInfo('Ingresa el código de tu aplicación de autenticación.');
        }
      } else if (result?.state === 'confirmingSignUp') {
        setView('confirmSignUp');
        setInfo('Tu cuenta necesita confirmación. Ingresa el código de verificación.');
        fetchDevCode();
      }
    } catch (err: any) {
      setError(parseAuthError(err?.message || 'Error desconocido', 'signIn'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const result = await authApi.setAuthState({ action: 'signUp', username: email, password });
      console.log('[AUTH DEBUG] signUp result:', JSON.stringify(result));

      if (result?.error) {
        setError(parseAuthError(result.error, 'signUp'));
        return;
      }

      if (result?.state === 'signedIn' && result.user) {
        // Signup + auto-login exitoso
        setUser({ username: result.user.username });
        api.getProfile().then(setProfile).catch(() => {});
        return;
      }

      if (result?.state === 'confirmingSignUp') {
        setView('confirmSignUp');
        setInfo('Cuenta creada. Ingresa el código de verificación.');
        fetchDevCode();
        return;
      }

      // Signup exitoso pero no auto-logueado → intentar login
      const loginResult = await authApi.setAuthState({ action: 'signIn', username: email, password });
      console.log('[AUTH DEBUG] auto-login result:', JSON.stringify(loginResult));

      if (loginResult?.state === 'signedIn' && loginResult.user) {
        setUser({ username: loginResult.user.username });
      } else if (loginResult?.error) {
        setInfo('✅ Cuenta creada exitosamente. Ahora inicia sesión.');
        setView('signIn');
      } else {
        setInfo('✅ Cuenta creada exitosamente. Ahora inicia sesión.');
        setView('signIn');
      }
    } catch (err: any) {
      setError(parseAuthError(err?.message || 'Error desconocido', 'signUp'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const result = await authApi.setAuthState({ action: 'confirmSignUp', username: email, code, password });

      if (result?.error) {
        setError(parseAuthError(result.error, 'confirmSignUp'));
      } else if (result?.state === 'signedIn' && result.user) {
        setUser({ username: result.user.username });
      } else {
        // Confirmado, intentar login
        const loginResult = await authApi.setAuthState({ action: 'signIn', username: email, password });
        if (loginResult?.state === 'signedIn' && loginResult.user) {
          setUser({ username: loginResult.user.username });
        } else {
          setView('signIn');
          setInfo('✅ Cuenta confirmada. Ahora inicia sesión.');
        }
      }
    } catch (err: any) {
      setError(parseAuthError(err?.message || 'Error desconocido', 'confirmSignUp'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authApi.setAuthState({ action: 'signOut' });
    setUser(null);
    setProfile(null);
    setView('signIn');
    setError('');
    setInfo('');
    setMfaSession(null);
    setMfaSecret('');
    setMfaCode('');
  };

  // Handler para verificar código MFA
  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Extraer el session token del campo hidden en actions
      const sessionField = mfaSession?.actions?.[0]?.fields?.find((f: any) => f.name === 'session');
      const session = sessionField?.defaultValue || mfaSession?.session || '';
      const result = await (authApi as any).setAuthState({ action: 'confirmSignIn', challenge: 'code', session, code: mfaCode });
      console.log('[AUTH DEBUG] MFA verify result:', JSON.stringify(result));

      if (result?.error) {
        setError(parseAuthError(result.error, 'signIn'));
      } else if (result?.state === 'signedIn' && result.user) {
        setUser({ username: result.user.username });
        setMfaSession(null);
        setMfaCode('');
        api.getProfile().then(setProfile).catch(() => {});
      }
    } catch (err: any) {
      setError(parseAuthError(err?.message || 'Error al verificar MFA', 'signIn'));
    } finally {
      setLoading(false);
    }
  };

  // Handler para setup TOTP (primera vez)
  const handleMfaSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const sessionField = mfaSession?.actions?.[0]?.fields?.find((f: any) => f.name === 'session');
      const session = sessionField?.defaultValue || mfaSession?.session || '';
      const result = await (authApi as any).setAuthState({ action: 'confirmSignIn', challenge: 'totpSetup', session, sharedSecret: mfaSecret, code: mfaCode });
      console.log('[AUTH DEBUG] MFA setup result:', JSON.stringify(result));

      if (result?.error) {
        setError(parseAuthError(result.error, 'signIn'));
      } else if (result?.state === 'signedIn' && result.user) {
        setUser({ username: result.user.username });
        setMfaSession(null);
        setMfaSecret('');
        setMfaCode('');
        api.getProfile().then(setProfile).catch(() => {});
      } else if (result?.state === 'confirmingSignIn') {
        // Setup exitoso, ahora pide verificar
        setView('mfaCode');
        setMfaSession(result);
        setMfaCode('');
        setInfo('MFA configurado. Ingresa un código de tu app para verificar.');
      }
    } catch (err: any) {
      setError(parseAuthError(err?.message || 'Error en setup MFA', 'signIn'));
    } finally {
      setLoading(false);
    }
  };

  // Handler para selección de tipo MFA
  const handleMfaTypeSelect = async (mfaType: string) => {
    setError('');
    setLoading(true);

    try {
      const sessionField = mfaSession?.actions?.[0]?.fields?.find((f: any) => f.name === 'session');
      const session = sessionField?.defaultValue || mfaSession?.session || '';
      const result = await (authApi as any).setAuthState({ action: 'confirmSignIn', challenge: 'mfaType', session, mfaType });
      console.log('[AUTH DEBUG] MFA type select result:', JSON.stringify(result));

      if (result?.error) {
        setError(result.error);
      } else if (result?.state === 'confirmingSignIn') {
        setView('mfaCode');
        setMfaSession(result);
        setInfo(`Ingresa el código de ${mfaType === 'TOTP' ? 'tu app autenticadora' : mfaType}.`);
      } else if (result?.state === 'signedIn' && result.user) {
        setUser({ username: result.user.username });
        api.getProfile().then(setProfile).catch(() => {});
      }
    } catch (err: any) {
      setError(err?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch {
      setProfile({ error: 'No autenticado o sesión expirada' });
    }
  };

  // --- Cargando sesión ---
  if (initializing) {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography sx={{ textAlign: 'center' }} color="text.secondary">
            Verificando sesión...
          </Typography>
        </Paper>
      </Container>
    );
  }

  // --- Vista autenticada (Dashboard con sidebar) ---
  if (user) {
    const userGroups = profile?.groups || [];
    const isAdmin = userGroups.includes('administrador') || userGroups.length === 0;

    // Determinar si hay admins en el sistema
    // Si no hay perfil cargado aún, permitir acceso al admin por defecto

    return (
      <Layout
        currentPath={currentPath}
        onNavigate={(path) => setCurrentPath(path)}
        user={user}
        groups={userGroups}
        onSignOut={handleSignOut}
        isAdmin={isAdmin}
      >
        {/* Renderizar contenido según la ruta */}
        {currentPath === '/admin' && isAdmin && <Admin />}

        {currentPath === '/overview' && (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
              Overview
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Typography variant="body1">
                Bienvenido, <strong>{user.username}</strong>
              </Typography>
              {userGroups.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Grupos: {userGroups.join(', ')}
                </Typography>
              )}
            </Paper>
          </Box>
        )}

        {currentPath === '/account' && (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
              Mi cuenta
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Typography variant="body2">👤 {user.username}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>🏷️ Grupos: {userGroups.length > 0 ? userGroups.join(', ') : 'Ninguno'}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>🔐 Proveedor: {profile?.provider || 'cargando...'}</Typography>
            </Paper>
          </Box>
        )}

        {currentPath !== '/admin' && currentPath !== '/overview' && currentPath !== '/account' && (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
              {currentPath.replace('/', '').replace(/-/g, ' ')}
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Typography color="text.secondary">
                Página en construcción. Configura el contenido desde el panel de administración.
              </Typography>
            </Paper>
          </Box>
        )}
      </Layout>
    );
  }

  // --- Vista de confirmación de código ---
  if (view === 'confirmSignUp') {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        {/* Dialog para mostrar el código en modo dev */}
        <Dialog open={devCode !== null} onClose={() => setDevCode(null)}>
          <DialogTitle>🔑 Código de verificación (modo dev)</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              En producción este código se enviaría por email. En modo local se muestra aquí:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="h3" sx={{ fontFamily: 'monospace', letterSpacing: 8 }}>
                {devCode}
              </Typography>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setCode(devCode || ''); setDevCode(null); }} variant="contained">
              Copiar y cerrar
            </Button>
            <Button onClick={() => setDevCode(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }} gutterBottom>
            Verificar cuenta
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            Ingresa el código de verificación de 6 dígitos
          </Typography>

          {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleConfirmSignUp} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
            />
            <TextField
              label="Código de verificación"
              required
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value)}
              size="small"
              placeholder="123456"
              slotProps={{ htmlInput: { maxLength: 6 } }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 1, bgcolor: c.button.color, '&:hover': { bgcolor: c.button.hoverColor }, textTransform: 'none', fontWeight: 'bold' }}
            >
              {loading ? '...' : 'Verificar'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link component="button" onClick={() => { setView('signIn'); setError(''); setInfo(''); }}>
              Volver a iniciar sesión
            </Link>
          </Box>
        </Paper>
      </Container>
    );
  }

  // --- Vista de MFA: ingresar código ---
  if (view === 'mfaCode') {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }} gutterBottom>
            🔐 Verificación MFA
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            Ingresa el código de 6 dígitos de tu aplicación de autenticación
          </Typography>

          {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleMfaVerify} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Código MFA"
              required
              fullWidth
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="123456"
              slotProps={{ htmlInput: { maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: 8 } } }}
              autoFocus
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || mfaCode.length < 6}
              sx={{ mt: 1, bgcolor: c.button.color, '&:hover': { bgcolor: c.button.hoverColor }, textTransform: 'none', fontWeight: 'bold' }}
            >
              {loading ? '...' : 'Verificar'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link component="button" onClick={() => { setView('signIn'); setError(''); setInfo(''); setMfaSession(null); }}>
              Cancelar
            </Link>
          </Box>
        </Paper>
      </Container>
    );
  }

  // --- Vista de MFA: setup TOTP (primera vez) ---
  if (view === 'mfaSetup') {
    const otpauthUrl = mfaSecret
      ? `otpauth://totp/${encodeURIComponent(config.app.title)}:${encodeURIComponent(email)}?secret=${mfaSecret}&issuer=${encodeURIComponent(config.app.title)}`
      : '';

    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }} gutterBottom>
            🔐 Configurar autenticación MFA
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            Escanea el código QR con tu app de autenticación (Google Authenticator, Authy, 1Password)
          </Typography>

          {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {mfaSecret && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {/* QR Code usando una API pública para generar la imagen */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`}
                  alt="QR Code para TOTP"
                  width={200}
                  height={200}
                  style={{ borderRadius: 8 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ¿No puedes escanear? Ingresa este código manualmente:
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, display: 'inline-block' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 2, fontWeight: 'bold' }}>
                  {mfaSecret}
                </Typography>
              </Paper>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box component="form" onSubmit={handleMfaSetup} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2">
              Después de agregar la cuenta en tu app, ingresa el código que genera:
            </Typography>
            <TextField
              label="Código de verificación"
              required
              fullWidth
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="123456"
              slotProps={{ htmlInput: { maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: 8 } } }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || mfaCode.length < 6}
              sx={{ mt: 1, bgcolor: c.button.color, '&:hover': { bgcolor: c.button.hoverColor }, textTransform: 'none', fontWeight: 'bold' }}
            >
              {loading ? '...' : 'Confirmar configuración'}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // --- Vista de MFA: seleccionar tipo ---
  if (view === 'mfaSelectType') {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }} gutterBottom>
            🔐 Método de verificación
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            Elige cómo quieres verificar tu identidad
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mfaTypes.includes('TOTP') && (
              <Button variant="outlined" size="large" onClick={() => handleMfaTypeSelect('TOTP')} disabled={loading}>
                📱 App de autenticación (TOTP)
              </Button>
            )}
            {mfaTypes.includes('SMS') && (
              <Button variant="outlined" size="large" onClick={() => handleMfaTypeSelect('SMS')} disabled={loading}>
                📱 SMS
              </Button>
            )}
            {mfaTypes.includes('EMAIL') && (
              <Button variant="outlined" size="large" onClick={() => handleMfaTypeSelect('EMAIL')} disabled={loading}>
                📧 Email
              </Button>
            )}
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link component="button" onClick={() => { setView('signIn'); setError(''); setMfaSession(null); }}>
              Cancelar
            </Link>
          </Box>
        </Paper>
      </Container>
    );
  }

  // --- Vista de login/signup ---
  const viewConfig = view === 'signIn' ? c.signIn : c.signUp;

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {config.app.logo && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar src={config.app.logo} sx={{ width: 56, height: 56 }} />
          </Box>
        )}

        <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }} gutterBottom>
          {viewConfig.title}
        </Typography>
        <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          {viewConfig.subtitle}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={view === 'signIn' ? handleSignIn : handleSignUp} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={viewConfig.fields.emailLabel}
            type="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="small"
          />
          <TextField
            label={viewConfig.fields.passwordLabel}
            type="password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            size="small"
            helperText={view === 'signUp' ? c.signUp.passwordHelp : ''}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 1,
              bgcolor: c.button.color,
              '&:hover': { bgcolor: c.button.hoverColor },
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            {loading ? '...' : viewConfig.buttonText}
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          {view === 'signIn' ? (
            <Typography variant="body2">
              {c.links.noAccount}{' '}
              <Link component="button" onClick={() => { setView('signUp'); setError(''); setInfo(''); }}>
                {c.links.noAccountAction}
              </Link>
            </Typography>
          ) : (
            <Typography variant="body2">
              {c.links.hasAccount}{' '}
              <Link component="button" onClick={() => { setView('signIn'); setError(''); setInfo(''); }}>
                {c.links.hasAccountAction}
              </Link>
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default App;
