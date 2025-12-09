@echo off
title Waste Detection System - Complete Startup
color 0A

echo ========================================
echo 🗂️ WASTE DETECTION SYSTEM STARTUP
echo ========================================
echo.

echo 📁 Creating required directories...
if not exist "ml_service\snapshots" mkdir "ml_service\snapshots"
if not exist "backend\snapshots" mkdir "backend\snapshots"  
if not exist "backend\data" mkdir "backend\data"

echo.
echo 📦 Installing dependencies...
echo Installing backend dependencies...
cd backend
call npm install >nul 2>&1
cd ..

echo Installing frontend dependencies...
cd frontend
call npm install >nul 2>&1
cd ..

echo.
echo ========================================
echo 🚀 STARTING ALL SERVICES
echo ========================================
echo.
echo Services will start in 3 separate windows:
echo 1️⃣ ML Camera Service (Port 5001)
echo 2️⃣ Backend API (Port 4000)
echo 3️⃣ Frontend UI (Port 3000)
echo.
echo ⚠️ Keep all windows open for the system to work!
echo.
pause

echo.
echo 🔥 Starting ML Camera Service...
start "ML Camera Service" cmd /k ".\waste-management-venv\Scripts\activate && cd ml_service && python app.py"

timeout /t 3 >nul

echo 🔥 Starting Backend API...
start "Backend API" cmd /k "cd backend && npm run dev"

timeout /t 3 >nul

echo 🔥 Starting Frontend UI...
start "Frontend UI" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo ✅ ALL SERVICES STARTED!
echo ========================================
echo.
echo 🌐 Your Waste Detection System is starting...
echo.
echo 📍 URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:4000  
echo    ML Feed:  http://localhost:5001/video_feed
echo.
echo 💡 The frontend will automatically open in your browser
echo    when ready (usually takes 10-15 seconds)
echo.
echo ⚠️ IMPORTANT: Keep all 3 service windows open!
echo    Close this window only when you're done.
echo.
echo Press any key to exit this launcher...
pause >nul