"""
Enhanced Control Flow Analysis Module

This module provides advanced control flow analysis with interactive visualization
using pyvis network graphs and complexity analysis.
"""

import ast
import os
import tempfile
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict
from pyvis.network import Network
import plotly.graph_objects as go
import plotly
import json

class EnhancedControlFlowAnalyzer(ast.NodeVisitor):
    """Enhanced control flow analyzer with complexity analysis and visualization."""
    
    def __init__(self):
        self.nodes: Dict[str, Dict] = {}
        self.edges: List[Tuple[str, str, Dict]] = []
        self.complexity_data = defaultdict(dict)
        self._node_counter = 0
        self._current_node: Optional[str] = None
        self._function_stack = []
        self._loop_stack = []
        self._current_function = None

    def _new_node_id(self) -> str:
        self._node_counter += 1
        return f"node_{self._node_counter}"
    
    def _add_node(self, node_type: str, label: str, line: int, **kwargs) -> str:
        """Add a node to the control flow graph."""
        node_id = self._new_node_id()
        self.nodes[node_id] = {
            'id': node_id,
            'type': node_type,
            'label': label,
            'line': line,
            **kwargs
        }
        return node_id
    
    def _connect_nodes(self, from_node: str, to_node: str, label: str = "", **kwargs) -> None:
        """Create an edge between two nodes."""
        if from_node and to_node and from_node in self.nodes and to_node in self.nodes:
            self.edges.append((from_node, to_node, {'label': label, **kwargs}))
    
    def _process_body(self, body: List[ast.AST], exit_node: Optional[str] = None) -> None:
        """Process a list of statements in a block."""
        prev_node = self._current_node
        
        for stmt in body:
            self.visit(stmt)
            if self._current_node and prev_node and prev_node != self._current_node:
                self._connect_nodes(prev_node, self._current_node)
            prev_node = self._current_node
        
        if prev_node and exit_node:
            self._connect_nodes(prev_node, exit_node)
    
    def analyze_line_complexity(self, node: ast.AST, parent_complexity: Dict[str, str]) -> Dict[str, Any]:
        """Analyze time and space complexity for a specific line/node."""
        result = {
            'time': 'O(1)',
            'space': 'O(1)',
            'details': [{
                'type': 'generic',
                'description': 'No complexity analysis available for this node type',
                'suggestion': 'Consider analyzing this code structure manually'
            }],
            'node_type': type(node).__name__
        }

        try:
            if isinstance(node, (ast.For, ast.While)):
                result['time'] = f"O(n * {parent_complexity.get('time', '1')})" if parent_complexity.get('time') != 'O(1)' else 'O(n)'
                result['space'] = parent_complexity.get('space', 'O(1)')
                result['details'] = [{
                    'type': 'loop',
                    'description': f"This {type(node).__name__} loop will run n times, multiplying the time complexity",
                    'suggestion': 'Consider optimization with memoization, early termination, or algorithm conversion'
                }]

            elif isinstance(node, ast.If):
                result['time'] = parent_complexity.get('time', 'O(1)')
                result['space'] = parent_complexity.get('space', 'O(1)')
                result['details'] = [{
                    'type': 'condition',
                    'description': "Conditional statement - complexity matches parent block in worst case",
                    'suggestion': 'Order conditions by likelihood or use switch statements for multiple conditions'
                }]

            elif isinstance(node, ast.FunctionDef):
                param_count = len(getattr(node.args, 'args', []))
                result['time'] = 'O(1)'
                result['space'] = f"O({param_count})" if param_count > 0 else 'O(1)'
                result['details'] = [{
                    'type': 'function',
                    'description': f"Function definition with {param_count} parameters",
                    'suggestion': 'Maintain small, focused functions (Single Responsibility Principle)'
                }]

            elif isinstance(node, ast.Call):
                result['time'] = 'O(n)'  # Conservative default
                result['space'] = 'O(1)'
                result['details'] = [{
                    'type': 'function_call',
                    'description': "Function call - complexity depends on the called function",
                    'suggestion': 'Verify complexity of called functions, especially in loops'
                }]

            elif isinstance(node, (ast.ListComp, ast.GeneratorExp)):
                result['time'] = 'O(n)'
                result['space'] = 'O(n)' if isinstance(node, ast.ListComp) else 'O(1)'
                result['details'] = [{
                    'type': 'comprehension',
                    'description': "List/generator comprehension - linear time complexity",
                    'suggestion': 'Use generator expressions for memory efficiency with large datasets'
                }]

        except Exception as e:
            result['details'].insert(0, {
                'type': 'error',
                'description': f"Analysis error: {str(e)}",
                'suggestion': 'This node might need manual analysis'
            })

        return result

    def generate_complexity_chart(self, time_complexity: str, space_complexity: str) -> Dict[str, Any]:
        """Generate interactive Plotly charts for complexity visualization."""
        # Time complexity gauge
        time_levels = {
            'O(1)': 100,
            'O(log n)': 80,
            'O(n)': 60,
            'O(n log n)': 40,
            'O(n²)': 20,
            'O(2^n)': 0
        }
        
        time_value = time_levels.get(time_complexity, 0)
        
        time_fig = go.Figure(go.Indicator(
            mode="gauge+number",
            value=time_value,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Time Complexity"},
            gauge={
                'axis': {'range': [0, 100], 'tickwidth': 1, 'tickcolor': "darkblue"},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 20], 'color': "red"},
                    {'range': [20, 40], 'color': "orange"},
                    {'range': [40, 60], 'color': "yellow"},
                    {'range': [60, 80], 'color': "lightgreen"},
                    {'range': [80, 100], 'color': "green"}],
                'threshold': {
                    'line': {'color': "black", 'width': 4},
                    'thickness': 0.75,
                    'value': time_value}}
        ))
        
        time_fig.update_layout(height=200, margin=dict(l=20, r=20, t=50, b=10))
        
        # Space complexity gauge
        space_levels = {
            'O(1)': 100,
            'O(log n)': 80,
            'O(n)': 60,
            'O(n log n)': 40,
            'O(n²)': 20,
            'O(2^n)': 0
        }
        
        space_value = space_levels.get(space_complexity, 0)
        
        space_fig = go.Figure(go.Indicator(
            mode="gauge+number",
            value=space_value,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Space Complexity"},
            gauge={
                'axis': {'range': [0, 100], 'tickwidth': 1, 'tickcolor': "darkgreen"},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 20], 'color': "red"},
                    {'range': [20, 40], 'color': "orange"},
                    {'range': [40, 60], 'color': "yellow"},
                    {'range': [60, 80], 'color': "lightgreen"},
                    {'range': [80, 100], 'color': "green"}],
                'threshold': {
                    'line': {'color': "black", 'width': 4},
                    'thickness': 0.75,
                    'value': space_value}}
        ))
        
        space_fig.update_layout(height=200, margin=dict(l=20, r=20, t=50, b=10))
        
        return {
            'time_chart': json.loads(plotly.io.to_json(time_fig)),
            'space_chart': json.loads(plotly.io.to_json(space_fig)),
            'time_level': self.get_complexity_level(time_complexity),
            'space_level': self.get_complexity_level(space_complexity),
            'time_description': self.get_complexity_description(time_complexity, 'time'),
            'space_description': self.get_complexity_description(space_complexity, 'space')
        }

    def get_complexity_level(self, complexity: str) -> str:
        """Convert Big-O notation to a severity level."""
        levels = {
            'O(1)': 'Excellent',
            'O(log n)': 'Very Good',
            'O(n)': 'Good',
            'O(n log n)': 'Fair',
            'O(n²)': 'Poor',
            'O(2^n)': 'Very Poor'
        }
        return levels.get(complexity, 'Unknown')

    def get_complexity_description(self, complexity: str, complexity_type: str) -> str:
        """Generate human-readable descriptions for complexity."""
        descriptions = {
            'O(1)': f"Constant {complexity_type} complexity - excellent performance that doesn't scale with input size",
            'O(log n)': f"Logarithmic {complexity_type} complexity - very efficient, scales well with large inputs",
            'O(n)': f"Linear {complexity_type} complexity - scales directly with input size, acceptable for most cases",
            'O(n log n)': f"Linearithmic {complexity_type} complexity - good for most practical cases, common in efficient algorithms",
            'O(n²)': f"Quadratic {complexity_type} complexity - may need optimization for large inputs, consider refactoring",
            'O(2^n)': f"Exponential {complexity_type} complexity - very inefficient, should be avoided for non-trivial inputs"
        }
        return descriptions.get(complexity, f"Unknown {complexity_type} complexity pattern")

    def generate_control_flow(self, code: str, function_name: str = None) -> str:
        """Generate an interactive control flow visualization."""
        try:
            tree = ast.parse(code)
            if function_name:
                # Find the specific function if name is provided
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef) and node.name == function_name:
                        tree = node
                        break
            
            self.visit(tree)
            
            # Create the visualization
            net = Network(height="600px", width="100%", directed=True)
            net.toggle_physics(True)
            
            # Add nodes
            for node_id, node_data in self.nodes.items():
                node_type = node_data.get('type', 'unknown')
                color = self._get_node_color(node_type)
                
                net.add_node(
                    node_id,
                    label=node_data['label'],
                    title=f"Line {node_data['line']}: {node_data['label']}",
                    color=color,
                    shape=self._get_node_shape(node_type),
                    size=20 if node_type in ['function', 'loop', 'condition'] else 15
                )
            
            # Add edges
            for from_node, to_node, edge_data in self.edges:
                net.add_edge(from_node, to_node, label=edge_data.get('label', ''))
            
            # Save to temp file
            with tempfile.NamedTemporaryFile(suffix='.html', delete=False, mode='w', encoding='utf-8') as f:
                net.save_graph(f.name)
                with open(f.name, 'r', encoding='utf-8') as f_in:
                    html_content = f_in.read()
                os.unlink(f.name)
                
            return html_content
            
        except Exception as e:
            # Return error visualization
            net = Network(height="200px", width="100%")
            net.add_node("error", label=f"Error: {str(e)}", color="red")
            with tempfile.NamedTemporaryFile(suffix='.html', delete=False, mode='w', encoding='utf-8') as f:
                net.save_graph(f.name)
                with open(f.name, 'r', encoding='utf-8') as f_in:
                    html_content = f_in.read()
                os.unlink(f.name)
                return html_content
    
    def _get_node_color(self, node_type: str) -> str:
        """Get color for a node based on its type."""
        colors = {
            'function': '#FF9F43',  # Orange
            'condition': '#4BC0C0',  # Teal
            'loop': '#9966FF',  # Purple
            'start': '#4CAF50',  # Green
            'end': '#F44336',  # Red
            'statement': '#2196F3',  # Blue
            'call': '#00BCD4',  # Cyan
            'default': '#9E9E9E'  # Grey
        }
        return colors.get(node_type, colors['default'])
    
    def _get_node_shape(self, node_type: str) -> str:
        """Get shape for a node based on its type."""
        shapes = {
            'function': 'box',
            'condition': 'diamond',
            'loop': 'ellipse',
            'start': 'star',
            'end': 'triangle',
            'default': 'dot'
        }
        return shapes.get(node_type, shapes['default'])

    # AST Visitor Methods
    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        """Visit a function definition node."""
        # Create entry and exit nodes for the function
        entry_node = self._add_node(
            'function', 
            f"FUNCTION: {node.name}", 
            node.lineno
        )
        
        exit_node = self._add_node(
            'end',
            f"END: {node.name}",
            getattr(node, 'end_lineno', node.lineno)
        )
        
        # Save current state and update context
        prev_node = self._current_node
        prev_function = self._current_function
        self._current_node = entry_node
        self._current_function = node.name
        self._function_stack.append((entry_node, exit_node))
        
        # Process function body
        self._process_body(node.body, exit_node)
        
        # Restore previous state
        self._function_stack.pop()
        self._current_node = prev_node
        self._current_function = prev_function
    
    def visit_If(self, node: ast.If) -> None:
        """Visit an if statement node."""
        # Create nodes for the condition and branches
        condition = ast.unparse(node.test) if hasattr(ast, 'unparse') else 'if condition'
        cond_node = self._add_node('condition', f"IF: {condition}", node.lineno)
        
        # Connect to previous node
        if self._current_node:
            self._connect_nodes(self._current_node, cond_node)
        
        # Create merge node
        merge_node = self._add_node('merge', 'MERGE', getattr(node, 'end_lineno', node.lineno))
        
        # Process if branch
        self._current_node = cond_node
        self._process_body(node.body, merge_node)
        
        # Process else branch if it exists
        if node.orelse:
            self._current_node = cond_node
            self._process_body(node.orelse, merge_node)
        else:
            self._connect_nodes(cond_node, merge_node, label="False")
        
        self._current_node = merge_node
    
    def visit_For(self, node: ast.For) -> None:
        """Visit a for loop node."""
        target = ast.unparse(node.target) if hasattr(ast, 'unparse') else 'item'
        iterable = ast.unparse(node.iter) if hasattr(ast, 'unparse') else 'iterable'
        loop_node = self._add_node('loop', f"FOR {target} IN {iterable}", node.lineno)
        
        # Connect to previous node
        if self._current_node:
            self._connect_nodes(self._current_node, loop_node)
        
        # Process loop body
        self._loop_stack.append(loop_node)
        self._current_node = loop_node
        self._process_body(node.body, loop_node)  # Loop back to condition
        
        # Process else clause if it exists
        if node.orelse:
            self._current_node = loop_node
            self._process_body(node.orelse)
        
        self._loop_stack.pop()
    
    def visit_While(self, node: ast.While) -> None:
        """Visit a while loop node."""
        test = ast.unparse(node.test) if hasattr(ast, 'unparse') else 'condition'
        loop_node = self._add_node('loop', f"WHILE {test}", node.lineno)
        
        # Connect to previous node
        if self._current_node:
            self._connect_nodes(self._current_node, loop_node)
        
        # Process loop body
        self._loop_stack.append(loop_node)
        self._current_node = loop_node
        self._process_body(node.body, loop_node)  # Loop back to condition
        
        # Process else clause if it exists
        if node.orelse:
            self._current_node = loop_node
            self._process_body(node.orelse)
        
        self._loop_stack.pop()
    
    def visit_Return(self, node: ast.Return) -> None:
        """Visit a return statement node."""
        if not self._function_stack:
            return
            
        return_value = ast.unparse(node.value) if node.value else 'None'
        return_node = self._add_node('statement', f"RETURN {return_value}", node.lineno)
        
        # Connect to previous node
        if self._current_node:
            self._connect_nodes(self._current_node, return_node)
        
        # Connect to function exit node
        _, exit_node = self._function_stack[-1]
        self._connect_nodes(return_node, exit_node)
        
        self._current_node = None  # No nodes after return
    
    def visit_Break(self, node: ast.Break) -> None:
        """Visit a break statement node."""
        if not self._loop_stack:
            return
            
        break_node = self._add_node('statement', 'BREAK', node.lineno)
        
        # Connect to previous node
        if self._current_node:
            self._connect_nodes(self._current_node, break_node)
        
        # Find the nearest loop exit
        if self._loop_stack:
            loop_node = self._loop_stack[-1]
            # Connect to the node after the loop
            for _, exit_node in reversed(self._function_stack):
                if exit_node != loop_node:
                    self._connect_nodes(break_node, exit_node)
                    break
        
        self._current_node = None  # No nodes after break
    
    def visit_Continue(self, node: ast.Continue) -> None:
        """Visit a continue statement node."""
        if not self._loop_stack:
            return
            
        continue_node = self._add_node('statement', 'CONTINUE', node.lineno)
        
        # Connect to previous node
        if self._current_node:
            self._connect_nodes(self._current_node, continue_node)
        
        # Connect back to loop condition
        if self._loop_stack:
            loop_node = self._loop_stack[-1]
            self._connect_nodes(continue_node, loop_node)
        
        self._current_node = None  # No nodes after continue
    
    def visit_Expr(self, node: ast.Expr) -> None:
        """Visit an expression node."""
        if isinstance(node.value, ast.Str):  # Skip docstrings
            return
            
        expr = ast.unparse(node) if hasattr(ast, 'unparse') else 'expression'
        expr_node = self._add_node('statement', expr, node.lineno)
        
        # Connect to previous node
        if self._current_node:
            self._connect_nodes(self._current_node, expr_node)
        
        self._current_node = expr_node
    
    def generic_visit(self, node: ast.AST) -> None:
        """Called if no explicit visitor function exists for a node."""
        # Skip certain node types that don't affect control flow
        if isinstance(node, (ast.Pass, ast.Import, ast.ImportFrom, ast.alias)):
            return
            
        # For other nodes, create a statement node
        node_type = type(node).__name__.upper()
        stmt_node = self._add_node('statement', f"{node_type}", getattr(node, 'lineno', 0))
        
        # Connect to previous node
        if self._current_node:
            self._connect_nodes(self._current_node, stmt_node)
        
        self._current_node = stmt_node
        super().generic_visit(node)


def analyze_control_flow(code: str, function_name: str = None) -> Dict[str, Any]:
    """
    Analyze the control flow of Python code and generate an interactive visualization.
    
    Args:
        code: Python source code as a string
        function_name: Optional name of a specific function to analyze
        
    Returns:
        Dictionary containing the HTML visualization and analysis results
    """
    analyzer = EnhancedControlFlowAnalyzer()
    
    try:
        # Generate the control flow visualization
        html_content = analyzer.generate_control_flow(code, function_name)
        
        # Parse the AST for additional analysis
        tree = ast.parse(code)
        
        # Find the target function if specified
        target_node = None
        if function_name:
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef) and node.name == function_name:
                    target_node = node
                    break
        
        # Analyze complexity if we found the target function
        complexity = {}
        if target_node or not function_name:
            # Analyze the entire code or the specific function
            node_to_analyze = target_node if function_name else tree
            
            # Simple complexity analysis (can be enhanced)
            complexity = {
                'time_complexity': 'O(n)',  # Placeholder
                'space_complexity': 'O(1)',  # Placeholder
                'cyclomatic_complexity': 1,  # Placeholder
                'line_count': (node_to_analyze.end_lineno - node_to_analyze.lineno + 1 
                             if hasattr(node_to_analyze, 'end_lineno') else 1)
            }
        
        return {
            'status': 'success',
            'html': html_content,
            'complexity': complexity,
            'nodes': list(analyzer.nodes.values()),
            'edges': [{
                'from': from_node,
                'to': to_node,
                'label': edge_data.get('label', '')
            } for from_node, to_node, edge_data in analyzer.edges]
        }
        
    except SyntaxError as e:
        return {
            'status': 'error',
            'error': f'Syntax error: {str(e)}',
            'line': e.lineno,
            'offset': e.offset
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': f'Analysis error: {str(e)}'
        }
