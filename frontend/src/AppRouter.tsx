import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Projects = React.lazy(() => import('./pages/Projects'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));
const Issues = React.lazy(() => import('./pages/Issues'));
const ControlFlow = React.lazy(() => import('./pages/ControlFlow'));
const AnalyzeCode = React.lazy(() => import('./pages/AnalyzeCode'));

// Loading component
const Loading = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <Typography>Loading...</Typography>
  </Box>
);

// 404 Not Found component
const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="60vh"
      textAlign="center"
      p={3}
    >
      <Typography variant="h4" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => navigate('/')}
        sx={{ mt: 2 }}
      >
        Go to Home
      </Button>
    </Box>
  );
};

// Error boundary wrapper for routes
const RouteWithErrorBoundary = ({ element }: { element: React.ReactElement }) => {
  return (
    <ErrorBoundary fallback={
      <Box p={3}>
        <Typography variant="h5" color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" paragraph>
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </Box>
    }>
      <React.Suspense fallback={<Loading />}>
        {element}
      </React.Suspense>
    </ErrorBoundary>
  );
};

const AppRouter = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={<RouteWithErrorBoundary element={<Dashboard />} />} 
      />
      <Route path="/projects">
        <Route index element={<RouteWithErrorBoundary element={<Projects />} />} />
        <Route 
          path=":id" 
          element={<RouteWithErrorBoundary element={<ProjectDetail />} />} 
        />
      </Route>
      <Route 
        path="/issues" 
        element={<RouteWithErrorBoundary element={<Issues />} />} 
      />
      <Route 
        path="/control-flow" 
        element={<RouteWithErrorBoundary element={<ControlFlow />} />} 
      />
      <Route 
        path="/analyze" 
        element={<RouteWithErrorBoundary element={<AnalyzeCode />} />} 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
