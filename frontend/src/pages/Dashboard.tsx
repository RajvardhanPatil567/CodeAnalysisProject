import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Folder as ProjectIcon,
  BugReport as IssueIcon,
  Code as CodeIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { api as apiService, Project, Report } from '../services/api';

interface DashboardStats {
  totalProjects: number;
  totalFiles: number;
  totalIssues: number;
  recentReports: any[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [projectsResponse, reportsResponse] = await Promise.all([
          apiService.getProjects(),
          apiService.getReports(),
        ]);

        // Handle potential API errors
        if (projectsResponse.status !== 'success') {
          throw new Error(projectsResponse.error || 'Failed to fetch projects');
        }

        if (reportsResponse.status !== 'success') {
          throw new Error(reportsResponse.error || 'Failed to fetch reports');
        }

        // Ensure we have arrays to work with
        const projects = Array.isArray(projectsResponse.data) ? projectsResponse.data : [];
        const reports = Array.isArray(reportsResponse.data) ? reportsResponse.data : [];

        console.log('Projects data:', projects);
        console.log('Reports data:', reports);

        // Safely calculate totals with null/undefined checks
        const totalFiles = projects.reduce((sum: number, project: Project) => {
          return sum + (project.files_count || 0);
        }, 0);
        
        const totalIssues = reports.reduce((sum: number, report: Report) => {
          const issues = (report.summary && report.summary.total_issues) || 0;
          return sum + (typeof issues === 'number' ? issues : 0);
        }, 0);

        setStats({
          totalProjects: projects.length,
          totalFiles,
          totalIssues,
          recentReports: Array.isArray(reports) ? reports.slice(0, 5) : []
        });
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({
    title, value, icon, color
  }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Projects"
            value={stats?.totalProjects || 0}
            icon={<ProjectIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Files"
            value={stats?.totalFiles || 0}
            icon={<CodeIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Issues"
            value={stats?.totalIssues || 0}
            icon={<IssueIcon />}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Analysis Runs"
            value={stats?.recentReports.length || 0}
            icon={<TrendIcon />}
            color="#ed6c02"
          />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Analysis Reports
          </Typography>
          {stats?.recentReports.length === 0 ? (
            <Typography color="textSecondary">
              No analysis reports yet. Upload some files or create a project to get started!
            </Typography>
          ) : (
            <Box>
              {stats?.recentReports.map((report: any) => (
                <Box
                  key={report.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1">
                      Project Analysis
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {report.total_files} files, {report.total_issues} issues found
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(report.started_at).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
