@echo off
echo Setting up Static Analysis Framework...

echo.
echo === Creating Virtual Environment ===
cd /d "%~dp0"

:: Create virtual environment in root directory
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        echo Please ensure Python is installed and available in PATH
        pause
        exit /b 1
    )
) else (
    echo Virtual environment already exists.
)

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo.
echo === Backend Setup ===
cd backend

:: Ensure pip is available and up to date
python -m ensurepip --upgrade
python -m pip install --upgrade pip setuptools wheel

:: Install backend dependencies
echo Installing backend dependencies...
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

:: Run Django migrations
echo Running Django migrations...
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
echo Backend setup complete!

echo.
echo === Frontend Setup ===
cd ..\frontend

:: Install frontend dependencies
echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    echo Please ensure Node.js is installed
    pause
    exit /b 1
)
echo Frontend setup complete!

echo.
echo === Setup Complete! ===
echo.
echo To start the application:
echo 1. Backend: run_backend.bat
echo 2. Frontend: run_frontend.bat
echo 3. Both: start_both.bat
echo.
echo Or use Docker: docker-compose up --build
pause
