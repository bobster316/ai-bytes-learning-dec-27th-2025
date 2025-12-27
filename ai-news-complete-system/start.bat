@echo off
REM AI News Widget - Quick Start Script for Windows
REM This script sets up everything you need in one command

echo.
echo AI News Widget - Quick Start
echo ================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.7 or higher.
    pause
    exit /b 1
)

echo Python found
echo.

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo Dependencies installed successfully
echo.

REM Start the backend server
echo Starting AI News Backend Server...
echo.
echo Backend will run on: http://localhost:5000
echo API endpoint: http://localhost:5000/api/ai-news
echo.
echo To test the frontend:
echo 1. Open index.html in your browser
echo 2. Or integrate into your website using the files provided
echo.
echo Press Ctrl+C to stop the server
echo.
echo ================================
echo.

python ai_news_backend.py

pause
