import re
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional

# Configurable legitimate banking domains mapping
LEGITIMATE_BANKING_DOMAINS = {
    "sbi": ["onlinesbi.sbi", "sbi.co.in", "bank.sbi", "sbicard.com"],
    "hdfc": ["hdfcbank.com", "hdfc.com", "hdfcsec.com"],
    "icici": ["icicibank.com", "icicidirect.com"],
    "axis": ["axisbank.com"],
    "kotak": ["kotak.com", "kotakbank.com", "kotaksecurities.com"],
    "baroda": ["bankofbaroda.in", "bobibanking.com", "bankofbaroda.com"],
    "pnb": ["pnbindia.in", "netpnb.com"],
    "canara": ["canarabank.com", "canarabank.in"],
    "union": ["unionbankofindia.co.in", "unionbankonline.co.in"],
    "rbi": ["rbi.org.in"],
    "incometax": ["incometax.gov.in", "incometaxindiaefiling.gov.in"]
}

# High-risk TLDs commonly abused in automated phishing kits
SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".click", ".buzz", ".club", ".work", ".loan",
    ".cf", ".gq", ".ml", ".ga", ".tk", ".zip", ".mov", ".link",
    ".site", ".online", ".rest", ".fit", ".icu", ".cam", ".monster"
}

# Common URL shortener services
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "ow.ly", "cutt.ly",
    "buff.ly", "rebrand.ly", "shorturl.at", "soo.gd", "s.id"
}

# Suspicious keywords in URLs
SUSPICIOUS_URL_KEYWORDS = [
    "login", "signin", "verify", "verification", "kyc", "pan", "aadhaar",
    "update", "secure", "security", "banking", "netbanking", "auth",
    "account-blocked", "unblock", "suspended", "reward", "refund", "claim",
    "bonus", "free-gift", "card-unlock", "otp", "password", "wallet"
]

IP_PATTERN = re.compile(r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$")


def extract_urls_from_text(text: str) -> List[str]:
    """Finds all URLs inside plain text messages or email bodies."""
    if not text:
        return []
    url_pattern = re.compile(
        r'(?:https?://|www\.)[^\s<>"\']+|[a-zA-Z0-9-]+\.(?:xyz|top|click|club|buzz|work|loan|cf|gq|ml|ga|tk|site|online|link)[^\s<>"\']*',
        re.IGNORECASE
    )
    matches = url_pattern.findall(text)
    cleaned = []
    for match in matches:
        # Strip trailing punctuation
        m = re.sub(r'[\.,;:\)\]\}>]+$', '', match)
        if not m.startswith("http://") and not m.startswith("https://"):
            m = "http://" + m
        if m not in cleaned:
            cleaned.append(m)
    return cleaned


def analyze_url(url: str) -> Dict[str, Any]:
    """
    Performs purely static/lexical analysis of a URL.
    Does NOT make external network requests to avoid security/privacy risks.
    """
    raw_url = url.strip() if url else ""
    if not raw_url.startswith("http://") and not raw_url.startswith("https://"):
        raw_url = "http://" + raw_url

    parsed = urlparse(raw_url)
    hostname = (parsed.hostname or "").lower()
    path = parsed.path or ""
    query = parsed.query or ""
    scheme = (parsed.scheme or "http").lower()

    indicators = []
    risk_score = 0
    features = {
        "url": raw_url,
        "hostname": hostname,
        "scheme": scheme,
        "url_length": len(raw_url),
        "hostname_length": len(hostname),
        "num_dots": hostname.count("."),
        "num_hyphens": hostname.count("-") + path.count("-"),
        "num_digits": sum(c.isdigit() for c in raw_url),
        "num_special_chars": sum(c in "@-_?=&%#+" for c in raw_url),
        "has_at_symbol": "@" in raw_url,
        "is_ip_address": bool(IP_PATTERN.match(hostname)),
        "is_https": scheme == "https",
        "has_suspicious_tld": False,
        "is_shortener": hostname in URL_SHORTENERS,
        "is_punycode": "xn--" in hostname,
        "subdomain_count": max(0, hostname.count(".") - 1),
        "matched_bank_impersonation": None,
        "suspicious_keywords_found": []
    }

    # 1. IP Address Check
    if features["is_ip_address"]:
        risk_score += 45
        indicators.append({
            "title": "Direct IP Address Host",
            "severity": "HIGH",
            "category": "Host Lexical",
            "description": "The URL uses a raw numeric IP address instead of a registered domain name, a hallmark of evasion in phishing kits.",
            "evidence": hostname
        })

    # 2. Protocol Security (HTTP vs HTTPS)
    if scheme == "http":
        risk_score += 15
        indicators.append({
            "title": "Unencrypted HTTP Protocol",
            "severity": "MEDIUM",
            "category": "Transport Security",
            "description": "Legitimate banking institutions strictly mandate HTTPS encryption for all user communications.",
            "evidence": scheme.upper()
        })

    # 3. '@' Symbol in URL
    if features["has_at_symbol"]:
        risk_score += 35
        indicators.append({
            "title": "Misleading '@' Symbol in URL",
            "severity": "HIGH",
            "category": "Obfuscation",
            "description": "The '@' character in URLs causes browsers to ignore all preceding characters (often fake bank names) and connect to the domain after '@'.",
            "evidence": "@"
        })

    # 4. Punycode / IDN Homograph
    if features["is_punycode"]:
        risk_score += 35
        indicators.append({
            "title": "Punycode / Homograph Attack Indicator",
            "severity": "HIGH",
            "category": "Obfuscation",
            "description": "URL uses internationalized domain encoding (xn--) which can visually mimic legitimate character glyphs.",
            "evidence": hostname
        })

    # 5. Suspicious TLD
    for tld in SUSPICIOUS_TLDS:
        if hostname.endswith(tld):
            features["has_suspicious_tld"] = True
            risk_score += 30
            indicators.append({
                "title": f"High-Risk TLD ({tld})",
                "severity": "HIGH",
                "category": "Domain Reputation",
                "description": f"The domain uses '{tld}', an inexpensive top-level domain frequently associated with automated smishing and phishing campaigns.",
                "evidence": tld
            })
            break

    # 6. URL Shortener
    if features["is_shortener"]:
        risk_score += 25
        indicators.append({
            "title": "URL Shortener Detected",
            "severity": "MEDIUM",
            "category": "Obfuscation",
            "description": f"URL is disguised using '{hostname}' shortener to conceal the ultimate destination domain.",
            "evidence": hostname
        })

    # 7. Subdomain Abuse
    if features["subdomain_count"] >= 3 and not features["is_ip_address"]:
        risk_score += 20
        indicators.append({
            "title": "Excessive Subdomains",
            "severity": "MEDIUM",
            "category": "Domain Structure",
            "description": f"Hostname contains {features['subdomain_count']} subdomains, often used to embed genuine bank names into unrelated malicious domains.",
            "evidence": hostname
        })

    # 8. Banking Brand Impersonation & Lookalike Detection
    full_url_lower = raw_url.lower()
    for bank_key, legitimate_list in LEGITIMATE_BANKING_DOMAINS.items():
        # Check if bank identifier appears anywhere in URL
        if bank_key in full_url_lower or (bank_key == "sbi" and "yono" in full_url_lower) or (bank_key == "icici" and "imobile" in full_url_lower):
            # Check if actual hostname matches one of legitimate domains
            is_legit = any(hostname == legit or hostname.endswith("." + legit) for legit in legitimate_list)
            if is_legit:
                # Legitimate official domain!
                indicators.append({
                    "title": f"Verified Banking Domain ({bank_key.upper()})",
                    "severity": "INFO",
                    "category": "Legitimacy",
                    "description": f"The domain '{hostname}' matches verified official domain records for {bank_key.upper()}.",
                    "evidence": hostname
                })
                # Heavily dampen risk score for authentic official banking portals
                risk_score = max(0, risk_score - 40)
            else:
                # Impersonation detected!
                features["matched_bank_impersonation"] = bank_key.upper()
                risk_score += 45
                indicators.append({
                    "title": f"Banking Domain Mismatch & Impersonation ({bank_key.upper()})",
                    "severity": "HIGH",
                    "category": "Brand Impersonation",
                    "description": f"URL references {bank_key.upper()} banking keywords but host '{hostname}' does NOT belong to official {bank_key.upper()} domains ({', '.join(legitimate_list)}).",
                    "evidence": f"Found '{bank_key}' in host '{hostname}'"
                })

    # 9. Suspicious Keywords in Path/Query
    found_keywords = [kw for kw in SUSPICIOUS_URL_KEYWORDS if kw in full_url_lower]
    features["suspicious_keywords_found"] = found_keywords
    if len(found_keywords) >= 2:
        risk_score += 15
        indicators.append({
            "title": "Suspicious Authentication Keywords in URL",
            "severity": "MEDIUM",
            "category": "Lexical Pattern",
            "description": f"URL path/query contains credential or urgency keywords: {', '.join(found_keywords[:4])}.",
            "evidence": ", ".join(found_keywords)
        })

    # 10. URL Length / Hyphen Count
    if features["url_length"] > 90:
        risk_score += 10
        indicators.append({
            "title": "Unusually Long URL Length",
            "severity": "LOW",
            "category": "URL Lexical",
            "description": f"URL length is {features['url_length']} characters, commonly seen in complex phishing redirect chains.",
            "evidence": f"{features['url_length']} chars"
        })

    if features["num_hyphens"] >= 4:
        risk_score += 10
        indicators.append({
            "title": "Excessive Hyphenation",
            "severity": "LOW",
            "category": "URL Lexical",
            "description": f"Contains {features['num_hyphens']} hyphens, frequently used to assemble multi-word lookalike domains.",
            "evidence": f"{features['num_hyphens']} hyphens"
        })

    # Cap score at 0-100
    final_score = min(100, max(0, risk_score))

    # Classification
    if final_score >= 60:
        classification = "PHISHING / HIGH RISK"
        rec = "DO NOT click this link or enter any personal/banking credentials. This domain exhibits high risk phishing characteristics."
    elif final_score >= 30:
        classification = "SUSPICIOUS"
        rec = "Exercise caution before interacting with this URL. Verify the website certificate and origin independently."
    else:
        classification = "SAFE"
        rec = "No major suspicious URL lexical indicators were detected. Continue with standard safety precautions."

    confidence = round(min(0.99, 0.60 + (len(indicators) * 0.08)), 2)

    return {
        "url": raw_url,
        "risk_score": final_score,
        "classification": classification,
        "confidence": confidence,
        "features": features,
        "indicators": indicators,
        "recommendation": rec
    }
