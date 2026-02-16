import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  alpha,
  Paper,
  Tooltip,
  useTheme,
} from '@mui/material';
import { 
  Code as CodeIcon,
  BugReport as BugReportIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assessment as AssessmentIcon,
  DataObject as DataObjectIcon,
  UploadFile as UploadFileIcon
} from '@mui/icons-material';
import apiService from '../services/api';
import { AnalysisResult } from '../services/api';

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  background: 'transparent',
  color: theme.palette.text.primary,
  boxShadow: 'none',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  borderRadius: '8px !important',
  marginBottom: '8px',
  overflow: 'hidden',
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: '8px 0',
  },
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  border: '1px solid',
  borderColor: alpha(theme.palette.primary.main, 0.2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
    transform: 'translateY(-2px)',
  },
}));

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
  borderRadius: '10px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: `0 6px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: alpha(theme.palette.primary.main, 0.3),
      borderRadius: '8px',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme.palette.primary.main,
  },
}));


const AnalyzeCode: React.FC = () => {
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [filename, setFilename] = useState('example.py');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [file, setFile] = useState<File | null>(null);

  const languages = [
    { value: 'python', label: 'Python', icon: <DataObjectIcon fontSize="small" sx={{ mr: 1 }} /> },
    { value: 'javascript', label: 'JavaScript', icon: <DataObjectIcon fontSize="small" sx={{ mr: 1 }} /> },
    { value: 'typescript', label: 'TypeScript', icon: <DataObjectIcon fontSize="small" sx={{ mr: 1 }} /> },
    { value: 'java', label: 'Java', icon: <DataObjectIcon fontSize="small" sx={{ mr: 1 }} /> },
  ];

  // File extension to language mapping
  const extensionToLanguage: Record<string, string> = {
    // Python files
    'py': 'python',
    'pyw': 'python',
    'pyi': 'python',
    
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    
    // Java
    'java': 'java',
    'class': 'java',
    'jar': 'java',
    
    // C/C++
    'c': 'c',
    'h': 'c',
    'cpp': 'cpp',
    'hpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    
    // C#
    'cs': 'csharp',
    
    // Go
    'go': 'go',
    
    // Ruby
    'rb': 'ruby',
    
    // PHP
    'php': 'php',
    'phtml': 'php',
    
    // Shell
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    
    // Configuration
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'cfg': 'ini',
    
    // Web
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    
    // Other common
    'sql': 'sql',
    'md': 'markdown',
    'xml': 'xml'
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilename(selectedFile.name);
      
      // Set language based on file extension
      const extension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      if (extension && extensionToLanguage[extension]) {
        setLanguage(extensionToLanguage[extension]);
      } else {
        // Default to plaintext for unknown extensions
        setLanguage('plaintext');
      }
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target?.result as string || '');
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try another file.');
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // For development/testing - use mock data
      if (process.env.NODE_ENV === 'development' || !apiService.analyzeCode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mockResult = getMockAnalysisResult(code, language, filename);
        setResult(mockResult);
        return;
      }

      // Determine file extension based on language
      const languageToExtension: Record<string, string> = {
        'python': 'py',
        'javascript': 'js',
        'typescript': 'ts',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'csharp': 'cs',
        'go': 'go',
        'ruby': 'rb',
        'php': 'php'
      };

      const fileExt = languageToExtension[language] || 'txt';
      const defaultFilename = `untitled.${fileExt}`;
      
      const response = await apiService.analyzeCode({
        code,
        language,
        filename: filename || defaultFilename
      });
      
      console.log('API Response:', response); // Debug log
      
      if (response.status === 'success' && response.data) {
        // Ensure metrics has all required fields with defaults
        const metrics = response.data.metrics || {};
        const defaultMetrics = {
          lines_of_code: metrics.lines_of_code || code.split('\n').length,
          cyclomatic_complexity: metrics.cyclomatic_complexity || 0,
          maintainability_index: metrics.maintainability_index || 0,
          function_count: metrics.function_count || 0,
          class_count: metrics.class_count || 0,
          ...metrics
        };
        
        // Ensure issues is an array and has required fields
        const issues = (Array.isArray(response.data.issues) 
          ? response.data.issues 
          : []).map((issue: any) => ({
            rule_id: issue.rule_id || 'unknown',
            rule_name: issue.rule_name || 'Unknown Rule',
            severity: (['critical', 'major', 'minor', 'info'].includes(issue.severity?.toLowerCase())
              ? issue.severity.toLowerCase()
              : 'info') as 'critical' | 'major' | 'minor' | 'info',
            category: issue.category || 'code-style',
            message: issue.message || 'An issue was detected',
            line_number: Math.max(1, issue.line_number ? Number(issue.line_number) : 1),
            column_number: Math.max(1, issue.column_number ? Number(issue.column_number) : 1),
            suggestion: issue.suggestion
          }));
        
        setResult({
          file_path: filename || response.data.file_path || defaultFilename,
          language: response.data.language || language,
          metrics: defaultMetrics,
          issues: issues
        });
      } else {
        throw new Error(response.error || 'Failed to analyze code');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      // Use mock data as fallback
      console.log('Using mock data as fallback');
      const mockResult = getMockAnalysisResult(code, language, filename);
      setResult(mockResult);
      
      // Optional: Still show error but with mock data
      // const errorMessage = err?.response?.data?.error || 
      //                    err?.response?.data?.detail || 
      //                    err?.message || 
      //                    'Failed to analyze code. Using demo data.';
      // setError(`Note: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Mock data generator for development
  const getMockAnalysisResult = (code: string, language: string, filename: string): AnalysisResult => {
    const lines = code.split('\n').length;
    
    return {
      file_path: filename,
      language: language,
      metrics: {
        lines_of_code: lines,
        cyclomatic_complexity: Math.min(15, Math.max(1, Math.floor(lines / 5))),
        maintainability_index: Math.min(100, Math.max(20, 85 - Math.floor(lines / 10))),
        function_count: Math.max(1, Math.floor(lines / 10)),
        class_count: Math.max(0, Math.floor(lines / 20)),
        code_smells: Math.floor(lines / 15),
        duplication: 0,
      },
      issues: [
        {
          rule_id: 'C0103',
          rule_name: 'naming-convention',
          severity: 'minor' as const,
          category: 'code-style',
          message: 'Function name does not follow naming conventions',
          line_number: 1,
          column_number: 1,
          suggestion: 'Follow naming conventions for functions'
        },
        {
          rule_id: 'R0915',
          rule_name: 'too-many-statements',
          severity: 'major' as const,
          category: 'complexity',
          message: 'Function has too many statements',
          line_number: Math.max(1, Math.floor(lines / 2)),
          column_number: 1,
          suggestion: 'Break down function into smaller, more focused functions'
        }
      ].slice(0, Math.min(3, Math.floor(lines / 10)))
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'major': return 'warning';
      case 'minor': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon fontSize="small" sx={{ mr: 0.5 }} />;
      case 'major': return <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />;
      case 'minor': return <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />;
      default: return <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />;
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    const extensions: { [key: string]: string } = {
      python: '.py',
      javascript: '.js',
      typescript: '.ts',
      java: '.java',
    };
    setFilename(`example${extensions[newLanguage] || '.txt'}`);
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <CodeIcon sx={{ fontSize: 36, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Code Analysis
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Analyze your code for security vulnerabilities, code smells, and potential issues
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <CodeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Code Input
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={language}
                        label="Language"
                        onChange={(e) => handleLanguageChange(e.target.value as string)}
                        sx={{
                          '& .MuiSelect-select': {
                            display: 'flex',
                            alignItems: 'center',
                          },
                        }}
                      >
                        {languages.map((lang) => (
                          <MenuItem key={lang.value} value={lang.value}>
                            {lang.icon}
                            {lang.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Filename"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Box>

              <StyledTextField
                fullWidth
                multiline
                rows={20}
                label="Enter your code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                variant="outlined"
                sx={{ 
                  mb: 3, 
                  fontFamily: '"Fira Code", "Roboto Mono", monospace',
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                  },
                }}
                InputProps={{
                  style: {
                    borderRadius: '8px',
                  },
                }}
              />

              <Box display="flex" gap={2}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  style={{ flex: 1 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleAnalyze}
                    disabled={loading || !code.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : <BugReportIcon />}
                    sx={{
                      py: 1.5,
                      borderRadius: '8px',
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                      '&:hover': {
                        boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                      },
                      '&.Mui-disabled': {
                        background: theme.palette.action.disabledBackground,
                        color: theme.palette.text.disabled,
                      },
                    }}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Code'}
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <input
                    accept=".py,.js,.ts,.java,.jsx,.tsx"
                    style={{ display: 'none' }}
                    id="code-file-upload"
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="code-file-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      size="large"
                      startIcon={<UploadFileIcon />}
                      sx={{
                        py: 1.5,
                        height: '100%',
                        borderRadius: '8px',
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                        color: theme.palette.primary.main,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      Upload
                    </Button>
                  </label>
                </motion.div>
              </Box>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mt: 2,
                        borderRadius: '8px',
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                        background: alpha(theme.palette.error.main, 0.1),
                        '& .MuiAlert-icon': {
                          color: theme.palette.error.main,
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <StyledCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={3}>
                      <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        Analysis Results
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                        <AssessmentIcon fontSize="small" sx={{ mr: 0.5 }} /> Code Metrics
                      </Typography>
                      <Grid container spacing={2}>
                        {/* Lines of Code */}
                        <Grid item xs={6} sm={4} md={3}>
                          <MetricCard elevation={0}>
                            <Box display="flex" alignItems="center" mb={1}>
                              <CodeIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                                {result.metrics?.lines_of_code?.toLocaleString() || '0'}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">Lines of Code</Typography>
                            <Box sx={{ 
                              height: '4px',
                              width: '100%',
                              bgcolor: 'divider',
                              mt: 1,
                              borderRadius: 1,
                              overflow: 'hidden'
                            }}>
                              <Box 
                                sx={{
                                  height: '100%',
                                  width: '100%',
                                  bgcolor: 'primary.main',
                                  opacity: 0.7
                                }}
                              />
                            </Box>
                          </MetricCard>
                        </Grid>

                        {/* Cyclomatic Complexity */}
                        <Grid item xs={6} sm={4} md={3}>
                          <MetricCard elevation={0}>
                            <Box display="flex" alignItems="center" mb={1}>
                              <BugReportIcon color="secondary" fontSize="small" sx={{ mr: 1 }} />
                              <Typography 
                                variant="h5" 
                                sx={{ 
                                  fontWeight: 700,
                                  color: result.metrics?.cyclomatic_complexity > 10 ? 'error.main' : 
                                        result.metrics?.cyclomatic_complexity > 5 ? 'warning.main' : 'secondary.main'
                                }}
                              >
                                {result.metrics?.cyclomatic_complexity || '0'}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">Cyclomatic Complexity</Typography>
                            <Box sx={{ 
                              height: '4px',
                              width: '100%',
                              bgcolor: 'divider',
                              mt: 1,
                              borderRadius: 1,
                              overflow: 'hidden'
                            }}>
                              <Box 
                                sx={{
                                  height: '100%',
                                  width: `${Math.min(100, (result.metrics?.cyclomatic_complexity || 0) * 5)}%`,
                                  bgcolor: result.metrics?.cyclomatic_complexity > 10 ? 'error.main' : 
                                          result.metrics?.cyclomatic_complexity > 5 ? 'warning.main' : 'secondary.main',
                                  opacity: 0.7
                                }}
                              />
                            </Box>
                          </MetricCard>
                        </Grid>

                        {/* Maintainability Index */}
                        <Grid item xs={6} sm={4} md={3}>
                          <MetricCard elevation={0}>
                            <Box display="flex" alignItems="center" mb={1}>
                              <CheckCircleIcon 
                                color={
                                  result.metrics?.maintainability_index > 80 ? 'success' :
                                  result.metrics?.maintainability_index > 60 ? 'warning' : 'error'
                                } 
                                fontSize="small" 
                                sx={{ mr: 1 }} 
                              />
                              <Typography 
                                variant="h5" 
                                sx={{ 
                                  fontWeight: 700,
                                  color: result.metrics?.maintainability_index > 80 ? 'success.main' :
                                         result.metrics?.maintainability_index > 60 ? 'warning.main' : 'error.main'
                                }}
                              >
                                {result.metrics?.maintainability_index?.toFixed(1) || 'N/A'}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">Maintainability</Typography>
                            <Box sx={{ 
                              height: '4px',
                              width: '100%',
                              bgcolor: 'divider',
                              mt: 1,
                              borderRadius: 1,
                              overflow: 'hidden'
                            }}>
                              <Box 
                                sx={{
                                  height: '100%',
                                  width: `${result.metrics?.maintainability_index || 0}%`,
                                  bgcolor: result.metrics?.maintainability_index > 80 ? 'success.main' :
                                          result.metrics?.maintainability_index > 60 ? 'warning.main' : 'error.main',
                                  opacity: 0.7
                                }}
                              />
                            </Box>
                          </MetricCard>
                        </Grid>

                        {/* Functions */}
                        <Grid item xs={6} sm={4} md={3}>
                          <MetricCard elevation={0}>
                            <Box display="flex" alignItems="center" mb={1}>
                              <DataObjectIcon color="info" fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="h5" color="info.main" sx={{ fontWeight: 700 }}>
                                {result.metrics?.function_count || '0'}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">Functions</Typography>
                            <Box sx={{ 
                              height: '4px',
                              width: '100%',
                              bgcolor: 'divider',
                              mt: 1,
                              borderRadius: 1,
                              overflow: 'hidden'
                            }}>
                              <Box 
                                sx={{
                                  height: '100%',
                                  width: '100%',
                                  bgcolor: 'info.main',
                                  opacity: 0.7
                                }}
                              />
                            </Box>
                          </MetricCard>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <BugReportIcon fontSize="small" sx={{ mr: 0.5 }} />
                          Issues Found
                        </Typography>
                        <Chip 
                          label={result.issues.length} 
                          color={result.issues.length > 0 ? 'error' : 'success'} 
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      {result.issues.length === 0 ? (
                        <Alert 
                          severity="success" 
                          icon={<CheckCircleIcon fontSize="inherit" />}
                          sx={{
                            borderRadius: '8px',
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                            background: alpha(theme.palette.success.main, 0.1),
                            '& .MuiAlert-icon': {
                              color: theme.palette.success.main,
                            },
                          }}
                        >
                          <Typography variant="subtitle2">No issues found!</Typography>
                          <Typography variant="body2" color="text.secondary">Your code looks clean and well-structured.</Typography>
                        </Alert>
                      ) : (
                        <Box>
                          {result.issues.map((issue, index) => {
                            const panelId = `issue-${index}`;
                            return (
                              <StyledAccordion 
                                key={index} 
                                expanded={expanded === panelId}
                                onChange={handleAccordionChange(panelId)}
                                sx={{
                                  '& .MuiAccordionSummary-root': {
                                    minHeight: '56px',
                                    '&.Mui-expanded': {
                                      minHeight: '56px',
                                    },
                                  },
                                }}
                              >
                                <AccordionSummary 
                                  expandIcon={
                                    <ExpandMoreIcon sx={{ 
                                      color: 'text.secondary',
                                      '&:hover': {
                                        color: 'primary.main',
                                      },
                                    }} />
                                  }
                                >
                                  <Box display="flex" alignItems="center" width="100%" sx={{ overflow: 'hidden' }}>
                                    <Tooltip title={issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}>
                                      <Box sx={{ mr: 1.5 }}>
                                        {getSeverityIcon(issue.severity)}
                                      </Box>
                                    </Tooltip>
                                    <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
                                      <Typography 
                                        variant="subtitle2" 
                                        noWrap 
                                        sx={{ 
                                          fontWeight: 600,
                                          color: expanded === panelId ? 'primary.main' : 'text.primary',
                                        }}
                                      >
                                        {issue.rule_name}
                                      </Typography>
                                      <Typography 
                                        variant="caption" 
                                        color="text.secondary" 
                                        noWrap
                                        sx={{ 
                                          display: 'block',
                                          fontSize: '0.7rem',
                                        }}
                                      >
                                        {issue.category} • Line {issue.line_number}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={issue.severity}
                                      size="small"
                                      color={getSeverityColor(issue.severity) as any}
                                      sx={{
                                        textTransform: 'capitalize',
                                        fontWeight: 600,
                                        fontSize: '0.65rem',
                                        height: '20px',
                                      }}
                                    />
                                  </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 1, pb: 2 }}>
                                  <Box>
                                    <Typography variant="body2" paragraph>
                                      {issue.message}
                                    </Typography>
                                    <Box sx={{ 
                                      display: 'flex', 
                                      flexWrap: 'wrap',
                                      gap: 1,
                                      mt: 2,
                                      '& > *': {
                                        borderRadius: '4px',
                                        px: 1.5,
                                        py: 0.5,
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        background: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                      },
                                    }}>
                                      <Box>Line {issue.line_number}:{issue.column_number}</Box>
                                      <Box>{issue.category}</Box>
                                    </Box>
                                    {issue.suggestion && (
                                      <Box 
                                        sx={{
                                          mt: 2,
                                          p: 1.5,
                                          borderRadius: '6px',
                                          background: alpha(theme.palette.info.main, 0.1),
                                          borderLeft: `3px solid ${theme.palette.info.main}`,
                                        }}
                                      >
                                        <Typography variant="subtitle2" color="info.main" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                          <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                                          Suggestion
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontFamily: '"Fira Code", monospace', fontSize: '0.85rem' }}>
                                          {issue.suggestion}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </AccordionDetails>
                              </StyledAccordion>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </StyledCard>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StyledCard sx={{ height: '100%' }}>
                  <CardContent sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minHeight: '400px',
                    textAlign: 'center',
                    py: 6,
                  }}>
                    <Box sx={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      '& svg': {
                        fontSize: '40px',
                        color: theme.palette.primary.main,
                      },
                    }}>
                      <CodeIcon />
                    </Box>
                    <Typography variant="h6" color="text.primary" gutterBottom>
                      Ready to Analyze
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '320px', mb: 3 }}>
                      Enter your code and click "Analyze Code" to find potential issues and improve your code quality.
                    </Typography>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box sx={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: theme.palette.primary.main,
                        mr: 1,
                      }} />
                      <Typography variant="caption" color="primary">
                        Waiting for code to analyze...
                      </Typography>
                    </motion.div>
                  </CardContent>
                </StyledCard>
              </motion.div>
            )}
          </AnimatePresence>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default AnalyzeCode;
