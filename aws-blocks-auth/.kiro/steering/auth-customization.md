---
inclusion: fileMatch
fileMatchPattern: "src/auth.config.json,src/app.tsx,src/index.tsx"
---

# Auth Block Customization Guide

## How this works

All visual customization of the auth UI is done through ONE file: `src/auth.config.json`.
The React components (`src/app.tsx` and `src/index.tsx`) read this config and render accordingly.
**You should NEVER need to edit app.tsx or index.tsx for visual/text changes.**

## Config file location

```
src/auth.config.json
```

## Config structure and what each field controls

### `app` — Browser tab and branding
| Field | Controls | Type | Example |
|-------|----------|------|---------|
| `app.title` | Browser tab title | string | `"My App"` |
| `app.logo` | Logo image URL (empty = no logo) | string | `"/logo.png"` |

### `theme` — Global Material UI theme
| Field | Controls | Type | Example |
|-------|----------|------|---------|
| `theme.mode` | Light or dark mode | `"light"` or `"dark"` | `"dark"` |
| `theme.primaryColor` | Primary color (links, highlights) | hex color | `"#1976d2"` |
| `theme.secondaryColor` | Secondary color | hex color | `"#ff9800"` |
| `theme.borderRadius` | Corner roundness in pixels | number | `8` |

### `auth.signIn` — Sign in form
| Field | Controls | Type |
|-------|----------|------|
| `auth.signIn.title` | Form heading | string |
| `auth.signIn.subtitle` | Text below heading | string |
| `auth.signIn.buttonText` | Submit button text | string |
| `auth.signIn.fields.emailLabel` | Email field label | string |
| `auth.signIn.fields.passwordLabel` | Password field label | string |

### `auth.signUp` — Sign up form
| Field | Controls | Type |
|-------|----------|------|
| `auth.signUp.title` | Form heading | string |
| `auth.signUp.subtitle` | Text below heading | string |
| `auth.signUp.buttonText` | Submit button text | string |
| `auth.signUp.passwordHelp` | Helper text below password | string |
| `auth.signUp.fields.emailLabel` | Email field label | string |
| `auth.signUp.fields.passwordLabel` | Password field label | string |

### `auth.links` — Navigation links between forms
| Field | Controls | Type |
|-------|----------|------|
| `auth.links.noAccount` | Text before signup link | string |
| `auth.links.noAccountAction` | Signup link text | string |
| `auth.links.hasAccount` | Text before signin link | string |
| `auth.links.hasAccountAction` | Signin link text | string |

### `auth.button` — Main submit button styling
| Field | Controls | Type |
|-------|----------|------|
| `auth.button.color` | Button background color | hex color |
| `auth.button.hoverColor` | Button color on hover | hex color |

### `authenticated` — Post-login screen
| Field | Controls | Type |
|-------|----------|------|
| `authenticated.title` | Welcome heading | string |
| `authenticated.subtitle` | Subtitle (use `{{username}}` as placeholder) | string |
| `authenticated.profileButton` | Profile button text | string |
| `authenticated.signOutButton` | Sign out button text | string |

## Instructions for the AI

When the user asks to change colors, text, theme, branding, or any visual aspect of the auth UI:

1. **ONLY edit `src/auth.config.json`** — never touch `app.tsx` or `index.tsx`
2. Find the correct field from the tables above
3. Change the value
4. That's it — no other files need changes

### Common requests mapped to fields:

| User says | Edit this field |
|-----------|----------------|
| "dark mode" / "modo oscuro" | `theme.mode` → `"dark"` |
| "change color" / "cambiar color" | `theme.primaryColor` or `auth.button.color` |
| "change button text" | `auth.signIn.buttonText` or `auth.signUp.buttonText` |
| "add logo" | `app.logo` → URL or path |
| "round corners" / "more rounded" | `theme.borderRadius` → higher number |
| "change title" | `auth.signIn.title` or `app.title` |
| "Spanish" / "English" texts | Change all string fields to desired language |
| "hide signup" — NOT possible via config, would need code change | Tell user this is not configurable yet |

## Backend customization

The backend auth config lives in `aws-blocks/index.ts`. Changes there include:
- Password policy (min length, require digits, etc.)
- Session duration
- Adding code delivery (email verification)

Those are NOT visual — they change behavior.
