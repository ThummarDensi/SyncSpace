@echo off
echo ============================================
echo    Quick Setup - After MongoDB is Ready
echo ============================================
echo.

cd "d:\rashmi Project\server"
echo [1/2] Seeding database with sample data...
call npm run seed

echo.
echo [2/2] Starting development servers...
cd ..
call start-dev.bat

pause
