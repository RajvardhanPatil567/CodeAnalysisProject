# Test Sample Files for Static Analysis Framework

This directory contains test files designed to validate the static analysis framework's ability to detect various types of code issues across different programming languages.

## Files Overview

### 1. `test_sample.py` (Original Python Test)
**Purpose**: Basic Python security and code quality issues
**Issues Detected**:
- ✅ Security: `eval()` and `exec()` usage
- ✅ Performance: Inefficient string concatenation in loops
- ✅ Code Quality: Functions with too many parameters (8+ params)
- ✅ Complexity: High cyclomatic complexity with nested conditionals
- ✅ Maintainability: Long functions and complex logic

### 2. `javascript_issues.js`
**Purpose**: JavaScript security vulnerabilities and performance issues
**Issues Detected**:
- ✅ Security: `eval()` usage, XSS via innerHTML, prototype pollution
- ✅ Security: Command injection patterns
- ✅ Performance: Inefficient DOM manipulation, string concatenation
- ✅ Performance: Global variable access in tight loops
- ✅ Code Quality: Functions with excessive parameters
- ✅ Complexity: Deeply nested conditional logic
- ✅ Maintainability: Unused variables

### 3. `typescript_issues.ts`
**Purpose**: TypeScript type safety and modern development issues
**Issues Detected**:
- ✅ Type Safety: `any` type usage, missing type annotations
- ✅ Type Safety: Incorrect interface implementations, dangerous type assertions
- ✅ Type Safety: Missing null checks and potential null reference errors
- ✅ Security: `eval()` usage, prototype pollution
- ✅ Performance: Inefficient array operations, synchronous blocking operations
- ✅ Performance: Memory leak potential in event management
- ✅ Code Quality: Complex functions with multiple responsibilities
- ✅ Maintainability: Unused imports and variables

### 4. `java_issues.java`
**Purpose**: Java enterprise-level security and performance issues
**Issues Detected**:
- ✅ Security: SQL injection vulnerabilities
- ✅ Security: Unsafe deserialization, hardcoded credentials
- ✅ Performance: Inefficient string concatenation with `+` operator
- ✅ Performance: O(n²) algorithms, synchronization bottlenecks
- ✅ Performance: Resource leaks (unclosed connections)
- ✅ Performance: Memory leaks in static collections
- ✅ Code Quality: Methods with excessive parameters
- ✅ Complexity: High cyclomatic complexity
- ✅ Maintainability: Magic numbers, generic exception handling

### 5. `python_advanced.py`
**Purpose**: Advanced Python security and architectural issues
**Issues Detected**:
- ✅ Security: SQL injection, pickle deserialization, command injection
- ✅ Security: Path traversal vulnerabilities, hardcoded secrets
- ✅ Performance: Inefficient database operations, O(n²) algorithms
- ✅ Performance: Global variable access, memory leaks
- ✅ Architecture: Functions with too many responsibilities
- ✅ Complexity: High cyclomatic complexity
- ✅ Maintainability: Unused imports and variables

## How to Use These Test Files

### 1. Upload via Web Interface
1. Open the static analysis framework at `http://localhost:3000`
2. Go to "Upload Files" page
3. Select one or more test files
4. Upload and analyze to see detected issues

### 2. Create Project and Add Files
1. Create a new project in the web interface
2. Upload test files to the project
3. Run analysis to see comprehensive reports
4. View issues categorized by severity and type

### 3. Real-time Analysis
1. Go to "Analyze Code" page
2. Copy content from any test file
3. Select the appropriate language
4. See instant analysis results

## Expected Analysis Results

Each test file should generate multiple issues across different categories:

- **Security Issues**: High severity vulnerabilities like injection attacks, unsafe deserialization
- **Performance Issues**: Medium severity problems like inefficient algorithms, resource leaks
- **Code Quality Issues**: Medium severity maintainability problems like complex functions
- **Style Issues**: Low severity formatting and convention violations

## Issue Categories Tested

### Security Vulnerabilities
- Code injection (eval, exec, SQL injection)
- Cross-site scripting (XSS)
- Unsafe deserialization
- Command injection
- Path traversal
- Hardcoded credentials
- Prototype pollution

### Performance Issues
- Inefficient string operations
- Poor algorithm complexity (O(n²) when O(n) possible)
- Resource leaks (unclosed connections, files)
- Memory leaks (unbounded caches, event listeners)
- Synchronization bottlenecks
- Global variable access in loops

### Code Quality Issues
- Functions with too many parameters (>7)
- High cyclomatic complexity (>10)
- Functions doing too much (single responsibility violation)
- Long functions (>50 lines)
- Deep nesting (>4 levels)
- Magic numbers and hardcoded values

### Maintainability Issues
- Unused variables and imports
- Missing type annotations (TypeScript)
- Generic exception handling
- Lack of documentation
- Inconsistent naming conventions

## Validation Checklist

Use this checklist to verify the static analysis framework is working correctly:

- [ ] All test files upload successfully
- [ ] Language detection works for each file type
- [ ] Security issues are flagged with high severity
- [ ] Performance issues are detected and categorized
- [ ] Code quality metrics are calculated
- [ ] Cyclomatic complexity is measured
- [ ] Line count and file statistics are accurate
- [ ] Issues are displayed with proper line numbers
- [ ] Severity levels are assigned correctly
- [ ] Analysis reports are generated successfully

## Adding New Test Cases

To add new test cases:

1. Create a new file with intentional issues
2. Document the expected issues in this README
3. Test the file through the web interface
4. Verify all expected issues are detected
5. Update the validation checklist

This comprehensive test suite ensures the static analysis framework can detect a wide range of real-world code issues across multiple programming languages.
