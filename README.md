# 🛡️ BankShield AI — Multi-Channel Banking Phishing & Fraud Detection

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Style-Tailwind_CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/ML-TF--IDF_%2B_LogisticReg-F7931E.svg?style=flat&logo=scikit-learn)](https://scikit-learn.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**BankShield AI** is an AI-powered, multi-channel cybersecurity and fraud prevention platform engineered specifically for the banking ecosystem. It provides real-time, explainable threat scoring across **Email, SMS, WhatsApp, URLs, and Phone Numbers**, fusing natural language processing (NLP), static lexical URL analytics, brand spoofing rules, telecom origin checks, and threat intelligence into a unified **0–100 Risk Score**.

---

## 🚀 Key Features

- **🌐 Multi-Channel Coverage**:
  - **Email Phishing**: Flags lookalike domains, free public webmail spoofing official banks, urgent subjects, and embedded credential harvesting links.
  - **SMS Smishing**: Detects fake KYC deactivation threats, utility disconnection coercion, and unverified sender numbers.
  - **WhatsApp Fraud**: Identifies malicious APK downloads, fake job/task scams, and coercive NetBanking unblocking scripts.
  - **Static Lexical URL Engine**: Air-gapped URL analysis detecting raw IP hosts, `@` symbol redirection, excessive subdomains, suspicious TLDs (`.xyz`, `.top`, `.click`), and domain mismatch against 15+ Indian & Global banking institutions.
  - **Phone / Vishing Radar**: Telecommunication formatting validation (ITU-T E.164) and simulated crowd-sourced fraud report lookups.
  - **Unified Multi-Signal Fusion**: Cross-correlates sender, message text, and embedded URLs for unified risk posture.
- **🧠 Hybrid Multi-Factor Risk Engine**:
  - Fuses ML Text Probability (40%) + Rule-based Heuristics (30%) + URL Threat Score (30%).
  - Intelligently distinguishes legitimate transactional OTP notifications from malicious OTP solicitations to prevent false positives.
- **🔍 Explainable AI (XAI)**:
  - Answers *"Why was this flagged?"* with severity-ranked indicators, category chips, and highlighted raw evidence snippets.
  - Formulates actionable security recommendations tailored for banking customers.
- **⚡ 100% Offline & Hackathon Ready**:
  - Runs with zero external paid APIs required.
  - Includes simulated threat intelligence feeds and auto-trains lightweight ML artifacts on boot.
- **🖥️ Cybersecurity Command Center Dashboard**:
  - Dark-mode telemetry monitor with animated circular SVG risk gauge, 10 one-click attack scenario presets, search/filterable audit history, and threat radar.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Lucide React Icons, Canvas Confetti |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| **Machine Learning** | Scikit-Learn (TF-IDF Vectorizer + Logistic Regression), Pandas, Numpy, Joblib |
| **Telecom & Parsing**| `phonenumbers` (Google Libphonenumber port), Python Urllib |
| **Database** | SQLite (persistent scan history and telemetry metrics) |

---

## 📁 Repository Structure

```
tcs_hack/
├── backend/
│   ├── main.py                     # FastAPI entrypoint, routes & CORS
│   ├── database.py                 # SQLite scan history & analytics persistence
│   ├── requirements.txt            # Python dependencies
│   ├── models/
│   │   └── schemas.py              # Pydantic request & response models
│   ├── services/
│   │   ├── url_detector.py         # Static/lexical URL analyzer & brand mismatch
│   │   ├── message_detector.py     # SMS & WhatsApp engine with smart OTP logic
│   │   ├── email_detector.py       # Email headers, spoofing & body analysis
│   │   ├── phone_detector.py       # Phone parsing & demo reputation DB
│   │   ├── risk_engine.py          # Multi-signal hybrid weighted fusion engine
│   │   ├── threat_intelligence.py  # Local threat feeds & adapter interfaces
│   │   └── explainability.py       # Human-readable explanation generator
│   ├── ml/
│   │   ├── train.py                # Dataset training script
│   │   ├── model.py                # Singleton ML inference & feature weights
│   │   └── artifacts/              # Serialized joblib models
│   ├── data/
│   │   ├── sample_messages.csv     # Phishing vs Legitimate banking dataset
│   │   ├── sample_urls.csv         # Phishing vs Legitimate URLs dataset
│   │   ├── phone_reputation_demo.json # Local simulated phone reputation
│   │   └── threat_intel_demo.json  # Local simulated campaign bulletins
│   └── tests/
│       └── test_detection.py       # Comprehensive pytest suite (14 test cases)
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, RiskGauge, IndicatorsList, etc.
│   │   ├── pages/                  # Dashboard, Analyze, History, ThreatIntel, System
│   │   ├── services/api.js         # API client & 10 Demo Presets
│   │   ├── App.jsx                 # Tab navigation & footer
│   │   ├── main.jsx                # React DOM entry
│   │   └── index.css               # Dark theme & glassmorphism utilities
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── run_backend.bat                 # Windows 1-click backend launcher
├── run_frontend.bat                # Windows 1-click frontend launcher
├── .env.example
└── README.md
```

---

## ⚡ Getting Started (Quickstart)

### Prerequisites
- **Python 3.10+**
- **Node.js v18+ & npm**

---

### Option A: Windows One-Click Launchers

1. **Start Backend**: Double-click `run_backend.bat`
2. **Start Frontend**: Double-click `run_frontend.bat`
3. Open your browser at `http://localhost:5173/`

---

### Option B: Manual Terminal Startup

#### 1. Backend Setup:
```bash
# Install Python requirements
pip install -r backend/requirements.txt

# Start FastAPI server (from repository root)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`*

#### 2. Frontend Setup:
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend Application Dashboard: `http://localhost:5173/`*

---

## 🧪 Running Automated Tests

Execute the 14-point test suite verifying URL lexical checks, SMS/WhatsApp smishing, free webmail email spoofing, phone parsing, and unified API endpoints:

```bash
# From the project root
python -m pytest backend/tests/test_detection.py -v
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health & engine status check |
| `POST` | `/api/analyze/email` | Analyzes sender header, subject, body, and extracted links |
| `POST` | `/api/analyze/sms` | Evaluates SMS text, urgency rules, and embedded URLs |
| `POST` | `/api/analyze/whatsapp`| Evaluates WhatsApp messages and APK/remote tool lures |
| `POST` | `/api/analyze/url` | Performs static lexical URL brand spoofing inspection |
| `POST` | `/api/analyze/phone` | Checks phone validity and reputation intelligence |
| `POST` | `/api/analyze/unified`| Fuses multi-vector signals into a single posture score |
| `GET` | `/api/history` | Retrieves recent scan audit records (with limit/offset) |
| `GET` | `/api/stats` | Fetches aggregate system metrics and threat counts |
| `GET` | `/api/threat-intel` | Returns active banking phishing campaign intelligence |

### Example Unified API Request:
```bash
curl -X POST "http://127.0.0.1:8000/api/analyze/unified" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "whatsapp",
    "sender": "+919876543210",
    "message": "URGENT: Your SBI account will be blocked today. Complete KYC at http://sbi-kyc-verification.xyz"
  }'
```

### Example API Response:
```json
{
  "id": "scan-uni-a4f108",
  "timestamp": "2026-08-27 12:30:00",
  "channel": "unified",
  "risk_score": 94,
  "classification": "PHISHING / HIGH RISK",
  "confidence": 0.96,
  "summary": "Cross-channel correlation completed. PHISHING / HIGH RISK detected with fused risk score of 94/100.",
  "indicators": [
    {
      "title": "Threat of Account Blockage / Suspension",
      "severity": "HIGH",
      "category": "Social Engineering",
      "description": "Scammers exploit false urgency and threats to bypass logical verification.",
      "evidence": "account will be blocked"
    },
    {
      "title": "URL Threat: Banking Domain Mismatch & Impersonation (SBI)",
      "severity": "HIGH",
      "category": "URL - Brand Impersonation",
      "description": "URL references SBI banking keywords but host does not match official SBI domains.",
      "evidence": "Found 'sbi' in host 'sbi-kyc-verification.xyz'"
    }
  ],
  "recommendations": [
    "DO NOT click any links, download files, or respond to this message.",
    "NEVER disclose your OTP, ATM PIN, UPI PIN, or NetBanking password to anyone.",
    "Contact your bank only through its official mobile app or verified numbers printed on your card."
  ]
}
```

---

## 🎯 2-Minute Demo Flow for Hackathon Judges

1. **Open Dashboard**: Go to `http://localhost:5173/` and observe the live telemetry cards and `● Detection Engine Online` status.
2. **Select WhatsApp Channel**: Navigate to **Threat Analyzer** and click the **WhatsApp** tab.
3. **Load Preset Scenario**: Click **"Load Demo Attack"** (or choose *Fake SBI KYC Expiry*).
4. **Analyze Threat**: Click **ANALYZE FOR THREATS**. Observe the animated **Risk Gauge (94/100 — HIGH RISK)** and the bulleted reasons in *"Why was this flagged?"*.
5. **Inspect URL Channel**: Switch to the **URL** tab and analyze `http://192.168.1.100/axis-login/auth.html` to see the Direct IP and Insecure HTTP detection.
6. **Demonstrate False-Positive Prevention**: Click scenario *Legitimate ICICI Bank Transaction Alert (SMS)*. Run analysis to show a clean **SAFE (12/100)** score with no false alarm on the "Do not share OTP" warning.
7. **View Detection History**: Click **Detection History** to display the searchable audit table with the forensics drawer.
8. **Threat Radar**: Visit **Threat Radar** to review active banking campaign bulletins and integration hooks.

---

## ⚖️ Ethical & Responsible AI Notice
BankShield AI is designed for cyber defensive intelligence and fraud detection. The system generates probabilistic risk scores and explains heuristic indicators; it does not claim to definitively prove the legal identity of phone numbers or senders. Local reputation intelligence is marked as simulated for hackathon evaluation.
#   t c s _ h a c k  
 