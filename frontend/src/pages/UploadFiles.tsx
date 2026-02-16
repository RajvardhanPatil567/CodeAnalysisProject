import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import apiService from '../services/api';

interface UploadedFile {
  id: string;
  filename: string;
  language: string;
  lines_of_code: number;
}

interface UploadResult {
  project: string;
  project_name: string;
  files: UploadedFile[];
  message: string;
}

const UploadFiles: React.FC = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  // Define the upload response type
  interface UploadResponse {
    project?: string;
    project_name: string;
    files: Array<{
      id: string;
      filename: string;
      language: string;
      lines_of_code: number;
    }>;
    message: string;
  }
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setSelectedFiles(files);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('project_name', projectName);
      
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }

      const response = await apiService.uploadFiles(formData);
      if (response.data) {
        const responseData = response.data as unknown as UploadResponse;
        setResult({
          project: responseData.project || '',
          project_name: responseData.project_name || projectName,
          files: responseData.files || [],
          message: responseData.message || 'Files uploaded successfully'
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError('Failed to upload files. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      python: '#3776ab',
      javascript: '#f7df1e',
      typescript: '#3178c6',
      java: '#ed8b00',
      cpp: '#00599c',
      c: '#a8b9cc',
    };
    return colors[language] || '#666';
  };

  const supportedExtensions = ['.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.go', '.rs'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Upload Files
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload Code Files for Analysis
          </Typography>
          
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Supported file types: {supportedExtensions.join(', ')}
          </Typography>

          <TextField
            fullWidth
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            sx={{ mb: 3 }}
            disabled={uploading}
          />

          <Box sx={{ mb: 3 }}>
            <input
              accept={supportedExtensions.join(',')}
              style={{ display: 'none' }}
              id="file-upload"
              multiple
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                disabled={uploading}
              >
                Select Files
              </Button>
            </label>
          </Box>

          {selectedFiles && selectedFiles.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Files ({selectedFiles.length}):
              </Typography>
              <List dense>
                {Array.from(selectedFiles).map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <FileIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(1)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || !selectedFiles || !projectName.trim()}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            fullWidth
          >
            {uploading ? 'Uploading...' : 'Upload and Create Project'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <SuccessIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" color="success.main">
                Upload Successful!
              </Typography>
            </Box>

            <Typography variant="body1" gutterBottom>
              {result.message}
            </Typography>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Project: {result.project_name}
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Uploaded Files:
            </Typography>

            <List>
              {result.files.map((file) => (
                <ListItem key={file.id}>
                  <ListItemIcon>
                    <FileIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.filename}
                    secondary={`${file.lines_of_code} lines of code`}
                  />
                  <Chip
                    label={file.language}
                    size="small"
                    sx={{ 
                      backgroundColor: getLanguageColor(file.language),
                      color: 'white'
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => navigate(`/projects/${result.project}`)}
              >
                View Project
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setResult(null);
                  setSelectedFiles(null);
                  setProjectName('');
                }}
              >
                Upload More Files
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UploadFiles;
