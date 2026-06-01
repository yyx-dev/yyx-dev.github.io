@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title VitePress Auto-Restart

for %%I in ("%cd%") do set current_dir=%%~nxI
if not "!current_dir!"=="yyx-dev.github.io" (
    echo 当前目录为 !current_dir! 而非 yyx-dev.github.io
    timeout /t 3 /nobreak >nul
    exit /b 1
)

if not exist "node_modules\vitepress" (
    echo 未检测到node_modules, 自动下载中
    call npm install
)

set wait_seconds=20
wmic path Win32_Battery get BatteryStatus 2>nul | find "2" >nul
if %errorlevel% equ 0 (
    set wait_seconds=14
)

start /b cmd /c "timeout /t %wait_seconds% /nobreak >nul && start http://localhost:5173"

:loop
call npm run docs:dev

if %errorlevel% equ 0 (
    echo [%time%] VitePress 正常退出
    goto :eof
) else (
    msg %username% /time:3 "VitePress 已崩溃 (错误码: %errorlevel%)，正在自动重启..."
    goto loop
)