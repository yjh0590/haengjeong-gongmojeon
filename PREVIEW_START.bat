@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Install LTS from https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules\vite\package.json" (
  echo Installing dependencies for the local preview...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check the network connection.
    pause
    exit /b 1
  )
)
echo.
echo ===============================================
echo ITDA local preview - keep this window open
echo Open http://localhost:5173/ in a browser
echo Legacy routes: /welcome / /owner /editor /map-editor
 echo ===============================================
call npm run dev -- --host 127.0.0.1
pause
