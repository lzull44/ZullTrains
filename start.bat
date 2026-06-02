@echo off
setlocal
title ZullCoaching
cd /d "%~dp0"

REM --- check Node / npm ---
where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js / npm was not found on this PC.
  echo   Install the LTS version from https://nodejs.org , then run this again.
  echo.
  pause
  exit /b 1
)

REM --- install dependencies on first run ---
if not exist "node_modules" (
  echo.
  echo   First run: installing dependencies ^(this can take a minute^)...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   npm install failed - see the messages above.
    pause
    exit /b 1
  )
)

echo.
echo   Starting ZullCoaching...
echo   A browser tab will open at http://localhost:5173
echo   Leave this window open while you use the app. Press Ctrl+C to stop.
echo.

REM --- run dev server and auto-open the browser when ready ---
call npm run dev -- --open
