@echo off
title career-ops
cd /d "%~dp0"

if not exist "%USERPROFILE%\career-ops" (
    echo career-ops is not installed yet.
    echo Running first-time setup...
    echo.
    call setup.sh
)

cd /d "%USERPROFILE%\career-ops"
echo.
echo Starting career-ops web UI...
echo Open http://localhost:3000 in your browser.
echo.
npm run ui
pause
