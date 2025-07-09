@echo off
echo 🚀 Starting Executive Cyber Crisis Simulator...

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

echo 🔌 Starting Socket.IO server on port 3001...
start "Socket.IO Server" cmd /k "node server/index.js"

timeout /t 2 /nobreak >nul

echo ⚡ Starting Vite dev server on port 5173...
start "Vite Dev Server" cmd /k "npm run dev:vite"

timeout /t 3 /nobreak >nul

echo.
echo ✅ Both servers are starting!
echo 📱 Frontend: http://localhost:5173
echo 🔌 Backend: http://localhost:3001
echo.
echo Close both command windows to stop the servers
pause