@echo off
echo ========================================================
echo Starting TaskMate AI Full-Stack Application
echo ========================================================

cd /d "%~dp0backend"
echo [1/3] Ensuring database migrations are up to date...
php artisan migrate --force

echo [2/3] Starting Laravel Backend on http://127.0.0.1:8000 ...
start "TaskMate AI - Backend" cmd /c "php artisan serve --port=8000"

cd /d "%~dp0frontend"
echo [3/3] Starting Vite Frontend on http://localhost:5173 ...
start "TaskMate AI - Frontend" cmd /c "npm run dev"

timeout /t 3 >nul
start http://localhost:5173

echo.
echo TaskMate AI is running!
echo - Frontend: http://localhost:5173
echo - Backend:  http://127.0.0.1:8000
echo ========================================================
pause
