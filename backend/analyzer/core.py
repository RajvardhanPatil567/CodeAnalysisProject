import ast
import re
import subprocess
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
import radon.complexity as radon_cc
import radon.metrics as radon_metrics
from radon.raw import analyze

class StaticAnalyzer:
    """Core static analysis engine"""
    
    def __init__(self):
        self.supported_languages = {
            'python': PythonAnalyzer(),
            'javascript': JavaScriptAnalyzer(),
            'typescript': TypeScriptAnalyzer(),
            'java': JavaAnalyzer(),
        }
    
    def analyze_file(self, file_path: str, content: str, language: str) -> Dict[str, Any]:
        """Analyze a single file"""
        if language not in self.supported_languages:
            raise ValueError(f"Unsupported language: {language}")
        
        analyzer = self.supported_languages[language]
        return analyzer.analyze(file_path, content)
    
    def analyze_project(self, project_path: str) -> Dict[str, Any]:
        """Analyze entire project"""
        results = {
            'files': [],
            'summary': {
                'total_files': 0,
                'total_lines': 0,
                'total_issues': 0,
                'complexity_score': 0.0,
                'maintainability_index': 0.0
            }
        }
        
        for file_path in Path(project_path).rglob('*'):
            if file_path.is_file():
                language = self._detect_language(file_path)
                if language:
                    try:
                        content = file_path.read_text(encoding='utf-8')
                        analysis = self.analyze_file(str(file_path), content, language)
                        results['files'].append(analysis)
                        results['summary']['total_files'] += 1
                        results['summary']['total_lines'] += analysis.get('metrics', {}).get('lines_of_code', 0)
                        results['summary']['total_issues'] += len(analysis.get('issues', []))
                    except Exception as e:
                        print(f"Error analyzing {file_path}: {e}")
        
        return results
    
    def _detect_language(self, file_path: Path) -> Optional[str]:
        """Detect programming language from file extension"""
        extension_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust',
        }
        return extension_map.get(file_path.suffix.lower())

class PythonAnalyzer:
    """Python-specific analyzer"""
    
    def analyze(self, file_path: str, content: str) -> Dict[str, Any]:
        issues = []
        metrics = {}
        
        try:
            # Parse AST
            tree = ast.parse(content)
            
            # Basic metrics
            raw_metrics = analyze(content)
            metrics = {
                'lines_of_code': raw_metrics.loc,
                'logical_lines': raw_metrics.lloc,
                'source_lines': raw_metrics.sloc,
                'comments': raw_metrics.comments,
                'blank_lines': raw_metrics.blank
            }
            
            # Complexity analysis
            complexity_results = radon_cc.cc_visit(content)
            total_complexity = sum(item.complexity for item in complexity_results)
            metrics['cyclomatic_complexity'] = total_complexity
            
            # Security issues
            issues.extend(self._check_security_issues(tree, content))
            
            # Code quality issues
            issues.extend(self._check_code_quality(tree, content))
            
            # Performance issues
            issues.extend(self._check_performance_issues(tree, content))
            
        except SyntaxError as e:
            issues.append({
                'rule_id': 'syntax_error',
                'rule_name': 'Syntax Error',
                'severity': 'critical',
                'category': 'reliability',
                'message': str(e),
                'line_number': e.lineno or 1,
                'column_number': e.offset or 0
            })
        
        return {
            'file_path': file_path,
            'language': 'python',
            'metrics': metrics,
            'issues': issues
        }
    
    def _check_security_issues(self, tree: ast.AST, content: str) -> List[Dict[str, Any]]:
        """Check for security vulnerabilities"""
        issues = []
        
        class SecurityVisitor(ast.NodeVisitor):
            def visit_Call(self, node):
                # Check for eval() usage
                if isinstance(node.func, ast.Name) and node.func.id == 'eval':
                    issues.append({
                        'rule_id': 'security_eval',
                        'rule_name': 'Dangerous eval() usage',
                        'severity': 'critical',
                        'category': 'security',
                        'message': 'Use of eval() can lead to code injection vulnerabilities',
                        'line_number': node.lineno,
                        'column_number': node.col_offset,
                        'suggestion': 'Consider using ast.literal_eval() for safe evaluation'
                    })
                
                # Check for exec() usage
                if isinstance(node.func, ast.Name) and node.func.id == 'exec':
                    issues.append({
                        'rule_id': 'security_exec',
                        'rule_name': 'Dangerous exec() usage',
                        'severity': 'critical',
                        'category': 'security',
                        'message': 'Use of exec() can lead to code injection vulnerabilities',
                        'line_number': node.lineno,
                        'column_number': node.col_offset
                    })
                
                self.generic_visit(node)
        
        SecurityVisitor().visit(tree)
        return issues
    
    def _check_code_quality(self, tree: ast.AST, content: str) -> List[Dict[str, Any]]:
        """Check for code quality issues"""
        issues = []
        
        class QualityVisitor(ast.NodeVisitor):
            def visit_FunctionDef(self, node):
                # Check function length
                if len(node.body) > 50:
                    issues.append({
                        'rule_id': 'function_too_long',
                        'rule_name': 'Function too long',
                        'severity': 'major',
                        'category': 'maintainability',
                        'message': f'Function {node.name} has {len(node.body)} statements (max 50)',
                        'line_number': node.lineno,
                        'column_number': node.col_offset,
                        'suggestion': 'Consider breaking this function into smaller functions'
                    })
                
                # Check parameter count
                if len(node.args.args) > 7:
                    issues.append({
                        'rule_id': 'too_many_parameters',
                        'rule_name': 'Too many parameters',
                        'severity': 'major',
                        'category': 'maintainability',
                        'message': f'Function {node.name} has {len(node.args.args)} parameters (max 7)',
                        'line_number': node.lineno,
                        'column_number': node.col_offset
                    })
                
                self.generic_visit(node)
        
        QualityVisitor().visit(tree)
        return issues
    
    def _check_performance_issues(self, tree: ast.AST, content: str) -> List[Dict[str, Any]]:
        """Check for performance issues"""
        issues = []
        
        class PerformanceVisitor(ast.NodeVisitor):
            def visit_For(self, node):
                # Check for inefficient string concatenation in loops
                for stmt in ast.walk(node):
                    if isinstance(stmt, ast.AugAssign) and isinstance(stmt.op, ast.Add):
                        if isinstance(stmt.target, ast.Name):
                            issues.append({
                                'rule_id': 'inefficient_string_concat',
                                'rule_name': 'Inefficient string concatenation in loop',
                                'severity': 'minor',
                                'category': 'performance',
                                'message': 'String concatenation in loops is inefficient',
                                'line_number': stmt.lineno,
                                'column_number': stmt.col_offset,
                                'suggestion': 'Use list.append() and str.join() instead'
                            })
                
                self.generic_visit(node)
        
        PerformanceVisitor().visit(tree)
        return issues

class JavaScriptAnalyzer:
    """JavaScript-specific analyzer"""
    
    def analyze(self, file_path: str, content: str) -> Dict[str, Any]:
        issues = []
        metrics = {
            'lines_of_code': len([line for line in content.split('\n') if line.strip()]),
            'cyclomatic_complexity': self._calculate_js_complexity(content)
        }
        
        # Basic pattern matching for common issues
        issues.extend(self._check_js_patterns(content))
        
        return {
            'file_path': file_path,
            'language': 'javascript',
            'metrics': metrics,
            'issues': issues
        }
    
    def _calculate_js_complexity(self, content: str) -> int:
        """Calculate cyclomatic complexity for JavaScript"""
        complexity = 1  # Base complexity
        
        # Count decision points
        patterns = [
            r'\bif\b', r'\belse\b', r'\bwhile\b', r'\bfor\b',
            r'\bswitch\b', r'\bcase\b', r'\bcatch\b', r'\b\?\b',
            r'\b&&\b', r'\b\|\|\b'
        ]
        
        for pattern in patterns:
            complexity += len(re.findall(pattern, content))
        
        return complexity
    
    def _check_js_patterns(self, content: str) -> List[Dict[str, Any]]:
        """Check for JavaScript-specific issues"""
        issues = []
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for == instead of ===
            if '==' in line and '===' not in line and '!=' in line and '!==' not in line:
                issues.append({
                    'rule_id': 'js_equality_operator',
                    'rule_name': 'Use strict equality',
                    'severity': 'minor',
                    'category': 'style',
                    'message': 'Use === instead of == for strict equality',
                    'line_number': i,
                    'column_number': line.find('=='),
                    'suggestion': 'Replace == with === and != with !=='
                })
            
            # Check for var usage
            if re.search(r'\bvar\b', line):
                issues.append({
                    'rule_id': 'js_var_usage',
                    'rule_name': 'Avoid var declaration',
                    'severity': 'minor',
                    'category': 'style',
                    'message': 'Use let or const instead of var',
                    'line_number': i,
                    'column_number': line.find('var'),
                    'suggestion': 'Use let for mutable variables or const for constants'
                })
        
        return issues

class TypeScriptAnalyzer(JavaScriptAnalyzer):
    """TypeScript-specific analyzer (extends JavaScript)"""
    
    def analyze(self, file_path: str, content: str) -> Dict[str, Any]:
        result = super().analyze(file_path, content)
        result['language'] = 'typescript'
        
        # Add TypeScript-specific checks
        result['issues'].extend(self._check_ts_patterns(content))
        
        return result
    
    def _check_ts_patterns(self, content: str) -> List[Dict[str, Any]]:
        """Check for TypeScript-specific issues"""
        issues = []
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for any type usage
            if re.search(r':\s*any\b', line):
                issues.append({
                    'rule_id': 'ts_any_type',
                    'rule_name': 'Avoid any type',
                    'severity': 'minor',
                    'category': 'maintainability',
                    'message': 'Avoid using any type, use specific types instead',
                    'line_number': i,
                    'column_number': line.find('any'),
                    'suggestion': 'Define specific types or interfaces'
                })
        
        return issues

class JavaAnalyzer:
    """Java-specific analyzer"""
    
    def analyze(self, file_path: str, content: str) -> Dict[str, Any]:
        issues = []
        metrics = {
            'lines_of_code': len([line for line in content.split('\n') if line.strip()]),
            'cyclomatic_complexity': self._calculate_java_complexity(content)
        }
        
        issues.extend(self._check_java_patterns(content))
        
        return {
            'file_path': file_path,
            'language': 'java',
            'metrics': metrics,
            'issues': issues
        }
    
    def _calculate_java_complexity(self, content: str) -> int:
        """Calculate cyclomatic complexity for Java"""
        complexity = 1
        
        patterns = [
            r'\bif\b', r'\belse\b', r'\bwhile\b', r'\bfor\b',
            r'\bswitch\b', r'\bcase\b', r'\bcatch\b', r'\b\?\b',
            r'\b&&\b', r'\b\|\|\b'
        ]
        
        for pattern in patterns:
            complexity += len(re.findall(pattern, content))
        
        return complexity
    
    def _check_java_patterns(self, content: str) -> List[Dict[str, Any]]:
        """Check for Java-specific issues"""
        issues = []
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for System.out.println in production code
            if 'System.out.println' in line:
                issues.append({
                    'rule_id': 'java_system_out',
                    'rule_name': 'Avoid System.out.println',
                    'severity': 'minor',
                    'category': 'maintainability',
                    'message': 'Use proper logging instead of System.out.println',
                    'line_number': i,
                    'column_number': line.find('System.out.println'),
                    'suggestion': 'Use a logging framework like SLF4J or Log4j'
                })
        
        return issues
