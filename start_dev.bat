@echo off
chcp 65001
echo === 正在启动航空维修系统开发环境 (CMD版) ===

:: 1. 启动 Hardhat 节点
echo 1. 启动 Hardhat 本地节点...
start "Hardhat Node" cmd /k "npx hardhat node"

echo    等待 5 秒让节点完全启动...
timeout /t 5 /nobreak >nul

:: 2. 部署合约
echo 2. 正在部署智能合约...
call npx hardhat run scripts/deploy.js --network localhost > deploy_output.txt
type deploy_output.txt

:: 3. 更新配置 (使用 PowerShell 单行命令处理正则替换，因为 Batch 处理文本太弱)
echo.
echo    正在更新 backend/config.js ...
powershell -Command "$d = Get-Content deploy_output.txt -Raw; if($d -match 'deployed to (0x[a-fA-F0-9]{40})') { $addr = $matches[1]; $c = Get-Content backend/config.js -Raw; $c = $c -replace 'const CONTRACT_ADDRESS = \`".*\`"', ('const CONTRACT_ADDRESS = \`"'+$addr+'\`"'); Set-Content backend/config.js $c; Write-Host '   [成功] 合约地址已更新为: ' $addr -ForegroundColor Yellow } else { Write-Host '   [错误] 未能提取合约地址' -ForegroundColor Red }"
del deploy_output.txt

:: 4. 启动后端
echo 3. 启动后端服务...
start "Backend API" cmd /k "cd backend && node index.js"

:: 5. 启动前端
echo 4. 启动前端服务...
start "Frontend Vite" cmd /k "cd frontend && npm run dev"

echo.
echo === 所有服务已启动 ===
pause