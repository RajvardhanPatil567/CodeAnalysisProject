import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ControlFlow from '../pages/ControlFlow';
import * as apiService from '../services/api';

// Mock the API service
jest.mock('../services/api');

describe('ControlFlow Component', () => {
  const mockApiResponse = {
    status: 'success',
    data: {
      nodes: [
        { id: '1', type: 'start', label: 'Start', line: 1 },
        { id: '2', type: 'condition', label: 'x > 0', line: 2 },
        { id: '3', type: 'statement', label: 'print("Positive")', line: 3 },
        { id: '4', type: 'return', label: 'return x', line: 4 },
        { id: '5', type: 'return', label: 'return -x', line: 6 },
        { id: '6', type: 'end', label: 'End', line: 7 }
      ],
      edges: [
        { from: '1', to: '2' },
        { from: '2', to: '3', label: 'True' },
        { from: '3', to: '4' },
        { from: '2', to: '5', label: 'False' },
        { from: '4', to: '6' },
        { from: '5', to: '6' }
      ],
      html: '<div>Mock Control Flow Diagram</div>'
    }
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('renders control flow component', () => {
    render(<ControlFlow />);
    expect(screen.getByText('Control Flow Analysis')).toBeInTheDocument();
  });

  test('analyzes code when analyze button is clicked', async () => {
    // Mock the API response
    (apiService.analyzeControlFlow as jest.Mock).mockResolvedValueOnce(mockApiResponse);
    
    render(<ControlFlow />);
    
    // Enter some code
    const codeInput = screen.getByPlaceholderText('Enter Python code here...');
    fireEvent.change(codeInput, { 
      target: { value: 'def test(x):\n    if x > 0:\n        return "Positive"\n    return "Non-positive"' } 
    });
    
    // Click the analyze button
    const analyzeButton = screen.getByText('Analyze');
    fireEvent.click(analyzeButton);
    
    // Check if loading state is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(apiService.analyzeControlFlow).toHaveBeenCalledWith({
        code: 'def test(x):\n    if x > 0:\n        return "Positive"\n    return "Non-positive"',
        function_name: undefined
      });
    });
    
    // Check if the diagram is rendered
    await waitFor(() => {
      expect(screen.getByText('Control Flow Diagram')).toBeInTheDocument();
    });
  });

  test('shows error message when analysis fails', async () => {
    // Mock a failed API response
    (apiService.analyzeControlFlow as jest.Mock).mockRejectedValueOnce({
      message: 'Analysis failed'
    });
    
    render(<ControlFlow />);
    
    // Enter some code
    const codeInput = screen.getByPlaceholderText('Enter Python code here...');
    fireEvent.change(codeInput, { target: { value: 'invalid python code' } });
    
    // Click the analyze button
    const analyzeButton = screen.getByText('Analyze');
    fireEvent.click(analyzeButton);
    
    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument();
    });
  });
});
