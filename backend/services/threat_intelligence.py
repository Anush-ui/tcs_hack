import os
import json
from typing import Dict, Any, List, Optional

THREAT_INTEL_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "threat_intel_demo.json")


def load_threat_intel_feed() -> Dict[str, Any]:
    """Loads simulated threat intelligence records."""
    if os.path.exists(THREAT_INTEL_PATH):
        try:
            with open(THREAT_INTEL_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading threat intel JSON: {e}")
    return {"notice": "Simulated Feed", "feeds": []}


class ThreatIntelligenceClient:
    """
    Threat Intelligence Adapter Layer.
    Can integrate external feeds (VirusTotal, URLhaus, Google Safe Browsing, AbuseIPDB).
    Falls back reliably to local demo threat intelligence.
    """

    def __init__(self, vt_api_key: Optional[str] = None, abuseipdb_key: Optional[str] = None):
        self.vt_api_key = vt_api_key or os.getenv("VIRUSTOTAL_API_KEY")
        self.abuseipdb_key = abuseipdb_key or os.getenv("ABUSEIPDB_API_KEY")

    def check_indicator(self, indicator: str) -> Dict[str, Any]:
        """
        Queries threat intelligence for a given domain, IP, or campaign indicator.
        """
        clean_target = (indicator or "").strip().lower()
        feed_data = load_threat_intel_feed()
        feeds = feed_data.get("feeds", [])

        # Match exact or substring in demo feed
        matches = []
        for item in feeds:
            ind = item.get("indicator", "").lower()
            if ind in clean_target or clean_target in ind:
                matches.append(item)

        if matches:
            top_match = matches[0]
            return {
                "flagged": True,
                "threat_level": top_match.get("threat_level", "HIGH"),
                "category": top_match.get("category", "Phishing"),
                "target_bank": top_match.get("target_bank", "Generic Bank"),
                "description": top_match.get("description", ""),
                "source": top_match.get("source", "Demo Intelligence"),
                "is_demo_data": True
            }

        return {
            "flagged": False,
            "threat_level": "LOW",
            "category": "Clean / Unlisted",
            "target_bank": None,
            "description": "No active threat intelligence matches in local database.",
            "source": "Local Threat Radar",
            "is_demo_data": True
        }


threat_intel_service = ThreatIntelligenceClient()
