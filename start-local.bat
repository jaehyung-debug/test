@echo off
setlocal
cd /d "%~dp0"
title Project Cost Manager - Local Setup

echo ============================================================
echo   Project Cost Manager - Windows Local Launcher
echo ============================================================
echo.

where node.exe >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Download and install the LTS version from https://nodejs.org/
  goto :failed
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Reinstall the Node.js LTS version.
  goto :failed
)

where pnpm.cmd >nul 2>&1
if errorlevel 1 (
  echo [1/5] pnpm was not found. Installing pnpm...
  call npm.cmd install --global pnpm@10.13.1
  if errorlevel 1 goto :failed
) else (
  echo [1/5] pnpm is already installed.
)

if not exist ".env" (
  echo [2/5] Creating .env from .env.example...
  copy /Y ".env.example" ".env" >nul
  if errorlevel 1 goto :failed
) else (
  echo [2/5] Existing .env will be used.
)

echo [3/5] Installing packages...
call pnpm.cmd install
if errorlevel 1 goto :failed

echo [4/5] Generating Prisma Client and preparing SQLite database...
call pnpm.cmd db:setup
if errorlevel 1 goto :failed

echo [5/5] Starting the application at http://localhost:3000 ...
echo Press Ctrl+C to stop the server.
call pnpm.cmd dev
if errorlevel 1 goto :failed

goto :eof

:failed
echo.
echo [ERROR] Setup or startup failed. Review the message above.
pause
exit /b 1
