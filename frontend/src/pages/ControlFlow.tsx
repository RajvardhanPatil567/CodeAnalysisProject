import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import {
  Box, Typography, Card, CardContent, TextField, Button, CircularProgress, Alert, Paper, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

// --- Interfaces for API Response ---
interface Complexity {
  time: string;
  space: string;
  details: Array<{ type: string; description: string; suggestion: string; }>;
  visualization: any;
  node_type: string;
}

interface LineAnalysis {
  line: number;
  code: string;
  type: string;
  complexity: Complexity;
}

interface AnalysisSummary {
  Time_Complexity: string;
  Space_Complexity: string;
  Line_Analysis: LineAnalysis[];
}

interface AnalysisResult {
  summary: AnalysisSummary;
  errors: string[];
}

// --- Styled Components ---
const StyledEditor = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    fontFamily: 'monospace',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f5f5f5',
    '& fieldset': { borderColor: theme.palette.divider },
  },
}));

const LineAnalysisRow: React.FC<{ row: LineAnalysis }> = ({ row }) => {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">{row.line}</TableCell>
        <TableCell><code>{row.code}</code></TableCell>
        <TableCell>{row.type}</TableCell>
        <TableCell>{row.complexity.time}</TableCell>
        <TableCell>{row.complexity.space}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom component="div">Details</Typography>
              <Typography variant="body2"><strong>Description:</strong> {row.complexity.details[0]?.description}</Typography>
              <Typography variant="body2"><strong>Suggestion:</strong> {row.complexity.details[0]?.suggestion}</Typography>
              <Box sx={{ mt: 2, height: 200 }}>
                <Plot 
                  data={row.complexity.visualization.time_chart.data}
                  layout={row.complexity.visualization.time_chart.layout}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler
                />
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const ControlFlow: React.FC = () => {
  const [code, setCode] = useState<string>('def example_function(n):\n    result = 0\n    for i in range(n):\n        for j in range(n):\n            result += i * j\n    return result');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [diagramHtml, setDiagramHtml] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setCode(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateDiagram = async () => {
    if (!code.trim()) {
      setError('Please enter some Python code to generate a diagram.');
      return;
    }
    setLoading(true);
    setError('');
    setDiagramHtml('');

    try {
      const response = await fetch('http://localhost:8000/api/diagram/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Diagram generation failed');
      }

      const html = await response.text();
      setDiagramHtml(html);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Please enter some Python code to analyze.');
      return;
    }
    setLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/analyze/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details?.join(', ') || data.error || 'Analysis failed');
      }
      
      setAnalysisResult({ summary: data, errors: [] });
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>Advanced Code Complexity Analyzer</Typography>
      
      <Card sx={{ mb: 3, p: 2, boxShadow: 3 }}>
        <input
          accept=".py"
          style={{ display: 'none' }}
          id="raised-button-file"
          multiple
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="raised-button-file">
          <Button variant="contained" component="span" sx={{ mb: 2 }}>
            Upload File
          </Button>
        </label>

        <StyledEditor
          fullWidth
          multiline
          minRows={12}
          maxRows={25}
          variant="outlined"
          placeholder="Enter your Python code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="secondary" onClick={handleGenerateDiagram} disabled={loading} sx={{ mr: 2 }}>
            {loading ? <CircularProgress size={24} /> : 'Generate Diagram'}
          </Button>
          <Button variant="contained" color="primary" onClick={handleAnalyze} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Analyze Code'}
          </Button>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {diagramHtml && (
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Control Flow Diagram</Typography>
          <iframe
            srcDoc={diagramHtml}
            style={{ width: '100%', height: '600px', border: 'none' }}
            title="Control Flow Diagram"
          />
        </Paper>
      )} 

      {analysisResult && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6">Overall Time Complexity</Typography>
                <Typography variant="h3" color="primary">{analysisResult.summary.Time_Complexity}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6">Overall Space Complexity</Typography>
                <Typography variant="h3" color="secondary">{analysisResult.summary.Space_Complexity}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper elevation={3} sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ p: 2 }}>Line-by-Line Analysis</Typography>
            <TableContainer>
              <Table aria-label="collapsible table">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Line</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Node Type</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Space</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(analysisResult.summary.Line_Analysis || []).map((row) => (
                    <LineAnalysisRow key={row.line} row={row} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ControlFlow;