import time
import pytest
from django.test import TestCase
from analyzer.enhanced_control_flow import analyze_control_flow

class ControlFlowPerformanceTests(TestCase):
    def test_large_function_performance(self):
        """Test performance with a large function"""
        # Generate a large function with many conditions and loops
        large_code = "def large_function(x):\n"
        for i in range(1, 101):  # 100 if-else blocks
            large_code += f"    if x == {i}:\n"
            large_code += f"        print('Number is {i}')\n"
            if i % 10 == 0:
                large_code += "        for j in range(5):\n"
                large_code += "            print(f'Processing {j}')\n"
        large_code += "    return x\n"
        
        # Time the analysis
        start_time = time.time()
        result = analyze_control_flow(large_code, 'large_function')
        end_time = time.time()
        
        # Verify the result
        self.assertEqual(result['status'], 'success')
        self.assertGreater(len(result['nodes']), 100)  # Should have many nodes
        
        # Check performance (should complete within 2 seconds)
        self.assertLess(end_time - start_time, 2.0)
        
    def test_multiple_functions_performance(self):
        """Test performance with many small functions"""
        code = ""
        for i in range(1, 51):  # 50 small functions
            code += f"def func_{i}(x):\n"
            code += f"    return x + {i}\n\n"
        
        # Time the analysis for the last function
        start_time = time.time()
        result = analyze_control_flow(code, 'func_50')
        end_time = time.time()
        
        # Verify the result
        self.assertEqual(result['status'], 'success')
        self.assertGreater(len(result['nodes']), 0)
        
        # Check performance (should complete within 1 second)
        self.assertLess(end_time - start_time, 1.0)
