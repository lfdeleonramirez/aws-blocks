# AWS Blocks — Blank Base (React + Material UI)

Plantilla limpia de AWS Blocks con React y Material UI lista para construir.
Sin código de ejemplo — solo la infraestructura de build y un `ping()` de verificación.

## Getting Started

### Crear un nuevo proyecto desde esta plantilla

```bash
npx degit lfdeleonramirez/aws-blocks/aws-blocks-blank-base mi-nuevo-proyecto
cd mi-nuevo-proyecto
npm install
```

### Después de clonar

1. Cambia `"name"` en `package.json` por el nombre de tu proyecto
2. Cambia el Scope en `aws-blocks/index.ts`: `new Scope('nombre-de-tu-app')`
3. `npm install`
4. `npm run dev`

Open http://localhost:3000 — debes ver "AWS Blocks Blank Base" con "✅ Backend conectado".

## Project Structure

| Path | Purpose |
|------|---------|
| `aws-blocks/index.ts` | Backend: IFC layer (agrega tus Blocks aquí) |
| `aws-blocks/index.cdk.ts` | CDK layer (config de deploy, WAF, hosting) |
| `src/index.tsx` | Frontend: entry point React + MUI ThemeProvider |
| `src/app.tsx` | Frontend: componente principal |
| `index.html` | HTML shell |

## Stack incluido

- **React 19** — UI library
- **Material UI 9** — componentes visuales
- **Vite** — build tool con hot reload
- **TypeScript** — type safety
- **AWS Blocks** — framework de backend (Blocks disponibles abajo)

## Blocks disponibles para importar

```typescript
import {
  Scope, ApiNamespace,       // Core
  AuthBasic, AuthCognito,    // Autenticación
  Database, DistributedTable, KVStore, // Datos
  FileBucket,                // Archivos
  Agent, KnowledgeBase,      // AI
  Realtime, AsyncJob, CronJob, // Async
} from '@aws-blocks/blocks';
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev con mocks (sin AWS) |
| `npm run typecheck` | Type checking |
| `npm run sandbox` | Deploy rápido a AWS (solo backend) |
| `npm run deploy` | Deploy completo (frontend + backend) |
| `npm run sandbox:destroy` | Eliminar sandbox |
| `npm run destroy` | Eliminar deploy completo |

## Cómo usar

1. Edita `aws-blocks/index.ts` para agregar Blocks y métodos API
2. Edita `src/app.tsx` para construir tu UI con Material UI
3. Importa `api` desde `'aws-blocks'` en el frontend — type-safe automático
4. Prueba con `npm run dev` (todo corre local, sin cuenta AWS)
5. Despliega con `npm run deploy` cuando estés listo

## Para Agents

Full Building Block documentation: `node_modules/@aws-blocks/blocks/README.md`

Backend en `aws-blocks/index.ts`. Frontend en `src/app.tsx`.
Import del backend en frontend: `import { api } from 'aws-blocks'`.
