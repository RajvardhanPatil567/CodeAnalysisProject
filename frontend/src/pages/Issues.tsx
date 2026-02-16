import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  CircularProgress, 
  Grid, 
  TextField, 
  InputAdornment, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  SelectChangeEvent, 
  useTheme,
  alpha,
  styled,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Badge,
  Divider
} from '@mui/material';
import { 
  BugReport as BugReportIcon, 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import apiService from '../services/api';
import { Issue, ApiResponse, SortableIssueField } from '../@types';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(30, 30, 46, 0.7)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.25)',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
  },
}));

const Issues: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortableIssueField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  const paginatedIssues = issues.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const stats = React.useMemo(() => {
    const severityCounts = {
      critical: 0,
      major: 0,
      minor: 0,
      info: 0,
    };
    const affectedProjects = new Set<string>();

    issues.forEach(issue => {
      if (issue.severity in severityCounts) {
        severityCounts[issue.severity as keyof typeof severityCounts]++;
      }
      if (issue.project) {
        affectedProjects.add(issue.project);
      }
    });

    return {
      total: issues.length,
      severity: severityCounts,
      affectedProjects: affectedProjects.size,
    };
  }, [issues]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await apiService.getIssues();
      
      if (response.status === 'success' && response.data) {
        let filteredIssues = Array.isArray(response.data) ? response.data : [];
        
        // Apply client-side filtering
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredIssues = filteredIssues.filter(issue => 
            issue.message.toLowerCase().includes(searchLower) ||
            issue.rule_name.toLowerCase().includes(searchLower) ||
            issue.file_name.toLowerCase().includes(searchLower)
          );
        }
        
        if (severityFilter !== 'all') {
          filteredIssues = filteredIssues.filter(issue => 
            issue.severity === severityFilter
          );
        }
        
        // Apply sorting with type-safe field access
        filteredIssues.sort((a, b) => {
          // Convert values to strings for consistent comparison
          const aValue = String(a[sortField] || '');
          const bValue = String(b[sortField] || '');
          
          if (aValue === bValue) return 0;
          
          // For dates, convert to timestamps for comparison
          if (sortField === 'created_at') {
            const aTime = new Date(a.created_at).getTime();
            const bTime = new Date(b.created_at).getTime();
            return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
          }
          
          // For severity, use custom order
          if (sortField === 'severity') {
            const severityOrder: Record<string, number> = {
              'critical': 0,
              'major': 1,
              'minor': 2,
              'info': 3
            };
            const aSeverity = severityOrder[a.severity] ?? 4;
            const bSeverity = severityOrder[b.severity] ?? 4;
            return sortOrder === 'asc' ? aSeverity - bSeverity : bSeverity - aSeverity;
          }
          
          // For other fields, use string comparison
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        });
        
        setIssues(filteredIssues);
        setTotalCount(filteredIssues.length);
      } else {
        setError('Failed to fetch issues');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [page, rowsPerPage, searchTerm, severityFilter, sortField, sortOrder]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleSeverityChange = (event: SelectChangeEvent<string>) => {
    setSeverityFilter(event.target.value);
    setPage(0);
  };

  const handleSort = (field: SortableIssueField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'high':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'medium':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'low':
        return <InfoIcon color="info" fontSize="small" />;
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && issues.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
<Box sx={{ 
        backgroundColor: 'error.dark', 
        color: 'white', 
        p: 2, 
        borderRadius: 1,
        mt: 2
      }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 700, 
            mb: 1,
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            Security Issues
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Review and manage all identified code issues
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchIssues} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Issues</Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Critical</Typography>
              <Typography variant="h4" color="error">{stats.severity.critical}</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Major</Typography>
              <Typography variant="h4" color="warning.main">{stats.severity.major}</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Affected Projects</Typography>
              <Typography variant="h4">{stats.affectedProjects}</Typography>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      <StyledCard>
        <CardContent sx={{ p: 0 }}>
          <Box p={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    sx: {
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="severity-filter-label">Severity</InputLabel>
                  <Select
                    labelId="severity-filter-label"
                    value={severityFilter}
                    label="Severity"
                    onChange={handleSeverityChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <FilterIcon />
                      </InputAdornment>
                    }
                    sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <MenuItem value="all">All Severities</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell 
                    onClick={() => handleSort('severity')}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Box display="flex" alignItems="center">
                      Severity
                      {sortField === 'severity' && (
                        sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('rule_name')}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Box display="flex" alignItems="center">
                      Rule
                      {sortField === 'rule_name' && (
                        sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('message')}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Box display="flex" alignItems="center">
                      Message
                      {sortField === 'message' && (
                        sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('file_name')}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Box display="flex" alignItems="center">
                      File
                      {sortField === 'file_name' && (
                        sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('created_at')}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Box display="flex" alignItems="center">
                      Detected
                      {sortField === 'created_at' && (
                        sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issues.length > 0 ? (
                  issues.map((issue) => (
                    <StyledTableRow 
                      key={issue.id} 
                      hover 
                      onClick={() => navigate(`/projects/${issue.project}`)}
                    >
                      <TableCell>
                        <Chip 
                          label={issue.severity}
                          color={
                            issue.severity === 'critical' ? 'error' :
                            issue.severity === 'major' ? 'warning' :
                            issue.severity === 'minor' ? 'info' : 'default'
                          }
                          size="small"
                          sx={{
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            ...(issue.severity === 'critical' && {
                              backgroundColor: 'rgba(244, 67, 54, 0.15)',
                              color: '#ff8a80',
                            }),
                            ...(issue.severity === 'major' && {
                              backgroundColor: 'rgba(255, 152, 0, 0.15)',
                              color: '#ffd180',
                            }),
                            ...(issue.severity === 'minor' && {
                              backgroundColor: 'rgba(255, 193, 7, 0.15)',
                              color: '#ffecb3',
                            }),
                            ...(issue.severity === 'info' && {
                              backgroundColor: 'rgba(33, 150, 243, 0.15)',
                              color: '#81d4fa',
                            }),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {issue.rule_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {issue.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
<BugReportIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap>
                            {issue.file_name}:{issue.line_number}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(issue.created_at)}
                        </Typography>
                      </TableCell>
                    </StyledTableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Box textAlign="center">
                        <BugReportIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" color="text.secondary">
                          No issues found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {searchTerm || severityFilter !== 'all' 
                            ? 'Try adjusting your search or filter criteria.' 
                            : 'Hooray! No issues detected in your codebase.'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                color: 'text.secondary',
              },
            }}
          />
        </CardContent>
      </StyledCard>
    </Box>
  );
};

export default Issues;
