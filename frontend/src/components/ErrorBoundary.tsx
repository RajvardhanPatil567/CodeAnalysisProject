import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Typography, Box } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Box sx={{ p: 3 }}>
          <Alert 
            severity="error" 
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => window.location.reload()}
              >
                Reload
              </Button>
            }
          >
            <Typography variant="h6">Something went wrong</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {this.state.error?.message}
            </Typography>
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
              <Typography variant="caption" component="div">
                {this.state.error?.stack}
              </Typography>
              <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                {this.state.errorInfo?.componentStack}
              </Typography>
            </details>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
