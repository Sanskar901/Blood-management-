@echo off
cd /d "%~dp0frontend"
echo Starting BloodConnect Frontend on http://localhost:5173 ...
npm run dev
pause
