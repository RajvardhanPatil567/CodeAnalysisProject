import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Folder as FolderIcon, UploadFile as UploadFileIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api, { Project as ProjectType, Report } from '../services/api';

// Using ProjectType from api.ts instead of local interface

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    projectId: string | null;
    projectName: string;
  }>({ open: false, projectId: null, projectName: '' });

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.getProjects();
      if (response.status === 'success' && Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        throw new Error(response.error || 'Failed to load projects');
      }
    } catch (err) {
      setError('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Handle project deletion
  const handleDeleteClick = (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation(); // Prevent event bubbling to parent elements
    console.log('Delete clicked for project:', projectId, projectName);
    setDeleteDialog({
      open: true,
      projectId,
      projectName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.projectId) {
      console.error('No project ID provided for deletion');
      return;
    }
    
    try {
      console.log('Attempting to delete project:', deleteDialog.projectId);
      const response = await api.deleteProject(deleteDialog.projectId);
      console.log('Delete response:', response);
      
      if (response.status === 'success') {
        setNotification({
          open: true,
          message: `Project "${deleteDialog.projectName}" deleted successfully`,
          severity: 'success',
        });
        // Refresh the projects list
        await loadProjects();
      } else {
        const errorMessage = response.error || 'Failed to delete project';
        console.error('Delete failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setNotification({
        open: true,
        message: `Delete failed: ${errorMessage}`,
        severity: 'error',
      });
    } finally {
      setDeleteDialog({ open: false, projectId: null, projectName: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, projectId: null, projectName: '' });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    if (!event.target.files || event.target.files.length === 0) {
      setNotification({
        open: true,
        message: 'Please select a file to upload',
        severity: 'warning',
      });
      return;
    }
    
    const file = event.target.files[0];
    console.log('Selected file:', file.name, 'size:', file.size, 'type:', file.type);

    try {
      setUploading(prev => ({ ...prev, [projectId]: true }));
      
      // Create a new FormData instance
      const formData = new FormData();
      
      // Append the file with the exact field name 'files' (plural)
      // This is crucial as the backend expects 'files' for request.FILES.getlist('files')
      formData.append('files', file);
      
      // Get the project to include its name in the request
      const project = projects.find(p => p.id === projectId);
      if (project) {
        formData.append('project_name', project.name);
        formData.append('project_id', projectId);
      } else {
        formData.append('project_name', `Project ${projectId}`);
      }
      
      // Log the form data entries for debugging
      console.log('FormData entries before upload:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value instanceof File ? 
          `[File] ${value.name} (${value.size} bytes, ${value.type})` : 
          value);
      }

      // Log the form data for debugging
      console.log('Uploading file with data:', {
        project_name: project?.name || `Project ${projectId}`,
        project_id: projectId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      });

      // Use the uploadFiles method from our API service
      const response = await api.uploadFiles(formData);
      
      if (response.status === 'success') {
        setNotification({
          open: true,
          message: 'File uploaded successfully!',
          severity: 'success',
        });
        
        // Refresh projects list and project data
        await loadProjects();
        
        // If we're on the project detail page, refresh that too
        if (window.location.pathname.includes('/projects/')) {
          window.location.reload();
        }
      } else {
        throw new Error(response.error || 'Failed to upload file');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setNotification({
        open: true,
        message: error.response?.data?.error || error.message || 'Failed to upload file',
        severity: 'error',
      });
    } finally {
      setUploading(prev => ({ ...prev, [projectId]: false }));
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleCreateProject = async () => {
    try {
      if (!newProject.name.trim()) {
        setError('Project name is required');
        return;
      }

      let response;
      
      if (selectedFile) {
        // If there's a file, use the uploadFiles endpoint first
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', newProject.name.trim());
        formData.append('description', newProject.description.trim());
        
        const uploadResponse = await api.uploadFiles(formData);
        
        // If file upload is successful, create the project with the file reference
        if (uploadResponse.status === 'success') {
          response = await api.createProject({
            name: newProject.name.trim(),
            description: newProject.description.trim(),
          });
          setNotification({
            open: true,
            message: 'Project created and file uploaded successfully!',
            severity: 'success',
          });
        } else {
          throw new Error(uploadResponse.error || 'Failed to upload file');
        }
      } else {
        // If no file, just create the project
        response = await api.createProject({
          name: newProject.name.trim(),
          description: newProject.description.trim()
        });
        
        if (response.status === 'success' && response.data) {
          setNotification({
            open: true,
            message: 'Project created successfully!',
            severity: 'success',
          });
          setCreateDialogOpen(false);
          setNewProject({ name: '', description: '' });
          setError(null);
          loadProjects();
        } else {
          throw new Error(response.error || 'Failed to create project');
        }
      }

      if (response.status === 'success' && response.data) {
        setCreateDialogOpen(false);
        setNewProject({ name: '', description: '' });
        setSelectedFile(null);
        setError(null);
        loadProjects();
      } else {
        const errorMessage = response.error || 'Failed to create project';
      setError(errorMessage);
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while creating the project';
      setError(errorMessage);
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
      console.error('Create project error:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 8 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card
              sx={{ 
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover .upload-button': {
                  opacity: 1,
                },
              }}
              onClick={(e) => {
                // Only navigate if the click is not on the upload button
                if (!(e.target as HTMLElement).closest('.upload-button')) {
                  navigate(`/projects/${project.id}`);
                }
              }}
            >
              <Box className="card-actions" sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                display: 'flex',
                gap: 1,
                '&:hover .action-button': {
                  opacity: 1,
                },
              }}>
                {/* Upload Button */}
                <Box className="upload-button action-button" sx={{ opacity: 0, transition: 'opacity 0.2s' }}>
                  <input
                    accept=".py,.js,.ts,.java,.jsx,.tsx"
                    style={{ display: 'none' }}
                    id={`file-upload-${project.id}`}
                    type="file"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      handleFileUpload(e, project.id);
                      e.target.value = '';
                    }}
                  />
                  <label htmlFor={`file-upload-${project.id}`}>
                    <Button
                      variant="contained"
                      component="span"
                      size="small"
                      startIcon={<UploadFileIcon />}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Upload
                    </Button>
                  </label>
                </Box>
                
                {/* Delete Button */}
                <Box className="delete-button action-button" sx={{ opacity: 0, transition: 'opacity 0.2s' }}>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={(e) => handleDeleteClick(e, project.id, project.name)}
                    title="Delete Project"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" component="h2" noWrap>
                    {project.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {project.description || 'No description'}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    {project.files_count} files
                  </Typography>
                  {project.latest_report && (
                    <Chip
                      label={project.latest_report.status}
                      color={getStatusColor(project.latest_report.status) as any}
                      size="small"
                    />
                  )}
                </Box>

                {project.latest_report && (
                  <Typography variant="body2" color="textSecondary">
                    {project.latest_report.total_issues} issues found
                  </Typography>
                )}

                <Typography variant="caption" color="textSecondary">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {projects.length === 0 && !loading && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Create your first project to start analyzing code
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Project
          </Button>
        </Box>
      )}

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <input
            accept=".py,.js,.ts,.java,.jsx,.tsx"
            style={{ display: 'none' }}
            id="project-file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="project-file-upload">
            <Button
              component="span"
              variant="outlined"
              fullWidth
              startIcon={<UploadFileIcon />}
              sx={{
                py: 1.5,
                borderStyle: 'dashed',
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              }}
            >
              {selectedFile ? selectedFile.name : 'Upload Initial File (Optional)'}
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!newProject.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Project
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete project "{deleteDialog.projectName}"?
            This action cannot be undone and will permanently delete all associated files and reports.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel} 
            color="primary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            autoFocus
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Projects;
