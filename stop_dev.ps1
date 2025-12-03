Write-Host "=== 正在停止航空维修系统开发环境 ===" -ForegroundColor Cyan

# 停止所有 Node.js 进程 (Hardhat, Backend, Frontend 都是 Node 进程)
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "正在停止 $($nodeProcesses.Count) 个 Node.js 进程..." -ForegroundColor Yellow
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Write-Host "所有 Node.js 进程已停止。" -ForegroundColor Green
}
else {
    Write-Host "未发现运行中的 Node.js 进程。" -ForegroundColor Yellow
}

# 停止 cmd.exe 进程 (关闭由 start_dev 启动的窗口)
$cmdProcesses = Get-Process cmd -ErrorAction SilentlyContinue
if ($cmdProcesses) {
    Write-Host "正在关闭 $($cmdProcesses.Count) 个 CMD 窗口..." -ForegroundColor Yellow
    # 注意：这会关闭所有 CMD 窗口，包括当前可能正在使用的其他 CMD 窗口
    Stop-Process -Name cmd -Force -ErrorAction SilentlyContinue
    Write-Host "所有 CMD 窗口已关闭。" -ForegroundColor Green
}

Write-Host "=== 开发环境已停止 ===" -ForegroundColor Cyan
