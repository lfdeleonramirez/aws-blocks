# Personalización del Auth Block

Toda la configuración visual y de textos se maneja desde un solo archivo:

```
src/auth.config.json
```

No necesitas saber React. Solo edita el JSON y recarga la página.

---

## Estructura del archivo

### `app` — Configuración general

| Campo | Qué hace | Ejemplo |
|-------|----------|---------|
| `title` | Título de la pestaña del navegador | `"Mi App"` |
| `logo` | URL de un logo (dejar vacío para no mostrar) | `"/logo.png"` o `"https://..."` |

### `theme` — Colores y estilo global

| Campo | Qué hace | Ejemplo |
|-------|----------|---------|
| `mode` | Tema claro u oscuro | `"light"` o `"dark"` |
| `primaryColor` | Color principal (botones, links) | `"#1976d2"` |
| `secondaryColor` | Color secundario | `"#ff9800"` |
| `borderRadius` | Redondez de esquinas (en px) | `8` |

> Para cambiar a modo oscuro, solo cambia `"mode": "dark"`.

### `auth` — Pantalla de login/signup

| Campo | Qué hace |
|-------|----------|
| `signIn.title` | Título del formulario de login |
| `signIn.subtitle` | Texto debajo del título |
| `signIn.buttonText` | Texto del botón de login |
| `signIn.fields.emailLabel` | Label del campo de email |
| `signIn.fields.passwordLabel` | Label del campo de password |
| `signUp.title` | Título del formulario de registro |
| `signUp.subtitle` | Texto debajo del título |
| `signUp.buttonText` | Texto del botón de registro |
| `signUp.passwordHelp` | Texto de ayuda debajo del password |
| `links.noAccount` | Texto "No tienes cuenta?" |
| `links.noAccountAction` | Texto del link para ir a signup |
| `links.hasAccount` | Texto "Ya tienes cuenta?" |
| `links.hasAccountAction` | Texto del link para ir a login |
| `button.color` | Color del botón principal |
| `button.hoverColor` | Color del botón al pasar el mouse |

### `authenticated` — Pantalla después de login

| Campo | Qué hace |
|-------|----------|
| `title` | Título de bienvenida |
| `subtitle` | Texto con `{{username}}` que se reemplaza automáticamente |
| `profileButton` | Texto del botón de perfil |
| `signOutButton` | Texto del botón de cerrar sesión |

---

## Ejemplos rápidos

### Cambiar a modo oscuro
```json
"theme": {
  "mode": "dark",
  ...
}
```

### Cambiar textos a inglés completo
```json
"auth": {
  "signIn": {
    "title": "Welcome back",
    "subtitle": "Please enter your credentials",
    "buttonText": "Sign In",
    ...
  }
}
```

### Agregar logo
```json
"app": {
  "title": "Mi App",
  "logo": "/logo.png"
}
```
Coloca el archivo `logo.png` en la carpeta raíz del proyecto (junto a `index.html`).

### Hacer los bordes más redondeados
```json
"theme": {
  "borderRadius": 16
}
```
