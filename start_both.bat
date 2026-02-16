@echo off
echo ========================================
echo Starting Static Analysis Framework
echo ========================================

echo.
echo This will start both backend and frontend servers.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C in each terminal to stop the servers.
echo.

:: Start backend in a new command window
echo Starting Django Backend Server...
start "Django Backend" cmd /c "run_backend.bat"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start frontend in a new command window
echo Starting React Frontend Server...
start "React Frontend" cmd /c "run_frontend.bat"

echo.
echo ========================================
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Close this window to keep servers running in background.
pause
