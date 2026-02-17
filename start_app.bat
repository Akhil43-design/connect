@echo off
echo Starting Smart QR Shopping Website...
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not found! Please install Python first.
    pause
    exit /b
)

:: Install dependencies if needed (optional check)
:: pip install -r requirements.txt

:: Start Flask Server in a new window
start "Flask Server" cmd /k "python app.py"

:: Wait for server to start
echo Waiting for server to initialize...
timeout /t 5 /nobreak >nul

:: Open Browser
echo Opening application in browser...
start http://127.0.0.1:5000

echo.
echo Application started!
echo Press any key to close this launcher (Server will keep running)...
pause >nul
