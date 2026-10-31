@echo off
cd /d "%~dp0"
echo Starting BloodConnect Backend on http://127.0.0.1:8000 ...
python run_backend.py
pause
