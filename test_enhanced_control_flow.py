#!/usr/bin/env python
"""
Test script for enhanced control flow analysis
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'static_analysis.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.chdir('backend')

django.setup()

def test_enhanced_control_flow():
    """Test the enhanced control flow analyzer"""
    print("\nTesting enhanced control flow analysis...")
    
    try:
        from analyzer.enhanced_control_flow import analyze_control_flow
        
        # Test with a simple function
        code = """
        def example(x):
            if x > 0:
                return "Positive"
            return "Non-positive"
        """
        
        print("Analyzing simple function...")
        result = analyze_control_flow(code, "example")
        
        print("Analysis results:")
        print(f"Status: {result.get('status')}")
        print(f"Nodes: {len(result.get('nodes', []))}")
        print(f"Edges: {len(result.get('edges', []))}")
        
        if result.get('status') == 'success':
            print("✓ Control flow analysis completed successfully")
            return True
        else:
            print(f"✗ Analysis failed: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Enhanced Control Flow Analysis Test ===\n")
    
    success = test_enhanced_control_flow()
    
    if success:
        print("\n✓ All tests passed!")
        sys.exit(0)
    else:
        print("\n✗ Some tests failed")
        sys.exit(1)
