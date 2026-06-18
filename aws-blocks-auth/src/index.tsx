import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import App from './app';
import config from './auth.config.json';

const theme = createTheme({
  palette: {
    mode: config.theme.mode as 'light' | 'dark',
    primary: { main: config.theme.primaryColor },
    secondary: { main: config.theme.secondaryColor },
  },
  shape: {
    borderRadius: config.theme.borderRadius,
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
