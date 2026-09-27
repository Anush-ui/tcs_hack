import os
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models.schemas import (
    EmailAnalysisRequest,
    MessageAnalysisRequest,
    UrlAnalysisRequest,
    PhoneAnalysisRequest,
    UnifiedAnalysisRequest,
    GenericAnalysisRequest,
    AnalysisResponse,
    StatsResponse
)
from .database import init_db, save_scan_record, get_scan_history, get_scan_stats
from .ml.model import get_model
from .services.risk_engine import risk_engine
from .services.threat_intelligence import load_threat_intel_feed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and model
    print("[*] Starting BankShield AI Backend...")
    init_db()
    get_model()
    print("[OK] BankShield AI Detection Engine is ONLINE.")
    yield
    print("[*] Shutting down BankShield AI Backend.")


app = FastAPI(
    title="BankShield AI - Fraud & Phishing Detection Engine",
    description="Multi-Channel AI-Powered Banking Cybersecurity & Smishing/Phishing Detection API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "BankShield AI Multi-Channel Phishing & Fraud Detection",
        "version": "1.0.0",
        "supported_channels": ["email", "sms", "whatsapp", "url", "phone", "unified"],
        "docs_url": "/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "engine_status": "ONLINE",
        "database": "connected",
        "ml_model": "loaded"
    }


@app.post("/api/analyze/email", response_model=AnalysisResponse)
async def analyze_email_endpoint(payload: EmailAnalysisRequest):
    try:
        data = {
            "sender_email": payload.sender_email,
            "subject": payload.subject,
            "body": payload.body
        }
        res = risk_engine.process_channel_request("email", data)
        save_scan_record({
            "id": res["id"],
            "timestamp": res["timestamp"],
            "channel": "email",
            "risk_score": res["risk_score"],
            "classification": res["classification"],
            "confidence": res["confidence"],
            "summary": res["summary"],
            "indicators": res["indicators"],
            "recommendations": res["recommendations"],
            "raw_input": data,
            "breakdown": res.get("breakdown", {})
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email analysis error: {str(e)}")


@app.post("/api/analyze/sms", response_model=AnalysisResponse)
async def analyze_sms_endpoint(payload: MessageAnalysisRequest):
    try:
        data = {
            "sender": payload.sender,
            "message": payload.message
        }
        res = risk_engine.process_channel_request("sms", data)
        save_scan_record({
            "id": res["id"],
            "timestamp": res["timestamp"],
            "channel": "sms",
            "risk_score": res["risk_score"],
            "classification": res["classification"],
            "confidence": res["confidence"],
            "summary": res["summary"],
            "indicators": res["indicators"],
            "recommendations": res["recommendations"],
            "raw_input": data,
            "breakdown": res.get("breakdown", {})
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SMS analysis error: {str(e)}")


@app.post("/api/analyze/whatsapp", response_model=AnalysisResponse)
async def analyze_whatsapp_endpoint(payload: MessageAnalysisRequest):
    try:
        data = {
            "sender": payload.sender,
            "message": payload.message
        }
        res = risk_engine.process_channel_request("whatsapp", data)
        save_scan_record({
            "id": res["id"],
            "timestamp": res["timestamp"],
            "channel": "whatsapp",
            "risk_score": res["risk_score"],
            "classification": res["classification"],
            "confidence": res["confidence"],
            "summary": res["summary"],
            "indicators": res["indicators"],
            "recommendations": res["recommendations"],
            "raw_input": data,
            "breakdown": res.get("breakdown", {})
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WhatsApp analysis error: {str(e)}")


@app.post("/api/analyze/url", response_model=AnalysisResponse)
async def analyze_url_endpoint(payload: UrlAnalysisRequest):
    try:
        data = {"url": payload.url}
        res = risk_engine.process_channel_request("url", data)
        save_scan_record({
            "id": res["id"],
            "timestamp": res["timestamp"],
            "channel": "url",
            "risk_score": res["risk_score"],
            "classification": res["classification"],
            "confidence": res["confidence"],
            "summary": res["summary"],
            "indicators": res["indicators"],
            "recommendations": res["recommendations"],
            "raw_input": data,
            "breakdown": res.get("breakdown", {})
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL analysis error: {str(e)}")


@app.post("/api/analyze/phone", response_model=AnalysisResponse)
async def analyze_phone_endpoint(payload: PhoneAnalysisRequest):
    try:
        data = {
            "phone_number": payload.phone_number,
            "country_code": payload.country_code
        }
        res = risk_engine.process_channel_request("phone", data)
        save_scan_record({
            "id": res["id"],
            "timestamp": res["timestamp"],
            "channel": "phone",
            "risk_score": res["risk_score"],
            "classification": res["classification"],
            "confidence": res["confidence"],
            "summary": res["summary"],
            "indicators": res["indicators"],
            "recommendations": res["recommendations"],
            "raw_input": data,
            "breakdown": res.get("breakdown", {})
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Phone analysis error: {str(e)}")


@app.post("/api/analyze/unified", response_model=AnalysisResponse)
async def analyze_unified_endpoint(payload: UnifiedAnalysisRequest):
    try:
        data = payload.model_dump()
        res = risk_engine.process_unified(data)
        res["id"] = f"scan-uni-{os.urandom(4).hex()}"
        res["timestamp"] = __import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        res["channel"] = "unified"

        save_scan_record({
            "id": res["id"],
            "timestamp": res["timestamp"],
            "channel": "unified",
            "risk_score": res["risk_score"],
            "classification": res["classification"],
            "confidence": res["confidence"],
            "summary": res["summary"],
            "indicators": res["indicators"],
            "recommendations": res["recommendations"],
            "raw_input": data,
            "breakdown": res.get("breakdown", {})
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unified analysis error: {str(e)}")


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_generic_endpoint(payload: GenericAnalysisRequest):
    try:
        res = risk_engine.process_channel_request(payload.channel, payload.data)
        save_scan_record({
            "id": res["id"],
            "timestamp": res["timestamp"],
            "channel": payload.channel,
            "risk_score": res["risk_score"],
            "classification": res["classification"],
            "confidence": res["confidence"],
            "summary": res["summary"],
            "indicators": res["indicators"],
            "recommendations": res["recommendations"],
            "raw_input": payload.data,
            "breakdown": res.get("breakdown", {})
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generic analysis error: {str(e)}")


@app.get("/api/history")
async def history_endpoint(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    return get_scan_history(limit=limit, offset=offset)


@app.get("/api/stats", response_model=StatsResponse)
async def stats_endpoint():
    return get_scan_stats()


@app.get("/api/threat-intel")
async def threat_intel_endpoint():
    return load_threat_intel_feed()
