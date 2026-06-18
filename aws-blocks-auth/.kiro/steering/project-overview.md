---
inclusion: auto
---

# AWS Blocks Auth — Project Overview

## Architecture (do NOT explore, this is the truth)

| File | Role |
|------|------|
| `aws-blocks/index.ts` | Backend: API definitions, auth config, protected endpoints |
| `src/auth.config.json` | ALL visual/text customization (colors, labels, theme) |
| `src/app.tsx` | Frontend component (reads auth.config.json, DO NOT edit for visual changes) |
| `src/index.tsx` | React entry point + MUI theme (reads auth.config.json, DO NOT edit for visual changes) |
| `index.html` | HTML shell |

## Key rules

1. **Visual changes** → edit ONLY `src/auth.config.json`
2. **Backend behavior** (password policy, session, new endpoints) → edit `aws-blocks/index.ts`
3. **Never edit `app.tsx` or `index.tsx`** for text, color, or theme changes
4. The project uses: React 19, Material UI 9, AWS Blocks, Vite, TypeScript
5. `npm run dev` starts local server on port 3000 (all mocks, no AWS needed)
6. Auth block documentation: `node_modules/@aws-blocks/bb-auth-basic/README.md`

## Auth system

- Uses `AuthBasic` (username/password + JWT cookies)
- `authApi` = state machine API for UI (signIn, signUp, signOut)
- `api` = app endpoints (ping, getProfile, greet)
- Protected endpoints use `auth.requireAuth(context)`
