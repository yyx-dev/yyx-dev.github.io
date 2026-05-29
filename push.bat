@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set http_proxy=http://127.0.0.1:7897
set https_proxy=http://127.0.0.1:7897

echo 请选择提交类型 :
echo 1) 数据结构
echo 2) 计组
echo 3) 操作系统
echo 4) 计网
echo.

set /p choice="请输入数字 (1-4): "

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I

rem 提取月份和日期（MMDD格式）
set month=%datetime:~4,2%
set day=%datetime:~6,2%
set current_date=%month%%day%

rem 根据选择设置提交信息
if "%choice%"=="1" (
    set commit_msg=数据结构%current_date%
) else if "%choice%"=="2" (
    set commit_msg=计组%current_date%
) else if "%choice%"=="3" (
    set commit_msg=操作系统%current_date%
) else if "%choice%"=="4" (
    set commit_msg=计网%current_date%
) else (
    echo 无效的选择！
    pause
    exit /b 1
)


echo 执行 git add . ...
git add .

echo 执行 git commit -m "%commit_msg%" ...
git commit -m "%commit_msg%"

echo 执行 git push ...
set http_proxy=http://127.0.0.1:7897
set https_proxy=http://127.0.0.1:7897
git push

echo.
echo 操作完成！

sleep 1