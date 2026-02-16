import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Chip,
} from '@mui/material';
import TabPanel from '../components/TabPanel';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  Assessment as ReportIcon,
  BugReport as IssueIcon,
  Settings as SettingsIcon,
  PlayArrow as AnalyzeIcon,
  InsertDriveFile as FileIcon,
  ExpandMore as ExpandMoreIcon,
  UploadFile as UploadFileIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import type { GridRenderCellParams } from '@mui/x-data-grid';
import api, { Project, Report, Issue, CodeFile } from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';


const ProjectDetail = (): JSX.Element => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  // Load project data
  const loadProjectData = useCallback(async () => {
    if (!projectId) return;
    
    // Reset all states when loading a new project
    setProject(null);
    setFiles([]);
    setIssues([]);
    setError(null);
    setLoading(true);
    
    console.log(`Loading data for project: ${projectId}`);
    
    try {
      // Fetch project details first
      const projectResponse = await api.getProject(projectId);
      console.log('Project response:', projectResponse);
      
      if (projectResponse.status === 'success' && projectResponse.data) {
        setProject(projectResponse.data);
        
        try {
          // Then fetch files
          const filesResponse = await api.getFiles({ project: projectId });

          console.log('Files response:', filesResponse);

          // Handle files response
          if (filesResponse.status === 'success' && Array.isArray(filesResponse.data)) {
            console.log(`Loaded ${filesResponse.data.length} files`);
            // Filter files to ensure they belong to the current project
            const projectFiles = filesResponse.data.filter(file => file.project === projectId);
            setFiles(projectFiles);
          } else {
            console.error('Failed to load files:', filesResponse.error);
            setFiles([]);
          }

          // Fetch and handle issues
          const issuesResponse = await api.getIssues({ project: projectId });
          if (issuesResponse.status === 'success' && Array.isArray(issuesResponse.data)) {
            console.log(`Loaded ${issuesResponse.data.length} issues for project`);
            setIssues(issuesResponse.data);
          } else {
            console.error('Failed to load issues:', issuesResponse.error);
            setIssues([]);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load project data';
          console.error('Error loading project data:', errorMessage, err);
          setError(`Failed to load project data: ${errorMessage}`);
        }
      } else {
        const errorMsg = projectResponse.error || 'Failed to load project details';
        console.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Unexpected error:', errorMessage, err);
      setError(`Failed to load project data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  
  // Add a cleanup function to reset state when the component unmounts or projectId changes
  useEffect(() => {
    return () => {
      setProject(null);
      setFiles([]);
      setIssues([]);
      setError(null);
    };
  }, [projectId]);

  // Load data on component mount
  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const file = files[0];
      const formData = new FormData();
      
      // Use 'files' as the field name to match the backend expectation
      formData.append('files', file);
      
      // Add project information
      if (projectId) {
        formData.append('project_id', projectId);
        if (project) {
          formData.append('project_name', project.name);
        }
      }

      console.log('Uploading file:', file.name, 'size:', file.size, 'type:', file.type);
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value instanceof File ? `[File] ${value.name}` : value);
      }

      const response = await api.uploadFiles(formData);
      
      if (response.status === 'success') {
        console.log('File upload successful, refreshing project data...');
        setNotification({
          open: true,
          message: `File "${file.name}" uploaded successfully`,
          severity: 'success',
        });
        
        // Force refresh the project data
        await loadProjectData();
        
        // Also refresh the files list specifically
        if (projectId) {
          const filesResponse = await api.getFiles({ project: projectId });
          if (filesResponse.status === 'success' && Array.isArray(filesResponse.data)) {
            setFiles(filesResponse.data.filter(file => file.project === projectId));
          }
        }
      } else {
        throw new Error(response.error || 'Failed to upload file');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      console.error('File upload error:', errorMessage, err);
      setError(errorMessage);
      setNotification({
        open: true,
        message: `Upload failed: ${errorMessage}`,
        severity: 'error',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [projectId, loadProjectData]);

  // Handle project analysis
  const handleAnalyze = useCallback(async () => {
    if (!projectId) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const response = await api.analyzeProject(projectId);
      
      if (response.status === 'success') {
        setNotification({
          open: true,
          message: 'Analysis completed successfully',
          severity: 'success',
        });
        await loadProjectData();
      } else {
        throw new Error(response.error || 'Failed to analyze project');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze project';
      setError(errorMessage);
      setNotification({
        open: true,
        message: `Analysis failed: ${errorMessage}`,
        severity: 'error',
      });
    } finally {
      setAnalyzing(false);
    }
  }, [projectId, loadProjectData]);

  // Get severity color for chips
  const getSeverityColor = (severity: string) => {
    const severityLower = severity.toLowerCase();
    if (severityLower === 'critical') {
      return 'error';
    } else if (severityLower === 'major') {
      return 'warning';
    } else if (severityLower === 'minor') {
      return 'info';
    }
    return 'info'; // default for 'info' or any other value
  };

  // Issue columns for DataGrid
  const issueColumns = useMemo<GridColDef[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 70 },
      {
        field: 'severity',
        headerName: 'Severity',
        width: 120,
        renderCell: (params: GridRenderCellParams) => (
          <Chip
            label={params.value}
            color={getSeverityColor(params.value) as any}
            size="small"
          />
        ),
      },
      { field: 'message', headerName: 'Message', flex: 1 },
      { field: 'file_name', headerName: 'File', width: 200 },
      { field: 'line_number', headerName: 'Line', width: 80 },
    ],
    [getSeverityColor]
  );

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          <Button color="inherit" size="small" onClick={loadProjectData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  // No project found
  if (!project) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Project not found
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/projects')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, ml: 1 }}>
          {project.name}
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadProjectData} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="project tabs"
          sx={{ minHeight: '64px' }}
        >
          <Tab 
            icon={<CodeIcon />} 
            label={`Files (${files.length})`} 
            iconPosition="start" 
            sx={{ minHeight: '64px' }} 
          />
          <Tab 
            icon={<IssueIcon />} 
            label={`Issues (${issues.length})`} 
            iconPosition="start" 
            sx={{ minHeight: '64px' }} 
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="Settings" 
            iconPosition="start" 
            sx={{ minHeight: '64px' }} 
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Files Tab Content */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={uploading || !projectId}
            sx={{ mr: 2, mb: 2 }}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <AnalyzeIcon />}
            onClick={handleAnalyze}
            disabled={analyzing || files.length === 0}
            sx={{ mb: 2 }}
          >
            {analyzing ? 'Analyzing...' : 'Analyze Project'}
          </Button>
          {files.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No files uploaded yet. Upload a file to get started.
            </Typography>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Files
                </Typography>
                <Typography variant="h5">{files.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Issues
                </Typography>
                <Typography variant="h5">{issues.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {files.length > 0 && (
          <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Project Files
            </Typography>
            <List>
              {files.map((file) => (
                <ListItem key={file.id}>
                  <ListItemIcon>
                    <FileIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.filename}
                    secondary={file.language || 'Unknown'}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Issues Tab Content */}
        {issues.length === 0 ? (
          <Alert severity="info">No issues found for this project.</Alert>
        ) : (
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={issues}
              columns={issueColumns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              checkboxSelection
              disableRowSelectionOnClick
            />
          </Box>
        )}
      </TabPanel>


      <TabPanel value={tabValue} index={2}>
        {/* Settings Tab Content */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Project Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Project Name"
                value={project.name}
                margin="normal"
                disabled
              />
              <TextField
                fullWidth
                label="Description"
                value={project.description || ''}
                margin="normal"
                multiline
                rows={4}
                disabled
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  sx={{ mr: 2 }}
                  disabled
                >
                  Delete Project
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  disabled
                >
                  Edit Project
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Project Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Created:</strong> {new Date(project.created_at).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Last Updated:</strong> {new Date(project.updated_at).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>ID:</strong> {project.id}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success/Info Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProjectDetail;
