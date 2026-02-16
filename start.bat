@echo off
echo Starting Static Analysis Framework...

echo Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe manage.py runserver"

timeout /t 3 /nobreak > nul

echo Starting frontend server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
