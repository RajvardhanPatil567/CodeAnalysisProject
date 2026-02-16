# Static Analysis Framework

A comprehensive static code analysis platform built with React and Django, designed to help developers identify code quality issues, security vulnerabilities, and performance problems across multiple programming languages.

## Features

- **Multi-language Support**: Python, JavaScript, TypeScript, Java, C++, C, Go, Rust
- **Real-time Analysis**: Instant code analysis with detailed issue reporting
- **Custom Rules**: Configurable analysis rules and thresholds
- **Detailed Reports**: Comprehensive analysis reports with metrics and suggestions
- **REST API**: Full-featured API for integration with other tools
- **Modern UI**: Clean, responsive interface built with Material-UI
- **Project Management**: Organize and track multiple code analysis projects
- **File Upload**: Bulk file upload and analysis
- **Docker Support**: Easy deployment with Docker containers

## Architecture

- **Backend**: Django REST Framework with Celery for async processing
- **Frontend**: React with TypeScript and Material-UI
- **Analyzer Core**: Custom static analysis engine with pluggable analyzers
- **Database**: PostgreSQL (production) / SQLite (development)
- **Cache/Queue**: Redis for caching and task queuing
- **Deployment**: Docker containers with docker-compose

## Quick Start

### Option 1: Automated Setup (Windows)
```bash
# Run the setup script to install dependencies
setup.bat

# Start both servers
start.bat
```

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Option 3: Docker Setup
```bash
docker-compose up --build
```

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

## Usage

1. **Dashboard**: View project statistics and recent analysis reports
2. **Projects**: Create and manage code analysis projects
3. **Analyze Code**: Real-time analysis of code snippets
4. **Upload Files**: Bulk upload files to create new projects
5. **Project Details**: View detailed analysis results and issues

## Analysis Capabilities

### Security Issues
- Dangerous function usage (eval, exec)
- Code injection vulnerabilities
- Insecure patterns

### Code Quality
- Function complexity and length
- Parameter count validation
- Code style violations
- Maintainability issues

### Performance
- Inefficient algorithms
- Memory usage patterns
- Optimization opportunities

### Metrics
- Cyclomatic complexity
- Lines of code
- Halstead complexity
- Maintainability index

## Tech Stack

- **Backend**: Django 4.2, Django REST Framework, Celery, Redis
- **Frontend**: React 18, TypeScript, Material-UI, Axios
- **Analysis**: Pylint, ESLint, Radon, Bandit, custom analyzers
- **Database**: PostgreSQL, SQLite
- **Deployment**: Docker, Gunicorn, Nginx

## Project Structure

```
static-analysis-framework/
├── backend/
│   ├── analyzer/          # Core analysis models and logic
│   ├── api/              # REST API endpoints
│   ├── static_analysis/  # Django settings and configuration
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Main application pages
│   │   └── services/     # API service layer
│   └── package.json      # Node.js dependencies
├── docker-compose.yml    # Docker orchestration
├── setup.bat            # Windows setup script
└── start.bat            # Windows startup script
