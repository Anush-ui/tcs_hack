from typing import Dict, Any, List


def generate_explainable_summary(
    channel: str,
    risk_score: int,
    classification: str,
    indicators: List[Dict[str, Any]],
    ml_details: Dict[str, Any] = None
) -> str:
    """
    Generates a concise, transparent executive explanation for the detection result.
    """
    if classification == "SAFE":
        return f"Scan completed across {channel.upper()} channel. No critical phishing markers or brand spoofing indicators were identified (Risk Score: {risk_score}/100)."

    high_sev = [i["title"] for i in indicators if i.get("severity") == "HIGH"]
    med_sev = [i["title"] for i in indicators if i.get("severity") == "MEDIUM"]

    key_reasons = high_sev if high_sev else med_sev
    reasons_str = ", ".join(key_reasons[:3]) if key_reasons else "Multiple heuristic risk triggers"

    return f"Flagged as {classification} ({risk_score}/100) primarily due to: {reasons_str}."


def format_actionable_recommendations(classification: str, channel: str) -> List[str]:
    """Provides tailored banking security guidance based on risk level."""
    if classification == "PHISHING / HIGH RISK":
        return [
            "DO NOT click any links, open attachments, or dial callback numbers mentioned in the message.",
            "NEVER share your OTP, NetBanking password, ATM PIN, UPI PIN, or CVV under any circumstance.",
            "Legitimate banks will NEVER threaten account deactivation via SMS or WhatsApp links.",
            "Report this incident immediately to the National Cyber Crime Helpline (1930) or cybercrime.gov.in."
        ]
    elif classification == "SUSPICIOUS":
        return [
            "Verify the sender identity independently by opening your official banking app directly.",
            "Do not use links provided in this message to access your account.",
            "If in doubt, call the official customer care number printed on the back of your debit/credit card."
        ]
    else:
        return [
            "The content aligns with normal notification patterns. Always keep your banking passwords confidential."
        ]
