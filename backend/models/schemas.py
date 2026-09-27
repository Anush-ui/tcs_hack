from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class EmailAnalysisRequest(BaseModel):
    sender_email: Optional[str] = Field(None, description="Sender email address or display name (e.g., 'SBI Alerts <support@sbi-online.xyz>')")
    subject: Optional[str] = Field(None, description="Email subject line")
    body: str = Field(..., min_length=1, max_length=20000, description="Full email body content")


class MessageAnalysisRequest(BaseModel):
    sender: Optional[str] = Field(None, description="Sender name or phone number (e.g., 'VK-HDFCBK' or '+919876543210')")
    message: str = Field(..., min_length=1, max_length=10000, description="SMS or WhatsApp message text")


class UrlAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=3, max_length=2048, description="URL to analyze")


class PhoneAnalysisRequest(BaseModel):
    phone_number: str = Field(..., min_length=3, max_length=30, description="Phone number to check")
    country_code: Optional[str] = Field("IN", description="Default ISO 2-letter country code (default 'IN')")


class UnifiedAnalysisRequest(BaseModel):
    channel: Optional[str] = Field("unified", description="Primary channel or 'unified'")
    sender: Optional[str] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    url: Optional[str] = None
    phone_number: Optional[str] = None


class GenericAnalysisRequest(BaseModel):
    channel: str = Field(..., description="One of: email, sms, whatsapp, url, phone, unified")
    data: Dict[str, Any] = Field(..., description="Channel specific data payload")


class IndicatorItem(BaseModel):
    title: str
    severity: str  # "HIGH", "MEDIUM", "LOW", "INFO"
    category: str  # "Urgency", "Impersonation", "Credential Harvesting", "URL Lexical", "Reputation", etc.
    description: str
    evidence: Optional[str] = None


class AnalysisResponse(BaseModel):
    id: str
    channel: str
    risk_score: int  # 0 to 100
    classification: str  # "SAFE", "SUSPICIOUS", "PHISHING / HIGH RISK"
    confidence: float  # 0.0 to 1.0
    summary: str
    indicators: List[IndicatorItem]
    recommendations: List[str]
    extracted_urls: List[Dict[str, Any]] = []
    breakdown: Dict[str, Any] = {}
    ml_details: Optional[Dict[str, Any]] = None
    phone_details: Optional[Dict[str, Any]] = None
    url_details: Optional[Dict[str, Any]] = None
    timestamp: str


class StatsResponse(BaseModel):
    total_scans: int
    high_risk_count: int
    suspicious_count: int
    safe_count: int
    channels_breakdown: Dict[str, int]
    average_risk_score: float


class ThreatIntelItem(BaseModel):
    id: str
    type: str  # "domain", "phone", "campaign", "ip"
    indicator: str
    category: str
    target_bank: Optional[str] = None
    threat_level: str  # "CRITICAL", "HIGH", "MEDIUM"
    reported_date: str
    description: str
    source: str = "Demo Intelligence Feed"
