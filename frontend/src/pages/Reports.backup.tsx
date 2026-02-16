import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  BugReport as BugReportIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api, { Report, Issue } from '../services/api';

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

const CHART_COLORS = {
  critical: '#ff4444',
  high: '#ffbb33',
  medium: '#ff8800',
  low: '#00C851',
  info: '#33b5e5',
} as const;

const Reports: React.FC = () => {
  // State management
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Refs and hooks
  const isMounted = useRef<boolean>(true);
  const navigate = useNavigate();

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load reports from API
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getReports();
      
      if (!isMounted.current) return;

      if (response.status === 'success' && response.data) {
        setReports(response.data);
        if (response.data.length > 0) {
          setSelectedReport(response.data[0]);
        }
      } else {
        setError(response.error || 'Failed to load reports');
      }
    } catch (err) {
      if (isMounted.current) {
        setError('Failed to load reports. Please try again later.');
        console.error('Error loading reports:', err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadReports();
  }, [loadReports]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle export
  const handleExport = useCallback(() => {
    if (!selectedReport) return;
    alert(`Exporting report: ${selectedReport.project}`);
  }, [selectedReport]);

  // Calculate severity data for charts
  const severityData = useMemo<ChartDataItem[]>(() => {
    if (!selectedReport?.summary) return [];
    
    return [
      { name: 'Critical', value: selectedReport.summary.critical || 0, color: CHART_COLORS.critical },
      { name: 'High', value: selectedReport.summary.high || 0, color: CHART_COLORS.high },
      { name: 'Medium', value: selectedReport.summary.medium || 0, color: CHART_COLORS.medium },
      { name: 'Low', value: selectedReport.summary.low || 0, color: CHART_COLORS.low },
      { name: 'Info', value: selectedReport.summary.info || 0, color: CHART_COLORS.info },
    ].filter(item => item.value > 0);
  }, [selectedReport?.summary]);

  // Calculate category data for charts
  const categoryData = useMemo<ChartDataItem[]>(() => {
    if (!selectedReport?.summary?.categories) {
      if (!selectedReport?.issues?.length) return [];
      
      const categories = new Map<string, number>();
      selectedReport.issues.forEach(issue => {
        const count = categories.get(issue.category) || 0;
        categories.set(issue.category, count + 1);
      });
      
      return Array.from(categories.entries()).map(([name, value]) => ({
        name,
        value,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
      }));
    }
    
    // Use categories from summary if available
    return Object.entries(selectedReport.summary.categories)
      .map(([name, value]) => ({
        name,
        value: Number(value) || 0,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [selectedReport?.summary?.categories, selectedReport?.issues]);

  // Render severity chip component
  const renderSeverityChip = (severity: string) => {
    const severityMap: Record<string, { color: string; label: string }> = {
      critical: { color: 'error', label: 'Critical' },
      high: { color: 'warning', label: 'High' },
      medium: { color: 'info', label: 'Medium' },
      low: { color: 'success', label: 'Low' },
      info: { color: 'default', label: 'Info' },
    };

    const { color, label } = severityMap[severity.toLowerCase()] || { color: 'default', label: severity };
    return <Chip label={label} color={color as any} size="small" />;
  };

  const renderReportSummary = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            {selectedReport?.project || 'Report Summary'}
          </Typography>
          <Box>
            <IconButton onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={handleExport} disabled={!selectedReport}>
              <DownloadIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <CodeIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="h6">{selectedReport?.summary?.total_files || 0}</Typography>
              <Typography variant="body2" color="textSecondary">Files Analyzed</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <BugReportIcon color="error" sx={{ fontSize: 40 }} />
              <Typography variant="h6">{selectedReport?.summary?.total_issues || 0}</Typography>
              <Typography variant="body2" color="textSecondary">Total Issues</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <SecurityIcon color="warning" sx={{ fontSize: 40 }} />
              <Typography variant="h6">{selectedReport?.summary?.vulnerabilities || 0}</Typography>
              <Typography variant="body2" color="textSecondary">Vulnerabilities</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <AssessmentIcon color="success" sx={{ fontSize: 40 }} />
              <Typography variant="h6">{selectedReport?.summary?.code_quality_score || 'N/A'}</Typography>
              <Typography variant="body2" color="textSecondary">Quality Score</Typography>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderCharts = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Severity Distribution" icon={<TimelineIcon />} />
          <Tab label="Issue Categories" icon={<AssessmentIcon />} />
        </Tabs>
        {activeTab === 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Severity Distribution</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
        {activeTab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Issue Categories</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderIssuesTable = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          Detected Issues
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Severity</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>File</TableCell>
                <TableCell>Line</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedReport?.issues?.map((issue, index) => (
                <TableRow key={index} hover>
                  <TableCell>{renderSeverityChip(issue.severity)}</TableCell>
                  <TableCell>{issue.category}</TableCell>
                  <TableCell>{issue.file_name}</TableCell>
                  <TableCell>{issue.line_number}</TableCell>
                  <TableCell>{issue.message}</TableCell>
                </TableRow>
              ))}
              {(!selectedReport?.issues || selectedReport.issues.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No issues found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (reports.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>No reports available</Typography>
        <Typography>Generate a report by analyzing a project.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Analysis Reports</Typography>
      </Box>

      {selectedReport && renderReportSummary()}
      {selectedReport && renderCharts()}
      {selectedReport && renderIssuesTable()}
    </Box>
  );
};

export default Reports;
