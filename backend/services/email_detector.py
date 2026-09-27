import re
from typing import Dict, Any, List, Optional
from .url_detector import extract_urls_from_text, analyze_url, LEGITIMATE_BANKING_DOMAINS
from .message_detector import analyze_message
from ..ml.model import predict_text

FREE_EMAIL_PROVIDERS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
    "protonmail.com", "mail.com", "yandex.com", "zoho.com", "rediffmail.com"
}

EMAIL_REGEX = re.compile(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)')


def parse_sender_info(sender_raw: str):
    """Extracts display name, email address, and domain from sender string."""
    if not sender_raw:
        return "", "", ""

    # Match format like: "SBI Alerts <support@sbi-online.xyz>" or just "support@sbi.co.in"
    email_match = EMAIL_REGEX.search(sender_raw)
    email_addr = email_match.group(1).lower() if email_match else ""

    # Display name is everything before '<' or empty
    if "<" in sender_raw:
        display_name = sender_raw.split("<")[0].strip().strip('"\'')
    else:
        display_name = ""

    domain = email_addr.split("@")[1] if "@" in email_addr else ""
    return display_name, email_addr, domain


def analyze_email(
    sender_email: Optional[str] = None,
    subject: Optional[str] = None,
    body: str = ""
) -> Dict[str, Any]:
    """
    Hybrid email phishing detection engine.
    Analyzes sender headers, subject line, body semantics, and embedded hyperlinks.
    """
    sender_raw = (sender_email or "").strip()
    subject_raw = (subject or "").strip()
    body_raw = (body or "").strip()

    display_name, email_addr, sender_domain = parse_sender_info(sender_raw)

    indicators = []
    sender_score = 0
    subject_score = 0

    full_text_to_eval = f"{subject_raw}\n\n{body_raw}"

    # 1. Sender Domain Analysis
    if email_addr and sender_domain:
        display_and_addr = f"{display_name} {email_addr}".lower()

        # Check for free email pretending to be a bank
        has_bank_claim = any(bank in display_and_addr for bank in LEGITIMATE_BANKING_DOMAINS.keys()) or "bank" in display_and_addr or "support" in display_and_addr

        if sender_domain in FREE_EMAIL_PROVIDERS and has_bank_claim:
            sender_score += 45
            indicators.append({
                "title": "Free Public Email Provider Used for Official Banking Alert",
                "severity": "HIGH",
                "category": "Sender Spoofing",
                "description": f"The email originates from a public webmail service ('{sender_domain}') while claiming to represent a financial institution ('{display_name or email_addr}').",
                "evidence": f"Sender: {sender_raw}"
            })
        else:
            # Check domain against legitimate bank domains
            for bank_key, legit_domains in LEGITIMATE_BANKING_DOMAINS.items():
                if bank_key in display_and_addr:
                    is_legit_domain = any(sender_domain == dom or sender_domain.endswith("." + dom) for dom in legit_domains)
                    if is_legit_domain:
                        indicators.append({
                            "title": f"Verified Sender Domain ({bank_key.upper()})",
                            "severity": "INFO",
                            "category": "Sender Verification",
                            "description": f"The sender domain '{sender_domain}' is an authorized domain for {bank_key.upper()}.",
                            "evidence": sender_domain
                        })
                    else:
                        sender_score += 40
                        indicators.append({
                            "title": f"Lookalike / Fake Sender Domain ({bank_key.upper()})",
                            "severity": "HIGH",
                            "category": "Sender Spoofing",
                            "description": f"The sender domain '{sender_domain}' is not authorized by {bank_key.upper()} ({', '.join(legit_domains)}).",
                            "evidence": f"Domain: {sender_domain}"
                        })

    # 2. Subject Line Urgency / Threat Check
    if subject_raw:
        subj_lower = subject_raw.lower()
        if any(term in subj_lower for term in ["urgent", "blocked", "suspended", "deactivated", "unauthorized", "security alert", "action required", "within 24 hours"]):
            subject_score += 25
            indicators.append({
                "title": "High-Urgency Threat in Subject Line",
                "severity": "HIGH",
                "category": "Social Engineering",
                "description": f"The subject line uses alarming language to induce panic: '{subject_raw}'.",
                "evidence": subject_raw
            })
        elif any(term in subj_lower for term in ["reward", "cashback", "lottery", "refund", "kyc update", "pan verification"]):
            subject_score += 20
            indicators.append({
                "title": "High-Risk Subject Hook",
                "severity": "MEDIUM",
                "category": "Lure Pattern",
                "description": f"Subject line references common lure categories: '{subject_raw}'.",
                "evidence": subject_raw
            })

    # 3. Message Body & URL Analysis
    body_analysis = analyze_message(full_text_to_eval, sender=email_addr or sender_raw, channel="email")

    # Merge body indicators
    for ind in body_analysis.get("indicators", []):
        if not any(existing["title"] == ind["title"] for existing in indicators):
            indicators.append(ind)

    # 4. Fused Scoring
    body_risk = body_analysis["risk_score"]
    combined_score = (body_risk * 0.60) + (min(100, sender_score + subject_score) * 0.40)

    # If sender was confirmed fake bank domain, elevate risk floor
    if sender_score >= 40:
        combined_score = max(combined_score, 75)

    final_score = int(min(100, max(0, round(combined_score))))

    if final_score >= 60:
        classification = "PHISHING / HIGH RISK"
        recommendations = [
            "Do NOT click any hyperlinks or open any email attachments.",
            "Never reply with sensitive information, passwords, or OTPs.",
            "Report this email as phishing to your security team and forward to your bank's fraud reporting address."
        ]
    elif final_score >= 30:
        classification = "SUSPICIOUS"
        recommendations = [
            "Verify the sender's full email address and DKIM/SPF headers before replying.",
            "Visit your bank's portal only by typing their official URL directly in your browser."
        ]
    else:
        classification = "SAFE"
        recommendations = [
            "Email appears consistent with legitimate notifications. Follow standard security hygiene."
        ]

    confidence = round(min(0.99, max(body_analysis["confidence"], 0.70 + len(indicators) * 0.05)), 2)

    return {
        "channel": "email",
        "risk_score": final_score,
        "classification": classification,
        "confidence": confidence,
        "summary": f"{classification} email detected with risk score of {final_score}/100.",
        "indicators": indicators,
        "recommendations": recommendations,
        "extracted_urls": body_analysis.get("extracted_urls", []),
        "breakdown": {
            "ml_score": body_analysis.get("breakdown", {}).get("ml_score", 0),
            "sender_score": sender_score,
            "subject_score": subject_score,
            "body_rule_score": body_analysis.get("breakdown", {}).get("rule_score", 0),
            "url_score": body_analysis.get("breakdown", {}).get("url_score", 0)
        },
        "ml_details": body_analysis.get("ml_details")
    }
