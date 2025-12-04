Write-Host "=== Stopping Aviation Maintenance System Dev Environment ===" -ForegroundColor Cyan

# Stop all Node.js processes
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Stopping $($nodeProcesses.Count) Node.js processes..." -ForegroundColor Yellow
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Write-Host "All Node.js processes stopped." -ForegroundColor Green
}
else {
    Write-Host "No running Node.js processes found." -ForegroundColor Yellow
}

# Stop cmd.exe processes
$cmdProcesses = Get-Process cmd -ErrorAction SilentlyContinue
if ($cmdProcesses) {
    Write-Host "Closing $($cmdProcesses.Count) CMD windows..." -ForegroundColor Yellow
    Stop-Process -Name cmd -Force -ErrorAction SilentlyContinue
    Write-Host "All CMD windows closed." -ForegroundColor Green
}

Write-Host "=== Dev Environment Stopped ===" -ForegroundColor Cyan
