# 1. Define paths
$projectRoot = Get-Location
$backendConfigPath = Join-Path $projectRoot "backend\config.js"

Write-Host "=== Starting Aviation Maintenance System Dev Environment ===" -ForegroundColor Cyan

# 2. Start Hardhat Node (New Window)
Write-Host "1. Starting Hardhat Local Node..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k npx hardhat node"
Write-Host "   Waiting 5 seconds for node to start..."
Start-Sleep -Seconds 5

# 3. Deploy Contract
Write-Host "2. Deploying Smart Contract..." -ForegroundColor Green
$deployOutput = npx hardhat run scripts/deploy.js --network localhost
$deployOutputString = $deployOutput | Out-String
Write-Host $deployOutputString

# 4. Extract Address and Update Config
if ($deployOutputString -match "AviationMaintenance deployed to (0x[a-fA-F0-9]{40})") {
    $newAddress = $matches[1]
    Write-Host "   Detected new contract address: $newAddress" -ForegroundColor Yellow
    
    # Read config.js
    $configContent = Get-Content $backendConfigPath -Raw
    
    # Replace address
    # Use regex to match the entire line after 'const CONTRACT_ADDRESS =' to handle potential trailing semicolons
    $newConfigContent = $configContent -replace 'const CONTRACT_ADDRESS = .*', "const CONTRACT_ADDRESS = `"$newAddress`";"
    
    # Prevent accumulation of newlines (Set-Content adds one)
    $newConfigContent = $newConfigContent.TrimEnd()

    # Write back
    Set-Content -Path $backendConfigPath -Value $newConfigContent
    Write-Host "   Updated backend/config.js" -ForegroundColor Yellow
}
else {
    Write-Host "   WARNING: Could not extract contract address. Please check config manually." -ForegroundColor Red
}

# 5. Start Backend (New Window)
Write-Host "3. Starting Backend Service..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd backend && node index.js"

# 6. Start Frontend (New Window)
Write-Host "4. Starting Frontend Service..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd frontend && npm run dev"

Write-Host "=== All Services Started ===" -ForegroundColor Cyan
