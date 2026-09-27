import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "bankshield.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scan_history (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            channel TEXT NOT NULL,
            risk_score INTEGER NOT NULL,
            classification TEXT NOT NULL,
            confidence REAL NOT NULL,
            summary TEXT NOT NULL,
            indicators_json TEXT NOT NULL,
            recommendations_json TEXT NOT NULL,
            raw_input_json TEXT NOT NULL,
            breakdown_json TEXT
        )
    """)
    conn.commit()

    # Seed initial demo history if empty
    cursor.execute("SELECT COUNT(*) as cnt FROM scan_history")
    count = cursor.fetchone()["cnt"]
    if count == 0:
        seed_demo_history(cursor)
        conn.commit()

    conn.close()


def seed_demo_history(cursor):
    demo_records = [
        (
            "scan-demo-001",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "whatsapp",
            94,
            "PHISHING / HIGH RISK",
            0.96,
            "High risk phishing attempt impersonating SBI with urgency and fake KYC link.",
            json.dumps([
                {"title": "SBI Brand Impersonation", "severity": "HIGH", "category": "Impersonation", "description": "Mentions SBI without matching official domain."},
                {"title": "KYC Expiry Urgency", "severity": "HIGH", "category": "Urgency", "description": "Threatens immediate account blockage within 24 hours."},
                {"title": "High-Risk Phishing Domain", "severity": "HIGH", "category": "URL Lexical", "description": "URL uses suspicious fast-flux TLD '.xyz'."}
            ]),
            json.dumps(["Do NOT click the link or provide any login credentials.", "Report to bank's official fraud helpline 1930."]),
            json.dumps({"sender": "+919876543210", "message": "URGENT: Your SBI account will be blocked today. Update KYC at http://sbi-kyc-verification.xyz"}),
            json.dumps({"ml_score": 92, "rule_score": 95, "url_score": 96})
        ),
        (
            "scan-demo-002",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "email",
            88,
            "PHISHING / HIGH RISK",
            0.91,
            "Phishing email impersonating HDFC Bank sent from a free/suspicious domain.",
            json.dumps([
                {"title": "Free Email Domain Mismatch", "severity": "HIGH", "category": "Impersonation", "description": "Sent from personal or generic domain claiming to be HDFC."},
                {"title": "Credential Harvesting Link", "severity": "HIGH", "category": "Social Engineering", "description": "Requests NetBanking password update immediately."}
            ]),
            json.dumps(["Never enter NetBanking credentials on third-party links.", "Forward email to report.phishing@hdfcbank.com."]),
            json.dumps({"sender_email": "hdfc-alert@security-support.xyz", "subject": "Account Deactivation Notice", "body": "Verify your NetBanking at http://hdfc-netbanking-security.top"}),
            json.dumps({"ml_score": 85, "rule_score": 90, "url_score": 92})
        ),
        (
            "scan-demo-003",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "sms",
            12,
            "SAFE",
            0.98,
            "Legitimate transactional OTP alert from ICICI Bank with strict privacy warning.",
            json.dumps([
                {"title": "Legitimate Transaction Alert", "severity": "INFO", "category": "Benign", "description": "Standard banking OTP notification containing 'do not share' warning."}
            ]),
            json.dumps(["Standard transactional message. Keep your OTP confidential."]),
            json.dumps({"sender": "VM-ICICIB", "message": "ICICI Bank: OTP for transaction of Rs 1,500 is 492019. Valid for 5 mins. Do not share with anyone."}),
            json.dumps({"ml_score": 5, "rule_score": 10, "url_score": 0})
        ),
        (
            "scan-demo-004",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "url",
            96,
            "PHISHING / HIGH RISK",
            0.99,
            "Direct IP address host hosting unencrypted login portal mimicking Axis Bank.",
            json.dumps([
                {"title": "IP Address Host", "severity": "HIGH", "category": "URL Lexical", "description": "Direct numerical IP used instead of legitimate domain."},
                {"title": "Unencrypted HTTP", "severity": "MEDIUM", "category": "Protocol", "description": "Insecure HTTP connection for authentication."}
            ]),
            json.dumps(["Do not enter any bank details or personal credentials on numerical IP addresses."]),
            json.dumps({"url": "http://192.168.1.100/axis-login/auth.html"}),
            json.dumps({"ml_score": 95, "rule_score": 98, "url_score": 96})
        ),
        (
            "scan-demo-005",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "phone",
            55,
            "SUSPICIOUS",
            0.75,
            "Phone number reported multiple times for unsolicited personal loan marketing.",
            json.dumps([
                {"title": "Telemarketing Report History", "severity": "MEDIUM", "category": "Reputation", "description": "34 crowd-sourced reports of unsolicited high-frequency robocalls."}
            ]),
            json.dumps(["Exercise caution. Do not share financial or personal details over unsolicited calls."]),
            json.dumps({"phone_number": "+917766554433"}),
            json.dumps({"ml_score": 0, "rule_score": 55, "phone_score": 58})
        )
    ]
    cursor.executemany("""
        INSERT INTO scan_history (
            id, timestamp, channel, risk_score, classification, confidence,
            summary, indicators_json, recommendations_json, raw_input_json, breakdown_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, demo_records)


def save_scan_record(record: Dict[str, Any]):
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO scan_history (
            id, timestamp, channel, risk_score, classification, confidence,
            summary, indicators_json, recommendations_json, raw_input_json, breakdown_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record.get("id", "scan-unknown"),
        record.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        record.get("channel", "unknown"),
        record.get("risk_score", 0),
        record.get("classification", "SAFE"),
        record.get("confidence", 0.9),
        record.get("summary", "Analysis completed."),
        json.dumps(record.get("indicators", [])),
        json.dumps(record.get("recommendations", [])),
        json.dumps(record.get("raw_input", {})),
        json.dumps(record.get("breakdown", {}))
    ))
    conn.commit()
    conn.close()


# Ensure DB and tables exist on import
init_db()



def get_scan_history(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM scan_history
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    """, (limit, offset))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "timestamp": row["timestamp"],
            "channel": row["channel"],
            "risk_score": row["risk_score"],
            "classification": row["classification"],
            "confidence": row["confidence"],
            "summary": row["summary"],
            "indicators": json.loads(row["indicators_json"]),
            "recommendations": json.loads(row["recommendations_json"]),
            "raw_input": json.loads(row["raw_input_json"]),
            "breakdown": json.loads(row["breakdown_json"]) if row["breakdown_json"] else {}
        })
    return results


def get_scan_stats() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as total FROM scan_history")
    total = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as high_cnt FROM scan_history WHERE risk_score >= 60")
    high_cnt = cursor.fetchone()["high_cnt"]

    cursor.execute("SELECT COUNT(*) as susp_cnt FROM scan_history WHERE risk_score >= 30 AND risk_score < 60")
    susp_cnt = cursor.fetchone()["susp_cnt"]

    cursor.execute("SELECT COUNT(*) as safe_cnt FROM scan_history WHERE risk_score < 30")
    safe_cnt = cursor.fetchone()["safe_cnt"]

    cursor.execute("SELECT channel, COUNT(*) as cnt FROM scan_history GROUP BY channel")
    channel_rows = cursor.fetchall()
    channels_breakdown = {row["channel"]: row["cnt"] for row in channel_rows}

    cursor.execute("SELECT AVG(risk_score) as avg_score FROM scan_history")
    avg_score_row = cursor.fetchone()
    avg_score = round(avg_score_row["avg_score"] or 0, 1)

    conn.close()
    return {
        "total_scans": total,
        "high_risk_count": high_cnt,
        "suspicious_count": susp_cnt,
        "safe_count": safe_cnt,
        "channels_breakdown": channels_breakdown,
        "average_risk_score": avg_score
    }
