@echo off
echo Creating default Django user...
cd /d "%~dp0backend"

set PYTHON_EXE=%~dp0backend\venv\Scripts\python.exe

echo Creating superuser with username: admin, password: admin123
echo from django.contrib.auth.models import User; User.objects.filter(username='admin').delete(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') | "%PYTHON_EXE%" manage.py shell

echo Default user created successfully!
echo Username: admin
echo Password: admin123
pause
