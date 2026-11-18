Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting TaskMate AI Full-Stack Application" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Run migrations
Set-Location "$root\backend"
Write-Host "[1/3] Ensuring database migrations are up to date..." -ForegroundColor Yellow
php artisan migrate --force

# 2. Start Backend
Write-Host "[2/3] Starting Laravel Backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; php artisan serve --port=8000"

# 3. Start Frontend
Set-Location "$root\frontend"
Write-Host "[3/3] Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "`nTaskMate AI is running!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "- Backend:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
