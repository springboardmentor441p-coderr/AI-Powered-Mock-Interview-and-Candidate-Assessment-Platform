@echo off
title SmartHire AI - Launching Platform
echo ========================================================
echo Starting SmartHire AI Backend & Frontend Servers...
echo ========================================================

:: 1. Start Backend in background
start "SmartHire AI - Backend" cmd /k "cd /d C:\Users\lenovea\.gemini\antigravity\scratch\SmartHire-AI\backend && python -m uvicorn main:app --reload --port 8000"

:: 2. Start Frontend in background
start "SmartHire AI - Frontend" cmd /k "cd /d C:\Users\lenovea\.gemini\antigravity\scratch\SmartHire-AI\frontend && npm run dev"

:: 3. Wait 3 seconds for servers to start then open browser
timeout /t 3 /nobreak >nul
echo Opening SmartHire AI in Web Browser...
start http://localhost:3000

echo ========================================================
echo SmartHire AI is now running on http://localhost:3000
echo ========================================================
