@echo off
echo ============================================
echo    SyncSpace - Installation and Setup
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/6] Checking Node.js installation...
node --version
echo.

REM Check if MongoDB is running (optional check)
echo [2/6] Note: Make sure MongoDB is running locally or update .env with your MongoDB URI
echo.

REM Install backend dependencies
echo [3/6] Installing backend dependencies...
cd server
if not exist package.json (
    echo ERROR: package.json not found in server directory!
    pause
    exit /b 1
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo [4/6] Creating backend .env file...
    copy .env.example .env
    echo Please edit server\.env file with your configuration!
) else (
    echo [4/6] Backend .env file already exists
)

cd ..

REM Install frontend dependencies
echo [5/6] Installing frontend dependencies...
cd client
if not exist package.json (
    echo ERROR: package.json not found in client directory!
    pause
    exit /b 1
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo [6/6] Creating frontend .env file...
    copy .env.example .env
) else (
    echo [6/6] Frontend .env file already exists
)

cd ..

echo.
echo ============================================
echo    Installation Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Update server\.env with your database URI if needed
echo 3. Run: npm run seed (in server directory) to add sample data
echo 4. Run: start-dev.bat to start both servers
echo.
pause
