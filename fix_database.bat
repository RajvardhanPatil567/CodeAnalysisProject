@echo off
echo Fixing Database Issues...
cd /d "%~dp0backend"

set PYTHON_EXE=%~dp0backend\venv\Scripts\python.exe

echo Creating migrations for analyzer app...
"%PYTHON_EXE%" manage.py makemigrations analyzer

echo Applying all migrations...
"%PYTHON_EXE%" manage.py migrate

echo Database setup complete!
pause
