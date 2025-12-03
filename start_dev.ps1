# 1. 定义路径
$projectRoot = Get-Location
$backendConfigPath = Join-Path $projectRoot "backend\config.js"

Write-Host "=== 正在启动航空维修系统开发环境 ===" -ForegroundColor Cyan

# 2. 启动 Hardhat 节点 (新窗口)
Write-Host "1. 启动 Hardhat 本地节点..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k npx hardhat node"
Write-Host "   等待 5 秒让节点完全启动..."
Start-Sleep -Seconds 5

# 3. 部署合约
Write-Host "2. 正在部署智能合约..." -ForegroundColor Green
$deployOutput = npx hardhat run scripts/deploy.js --network localhost
$deployOutputString = $deployOutput | Out-String
Write-Host $deployOutputString

# 4. 提取合约地址并更新配置
if ($deployOutputString -match "AviationMaintenance deployed to (0x[a-fA-F0-9]{40})") {
    $newAddress = $matches[1]
    Write-Host "   检测到新合约地址: $newAddress" -ForegroundColor Yellow
    
    # 读取 config.js
    $configContent = Get-Content $backendConfigPath -Raw
    
    # 替换地址 (使用正则确保匹配 const CONTRACT_ADDRESS = "...")
    $newConfigContent = $configContent -replace 'const CONTRACT_ADDRESS = ".*"', "const CONTRACT_ADDRESS = `"$newAddress`";"
    
    # 写回文件
    Set-Content -Path $backendConfigPath -Value $newConfigContent
    Write-Host "   已更新 backend/config.js" -ForegroundColor Yellow
}
else {
    Write-Host "   警告: 未能从输出中提取合约地址，请手动检查配置。" -ForegroundColor Red
}

# 5. 启动后端 (新窗口)
Write-Host "3. 启动后端服务..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd backend && node index.js"

# 6. 启动前端 (新窗口)
Write-Host "4. 启动前端服务..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd frontend && npm run dev"

Write-Host "=== 所有服务已启动 ===" -ForegroundColor Cyan
