@echo off
set NODE_OPTIONS=--openssl-legacy-provider
echo ============================================
echo    Starting SyncSpace Development Servers
echo ============================================
echo.

REM Start backend server in a new window
echo Starting Backend Server...
start "SyncSpace Backend" cmd /k "cd server && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server in a new window
echo Starting Frontend Server...
start "SyncSpace Frontend" cmd /k "cd client && npm run dev"

echo.
echo ============================================
echo Both servers are starting!
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
echo (The servers will continue running)
echo ============================================
pause >nul