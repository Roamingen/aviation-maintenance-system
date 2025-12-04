# Quick Reset Script
# Flow: Stop -> Start -> Seed

$ErrorActionPreference = "Stop"

Write-Host "=== Quick Reset Dev Environment ===" -ForegroundColor Cyan

# 1. Stop Environment
if (Test-Path "stop_dev.ps1") {
    Write-Host "`n[1/3] Stopping current environment..." -ForegroundColor Yellow
    & .\stop_dev.ps1
    Start-Sleep -Seconds 2
}
else {
    Write-Host "⚠️ stop_dev.ps1 not found, skipping stop." -ForegroundColor DarkYellow
}

# 2. Start Environment
if (Test-Path "start_dev.ps1") {
    Write-Host "`n[2/3] Starting new environment (Deploying)..." -ForegroundColor Yellow
    & .\start_dev.ps1
}
else {
    Write-Host "❌ start_dev.ps1 not found!" -ForegroundColor Red
    exit 1
}

# 3. Seed Data
Write-Host "`n[3/3] Seeding test data..." -ForegroundColor Yellow
Start-Sleep -Seconds 5 # Wait for backend to be ready

Push-Location backend
try {
    node seed.js
}
catch {
    Write-Host "❌ Seeding failed." -ForegroundColor Red
}
finally {
    Pop-Location
}

Write-Host "`n=== Reset Complete! ===" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend: http://localhost:3000"
