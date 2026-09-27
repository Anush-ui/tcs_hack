import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure workspace root and backend directory are in sys.path regardless of CWD
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for p in [REPO_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.main import app
from backend.database import init_db
from backend.services.url_detector import analyze_url
from backend.services.message_detector import analyze_message
from backend.services.email_detector import analyze_email
from backend.services.phone_detector import analyze_phone
from backend.services.risk_engine import risk_engine

# Initialize DB for testing
init_db()
client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["engine_status"] == "ONLINE"


def test_legitimate_url():
    res = analyze_url("https://www.onlinesbi.sbi/login")
    assert res["risk_score"] < 30
    assert res["classification"] == "SAFE"
    assert any("Verified Banking Domain" in ind["title"] for ind in res["indicators"])


def test_phishing_url_lookalike():
    res = analyze_url("http://sbi-kyc-verification.xyz/login.php")
    assert res["risk_score"] >= 60
    assert res["classification"] == "PHISHING / HIGH RISK"
    assert any("Banking Domain Mismatch" in ind["title"] for ind in res["indicators"])
    assert any("High-Risk TLD" in ind["title"] for ind in res["indicators"])


def test_suspicious_url_ip_address():
    res = analyze_url("http://192.168.1.100/axis-login/auth.html")
    assert res["risk_score"] >= 45
    assert any("Direct IP Address Host" in ind["title"] for ind in res["indicators"])


def test_legitimate_sms_otp_alert():
    # Legitimate informational OTP alert containing "do not share" warning
    msg = "ICICI Bank Alert: Your OTP for transaction of INR 3,250.00 is 839201. Valid for 5 mins. Do NOT share OTP with anyone."
    res = analyze_message(msg, sender="AX-ICICIB", channel="sms")
    assert res["risk_score"] < 30
    assert res["classification"] == "SAFE"


def test_phishing_sms_fake_kyc():
    msg = "URGENT: Your HDFC Bank account will be suspended in 24 hours. Complete your PAN KYC immediately at http://hdfc-kyc-verify.xyz"
    res = analyze_message(msg, sender="+919876543210", channel="sms")
    assert res["risk_score"] >= 60
    assert res["classification"] == "PHISHING / HIGH RISK"
    assert any("Blockage" in ind["title"] or "Urgency" in ind["title"] or "KYC" in ind["title"] for ind in res["indicators"])
    assert len(res["extracted_urls"]) >= 1


def test_otp_theft_solicitation():
    msg = "Security Alert: ICICI Bank detected unauthorized login. Verify your identity now by sharing your 6-digit OTP with this representative."
    res = analyze_message(msg, sender="+918800112233", channel="sms")
    assert res["risk_score"] >= 60
    assert any("Direct OTP" in ind["title"] or "Credential" in ind["title"] for ind in res["indicators"])


def test_whatsapp_phishing_apk_malware():
    msg = "Dear Customer, Your Kotak Bank 811 account is blocked due to non-verification. Download official verification APK http://192.168.1.100/kotak.apk"
    res = analyze_message(msg, sender="+919988776655", channel="whatsapp")
    assert res["risk_score"] >= 60
    assert res["classification"] == "PHISHING / HIGH RISK"
    assert any("APK" in ind["title"] or "Tool" in ind["title"] for ind in res["indicators"])


def test_phone_valid_and_demo_reputation():
    # Demo high-risk number
    res = analyze_phone("+919876543210")
    assert res["valid"] is True
    assert res["risk_score"] >= 60
    assert res["reputation"] == "HIGH_RISK"
    assert res["is_simulated_data"] is True


def test_phone_clean_indian_numbers():
    # Clean arbitrary Indian numbers across series 6, 7, 8, 9 with various prefixes
    for num in ["9845123456", "+91 98451 23456", "07890123456", "6301234567", "918899001122"]:
        res = analyze_phone(num)
        assert res["valid"] is True, f"Failed for {num}"
        assert res["classification"] == "SAFE"
        assert res["risk_score"] < 30
        assert "India" in res["country"]


def test_phone_international_foreign_number():
    # Non-Indian US/UK number
    res = analyze_phone("+1 415 555 2671")
    assert res["valid"] is False
    assert res["risk_score"] >= 60
    assert any("Non-Indian" in ind["title"] or "Foreign" in ind["title"] for ind in res["indicators"])


def test_phone_invalid_format():
    # Malformed inputs
    for bad in ["12345", "5551234567", "0000000000", "abcdef"]:
        res = analyze_phone(bad)
        assert res["valid"] is False
        assert any("Invalid" in ind["title"] or "Regex Failed" in ind["title"] for ind in res["indicators"])



def test_legitimate_email():
    res = analyze_email(
        sender_email="alerts@hdfcbank.com",
        subject="Your Monthly Account Statement - July 2026",
        body="Dear Customer, Your monthly e-statement has been generated and is attached. Thank you for banking with HDFC Bank."
    )
    assert res["risk_score"] < 30
    assert res["classification"] == "SAFE"


def test_phishing_email_free_domain_spoof():
    res = analyze_email(
        sender_email="SBI Customer Support <sbi-security-desk@gmail.com>",
        subject="CRITICAL: Your account is suspended. Update KYC now",
        body="Your SBI NetBanking password has expired. Click here immediately to update http://sbi-secure-login.top/auth to avoid penalty."
    )
    assert res["risk_score"] >= 60
    assert res["classification"] == "PHISHING / HIGH RISK"
    assert any("Free Public Email" in ind["title"] for ind in res["indicators"])


def test_api_unified_endpoint():
    payload = {
        "channel": "whatsapp",
        "sender": "+919876543210",
        "message": "URGENT: Your SBI account will be blocked today. Update KYC at http://sbi-kyc-verification.xyz"
    }
    response = client.post("/api/analyze/unified", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] >= 60
    assert data["classification"] == "PHISHING / HIGH RISK"
    assert "breakdown" in data
    assert len(data["indicators"]) > 0


def test_api_history_and_stats():
    history_res = client.get("/api/history")
    assert history_res.status_code == 200
    history_data = history_res.json()
    assert len(history_data) >= 1

    stats_res = client.get("/api/stats")
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert stats_data["total_scans"] >= 1


def test_url_at_symbol_obfuscation():
    res = analyze_url("http://sbi.co.in@evil-phishing-host.xyz/login")
    assert res["risk_score"] >= 60
    assert any("Misleading '@' Symbol" in ind["title"] for ind in res["indicators"])


def test_url_shortener_detection():
    res = analyze_url("https://bit.ly/sbi-urgent-update")
    assert any("URL Shortener Detected" in ind["title"] for ind in res["indicators"])


def test_sms_reward_points_lure():
    msg = "Dear Union Bank user, your 9,850 reward points worth Rs 4,925 are expiring today. Redeem cash directly at http://union-rewards.buzz/redeem"
    res = analyze_message(msg, sender="+919123456789", channel="sms")
    assert res["risk_score"] >= 60
    assert any("Reward" in ind["title"] or "Financial" in ind["title"] or "Urgency" in ind["title"] for ind in res["indicators"])


def test_threat_intel_endpoint():
    res = client.get("/api/threat-intel")
    assert res.status_code == 200
    data = res.json()
    assert "feeds" in data
    assert len(data["feeds"]) >= 1


def test_generic_analyze_endpoint():
    payload = {
        "channel": "sms",
        "data": {
            "sender": "+919876543210",
            "message": "Electricity bill unpaid. Power will be disconnected tonight. Call officer at 9876543210 or pay at http://bill-pay.xyz"
        }
    }
    res = client.post("/api/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["risk_score"] >= 60
    assert data["classification"] == "PHISHING / HIGH RISK"

