@echo off
echo ===================================================
echo Starting BankShield AI Backend API (FastAPI)...
echo ===================================================
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause

