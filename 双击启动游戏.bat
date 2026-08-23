@echo off
setlocal
cd /d "%~dp0"
title Metro Brigade - City Breakout

rem 优先用 py 启动器（Windows 官方安装器自带，对中文路径最稳）
where py >nul 2>&1
if %errorlevel%==0 (
    py start_game.py
    goto :end
)

where python >nul 2>&1
if %errorlevel%==0 (
    python start_game.py
    goto :end
)

echo.
echo   [!] Python not found.
echo.
echo   Please install Python from https://www.python.org/downloads/
echo   and make sure "Add Python to PATH" is checked during setup.
echo.
pause
goto :eof

:end
if %errorlevel% neq 0 (
    echo.
    echo   [!] Launcher exited with an error. Details above.
    pause
)

:eof
endlocal
