import { adminApi } from 'aws-blocks';
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  Tabs,
  Tab,
  Slider,
} from '@mui/material';

// --- Temas predefinidos ---
const THEME_PRESETS: Record<string, { label: string; mode: string; primaryColor: string; secondaryColor: string; buttonColor: string; buttonHoverColor: string; borderRadius: number }> = {
  default: {
    label: '🔵 Default',
    mode: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#ff9800',
    buttonColor: '#1a1a2e',
    buttonHoverColor: '#16213e',
    borderRadius: 8,
  },
  ocean: {
    label: '🌊 Ocean',
    mode: 'light',
    primaryColor: '#0077b6',
    secondaryColor: '#00b4d8',
    buttonColor: '#023e8a',
    buttonHoverColor: '#03045e',
    borderRadius: 12,
  },
  sunset: {
    label: '🌅 Sunset',
    mode: 'light',
    primaryColor: '#e63946',
    secondaryColor: '#f4a261',
    buttonColor: '#e63946',
    buttonHoverColor: '#d62828',
    borderRadius: 8,
  },
  forest: {
    label: '🌲 Forest',
    mode: 'light',
    primaryColor: '#2d6a4f',
    secondaryColor: '#95d5b2',
    buttonColor: '#1b4332',
    buttonHoverColor: '#081c15',
    borderRadius: 10,
  },
  midnight: {
    label: '🌙 Midnight',
    mode: 'dark',
    primaryColor: '#bb86fc',
    secondaryColor: '#03dac6',
    buttonColor: '#6200ee',
    buttonHoverColor: '#3700b3',
    borderRadius: 16,
  },
  rose: {
    label: '🌸 Rose',
    mode: 'light',
    primaryColor: '#e91e63',
    secondaryColor: '#ff6090',
    buttonColor: '#880e4f',
    buttonHoverColor: '#560027',
    borderRadius: 20,
  },
  monochrome: {
    label: '⚫ Monochrome',
    mode: 'light',
    primaryColor: '#212121',
    secondaryColor: '#757575',
    buttonColor: '#000000',
    buttonHoverColor: '#333333',
    borderRadius: 4,
  },
  neon: {
    label: '💜 Neon',
    mode: 'dark',
    primaryColor: '#f72585',
    secondaryColor: '#4cc9f0',
    buttonColor: '#7209b7',
    buttonHoverColor: '#560bad',
    borderRadius: 12,
  },
  earth: {
    label: '🏜️ Earth',
    mode: 'light',
    primaryColor: '#8d6e63',
    secondaryColor: '#a1887f',
    buttonColor: '#4e342e',
    buttonHoverColor: '#3e2723',
    borderRadius: 6,
  },
  arctic: {
    label: '❄️ Arctic',
    mode: 'dark',
    primaryColor: '#4fc3f7',
    secondaryColor: '#81d4fa',
    buttonColor: '#0277bd',
    buttonHoverColor: '#01579b',
    borderRadius: 14,
  },
};

function Admin() {
  const [frontendConfig, setFrontendConfig] = useState<any>(null);
  const [backendConfig, setBackendConfig] = useState<any>(null);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  useEffect(() => {
    document.title = 'Admin — Auth Config';
    adminApi.getFrontendConfig().then(setFrontendConfig).catch(() => setError('No se pudo cargar config frontend'));
    adminApi.getBackendConfig().then(setBackendConfig).catch(() => setError('No se pudo cargar config backend'));
  }, []);

  const saveFrontend = async () => {
    try {
      await adminApi.saveFrontendConfig(frontendConfig);
      setSaved('frontend');
      setTimeout(() => setSaved(''), 3000);
    } catch {
      setError('Error al guardar frontend config');
    }
  };

  const saveBackend = async () => {
    try {
      const result = await adminApi.saveBackendConfig(backendConfig);
      setSaved('backend');
      setTimeout(() => setSaved(''), 5000);
    } catch {
      setError('Error al guardar backend config');
    }
  };

  const updateFrontend = (path: string, value: any) => {
    setFrontendConfig((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const updateBackend = (path: string, value: any) => {
    setBackendConfig((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (!preset) return;
    setSelectedPreset(presetKey);
    setFrontendConfig((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.theme.mode = preset.mode;
      copy.theme.primaryColor = preset.primaryColor;
      copy.theme.secondaryColor = preset.secondaryColor;
      copy.theme.borderRadius = preset.borderRadius;
      copy.auth.button.color = preset.buttonColor;
      copy.auth.button.hoverColor = preset.buttonHoverColor;
      return copy;
    });
  };

  if (!frontendConfig || !backendConfig) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Cargando configuración...</Typography>
        {error && <Alert severity="error">{error}</Alert>}
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          ⚙️ Auth Block — Admin Panel
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Configura la apariencia y el comportamiento del bloque de autenticación sin tocar código.
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab label="🎨 Frontend (UI)" />
          <Tab label="🔧 Backend (Auth)" />
          <Tab label="👥 Usuarios" />
          <Tab label="📋 Menú" />
        </Tabs>
      </Paper>

      {/* ===================== TAB FRONTEND ===================== */}
      {tab === 0 && (
        <>
          <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" size="large" onClick={saveFrontend}>
              💾 Guardar Frontend
            </Button>
          </Paper>
          {saved === 'frontend' && <Alert severity="success" sx={{ mb: 2 }}>✅ UI guardada. Hot-reload aplicará los cambios.</Alert>}

          {/* Theme Presets */}
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>🎭 Temas predefinidos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Clic en un tema para aplicar todos sus colores. Personaliza después si quieres.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <Chip
                  key={key}
                  label={preset.label}
                  onClick={() => applyPreset(key)}
                  variant={selectedPreset === key ? 'filled' : 'outlined'}
                  sx={{
                    borderColor: preset.primaryColor,
                    bgcolor: selectedPreset === key ? preset.primaryColor : 'transparent',
                    color: selectedPreset === key ? '#fff' : preset.primaryColor,
                    fontWeight: selectedPreset === key ? 'bold' : 'normal',
                    '&:hover': { bgcolor: preset.primaryColor, color: '#fff' },
                  }}
                />
              ))}
            </Box>
          </Paper>

          {/* App */}
          <Section title="🏷️ App">
            <Field label="Título de la app" value={frontendConfig.app.title} onChange={(v) => updateFrontend('app.title', v)} />
            <Field label="URL del logo" value={frontendConfig.app.logo} onChange={(v) => updateFrontend('app.logo', v)} />
          </Section>

          {/* Theme manual */}
          <Section title="🎨 Tema">
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Switch checked={frontendConfig.theme.mode === 'dark'} onChange={(e) => updateFrontend('theme.mode', e.target.checked ? 'dark' : 'light')} />}
                label="Modo oscuro"
              />
            </Grid>
            <ColorField label="Color primario" value={frontendConfig.theme.primaryColor} onChange={(v) => updateFrontend('theme.primaryColor', v)} />
            <ColorField label="Color secundario" value={frontendConfig.theme.secondaryColor} onChange={(v) => updateFrontend('theme.secondaryColor', v)} />
            <Field label="Border radius (px)" value={String(frontendConfig.theme.borderRadius)} onChange={(v) => updateFrontend('theme.borderRadius', Number(v) || 0)} type="number" />
          </Section>

          {/* Sign In */}
          <Section title="🔐 Sign In">
            <Field label="Título" value={frontendConfig.auth.signIn.title} onChange={(v) => updateFrontend('auth.signIn.title', v)} />
            <Field label="Subtítulo" value={frontendConfig.auth.signIn.subtitle} onChange={(v) => updateFrontend('auth.signIn.subtitle', v)} />
            <Field label="Texto del botón" value={frontendConfig.auth.signIn.buttonText} onChange={(v) => updateFrontend('auth.signIn.buttonText', v)} />
            <Field label="Label email" value={frontendConfig.auth.signIn.fields.emailLabel} onChange={(v) => updateFrontend('auth.signIn.fields.emailLabel', v)} />
            <Field label="Label password" value={frontendConfig.auth.signIn.fields.passwordLabel} onChange={(v) => updateFrontend('auth.signIn.fields.passwordLabel', v)} />
          </Section>

          {/* Sign Up */}
          <Section title="📝 Sign Up">
            <Field label="Título" value={frontendConfig.auth.signUp.title} onChange={(v) => updateFrontend('auth.signUp.title', v)} />
            <Field label="Subtítulo" value={frontendConfig.auth.signUp.subtitle} onChange={(v) => updateFrontend('auth.signUp.subtitle', v)} />
            <Field label="Texto del botón" value={frontendConfig.auth.signUp.buttonText} onChange={(v) => updateFrontend('auth.signUp.buttonText', v)} />
            <Field label="Ayuda password" value={frontendConfig.auth.signUp.passwordHelp} onChange={(v) => updateFrontend('auth.signUp.passwordHelp', v)} />
          </Section>

          {/* Links */}
          <Section title="🔗 Links">
            <Field label="No tienes cuenta?" value={frontendConfig.auth.links.noAccount} onChange={(v) => updateFrontend('auth.links.noAccount', v)} />
            <Field label="Link crear cuenta" value={frontendConfig.auth.links.noAccountAction} onChange={(v) => updateFrontend('auth.links.noAccountAction', v)} />
            <Field label="Ya tienes cuenta?" value={frontendConfig.auth.links.hasAccount} onChange={(v) => updateFrontend('auth.links.hasAccount', v)} />
            <Field label="Link iniciar sesión" value={frontendConfig.auth.links.hasAccountAction} onChange={(v) => updateFrontend('auth.links.hasAccountAction', v)} />
          </Section>

          {/* Button */}
          <Section title="🖌️ Botón">
            <ColorField label="Color" value={frontendConfig.auth.button.color} onChange={(v) => updateFrontend('auth.button.color', v)} />
            <ColorField label="Color hover" value={frontendConfig.auth.button.hoverColor} onChange={(v) => updateFrontend('auth.button.hoverColor', v)} />
          </Section>

          {/* Authenticated */}
          <Section title="✅ Post-login">
            <Field label="Título" value={frontendConfig.authenticated.title} onChange={(v) => updateFrontend('authenticated.title', v)} />
            <Field label="Subtítulo ({{username}})" value={frontendConfig.authenticated.subtitle} onChange={(v) => updateFrontend('authenticated.subtitle', v)} />
            <Field label="Botón perfil" value={frontendConfig.authenticated.profileButton} onChange={(v) => updateFrontend('authenticated.profileButton', v)} />
            <Field label="Botón cerrar sesión" value={frontendConfig.authenticated.signOutButton} onChange={(v) => updateFrontend('authenticated.signOutButton', v)} />
          </Section>
        </>
      )}

      {/* ===================== TAB BACKEND ===================== */}
      {tab === 1 && (
        <>
          <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Alert severity="info" sx={{ flex: 1, mr: 2 }}>
              Los cambios de backend requieren reiniciar el servidor (<code>npm run dev</code>).
            </Alert>
            <Button variant="contained" size="large" color="secondary" onClick={saveBackend}>
              💾 Guardar Backend
            </Button>
          </Paper>
          {saved === 'backend' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Backend config guardada. Reinicia el servidor para aplicar.
            </Alert>
          )}

          {/* Provider Selection */}
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>🔐 Proveedor de autenticación</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Elige el sistema que manejará los usuarios y sesiones.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                  variant={backendConfig.auth.provider === 'basic' ? 'elevation' : 'outlined'}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: backendConfig.auth.provider === 'basic' ? '2px solid' : '1px solid',
                    borderColor: backendConfig.auth.provider === 'basic' ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                  onClick={() => updateBackend('auth.provider', 'basic')}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>⚡ AuthBasic</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Username/password con JWT. Sin dependencias externas. Ideal para MVPs y herramientas internas.
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip label="Simple" size="small" sx={{ mr: 0.5 }} />
                    <Chip label="Sin AWS" size="small" sx={{ mr: 0.5 }} />
                    <Chip label="Rápido" size="small" />
                  </Box>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                  variant={backendConfig.auth.provider === 'cognito' ? 'elevation' : 'outlined'}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: backendConfig.auth.provider === 'cognito' ? '2px solid' : '1px solid',
                    borderColor: backendConfig.auth.provider === 'cognito' ? 'secondary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'secondary.main' },
                  }}
                  onClick={() => updateBackend('auth.provider', 'cognito')}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>☁️ AuthCognito</Typography>
                  <Typography variant="body2" color="text.secondary">
                    AWS Cognito User Pool. MFA, grupos, atributos custom. Para producción.
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip label="MFA" size="small" color="secondary" sx={{ mr: 0.5 }} />
                    <Chip label="Grupos" size="small" color="secondary" sx={{ mr: 0.5 }} />
                    <Chip label="Producción" size="small" color="secondary" />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Session (solo para AuthBasic) */}
          {backendConfig.auth.provider === 'basic' && (
            <Section title="⏱️ Sesión">
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duración de la sesión: <strong>{backendConfig.auth.sessionDurationHours} horas</strong>
                </Typography>
                <Slider
                  value={backendConfig.auth.sessionDurationHours}
                  onChange={(_, v) => updateBackend('auth.sessionDurationHours', v)}
                  min={1}
                  max={720}
                  step={1}
                  marks={[
                    { value: 1, label: '1h' },
                    { value: 24, label: '24h' },
                    { value: 168, label: '7d' },
                    { value: 720, label: '30d' },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => v >= 24 ? `${Math.round(v / 24)}d` : `${v}h`}
                />
              </Grid>
            </Section>
          )}

          {/* Password Policy (compartida) */}
          <Section title="🔑 Política de contraseñas">
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Largo mínimo"
                type="number"
                value={backendConfig.auth.passwordPolicy.minLength}
                onChange={(e) => updateBackend('auth.passwordPolicy.minLength', Number(e.target.value) || 1)}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { min: 1, max: 128 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <FormControlLabel
                  control={<Switch checked={backendConfig.auth.passwordPolicy.requireUppercase} onChange={(e) => updateBackend('auth.passwordPolicy.requireUppercase', e.target.checked)} />}
                  label="Requiere mayúscula (A-Z)"
                />
                <FormControlLabel
                  control={<Switch checked={backendConfig.auth.passwordPolicy.requireLowercase} onChange={(e) => updateBackend('auth.passwordPolicy.requireLowercase', e.target.checked)} />}
                  label="Requiere minúscula (a-z)"
                />
                <FormControlLabel
                  control={<Switch checked={backendConfig.auth.passwordPolicy.requireDigits} onChange={(e) => updateBackend('auth.passwordPolicy.requireDigits', e.target.checked)} />}
                  label="Requiere número (0-9)"
                />
                <FormControlLabel
                  control={<Switch checked={backendConfig.auth.passwordPolicy.requireSpecialChars} onChange={(e) => updateBackend('auth.passwordPolicy.requireSpecialChars', e.target.checked)} />}
                  label="Requiere carácter especial (!@#$)"
                />
              </Box>
            </Grid>
          </Section>

          {/* Cognito-specific options */}
          {backendConfig.auth.provider === 'cognito' && (
            <>
              <Section title="🛡️ MFA (Multi-Factor Authentication)">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Modo MFA</InputLabel>
                    <Select
                      value={backendConfig.auth.cognito.mfa}
                      label="Modo MFA"
                      onChange={(e) => updateBackend('auth.cognito.mfa', e.target.value)}
                    >
                      <MenuItem value="off">Desactivado</MenuItem>
                      <MenuItem value="optional">Opcional (el usuario elige)</MenuItem>
                      <MenuItem value="required">Obligatorio</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {backendConfig.auth.cognito.mfa !== 'off' && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>Métodos MFA permitidos:</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={backendConfig.auth.cognito.mfaTypes.includes('TOTP')}
                          onChange={(e) => {
                            const types = [...backendConfig.auth.cognito.mfaTypes];
                            if (e.target.checked) { if (!types.includes('TOTP')) types.push('TOTP'); }
                            else { const i = types.indexOf('TOTP'); if (i >= 0) types.splice(i, 1); }
                            updateBackend('auth.cognito.mfaTypes', types);
                          }}
                        />
                      }
                      label="TOTP (Google Authenticator)"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={backendConfig.auth.cognito.mfaTypes.includes('SMS')}
                          onChange={(e) => {
                            const types = [...backendConfig.auth.cognito.mfaTypes];
                            if (e.target.checked) { if (!types.includes('SMS')) types.push('SMS'); }
                            else { const i = types.indexOf('SMS'); if (i >= 0) types.splice(i, 1); }
                            updateBackend('auth.cognito.mfaTypes', types);
                          }}
                        />
                      }
                      label="SMS"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={backendConfig.auth.cognito.mfaTypes.includes('EMAIL')}
                          onChange={(e) => {
                            const types = [...backendConfig.auth.cognito.mfaTypes];
                            if (e.target.checked) { if (!types.includes('EMAIL')) types.push('EMAIL'); }
                            else { const i = types.indexOf('EMAIL'); if (i >= 0) types.splice(i, 1); }
                            updateBackend('auth.cognito.mfaTypes', types);
                          }}
                        />
                      }
                      label="Email OTP"
                    />
                  </Grid>
                )}
              </Section>

              <Section title="👤 Registro de usuarios">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={<Switch checked={backendConfig.auth.cognito.selfSignUp} onChange={(e) => updateBackend('auth.cognito.selfSignUp', e.target.checked)} />}
                    label="Permitir auto-registro (self sign-up)"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Si está desactivado, solo un admin puede crear usuarios.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Identificador de login</InputLabel>
                    <Select
                      value={backendConfig.auth.cognito.signInWith}
                      label="Identificador de login"
                      onChange={(e) => updateBackend('auth.cognito.signInWith', e.target.value)}
                    >
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="username">Username</MenuItem>
                      <MenuItem value="phone">Teléfono</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Section>

              <Section title="👥 Grupos (Roles)">
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Define grupos para control de acceso. Escribe un nombre y presiona Enter o coma para agregar.
                  </Typography>
                  <TextField
                    label="Agregar grupo"
                    fullWidth
                    size="small"
                    placeholder="Escribe un nombre y presiona Enter"
                    onKeyDown={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const value = input.value.trim().replace(/,/g, '');
                        if (value && !backendConfig.auth.cognito.groups.includes(value)) {
                          updateBackend('auth.cognito.groups', [...backendConfig.auth.cognito.groups, value]);
                        }
                        input.value = '';
                      }
                    }}
                  />
                  {backendConfig.auth.cognito.groups.length > 0 && (
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {backendConfig.auth.cognito.groups.map((g: string) => (
                        <Chip
                          key={g}
                          label={g}
                          size="small"
                          color="primary"
                          onDelete={() => {
                            updateBackend('auth.cognito.groups', backendConfig.auth.cognito.groups.filter((x: string) => x !== g));
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Grid>
              </Section>
            </>
          )}

          {/* Email Verification (solo para AuthBasic) */}
          {backendConfig.auth.provider === 'basic' && (
            <Section title="📧 Verificación por email">
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={backendConfig.auth.requireEmailVerification} onChange={(e) => updateBackend('auth.requireEmailVerification', e.target.checked)} />}
                  label="Requiere verificación por código al registrarse"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Si está activado, los usuarios reciben un código de 6 dígitos al registrarse.
                  Necesita un servicio de email configurado.
                </Typography>
              </Grid>
            </Section>
          )}

          {/* Preview */}
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>📋 Resumen de configuración</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography component="pre" variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
              {JSON.stringify(backendConfig, null, 2)}
            </Typography>
          </Paper>
        </>
      )}

      {/* ===================== TAB USUARIOS ===================== */}
      {tab === 2 && (
        <UsersPanel
          users={users}
          loaded={usersLoaded}
          groups={backendConfig.auth.provider === 'cognito' ? backendConfig.auth.cognito.groups : []}
          onRefresh={async () => {
            const list = await adminApi.listUsers();
            setUsers(list);
            setUsersLoaded(true);
          }}
          onSetGroups={async (username: string, groups: string[]) => {
            await adminApi.setUserGroups(username, groups);
            const list = await adminApi.listUsers();
            setUsers(list);
          }}
          onDelete={async (username: string) => {
            await adminApi.deleteUser(username);
            const list = await adminApi.listUsers();
            setUsers(list);
          }}
        />
      )}

      {/* ===================== TAB MENÚ ===================== */}
      {tab === 3 && (
        <MenuPanel />
      )}
    </Container>
  );
}

// --- Panel de Menú ---

function MenuPanel() {
  const [menuConfig, setMenuConfig] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('Folder');
  const [newItemPath, setNewItemPath] = useState('');
  const [addingTo, setAddingTo] = useState<number | null>(null);

  useEffect(() => {
    adminApi.getMenuConfig().then(setMenuConfig).catch(() => {});
  }, []);

  const save = async () => {
    await adminApi.saveMenuConfig(menuConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addSection = () => {
    if (!newSectionLabel.trim() && menuConfig.sections.length > 0) return;
    setMenuConfig((prev: any) => ({
      ...prev,
      sections: [...prev.sections, { label: newSectionLabel.trim().toUpperCase(), items: [] }],
    }));
    setNewSectionLabel('');
  };

  const addItem = (sectionIdx: number) => {
    if (!newItemLabel.trim() || !newItemPath.trim()) return;
    const path = newItemPath.startsWith('/') ? newItemPath : '/' + newItemPath;
    setMenuConfig((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.sections[sectionIdx].items.push({
        label: newItemLabel.trim(),
        icon: newItemIcon,
        path,
      });
      return copy;
    });
    setNewItemLabel('');
    setNewItemPath('');
    setAddingTo(null);
  };

  const removeItem = (sectionIdx: number, itemIdx: number) => {
    setMenuConfig((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.sections[sectionIdx].items.splice(itemIdx, 1);
      return copy;
    });
  };

  const removeSection = (sectionIdx: number) => {
    setMenuConfig((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.sections.splice(sectionIdx, 1);
      return copy;
    });
  };

  if (!menuConfig) return <Typography>Cargando...</Typography>;

  const iconOptions = ['Dashboard', 'BarChart', 'Person', 'People', 'Settings', 'ShoppingCart', 'Inventory', 'Mail', 'CalendarMonth', 'Folder'];

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Configura las opciones del menú lateral. Los cambios requieren recargar la página.
        </Typography>
        <Button variant="contained" onClick={save}>💾 Guardar Menú</Button>
      </Paper>
      {saved && <Alert severity="success" sx={{ mb: 2 }}>✅ Menú guardado.</Alert>}

      {menuConfig.sections.map((section: any, sIdx: number) => (
        <Paper key={sIdx} sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {section.label || '(Sin título)'}
            </Typography>
            <Box>
              <Button size="small" onClick={() => setAddingTo(addingTo === sIdx ? null : sIdx)}>
                + Agregar ítem
              </Button>
              <Button size="small" color="error" onClick={() => removeSection(sIdx)}>
                Eliminar sección
              </Button>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {section.items.map((item: any, iIdx: number) => (
            <Box key={iIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, pl: 1 }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                📄 <strong>{item.label}</strong> → <code>{item.path}</code>
                {item.adminOnly && ' 🔒'}
              </Typography>
              <Button size="small" color="error" onClick={() => removeItem(sIdx, iIdx)}>✕</Button>
            </Box>
          ))}

          {addingTo === sIdx && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <TextField label="Label" size="small" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} />
              <TextField label="Ruta (/path)" size="small" value={newItemPath} onChange={(e) => setNewItemPath(e.target.value)} />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Icono</InputLabel>
                <Select value={newItemIcon} label="Icono" onChange={(e) => setNewItemIcon(e.target.value)}>
                  {iconOptions.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" size="small" onClick={() => addItem(sIdx)}>Agregar</Button>
            </Box>
          )}
        </Paper>
      ))}

      {/* Agregar sección */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Agregar nueva sección</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField label="Título de sección (ej: GESTIÓN)" size="small" value={newSectionLabel} onChange={(e) => setNewSectionLabel(e.target.value)} fullWidth />
          <Button variant="outlined" onClick={addSection}>+ Sección</Button>
        </Box>
      </Paper>
    </>
  );
}

// --- Panel de Usuarios ---

function UsersPanel({ users, loaded, groups, onRefresh, onSetGroups, onDelete }: {
  users: any[];
  loaded: boolean;
  groups: string[];
  onRefresh: () => Promise<void>;
  onSetGroups: (username: string, groups: string[]) => Promise<void>;
  onDelete: (username: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  const refresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded]);

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {users.length} usuario(s) registrado(s) en local
        </Typography>
        <Button variant="outlined" onClick={refresh} disabled={loading}>
          🔄 Refrescar
        </Button>
      </Paper>

      {users.length === 0 && loaded && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
            No hay usuarios registrados. Crea uno desde la pantalla de Sign Up en <a href="/">la app</a>.
          </Typography>
        </Paper>
      )}

      {users.map((user) => (
        <Paper key={user.username} sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                👤 {user.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.confirmed ? '✅ Confirmado' : '⏳ Pendiente'} 
                {user.createdAt && ` — Creado: ${new Date(user.createdAt).toLocaleDateString()}`}
              </Typography>
            </Box>
            <Box>
              {confirmDelete === user.username ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" color="error" variant="contained" onClick={() => { onDelete(user.username); setConfirmDelete(''); }}>
                    Confirmar
                  </Button>
                  <Button size="small" onClick={() => setConfirmDelete('')}>
                    Cancelar
                  </Button>
                </Box>
              ) : (
                <Button size="small" color="error" variant="outlined" onClick={() => setConfirmDelete(user.username)}>
                  🗑️ Eliminar
                </Button>
              )}
            </Box>
          </Box>

          {/* Grupos */}
          {groups.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Grupos:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {groups.map((g: string) => {
                  const isInGroup = (user.groups || []).includes(g);
                  return (
                    <Chip
                      key={g}
                      label={g}
                      size="small"
                      color={isInGroup ? 'primary' : 'default'}
                      variant={isInGroup ? 'filled' : 'outlined'}
                      onClick={() => {
                        const newGroups = isInGroup
                          ? (user.groups || []).filter((x: string) => x !== g)
                          : [...(user.groups || []), g];
                        onSetGroups(user.username, newGroups);
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  );
                })}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Clic en un grupo para agregar/quitar al usuario.
              </Typography>
            </Box>
          )}

          {groups.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No hay grupos definidos. Configúralos en el tab "Backend" → Cognito → Grupos.
            </Typography>
          )}
        </Paper>
      ))}
    </>
  );
}

// --- Componentes auxiliares ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Paper>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        size="small"
        type={type}
      />
    </Grid>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 40, height: 40, border: 'none', cursor: 'pointer', borderRadius: 4 }}
        />
        <TextField
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
          size="small"
        />
      </Box>
    </Grid>
  );
}

export default Admin;
