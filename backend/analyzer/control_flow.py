import os
import ast
import json
import logging
import tempfile
from collections import defaultdict

import pandas as pd
import plotly
import plotly.graph_objects as go
from pyvis.network import Network
from werkzeug.utils import secure_filename

# Get a logger
logger = logging.getLogger(__name__)


def generate_complexity_chart(time_complexity, space_complexity):
    """Generate interactive Plotly charts for complexity visualization"""
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
        mode = "gauge+number",
        value = time_value,
        domain = {'x': [0, 1], 'y': [0, 1]},
        title = {'text': "Time Complexity"},
        gauge = {
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
                'value': time_value}}))
    
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
        mode = "gauge+number",
        value = space_value,
        domain = {'x': [0, 1], 'y': [0, 1]},
        title = {'text': "Space Complexity"},
        gauge = {
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
                'value': space_value}}))
    
    space_fig.update_layout(height=200, margin=dict(l=20, r=20, t=50, b=10))
    
    return {
        'time_chart': json.loads(plotly.io.to_json(time_fig)),
        'space_chart': json.loads(plotly.io.to_json(space_fig)),
    }

class ComplexityVisitor(ast.NodeVisitor):
    """AST visitor to calculate time and space complexity recursively."""
    def __init__(self):
        self.complexity_data = defaultdict(lambda: {'time': 'O(1)', 'space': 'O(1)'})
        self.scope_stack = [{'time': 'O(1)', 'space': 'O(1)'}] # Base scope

    def visit(self, node):
        """Override visit to store complexity for each node after visiting its children."""
        super().visit(node)
        if hasattr(node, 'lineno'):
            # The complexity of a line is the complexity of the current scope at that point
            self.complexity_data[node.lineno] = self.scope_stack[-1]
        return self.complexity_data

    def _process_body(self, body):
        for node in body:
            self.visit(node)

    def visit_FunctionDef(self, node):
        self.scope_stack.append({'time': 'O(1)', 'space': 'O(1)'})
        self._process_body(node.body)
        func_complexity = self.scope_stack.pop()
        self.complexity_data[node.lineno] = func_complexity

    def visit_For(self, node):
        # A loop multiplies the complexity of its body by O(n)
        parent_scope_complexity = self.scope_stack[-1]
        loop_scope = self._multiply_complexity(parent_scope_complexity, {'time': 'O(n)', 'space': 'O(1)'})
        self.scope_stack.append(loop_scope)
        self._process_body(node.body)
        body_complexity = self.scope_stack.pop()
        # The parent scope's complexity becomes the max of its original and the loop's total complexity
        self.scope_stack[-1] = self._max_complexity(parent_scope_complexity, body_complexity)

    def visit_While(self, node):
        # Treat While loops similarly to For loops
        self.visit_For(node)

    def visit_If(self, node):
        # The complexity of an if-statement is the complexity of the parent plus the max of its branches
        parent_scope = self.scope_stack[-1]
        
        # Visit 'if' body
        self.scope_stack.append(parent_scope.copy())
        self._process_body(node.body)
        if_complexity = self.scope_stack.pop()

        # Visit 'else' body
        else_complexity = {'time': 'O(1)', 'space': 'O(1)'}
        if node.orelse:
            self.scope_stack.append(parent_scope.copy())
            self._process_body(node.orelse)
            else_complexity = self.scope_stack.pop()

        # The parent scope's complexity is updated with the max of the branches
        max_branch_complexity = self._max_complexity(if_complexity, else_complexity)
        self.scope_stack[-1] = max_branch_complexity

    def _get_order_index(self, complexity_str):
        order = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)', 'O(2^n)']
        try:
            return order.index(complexity_str)
        except ValueError:
            return -1 # Should not happen with controlled inputs

    def _max_complexity(self, comp1, comp2):
        """Return the higher of two complexities."""
        order = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)', 'O(2^n)']
        max_time = order[max(self._get_order_index(comp1['time']), self._get_order_index(comp2['time']))]
        max_space = order[max(self._get_order_index(comp1['space']), self._get_order_index(comp2['space']))]
        return {'time': max_time, 'space': max_space}

    def _multiply_complexity(self, comp1, comp2):
        """Multiply two complexities, for loops."""
        # Simplified multiplication for demonstration
        if comp1['time'] == 'O(n)' or comp2['time'] == 'O(n)':
            new_time = 'O(n^2)'
        elif comp1['time'] == 'O(1)' and comp2['time'] == 'O(n)':
            new_time = 'O(n)'
        else:
            new_time = 'O(n)' # Default for loop
        return {'time': new_time, 'space': comp1['space']}

def generate_control_flow(code):
    """Generate control flow diagram using pyvis with complexity annotations and proper nesting."""
    net = Network(height="750px", width="100%", directed=True, notebook=True)
    net.toggle_physics(True)
    net.set_options("""
    {
      "nodes": {
        "font": {
          "size": 16,
          "face": "arial",
          "color": "#000000"
        },
        "borderWidth": 2,
        "shadow": true
      },
      "edges": {
        "color": {
          "inherit": false,
          "color": "#404040",
          "highlight": "#000000"
        },
        "smooth": {
          "enabled": true,
          "type": "cubicBezier",
          "forceDirection": "vertical",
          "roundness": 0.4
        },
        "arrows": {
          "to": { "enabled": true, "scaleFactor": 1 }
        }
      },
      "physics": {
        "enabled": false
      },
      "layout": {
        "hierarchical": {
          "enabled": true,
          "levelSeparation": 200,
          "nodeSpacing": 120,
          "treeSpacing": 250,
          "direction": "UD",
          "sortMethod": "directed"
        }
      }
    }
    """)

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        logger.error(f"Syntax error in code: {str(e)}")
        net.add_node("error", label="Syntax Error", title=str(e), color="red", shape='box')
        return net.generate_html()

    visitor = ComplexityVisitor()
    complexity_data = visitor.visit(tree)

    def get_node_id(node):
        return f"{type(node).__name__}_{node.lineno}_{node.col_offset}"

    def get_complexity_for_node(node):
        return complexity_data.get(node.lineno, {'time': 'O(1)', 'space': 'O(1)'})

    def process_body(body, parent_id, level):
        last_node_id = parent_id
        for child in body:
            new_node_id = process_node(child, parent_id=last_node_id, level=level)
            if new_node_id:
                last_node_id = new_node_id
        return last_node_id

    def process_node(node, parent_id=None, level=0):
        if not hasattr(node, 'lineno'):
            return None

        node_id = get_node_id(node)
        complexity = get_complexity_for_node(node)
        details = complexity.get('details', [{}])[0]
        description = details.get('description', 'No description available.')
        line_info = f"L{node.lineno}"

        if isinstance(node, ast.FunctionDef):
            label = f"▶ {line_info}: FUNCTION {node.name}\nTime: {complexity.get('time', 'N/A')} | Space: {complexity.get('space', 'N/A')}"
            net.add_node(node_id, label=label, title=description, color='#007BFF', shape='box', level=level)
            process_body(node.body, node_id, level + 1)

        elif isinstance(node, (ast.For, ast.While)):
            loop_type = "FOR" if isinstance(node, ast.For) else "WHILE"
            label = f"🔄 {line_info}: {loop_type} LOOP\nTime: {complexity.get('time', 'N/A')} | Space: {complexity.get('space', 'N/A')}"
            net.add_node(node_id, label=label, title=description, color='#FF8C00', shape='box', level=level)
            if parent_id:
                net.add_edge(parent_id, node_id)
            process_body(node.body, node_id, level + 1)

        elif isinstance(node, ast.If):
            condition = ast.unparse(node.test).strip()
            label = f"❓ {line_info}: IF {condition[:20]}...\nTime: {complexity.get('time', 'N/A')} | Space: {complexity.get('space', 'N/A')}"
            net.add_node(node_id, label=label, title=description, color='#28A745', shape='diamond', level=level)
            if parent_id:
                net.add_edge(parent_id, node_id)

            # Process 'if' and 'else' bodies
            last_if_node = process_body(node.body, node_id, level + 1)
            last_else_node = None
            if node.orelse:
                last_else_node = process_body(node.orelse, node_id, level + 1)
            
            # Create a merge node if both branches exist
            if last_if_node and last_else_node:
                merge_id = f"merge_{node.lineno}"
                net.add_node(merge_id, label="MERGE", shape='circle', color='#E0E0E0', level=level + 2)
                net.add_edge(last_if_node, merge_id)
                net.add_edge(last_else_node, merge_id)
                return merge_id
            return last_if_node or parent_id

        elif isinstance(node, (ast.Assign, ast.Expr, ast.Return)):
            code_line = ast.unparse(node).strip()
            label = f"⚙️ {line_info}: {code_line[:35]}..."
            net.add_node(node_id, label=label, title=code_line, color='#6C757D', shape='box', level=level)
            if parent_id:
                net.add_edge(parent_id, node_id)
        
        else:
            return None # Skip nodes that are not statements

        return node_id

    # Initial processing call
    last_processed_id = None
    for item in tree.body:
        new_id = process_node(item, parent_id=last_processed_id, level=0)
        if new_id:
            last_processed_id = new_id

    html = net.generate_html()
    legend_html = """
    <div style="position: absolute; top: 10px; right: 10px; background-color: rgba(255, 255, 255, 0.9); border: 2px solid #ccc; padding: 10px; border-radius: 8px; font-family: arial; z-index: 999; color: #000000;">
        <h4 style="margin-top: 0; margin-bottom: 10px; text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Diagram Legend</h4>
        <table style="border-collapse: collapse;">
            <tr><td style="padding: 5px;"><div style="width: 20px; height: 20px; background-color: #007BFF; border-radius: 3px; border: 1px solid #000;"></div></td><td style="padding: 5px;">Function</td></tr>
            <tr><td style="padding: 5px;"><div style="width: 20px; height: 20px; background-color: #FF8C00; border-radius: 3px; border: 1px solid #000;"></div></td><td style="padding: 5px;">Loop</td></tr>
            <tr><td style="padding: 5px;"><div style="width: 20px; height: 20px; background-color: #28A745; transform: rotate(45deg); border: 1px solid #000;"></div></td><td style="padding: 5px;">Condition</td></tr>
            <tr><td style="padding: 5px;"><div style="width: 20px; height: 20px; background-color: #6C757D; border-radius: 3px; border: 1px solid #000;"></div></td><td style="padding: 5px;">Statement</td></tr>
        </table>
    </div>
    """
    html = html.replace('</body>', legend_html + '</body>')
    return html

def analyze_code(code_content):
    """Comprehensive code analysis for a given string of code."""
    result = {
        "summary": {
            "Time_Complexity": "O(1)",
            "Space_Complexity": "O(1)",
            "Line_Analysis": [],
        },
        "errors": []
    }

    try:
        tree = ast.parse(code_content)
    except SyntaxError as e:
        error_msg = f"Syntax error: {str(e)}"
        result["errors"].append(error_msg)
        logger.error(error_msg)
        return result

    lines = code_content.splitlines()
    visitor = ComplexityVisitor()
    complexity_data = visitor.visit(tree)

    for line_num, complexity in complexity_data.items():
        if line_num -1 < len(lines):
            line_analysis = {
                'line': line_num,
                'code': lines[line_num - 1].strip(),
                'type': 'line', # Type info is less relevant here now
                'complexity': {
                    'time': complexity['time'],
                    'space': complexity['space'],
                    'visualization': generate_complexity_chart(complexity['time'], complexity['space'])
                }
            }
            result["summary"]["Line_Analysis"].append(line_analysis)
    
    # Calculate overall complexity
    time_complexities = [item['complexity']['time'] for item in result["summary"]["Line_Analysis"]]
    space_complexities = [item['complexity']['space'] for item in result["summary"]["Line_Analysis"]]
    
    def calculate_overall_complexity(complexities):
        complexity_order = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)']
        max_index = 0
        for c in complexities:
            if c in complexity_order:
                max_index = max(max_index, complexity_order.index(c))
        return complexity_order[max_index]

    result["summary"]["Time_Complexity"] = calculate_overall_complexity(time_complexities)
    result["summary"]["Space_Complexity"] = calculate_overall_complexity(space_complexities)

    return result
