import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ControlFlow from '../ControlFlow';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock the API service
jest.mock('../../services/api', () => ({
  getFiles: jest.fn().mockResolvedValue({
    data: [
      { id: '1', filename: 'test.py', language: 'python', content: 'def test():\n    pass', created_at: '2023-01-01' }
    ]
  }),
  analyzeControlFlow: jest.fn().mockResolvedValue({
    data: {
      status: 'success',
      dot: 'digraph { A -> B }',
      nodes: [{ id: '1', type: 'start', label: 'Start' }],
      edges: [{ source: '1', target: '2', label: 'next' }]
    }
  })
}));

describe('ControlFlow Component', () => {
  const renderControlFlow = () => {
    return render(
      <Router>
        <ControlFlow />
      </Router>
    );
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderControlFlow();
    expect(screen.getByText(/Control Flow Analysis/i)).toBeInTheDocument();
  });

  it('displays code editor by default', () => {
    renderControlFlow();
    expect(screen.getByLabelText(/python code/i)).toBeInTheDocument();
  });

  it('switches between code and file modes', async () => {
    renderControlFlow();
    
    // Switch to file mode
    fireEvent.mouseDown(screen.getByLabelText('Mode'));
    fireEvent.click(screen.getByRole('option', { name: /file/i }));
    
    // Should show file upload/select
    expect(screen.getByText(/select a file/i)).toBeInTheDocument();
  });

  it('loads files on mount', async () => {
    renderControlFlow();
    
    // Switch to file mode
    fireEvent.mouseDown(screen.getByLabelText('Mode'));
    fireEvent.click(screen.getByRole('option', { name: /file/i }));
    
    // Check if files are loaded
    await waitFor(() => {
      expect(screen.getByText(/test.py/i)).toBeInTheDocument();
    });
  });

  it('analyzes code when analyze button is clicked', async () => {
    renderControlFlow();
    
    // Enter some code
    const codeInput = screen.getByLabelText(/python code/i);
    fireEvent.change(codeInput, { target: { value: 'def test():\n    pass' } });
    
    // Click analyze button
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
    
    // Check if loading state is shown
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    // Check if the API was called
    const { analyzeControlFlow } = require('../../services/api');
    expect(analyzeControlFlow).toHaveBeenCalledTimes(1);
  });

  it('displays error message when analysis fails', async () => {
    // Mock a failed API call
    const { analyzeControlFlow } = require('../../services/api');
    analyzeControlFlow.mockRejectedValueOnce(new Error('Analysis failed'));
    
    renderControlFlow();
    
    // Enter some code and analyze
    const codeInput = screen.getByLabelText(/python code/i);
    fireEvent.change(codeInput, { target: { value: 'def test():\n    pass' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to analyze code/i)).toBeInTheDocument();
    });
  });
});
