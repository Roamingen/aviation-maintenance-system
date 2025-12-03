@echo off
chcp 65001
echo === 正在停止航空维修系统开发环境 ===

echo 1. 正在停止 Node.js 进程...
taskkill /F /IM node.exe /T 2>nul
if %errorlevel% equ 0 (
    echo    [成功] Node.js 进程已停止
) else (
    echo    [提示] 未发现运行中的 Node.js 进程
)

echo.
echo 2. 正在关闭 CMD 窗口...
echo    注意：这将关闭所有打开的 CMD 窗口！
timeout /t 2 /nobreak >nul
taskkill /F /IM cmd.exe /T 2>nul

:: 如果脚本运行到这里还没被杀掉（例如在 PowerShell 中运行此 bat），则显示完成
echo.
echo === 开发环境已停止 ===
pause