@echo off
title BIS Assistant Server
echo ============================================
echo   Bureau of Indian Standards - BIS Assistant
echo ============================================
echo.
echo Starting server...
echo.

cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found!
    echo Run:  python -m venv venv
    echo Then: venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

echo Opening browser in 3 seconds...
start "" cmd /c "timeout /t 3 /noq >nul & start http://localhost:8000"

echo Server running at: http://localhost:8000
echo Press Ctrl+C to stop.
echo.

venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000

pause
