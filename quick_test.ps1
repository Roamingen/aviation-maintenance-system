# 快速重置测试环境脚本
# 流程: Stop -> Start -> Seed

$ErrorActionPreference = "Stop"

Write-Host "=== 🚀 开始快速重置测试环境 ===" -ForegroundColor Cyan

# 1. 停止环境
if (Test-Path "stop_dev.ps1") {
    Write-Host "`n[1/3] 正在停止当前环境..." -ForegroundColor Yellow
    & .\stop_dev.ps1
    Start-Sleep -Seconds 2
}
else {
    Write-Host "⚠️ 未找到 stop_dev.ps1，跳过停止步骤。" -ForegroundColor DarkYellow
}

# 2. 启动环境
if (Test-Path "start_dev.ps1") {
    Write-Host "`n[2/3] 正在启动新环境 (部署合约)..." -ForegroundColor Yellow
    # start_dev.ps1 会同步执行合约部署，等待它完成后再继续
    & .\start_dev.ps1
}
else {
    Write-Host "❌ 未找到 start_dev.ps1，无法启动。" -ForegroundColor Red
    exit 1
}

# 3. 注入数据
Write-Host "`n[3/3] 正在注入测试数据..." -ForegroundColor Yellow
if (Test-Path "backend\seed.js") {
    Push-Location backend
    try {
        node seed.js
    }
    catch {
        Write-Host "❌ 数据注入失败" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "❌ 未找到 backend/seed.js" -ForegroundColor Red
}

Write-Host "`n=== ✅ 测试环境重置完成 ===" -ForegroundColor Green
Write-Host "前端地址: http://localhost:5173"
Write-Host "后端地址: http://localhost:3000"
