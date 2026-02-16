import React from 'react';
import { Box, createTheme } from '@mui/material';
import Navbar from './components/Navbar';
import AppRouter from './AppRouter';
import { blue, deepPurple } from '@mui/material/colors';
import { SnackbarProvider } from 'notistack';

// Create a game-themed dark theme
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: blue[500],
      light: blue[400],
      dark: blue[600],
      contrastText: '#fff',
    },
    secondary: {
      main: deepPurple[500],
      light: deepPurple[400],
      dark: deepPurple[600],
    },
    background: {
      default: '#0a0a1a',
      paper: '#13132b',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '0.5px',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '0.3px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #2563eb 30%, #7c3aed 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(19, 19, 43, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <SnackbarProvider 
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      autoHideDuration={5000}
      preventDuplicate
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            pt: { xs: '80px', sm: '88px' }, // Increased top padding for fixed navbar
            px: { xs: 2, sm: 3, md: 4 },
            pb: 4,
            maxWidth: '1600px',
            margin: '0 auto',
            width: '100%',
            minHeight: 'calc(100vh - 80px)', // Ensure content takes at least the full viewport height minus navbar
          }}
        >
          <AppRouter />
        </Box>
      </Box>
    </SnackbarProvider>
  );
}

export default App;

