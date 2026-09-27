import os
import json
import re
from typing import Dict, Any, Optional

REPUTATION_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "phone_reputation_demo.json")

# Strict Indian National Numbering Plan (DoT / TRAI) Regex Patterns
# Mobile: 10 digits starting with 6, 7, 8, or 9 with optional +91, 91, or 0 prefix
INDIAN_MOBILE_REGEX = re.compile(r'^(?:\+91|91|0)?([6-9]\d{9})$')

# Toll-Free: 1800 followed by 6 or 7 digits
INDIAN_TOLLFREE_REGEX = re.compile(r'^(?:\+91|91|0)?(1800\d{6,7})$')

# Landline: Major Indian STD codes (011 Delhi, 022 Mumbai, 080 Bangalore, 040 Hyderabad, 044 Chennai, 033 Kolkata, 020 Pune, 079 Ahmedabad)
INDIAN_LANDLINE_REGEX = re.compile(r'^(?:\+91|91|0)?((?:11|20|22|33|40|44|79|80)\d{8})$')


def load_reputation_db() -> Dict[str, Any]:
    if os.path.exists(REPUTATION_DB_PATH):
        try:
            with open(REPUTATION_DB_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading phone reputation DB: {e}")
    return {"records": {}}


def get_indian_carrier_hint(digits10: str) -> str:
    """Provides telecom carrier/series context based on TRAI DoT allocation series."""
    if not digits10 or len(digits10) < 2:
        return "Indian Mobile Cellular"
    prefix2 = digits10[:2]
    if prefix2 in ["98", "97", "99", "90", "91"]:
        return "GSM Cellular Series (Airtel, Vi, BSNL, Jio)"
    elif prefix2 in ["70", "72", "73", "74", "75", "76", "77", "78", "79"]:
        return "4G/VoLTE Cellular Series (Jio, Airtel, Vi)"
    elif prefix2 in ["80", "81", "82", "83", "84", "85", "86", "87", "88", "89"]:
        return "Cellular Series (Airtel, Vi, Jio, BSNL)"
    elif prefix2 in ["62", "63", "60"]:
        return "NextGen 5G/4G Series (Jio / Airtel)"
    return "Indian Mobile Cellular"


def analyze_phone(phone_input: str, default_country: str = "IN") -> Dict[str, Any]:
    """
    Validates and analyzes phone numbers specifically using Indian National Numbering Plan regex.
    Checks against local crowd-sourced fraud reputation database.
    """
    raw_str = (phone_input or "").strip()
    indicators = []
    risk_score = 0

    if not raw_str:
        return {
            "phone_number": "",
            "risk_score": 0,
            "classification": "SAFE",
            "confidence": 0.5,
            "valid": False,
            "country": "Unknown",
            "region": "Unknown",
            "reputation": "NO_DATA",
            "indicators": [],
            "recommendations": ["Please provide a valid Indian phone number (e.g. +91 9876543210)."]
        }

    # Normalize phone string by removing spaces, hyphens, dots, brackets
    clean_number = re.sub(r'[\s\-\(\)\.\,]', '', raw_str)

    is_valid = False
    country_name = "India (+91)"
    region = "Unknown"
    carrier_name = "Unknown"
    formatted_number = raw_str
    canonical_number = clean_number
    number_type = "Unknown"

    # 1. Regex Validation for Indian Numbers
    mobile_match = INDIAN_MOBILE_REGEX.match(clean_number)
    tollfree_match = INDIAN_TOLLFREE_REGEX.match(clean_number)
    landline_match = INDIAN_LANDLINE_REGEX.match(clean_number)

    if mobile_match:
        digits = mobile_match.group(1)
        # Check for fake/repeating digits like 0000000000, 9999999999
        if len(set(digits)) <= 1:
            is_valid = False
            number_type = "Dummy / Repeating Digits"
        else:
            canonical_number = f"+91{digits}"
            formatted_number = f"+91 {digits[:5]} {digits[5:]}"
            is_valid = True
            country_name = "India (+91)"
            region = "National Mobile (TRAI / DoT)"
            carrier_name = get_indian_carrier_hint(digits)
            number_type = "Indian Mobile (10-Digit Cellular Series)"
    elif tollfree_match:
        digits = tollfree_match.group(1)
        canonical_number = digits
        formatted_number = f"1800 {digits[4:7]} {digits[7:]}" if len(digits) >= 8 else digits
        is_valid = True
        country_name = "India (+91)"
        region = "Toll-Free (All India)"
        carrier_name = "Enterprise Toll-Free Service"
        number_type = "Indian Toll-Free Line"
    elif landline_match:
        digits = landline_match.group(1)
        canonical_number = f"+91{digits}"
        formatted_number = f"+91 {digits[:3]} {digits[3:]}"
        is_valid = True
        country_name = "India (+91)"
        region = "Fixed Line / Landline (India)"
        carrier_name = "BSNL / MTNL / Airtel Fixed Line"
        number_type = "Indian Landline / STD Series"
    else:
        # Invalid or Non-Indian Number
        is_valid = False
        if clean_number.startswith("+") and not clean_number.startswith("+91"):
            # International number
            country_name = "Non-Indian / Foreign Origin"
            region = "International Telecom"
            carrier_name = "Unverified Overseas / VoIP Carrier"
            number_type = "Non-Indian International Line"
            risk_score += 65
            indicators.append({
                "title": "Non-Indian / Foreign Phone Number Detected",
                "severity": "HIGH",
                "category": "Origin Risk",
                "description": "The number does NOT conform to the Indian National Numbering Plan (+91). Indian banks exclusively communicate via registered Indian shortcodes (+91); foreign numbers are a prominent indicator of international vishing scams.",
                "evidence": raw_str
            })
        else:
            # Malformed Indian number
            country_name = "Invalid"
            region = "Unrecognized"
            carrier_name = "Unknown"
            number_type = "Malformed Phone Number"
            risk_score += 50
            indicators.append({
                "title": "Invalid Indian Phone Number Format (Regex Failed)",
                "severity": "MEDIUM",
                "category": "Number Validation",
                "description": "Does not match valid 10-digit Indian telecommunication format (^(\\+91|91|0)?[6-9]\\d{9}$). Valid Indian numbers must contain 10 digits starting with 6, 7, 8, or 9.",
                "evidence": raw_str
            })

    # 2. Check Threat Reputation Database
    rep_db = load_reputation_db()
    records = rep_db.get("records", {})

    # Check multiple lookup variations
    rep_match = (
        records.get(canonical_number) or
        records.get(clean_number) or
        records.get(raw_str) or
        (records.get(f"+91{clean_number}") if not clean_number.startswith("+") else None)
    )

    reputation_status = "CLEAN / NO REPORTS"
    report_count = 0
    simulated_tags = []

    if rep_match:
        reputation_status = rep_match.get("reputation", "HIGH_RISK")
        rep_risk = rep_match.get("risk_score", 75)
        report_count = rep_match.get("report_count", 0)
        category = rep_match.get("category", "Unsolicited Fraud Call")
        simulated_tags = rep_match.get("tags", [])

        risk_score = max(risk_score, rep_risk)

        indicators.append({
            "title": f"Threat Radar Flag: {category} (Demo Intelligence)",
            "severity": "HIGH" if rep_risk >= 70 else "MEDIUM",
            "category": "Threat Intelligence",
            "description": f"[DEMO REPUTATION] Phone number flagged in local threat database with {report_count} user fraud complaints. Associated tags: {', '.join(simulated_tags)}.",
            "evidence": f"{report_count} complaints | Category: {category}"
        })
    elif is_valid:
        # Valid Indian number with clean reputation
        risk_score = 10
        indicators.append({
            "title": f"Valid Indian Telecom Number ({formatted_number})",
            "severity": "INFO",
            "category": "DoT / TRAI Compliance",
            "description": f"Verified valid structure conforming to Indian National Numbering Plan ({number_type}). Carrier Series: {carrier_name}.",
            "evidence": formatted_number
        })

    final_score = min(100, max(0, risk_score))

    if final_score >= 60:
        classification = "PHISHING / HIGH RISK"
        recommendations = [
            "Do NOT entertain calls, WhatsApp messages, or OTP requests from this number.",
            "Never disclose your ATM PIN, UPI PIN, OTP, or NetBanking password to anyone over phone.",
            "Block this contact and report incident to National Cyber Crime Portal (1930 / cybercrime.gov.in)."
        ]
    elif final_score >= 30:
        classification = "SUSPICIOUS"
        recommendations = [
            "Verify caller identity before accepting any financial or KYC update requests.",
            "Contact your bank directly via the official toll-free number printed behind your debit card."
        ]
    else:
        classification = "SAFE"
        recommendations = [
            "Validated Indian phone number with no active fraud reports in local threat database.",
            "Maintain standard security vigilance: banks never call customers demanding OTPs or passwords."
        ]

    confidence = 0.95 if rep_match else (0.92 if is_valid else 0.85)

    return {
        "phone_number": canonical_number if is_valid else raw_str,
        "formatted_number": formatted_number,
        "raw_input": raw_str,
        "valid": is_valid,
        "country": country_name,
        "region": region,
        "carrier": carrier_name,
        "number_type": number_type,
        "reputation": reputation_status,
        "report_count": report_count,
        "simulated_tags": simulated_tags,
        "risk_score": final_score,
        "classification": classification,
        "confidence": confidence,
        "indicators": indicators,
        "recommendations": recommendations,
        "is_simulated_data": bool(rep_match)
    }

