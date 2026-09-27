import re
from typing import Dict, Any, List, Optional
from .url_detector import extract_urls_from_text, analyze_url
from ..ml.model import predict_text

# High-risk urgency and coercion phrases
URGENCY_PATTERNS = [
    (r"(?:account|card|access|netbanking).*(?:blocked|suspended|deactivated|frozen|terminated|closed|locked)", "Threat of Account Blockage / Suspension", "HIGH"),
    (r"(?:immediate|urgently|within\s+(?:24|12|2)\s*hours|today|before\s+midnight)", "Extreme Time-Pressure Urgency Tactic", "HIGH"),
    (r"(?:update|complete|verify|link)\s*(?:your\s*)?(?:pan|kyc|aadhaar|profile)", "Fake KYC / Identity Update Demand", "HIGH"),
    (r"(?:electricity|power)\s*(?:cut|disconnected|stopped)\s*tonight", "Utility Disconnection Coercion", "HIGH"),
    (r"section\s*\d+[a-z]?|rbi\s*mandate|legal\s*action|police\s*notice", "Fake Legal / Regulatory Authority Intimidation", "HIGH")
]

# Reward / Lottery / Scam patterns
REWARD_PATTERNS = [
    (r"(?:won|winner|congratulations|lottery|prize|claim\s*reward|cashback\s*of\s*rs|free\s*gift|earn\s*\d+\s*(?:daily|per\s*day))", "Lotto / Unrealistic Reward / Part-Time Job Scam Hook", "HIGH"),
    (r"(?:rate\s*hotels|youtube\s*like|telegram\s*task|crypto\s*investment)", "Task / Telegram Investment Fraud Pattern", "HIGH")
]

# Banking keywords for brand recognition
BANK_KEYWORDS = [
    "sbi", "state bank", "hdfc", "icici", "axis", "kotak", "baroda",
    "pnb", "punjab national", "canara", "union bank", "yono", "imobile",
    "netbanking", "rbi", "income tax", "paytm", "phonepe", "gpay", "bhim upi"
]


def check_otp_solicitation(text_lower: str) -> tuple[bool, Optional[str]]:
    """
    Carefully distinguishes malicious OTP solicitation ('share your OTP to verify')
    from legitimate security warnings ('Do NOT share OTP with anyone').
    """
    # If text contains "do not share", "never share", "don't share", it's legitimate advice
    is_warning = bool(re.search(r"(?:do\s*not|never|don'?t|should\s*not|cannot)\s*(?:ever\s*)?(?:share|disclose|reveal|provide|send|tell)\s*(?:your\s*)?(?:otp|pin|password|cvv)", text_lower))

    # Match malicious solicitation like "share your OTP with this executive", "sharing your 6-digit OTP"
    solicit_match = re.search(r"(?:please\s+|kindly\s+|by\s+|to\s+)?\b(?:share|sharing|send|sending|provide|providing|tell|telling|give|giving|forward|forwarding|enter|entering|disclose|disclosing)\s+(?:your\s+)?(?:6\s*[-]?\s*digit\s+)?(?:otp|one\s*time\s*password|pin|cvv|netbanking\s*password)", text_lower)


    if solicit_match and not is_warning:
        return True, solicit_match.group(0)

    # Check for direct APK or remote screen share tool download request
    apk_match = re.search(r"(?:download|install)\s+(?:official\s+)?(?:verification\s+)?(?:apk|app|quicksupport|anydesk|teamviewer)", text_lower)
    if apk_match:
        return True, apk_match.group(0)

    return False, None


def analyze_message(message_text: str, sender: Optional[str] = None, channel: str = "sms") -> Dict[str, Any]:
    """
    Core analysis engine for SMS and WhatsApp messages.
    Fuses ML prediction, rule-based indicators, URL extraction/analysis, and sender profiling.
    """
    raw_text = (message_text or "").strip()
    sender_str = (sender or "").strip()

    indicators = []
    rule_score = 0
    raw_lower = raw_text.lower()

    # 1. ML Model Prediction
    ml_result = predict_text(raw_text)
    ml_score = ml_result["ml_score"]

    if ml_score >= 70 and ml_result["top_features"]:
        top_terms = [item["term"] for item in ml_result["top_features"]]
        indicators.append({
            "title": "AI Model Detected Phishing Language Patterns",
            "severity": "HIGH",
            "category": "Machine Learning NLP",
            "description": f"Natural language processing identified linguistic structures highly characteristic of financial fraud (Confidence: {int(ml_result['confidence']*100)}%).",
            "evidence": f"Key phrases: {', '.join(top_terms)}"
        })
    elif ml_score >= 50 and ml_result["top_features"]:
        top_terms = [item["term"] for item in ml_result["top_features"]]
        indicators.append({
            "title": "AI Model Flagged Suspicious Vocabulary",
            "severity": "MEDIUM",
            "category": "Machine Learning NLP",
            "description": "Text contains phrasing moderately correlated with promotional or unsolicited banking notices.",
            "evidence": f"Key phrases: {', '.join(top_terms)}"
        })

    # 2. Urgency & Coercion Rule Checks
    for pattern, title, severity in URGENCY_PATTERNS:
        match = re.search(pattern, raw_lower)
        if match:
            rule_score += 30
            indicators.append({
                "title": title,
                "severity": severity,
                "category": "Social Engineering",
                "description": "Scammers exploit false urgency and threats to bypass logical verification.",
                "evidence": match.group(0)
            })
            break

    # 3. Credential & OTP Harvesting Rule Checks
    is_soliciting, matched_evidence = check_otp_solicitation(raw_lower)
    if is_soliciting:
        rule_score += 45
        if ".apk" in raw_lower or "app" in raw_lower or "download" in raw_lower:
            indicators.append({
                "title": "Malicious APK / Remote Tool Solicitation",
                "severity": "HIGH",
                "category": "Credential Theft",
                "description": "Legitimate banks NEVER ask customers to download standalone APKs or screen-sharing tools.",
                "evidence": matched_evidence
            })
        else:
            indicators.append({
                "title": "Direct OTP / PIN / Credential Solicitation",
                "severity": "HIGH",
                "category": "Credential Theft",
                "description": "Legitimate banks NEVER ask customers to disclose OTPs, PINs, or passwords over text or phone.",
                "evidence": matched_evidence
            })

    # Check for benign transactional security warning
    is_benign_otp = bool(re.search(r"(?:do\s*not|never|don'?t)\s*share\s*otp", raw_lower)) or "valid for" in raw_lower
    if is_benign_otp and not is_soliciting:
        indicators.append({
            "title": "Legitimate Transactional Alert Characteristics",
            "severity": "INFO",
            "category": "Benign Pattern",
            "description": "Standard banking security notification containing mandatory 'Do Not Share' warning.",
            "evidence": "Contains 'Do Not Share' safety clause"
        })
        # Strongly suppress false positives for genuine transactional notifications
        rule_score = max(0, rule_score - 40)
        ml_score = min(ml_score, 15)

    # 4. Reward / Lottery Scams
    for pattern, title, severity in REWARD_PATTERNS:
        match = re.search(pattern, raw_lower)
        if match:
            rule_score += 35
            indicators.append({
                "title": title,
                "severity": severity,
                "category": "Financial Fraud",
                "description": "Promise of unrealistic monetary gain or prize used as a lure to steal banking credentials.",
                "evidence": match.group(0)
            })
            break

    # 5. Sender Profiling
    sender_score = 0
    found_banks = [bank for bank in BANK_KEYWORDS if bank in raw_lower]
    has_bank_mention = len(found_banks) > 0

    if sender_str:
        if has_bank_mention and (sender_str.startswith("+") or sender_str.isdigit()):
            sender_score += 25
            indicators.append({
                "title": "Unverified Personal Number Impersonating Bank",
                "severity": "HIGH",
                "category": "Sender Verification",
                "description": f"Message claims to represent a bank ({', '.join(found_banks[:2])}) but originated from personal number '{sender_str}'.",
                "evidence": f"Sender: {sender_str}"
            })
        elif re.match(r'^[A-Z]{2}-[A-Z0-9]{5,6}$', sender_str, re.IGNORECASE):
            indicators.append({
                "title": "Authorized Telecom Header Format",
                "severity": "INFO",
                "category": "Sender Verification",
                "description": f"Sender ID '{sender_str}' matches official enterprise DLT telecom header format.",
                "evidence": sender_str
            })

    # 6. URL Extraction and Deep Lexical Inspection
    extracted_raw_urls = extract_urls_from_text(raw_text)
    url_results = []
    max_url_score = 0

    for u in extracted_raw_urls:
        u_analysis = analyze_url(u)
        url_results.append(u_analysis)
        if u_analysis["risk_score"] > max_url_score:
            max_url_score = u_analysis["risk_score"]

        for ind in u_analysis.get("indicators", []):
            if ind["severity"] in ["HIGH", "MEDIUM"]:
                indicators.append({
                    "title": f"URL Threat: {ind['title']}",
                    "severity": ind["severity"],
                    "category": f"URL - {ind['category']}",
                    "description": ind["description"],
                    "evidence": ind.get("evidence")
                })

    # 7. Multi-factor Fusion
    if extracted_raw_urls:
        weighted_score = (ml_score * 0.30) + (min(100, rule_score + sender_score) * 0.40) + (max_url_score * 0.30)
    else:
        weighted_score = (ml_score * 0.45) + (min(100, rule_score + sender_score) * 0.55)

    # Only enforce high floor if not benign OTP and high severity threat confirmed
    has_high_threat = any(ind["severity"] == "HIGH" for ind in indicators)
    if has_high_threat and not is_benign_otp:
        weighted_score = max(weighted_score, 70)

    final_score = int(min(100, max(0, round(weighted_score))))

    # Classification
    if final_score >= 60:
        classification = "PHISHING / HIGH RISK"
        recommendations = [
            "DO NOT click any links, download files, or respond to this message.",
            "NEVER disclose your OTP, ATM PIN, UPI PIN, or NetBanking password to anyone.",
            "Contact your bank only through its official mobile app or verified numbers printed on your card."
        ]
    elif final_score >= 30:
        classification = "SUSPICIOUS"
        recommendations = [
            "Verify the authenticity of this alert directly with your branch before taking any action.",
            "Do not call phone numbers or visit URLs provided inside the message body."
        ]
    else:
        classification = "SAFE"
        recommendations = [
            "No active phishing patterns detected. Maintain standard digital hygiene."
        ]

    confidence = round(float(ml_result.get("confidence", 0.88)), 2)

    return {
        "channel": channel,
        "risk_score": final_score,
        "classification": classification,
        "confidence": confidence,
        "summary": f"{classification} detected on {channel.upper()} channel with {final_score}/100 threat rating.",
        "indicators": indicators,
        "recommendations": recommendations,
        "extracted_urls": url_results,
        "breakdown": {
            "ml_score": ml_score,
            "rule_score": min(100, rule_score),
            "sender_score": sender_score,
            "url_score": max_url_score
        },
        "ml_details": ml_result
    }
