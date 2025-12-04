@echo off
echo === Starting Aviation Maintenance System Dev Environment ===

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [Error] Node.js is not installed or not in PATH.
    pause
    exit /b
)

:: 1. Start Hardhat Node
echo 1. Starting Hardhat Node...
start "Hardhat Node" cmd /k "npx hardhat node"

echo    Waiting 5 seconds for node to start...
timeout /t 5 /nobreak >nul

:: 2. Deploy Contracts
echo 2. Deploying Smart Contract...
call npx hardhat run scripts/deploy.js --network localhost > deploy_output.txt
type deploy_output.txt

:: 3. Update Config
echo.
echo    Updating backend/config.js...
:: Use PowerShell to parse the output and update config.js (PowerShell is available on all Win10)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d = Get-Content deploy_output.txt -Raw; if($d -match 'deployed to (0x[a-fA-F0-9]{40})') { $addr = $matches[1]; $c = Get-Content backend/config.js -Raw; $c = $c -replace 'const CONTRACT_ADDRESS = \`".*\`"', ('const CONTRACT_ADDRESS = \`"'+$addr+'\`"'); Set-Content backend/config.js $c; Write-Host '   [Success] Contract address updated to: ' $addr -ForegroundColor Yellow } else { Write-Host '   [Error] Could not extract contract address.' -ForegroundColor Red }"
del deploy_output.txt

:: 4. Start Backend
echo 3. Starting Backend Service...
start "Backend API" cmd /k "cd backend && node index.js"

:: 5. Start Frontend
echo 4. Starting Frontend Service...
start "Frontend Vite" cmd /k "cd frontend && npm run dev"

echo.
echo === All services started ===
echo Don't close this window.
pause