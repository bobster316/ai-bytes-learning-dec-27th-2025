#!/bin/bash

# AI News Widget - Quick Start Script
# This script sets up everything you need in one command

echo "🤖 AI News Widget - Quick Start"
echo "================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is not installed. Please install Python 3.7 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Check if pip is installed
if ! command -v pip3 &> /dev/null
then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

echo "✅ pip3 found"
echo ""

# Install dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Start the backend server
echo "🚀 Starting AI News Backend Server..."
echo ""
echo "Backend will run on: http://localhost:5000"
echo "API endpoint: http://localhost:5000/api/ai-news"
echo ""
echo "To test the frontend:"
echo "1. Open index.html in your browser"
echo "2. Or integrate into your website using the files provided"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "================================"
echo ""

python3 ai_news_backend.py
