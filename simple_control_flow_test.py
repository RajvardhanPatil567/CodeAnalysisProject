"""
Simple test for the control flow analysis
"""
import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_simple_control_flow():
    """Test the control flow analysis with a simple function"""
    print("Testing simple control flow analysis...")
    
    try:
        # Import the enhanced control flow analyzer
        from analyzer.enhanced_control_flow import EnhancedControlFlowAnalyzer
        import ast
        
        # Create a simple function to analyze
        code = """
def example(x):
    if x > 0:
        print("Positive")
        return "Positive"
    elif x < 0:
        print("Negative")
        return "Negative"
    else:
        print("Zero")
        return "Zero"
        """
        
        print("\nAnalyzing code:")
        print(code)
        
        # Parse the code into an AST
        tree = ast.parse(code)
        
        # Use the analyze_control_flow function directly
        result = analyze_control_flow(code, "example")
        
        if result['status'] == 'error':
            print(f"Error in analysis: {result.get('error', 'Unknown error')}")
            return False
        
        # Save the visualization to a file
        output_file = "control_flow_visualization.html"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(result['html'])
        
        print(f"\nControl flow visualization saved to: {os.path.abspath(output_file)}")
        print(f"Number of nodes: {len(result['nodes'])}")
        print(f"Number of edges: {len(result['edges'])}")
        
        print("\nNodes:")
        for node in result['nodes']:
            print(f"- {node['label']} (Type: {node['type']}, Line: {node.get('line', 'N/A')})")
        
        print("\nEdges:")
        for edge in result['edges']:
            print(f"- From: {edge['from']} -> To: {edge['to']} (Label: {edge.get('label', '')})")
        
        return True
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Simple Control Flow Analysis Test ===\n")
    
    success = test_simple_control_flow()
    
    if success:
        print("\n✓ Test completed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Test failed")
        sys.exit(1)
