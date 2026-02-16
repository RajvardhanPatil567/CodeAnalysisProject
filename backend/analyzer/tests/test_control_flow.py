import os
import sys
import unittest
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.urls import reverse

# Add the parent directory to the Python path
import os
import sys
import ast
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from analyzer.enhanced_control_flow import EnhancedControlFlowAnalyzer, analyze_control_flow

class TestEnhancedControlFlowAnalyzer(TestCase):
    def setUp(self):
        self.sample_code = """
        def example_function(x):
            if x > 0:
                return "Positive"
            elif x < 0:
                return "Negative"
            else:
                return "Zero"
        """

    def test_analyze_simple_function(self):
        """Test analyzing a simple function with control flow."""
        # Create a new analyzer instance
        analyzer = EnhancedControlFlowAnalyzer()
        # Parse the code into an AST
        tree = ast.parse(self.sample_code)
        # Visit the AST to analyze the control flow
        analyzer.visit(tree)
        # Get the result
        result = analyzer.get_result()
        
        # Verify basic structure
        self.assertIn('nodes', result)
        self.assertIn('edges', result)
        self.assertIn('complexity', result)
        self.assertIn('functions', result)

class TestAnalyzeControlFlow(TestCase):
    def test_analyze_control_flow_function(self):
        """Test the analyze_control_flow function."""
        code = """
        def test_function(x):
            if x > 0:
                return "Positive"
            return "Non-positive"
        """
        
        result = analyze_control_flow(code, function_name="test_function")
        
        # Check the structure of the result
        self.assertIn('html', result)
        self.assertIn('nodes', result)
        self.assertIn('edges', result)
        self.assertIn('complexity', result)
        self.assertGreater(len(result['nodes']), 0)
        self.assertGreater(len(result['edges']), 0)

class ControlFlowAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.control_flow_url = reverse('control_flow_analysis')
        self.sample_code = """
        def test_function(x):
            if x > 0:
                return "Positive"
            return "Non-positive"
        """

    @patch('api.views.analyze_control_flow')
    def test_control_flow_analysis(self, mock_analyze):
        """Test the control flow analysis API endpoint."""
        # Mock the analysis function
        mock_analyze.return_value = {
            'nodes': [{'id': '1', 'type': 'start', 'label': 'Start'}],
            'edges': [],
            'html': '<div>Test</div>',
            'complexity': {'cyclomatic': 2}
        }
        
        # Make the request to the correct URL
        response = self.client.post(
            '/api/control-flow/',
            data=json.dumps({
                'code': self.sample_code,
                'function_name': 'test_function'
            }),
            content_type='application/json'
        )
        
        # Verify the response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('nodes', data)
        self.assertIn('edges', data)

if __name__ == '__main__':
    unittest.main()
