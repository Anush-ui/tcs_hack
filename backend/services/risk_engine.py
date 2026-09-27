import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from .url_detector import analyze_url, extract_urls_from_text
from .message_detector import analyze_message
from .email_detector import analyze_email
from .phone_detector import analyze_phone
from .explainability import generate_explainable_summary, format_actionable_recommendations


class HybridRiskEngine:
    """
    Central Risk Scoring & Correlation Engine for BankShield AI.
    Fuses Multi-Signal Inputs (Text NLP + Heuristics + URL Analysis + Phone Reputation).
    """

    @staticmethod
    def process_channel_request(channel: str, data: Dict[str, Any]) -> Dict[str, Any]:
        channel = (channel or "unified").lower()
        scan_id = f"scan-{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if channel == "email":
            res = analyze_email(
                sender_email=data.get("sender_email") or data.get("sender"),
                subject=data.get("subject"),
                body=data.get("body") or data.get("message") or ""
            )
        elif channel in ["sms", "whatsapp"]:
            res = analyze_message(
                message_text=data.get("message") or data.get("body") or "",
                sender=data.get("sender") or data.get("phone_number"),
                channel=channel
            )
        elif channel == "url":
            res = analyze_url(data.get("url") or "")
            # Adapt output to standard format
            res["channel"] = "url"
            res["summary"] = f"{res['classification']} URL detected with risk score of {res['risk_score']}/100."
            res["recommendations"] = [res["recommendation"]] if isinstance(res.get("recommendation"), str) else res.get("recommendations", [])
            res["extracted_urls"] = []
            res["breakdown"] = {"url_lexical_score": res["risk_score"]}
        elif channel == "phone":
            res = analyze_phone(
                phone_input=data.get("phone_number") or data.get("sender") or "",
                default_country=data.get("country_code", "IN")
            )
            res["channel"] = "phone"
            res["summary"] = f"{res['classification']} phone entity: {res.get('formatted_number', res.get('phone_number'))} ({res['reputation']})."
            res["extracted_urls"] = []
            res["breakdown"] = {"reputation_score": res["risk_score"], "format_validation": 100 if res["valid"] else 20}
            res["phone_details"] = {
                "phone_number": res.get("phone_number"),
                "formatted_number": res.get("formatted_number"),
                "valid": res.get("valid"),
                "country": res.get("country"),
                "region": res.get("region"),
                "carrier": res.get("carrier"),
                "number_type": res.get("number_type"),
                "reputation": res.get("reputation"),
                "report_count": res.get("report_count"),
                "simulated_tags": res.get("simulated_tags", [])
            }
        elif channel == "unified":
            res = HybridRiskEngine.process_unified(data)
        else:
            # Fallback
            res = analyze_message(data.get("message", ""), channel=channel)

        # Standardize envelope
        res["id"] = scan_id
        res["timestamp"] = timestamp
        res["channel"] = channel

        # Ensure summary
        if not res.get("summary"):
            res["summary"] = generate_explainable_summary(
                channel=channel,
                risk_score=res["risk_score"],
                classification=res["classification"],
                indicators=res.get("indicators", []),
                ml_details=res.get("ml_details")
            )

        # Ensure recommendations
        if not res.get("recommendations"):
            res["recommendations"] = format_actionable_recommendations(res["classification"], channel)

        return res

    @staticmethod
    def process_unified(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fuses multi-vector input (e.g. sender phone + message text + embedded/standalone URL).
        """
        sender = data.get("sender") or data.get("phone_number") or data.get("sender_email")
        message = data.get("message") or data.get("body") or ""
        standalone_url = data.get("url")
        subject = data.get("subject")

        indicators = []
        breakdown = {}

        # 1. Analyze Message & Subject
        combined_text = f"{subject or ''}\n{message}".strip()
        msg_result = analyze_message(combined_text, sender=sender, channel="unified")
        msg_score = msg_result["risk_score"]
        breakdown["message_score"] = msg_score
        indicators.extend(msg_result.get("indicators", []))

        # 2. Analyze Sender if phone number
        phone_score = 0
        phone_details = None
        if sender and (sender.startswith("+") or sender.replace("-", "").isdigit()):
            phone_result = analyze_phone(sender)
            phone_score = phone_result["risk_score"]
            phone_details = phone_result
            breakdown["phone_reputation_score"] = phone_score
            for p_ind in phone_result.get("indicators", []):
                if not any(i["title"] == p_ind["title"] for i in indicators):
                    indicators.append(p_ind)

        # 3. Analyze URLs (both standalone and extracted)
        url_score = 0
        all_urls = list(msg_result.get("extracted_urls", []))
        if standalone_url:
            st_url_res = analyze_url(standalone_url)
            all_urls.append(st_url_res)
            for u_ind in st_url_res.get("indicators", []):
                if not any(i["title"] == u_ind["title"] for i in indicators):
                    indicators.append(u_ind)

        if all_urls:
            url_score = max(u["risk_score"] for u in all_urls)
            breakdown["max_url_score"] = url_score

        # 4. Multi-Signal Fusion Calculation
        # Weights: Message 40%, URL 40%, Phone 20%
        active_weights = []
        weighted_sum = 0

        weighted_sum += msg_score * 0.40
        active_weights.append(0.40)

        if url_score > 0:
            weighted_sum += url_score * 0.40
            active_weights.append(0.40)

        if phone_score > 0:
            weighted_sum += phone_score * 0.20
            active_weights.append(0.20)

        total_weight = sum(active_weights)
        fused_score = int(round(weighted_sum / total_weight)) if total_weight > 0 else msg_score

        # Ensure high risk ceiling if critical indicator flagged
        if any(ind.get("severity") == "HIGH" for ind in indicators):
            fused_score = max(fused_score, 70)

        fused_score = min(100, max(0, fused_score))

        if fused_score >= 60:
            classification = "PHISHING / HIGH RISK"
        elif fused_score >= 30:
            classification = "SUSPICIOUS"
        else:
            classification = "SAFE"

        confidence = round(min(0.99, max(msg_result.get("confidence", 0.8), 0.70 + len(indicators) * 0.04)), 2)

        return {
            "channel": "unified",
            "risk_score": fused_score,
            "classification": classification,
            "confidence": confidence,
            "summary": f"Cross-channel correlation completed. {classification} detected with fused risk score of {fused_score}/100.",
            "indicators": indicators,
            "recommendations": format_actionable_recommendations(classification, "unified"),
            "extracted_urls": all_urls,
            "phone_details": phone_details,
            "breakdown": breakdown,
            "ml_details": msg_result.get("ml_details")
        }


risk_engine = HybridRiskEngine()
