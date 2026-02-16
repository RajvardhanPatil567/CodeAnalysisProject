@echo off
echo ========================================
echo  Static Analysis Framework Quick Start
echo ========================================
echo.

:: Start backend in new window
echo Starting backend server...
start "Django Backend" cmd /c "run_backend.bat"

:: Wait a moment
timeout /t 3 /nobreak > nul

:: Start frontend in new window  
echo Starting frontend server...
start "React Frontend" cmd /c "run_frontend.bat"

echo.
echo Both servers are starting in separate windows...
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Wait for both servers to fully load, then open:
echo http://localhost:3000
echo.
pause
