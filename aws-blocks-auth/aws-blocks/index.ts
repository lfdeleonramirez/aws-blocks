/**
 * Backend — aws-blocks/index.ts
 * Config-driven auth backend (supports AuthBasic and AuthCognito)
 */
import { ApiNamespace, Scope, AuthBasic, AuthCognito } from '@aws-blocks/blocks';
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_CONFIG_PATH = join(__dirname, '..', 'src', 'auth.config.json');
const BACKEND_CONFIG_PATH = join(__dirname, 'backend.config.json');
const MENU_CONFIG_PATH = join(__dirname, '..', 'src', 'menu.config.json');
const BB_DATA_DIR = join(__dirname, '..', '.bb-data');
const USERS_DIR = join(BB_DATA_DIR, 'aws-blocks-auth-auth-users');

// Leer configuración del backend
const backendConfig = JSON.parse(readFileSync(BACKEND_CONFIG_PATH, 'utf-8'));

const scope = new Scope('aws-blocks-auth');

// Crear el bloque de autenticación según el provider configurado
type AuthBlock = AuthBasic | AuthCognito;

let auth: AuthBlock;

// Almacena el último código generado para exponerlo en modo dev
let lastVerificationCode: { username: string; code: string; timestamp: number } | null = null;

if (backendConfig.auth.provider === 'cognito') {
  const cognitoOpts = backendConfig.auth.cognito;
  auth = new AuthCognito(scope, 'auth', {
    passwordPolicy: {
      minLength: backendConfig.auth.passwordPolicy.minLength,
      requireUppercase: backendConfig.auth.passwordPolicy.requireUppercase,
      requireLowercase: backendConfig.auth.passwordPolicy.requireLowercase,
      requireDigits: backendConfig.auth.passwordPolicy.requireDigits,
      requireSpecialChars: backendConfig.auth.passwordPolicy.requireSpecialChars,
    },
    mfa: cognitoOpts.mfa,
    mfaTypes: cognitoOpts.mfaTypes,
    selfSignUp: cognitoOpts.selfSignUp,
    signInWith: cognitoOpts.signInWith,
    groups: cognitoOpts.groups.length > 0 ? cognitoOpts.groups : undefined,
    codeDelivery: async (username: string, code: string) => {
      lastVerificationCode = { username, code, timestamp: Date.now() };
      console.log(`[DEV] Código de verificación para ${username}: ${code}`);
    },
  } as any);
} else {
  auth = new AuthBasic(scope, 'auth', {
    sessionDuration: backendConfig.auth.sessionDurationHours * 3600,
    passwordPolicy: {
      minLength: backendConfig.auth.passwordPolicy.minLength,
      requireUppercase: backendConfig.auth.passwordPolicy.requireUppercase,
      requireLowercase: backendConfig.auth.passwordPolicy.requireLowercase,
      requireDigits: backendConfig.auth.passwordPolicy.requireDigits,
      requireSpecialChars: backendConfig.auth.passwordPolicy.requireSpecialChars,
    },
  });
}

// Exportar la API del state machine (funciona con ambos providers)
export const authApi = auth.createApi();

export const api = new ApiNamespace(scope, 'api', (context) => ({
  async ping() {
    return {
      message: 'AWS Blocks funcionando',
      provider: backendConfig.auth.provider,
      timestamp: Date.now(),
    };
  },

  // Endpoint protegido
  async getProfile() {
    const user = await auth.requireAuth(context);
    // Intentar obtener grupos del usuario
    let groups: string[] = [];
    if ('groups' in user && Array.isArray((user as any).groups)) {
      groups = (user as any).groups;
    } else {
      // Leer grupos del state.json para Cognito mock
      const cognitoState = join(BB_DATA_DIR, 'aws-blocks-auth-auth', 'state.json');
      if (existsSync(cognitoState)) {
        const data = JSON.parse(readFileSync(cognitoState, 'utf-8'));
        if (data.groups) {
          for (const [groupName, members] of Object.entries(data.groups)) {
            if ((members as string[]).includes(user.username)) {
              groups.push(groupName);
            }
          }
        }
      }
    }
    return {
      username: user.username,
      groups,
      provider: backendConfig.auth.provider,
    };
  },

  // Endpoint con auth opcional
  async greet() {
    const user = await auth.getCurrentUser(context);
    return user
      ? { message: `Hola, ${user.username}!` }
      : { message: 'Hola, visitante!' };
  },
}));

// Admin API — para la UI de configuración (solo funciona en dev local)
export const adminApi = new ApiNamespace(scope, 'admin', () => ({
  async getFrontendConfig() {
    const raw = readFileSync(FRONTEND_CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  },

  async saveFrontendConfig(config: any) {
    writeFileSync(FRONTEND_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    return { success: true };
  },

  async getBackendConfig() {
    const raw = readFileSync(BACKEND_CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  },

  async saveBackendConfig(config: any) {
    writeFileSync(BACKEND_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    return { success: true, note: 'Reinicia el servidor para aplicar cambios del backend (npm run dev)' };
  },

  // --- User Management (local mock only) ---
  async listUsers() {
    // Cognito mock: state.json con { users: {...}, groups: {...} }
    const cognitoState = join(BB_DATA_DIR, 'aws-blocks-auth-auth', 'state.json');
    if (existsSync(cognitoState)) {
      const data = JSON.parse(readFileSync(cognitoState, 'utf-8'));
      const userGroups: Record<string, string[]> = {};
      // Invertir el mapa de grupos a usuarios
      if (data.groups) {
        for (const [groupName, members] of Object.entries(data.groups)) {
          for (const member of members as string[]) {
            if (!userGroups[member]) userGroups[member] = [];
            userGroups[member].push(groupName);
          }
        }
      }
      return Object.entries(data.users || {}).map(([username, userData]: [string, any]) => ({
        username,
        confirmed: userData.confirmed !== false,
        groups: userGroups[username] || [],
        attributes: userData.attributes || {},
      }));
    }

    // AuthBasic: archivos individuales en users dir
    if (!existsSync(USERS_DIR)) return [];
    const files = readdirSync(USERS_DIR).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const data = JSON.parse(readFileSync(join(USERS_DIR, f), 'utf-8'));
      return {
        username: data.username || f.replace('.json', ''),
        confirmed: data.confirmed !== false,
        groups: data.groups || [],
        attributes: {},
      };
    });
  },

  async setUserGroups(username: string, groups: string[]) {
    // Cognito mock
    const cognitoState = join(BB_DATA_DIR, 'aws-blocks-auth-auth', 'state.json');
    if (existsSync(cognitoState)) {
      const data = JSON.parse(readFileSync(cognitoState, 'utf-8'));
      if (!data.users[username]) throw new Error(`Usuario "${username}" no encontrado`);

      // Limpiar usuario de todos los grupos primero
      if (data.groups) {
        for (const groupName of Object.keys(data.groups)) {
          data.groups[groupName] = (data.groups[groupName] as string[]).filter((m: string) => m !== username);
        }
      }
      // Agregar a los nuevos grupos
      for (const g of groups) {
        if (!data.groups[g]) data.groups[g] = [];
        data.groups[g].push(username);
      }
      writeFileSync(cognitoState, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      return { success: true, username, groups };
    }

    // AuthBasic
    const filePath = join(USERS_DIR, `${username}.json`);
    if (!existsSync(filePath)) throw new Error(`Usuario "${username}" no encontrado`);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    data.groups = groups;
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    return { success: true, username, groups };
  },

  async deleteUser(username: string) {
    // Cognito mock
    const cognitoState = join(BB_DATA_DIR, 'aws-blocks-auth-auth', 'state.json');
    if (existsSync(cognitoState)) {
      const data = JSON.parse(readFileSync(cognitoState, 'utf-8'));
      if (!data.users[username]) throw new Error(`Usuario "${username}" no encontrado`);
      delete data.users[username];
      // Quitar de grupos
      if (data.groups) {
        for (const groupName of Object.keys(data.groups)) {
          data.groups[groupName] = (data.groups[groupName] as string[]).filter((m: string) => m !== username);
        }
      }
      writeFileSync(cognitoState, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      return { success: true, username };
    }

    // AuthBasic
    const filePath = join(USERS_DIR, `${username}.json`);
    if (!existsSync(filePath)) throw new Error(`Usuario "${username}" no encontrado`);
    unlinkSync(filePath);
    return { success: true, username };
  },

  // Devuelve el último código de verificación generado (solo en dev local)
  async getLastCode() {
    return lastVerificationCode;
  },

  async getMenuConfig() {
    const raw = readFileSync(MENU_CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  },

  async saveMenuConfig(config: any) {
    writeFileSync(MENU_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    return { success: true };
  },
}));
