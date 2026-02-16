#!/usr/bin/env python
"""
Test script to debug control flow analysis issues
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'static_analysis.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.chdir('backend')

django.setup()

def test_dependencies():
    """Test if all required dependencies are available"""
    print("Testing dependencies...")
    
    try:
        import plotly
        print(f"✓ Plotly version: {plotly.__version__}")
    except ImportError as e:
        print(f"✗ Plotly import failed: {e}")
        return False
    
    try:
        import networkx
        print(f"✓ NetworkX version: {networkx.__version__}")
    except ImportError as e:
        print(f"✗ NetworkX import failed: {e}")
        return False
    
    try:
        import numpy
        print(f"✓ NumPy version: {numpy.__version__}")
    except ImportError as e:
        print(f"✗ NumPy import failed: {e}")
        return False
    
    return True

def test_control_flow_function():
    """Test the control flow analysis function directly"""
    print("\nTesting control flow analysis function...")
    
    try:
        from analyzer.control_flow import analyze_python_control_flow
        
        test_code = '''def test_function():
    x = 10
    if x > 5:
        return "high"
    else:
        return "low"
'''
        
        result = analyze_python_control_flow(test_code)
        print(f"✓ Analysis completed successfully")
        print(f"  - Success: {result.get('success', False)}")
        print(f"  - Function: {result.get('function_name', 'None')}")
        print(f"  - Nodes: {result.get('node_count', 0)}")
        print(f"  - Edges: {result.get('edge_count', 0)}")
        
        if 'error' in result:
            print(f"✗ Error in result: {result['error']}")
            return False
        
        return result.get('success', False)
        
    except Exception as e:
        print(f"✗ Function test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoint():
    """Test the API endpoint directly"""
    print("\nTesting API endpoint...")
    
    try:
        import json
        from django.test import Client
        from django.urls import reverse
        
        client = Client()
        
        test_data = {
            'code': '''def simple_test():
    return True
''',
            'function_name': None
        }
        
        response = client.post(
            '/api/control-flow/',
            data=json.dumps(test_data),
            content_type='application/json'
        )
        
        print(f"  - Status Code: {response.status_code}")
        print(f"  - Response: {response.content.decode()[:200]}...")
        
        if response.status_code == 200:
            print("✓ API endpoint working correctly")
            return True
        else:
            print(f"✗ API endpoint failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ API test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Control Flow Analysis Debug Test ===\n")
    
    # Test 1: Dependencies
    deps_ok = test_dependencies()
    
    # Test 2: Function
    func_ok = test_control_flow_function() if deps_ok else False
    
    # Test 3: API
    api_ok = test_api_endpoint() if func_ok else False
    
    print(f"\n=== Test Results ===")
    print(f"Dependencies: {'✓' if deps_ok else '✗'}")
    print(f"Function:     {'✓' if func_ok else '✗'}")
    print(f"API:          {'✓' if api_ok else '✗'}")
    
    if all([deps_ok, func_ok, api_ok]):
        print("\n🎉 All tests passed! Control flow analysis should work.")
    else:
        print("\n❌ Some tests failed. Check the output above for details.")
