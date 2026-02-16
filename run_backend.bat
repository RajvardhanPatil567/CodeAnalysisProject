@echo off
echo Starting Django Backend Server...

:: Activate virtual environment from root folder
call "%~dp0venv\Scripts\activate.bat"
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    echo Please run setup.bat first to create and configure the virtual environment
    pause
    exit /b 1
)

:: Change to backend directory
cd backend

:: Quick check if Django is available
python -c "import django" >nul 2>&1
if errorlevel 1 (
    echo Django not found. Installing dependencies...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        echo Please check your internet connection and try again
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
)

:: Run Django migrations (only if needed)
echo Running Django migrations...
python manage.py makemigrations analyzer --dry-run >nul 2>&1
if not errorlevel 1 (
    python manage.py makemigrations analyzer
    python manage.py migrate
) else (
    echo No new migrations needed.
)

echo Starting Django development server...
python manage.py runserver 0.0.0.0:8000
pause
