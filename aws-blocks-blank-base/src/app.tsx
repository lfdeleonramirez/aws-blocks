import { api } from 'aws-blocks';
import { useState, useEffect } from 'react';
import { Container, Typography, Paper } from '@mui/material';

function App() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    api.ping().then(setStatus);
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          AWS Blocks Blank Base
        </Typography>
        {status ? (
          <Typography color="success.main">
            ✅ Backend conectado: {status.message}
          </Typography>
        ) : (
          <Typography color="text.secondary">
            Conectando al backend...
          </Typography>
        )}
      </Paper>
    </Container>
  );
}

export default App;
