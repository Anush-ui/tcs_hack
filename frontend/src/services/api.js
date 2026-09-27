const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function analyzeChannel(channel, payload) {
  try {
    let endpoint = `/api/analyze/${channel}`;
    if (channel === 'unified') {
      endpoint = '/api/analyze/unified';
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Analysis request failed');
    }
    return await res.json();
  } catch (error) {
    console.error('API analyze error:', error);
    throw error;
  }
}

export async function fetchScanHistory(limit = 50, offset = 0) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/history?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return await res.json();
  } catch (error) {
    console.error('API history error:', error);
    return [];
  }
}

export async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/stats`);
    if (!res.ok) throw new Error('Failed to fetch statistics');
    return await res.json();
  } catch (error) {
    console.error('API stats error:', error);
    return {
      total_scans: 0,
      high_risk_count: 0,
      suspicious_count: 0,
      safe_count: 0,
      channels_breakdown: {},
      average_risk_score: 0
    };
  }
}

export async function fetchThreatIntel() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/threat-intel`);
    if (!res.ok) throw new Error('Failed to fetch threat intelligence');
    return await res.json();
  } catch (error) {
    console.error('API threat intel error:', error);
    return { feeds: [] };
  }
}

// 10 Realistic Demo Attack Scenarios
export const DEMO_SCENARIOS = [
  {
    id: 'sbi_kyc_sms',
    name: 'Fake SBI KYC Expiry (SMS)',
    channel: 'sms',
    category: 'Smishing / Urgency',
    expectedRisk: 'HIGH RISK',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Urgent threat of SBI account blockage demanding instant PAN/KYC update via fake *.xyz link.',
    data: {
      sender: '+919876543210',
      message: 'URGENT: Your SBI account 4829 will be suspended today. Complete your PAN KYC immediately at http://sbi-kyc-verification.xyz to avoid permanent account deactivation.'
    }
  },
  {
    id: 'hdfc_email_phish',
    name: 'HDFC NetBanking Block Email (Free Webmail Spoof)',
    channel: 'email',
    category: 'Brand Spoofing',
    expectedRisk: 'HIGH RISK',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Email sent from free Gmail address masquerading as official HDFC Bank Security Desk with password harvesting link.',
    data: {
      sender_email: 'HDFC Security Desk <hdfc-alerts-security@gmail.com>',
      subject: 'CRITICAL SECURITY NOTICE: NetBanking Access Suspended',
      body: 'Dear Valued Customer,\n\nWe detected unauthorized login attempts on your HDFC NetBanking account from an unknown IP address in Singapore. Your access has been temporarily restricted.\n\nTo restore your NetBanking immediately, verify your credentials at http://hdfc-netbanking-security.top/auth/login.html within 2 hours.\n\nSincerely,\nHDFC Bank Security Operations'
    }
  },
  {
    id: 'kotak_apk_whatsapp',
    name: 'Kotak 811 APK Malware Delivery (WhatsApp)',
    channel: 'whatsapp',
    category: 'Malware APK Lure',
    expectedRisk: 'HIGH RISK',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'WhatsApp message requesting customer to download an unverified verification APK to unblock account.',
    data: {
      sender: '+919988776655',
      message: 'Dear Customer, Your Kotak 811 savings account is blocked due to non-verification. Kindly download official verification APK from http://192.168.1.100/kotak811-update.apk to complete instant facial Aadhaar verification.'
    }
  },
  {
    id: 'otp_theft_sms',
    name: 'Social Engineering OTP Share Solicitation',
    channel: 'sms',
    category: 'Credential Theft',
    expectedRisk: 'HIGH RISK',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Scammer pretending to be fraud investigator soliciting OTP to cancel a fake unauthorized transfer.',
    data: {
      sender: '+918800112233',
      message: 'ICICI Security Alert: Unrecognized transaction of Rs 85,000 initiated. To cancel transaction and protect your funds, kindly share your 6-digit OTP with our verified fraud desk representative immediately.'
    }
  },
  {
    id: 'union_rewards_sms',
    name: 'Union Bank Fake Reward Points Expiry',
    channel: 'sms',
    category: 'Financial Hook',
    expectedRisk: 'HIGH RISK',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Lure promising instant cash redemption of expiring reward points into victim bank account.',
    data: {
      sender: '+919123456789',
      message: 'Dear Union Bank user, your 9,850 reward points worth Rs 4,925 are expiring tonight. Claim direct cash refund into your bank account now at http://union-rewards.buzz/redeem'
    }
  },
  {
    id: 'ip_phishing_url',
    name: 'Direct IP Numeric Phishing Portal (URL)',
    channel: 'url',
    category: 'Infrastructure Evasion',
    expectedRisk: 'HIGH RISK',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Raw IP address hosting unencrypted fake bank login form without SSL certificate.',
    data: {
      url: 'http://192.168.1.100/axis-netbanking/login.php'
    }
  },
  {
    id: 'high_risk_tld_url',
    name: 'Lookalike Domain with Suspicious TLD (URL)',
    channel: 'url',
    category: 'Lookalike Domain',
    expectedRisk: 'HIGH RISK',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Fast-flux .top domain impersonating ICICI reward point portal with brand mismatch.',
    data: {
      url: 'http://icici-rewards-claim.club/portal/auth.html'
    }
  },
  {
    id: 'demo_bad_phone',
    name: 'Known Smishing Caller / Robocall (Phone)',
    channel: 'phone',
    category: 'Reputation Radar',
    expectedRisk: 'HIGH RISK',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Phone number with 480+ crowd-sourced fraud reports in local threat database.',
    data: {
      phone_number: '+919876543210',
      country_code: 'IN'
    }
  },
  {
    id: 'legit_otp_sms',
    name: 'Legitimate ICICI Bank Transaction Alert (SMS)',
    channel: 'sms',
    category: 'Benign Alert',
    expectedRisk: 'SAFE',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Official transactional OTP with strict privacy notice ("Do not share OTP with anyone").',
    data: {
      sender: 'VM-ICICIB',
      message: 'ICICI Bank: OTP for transaction of INR 3,250.00 is 839201. Valid for 5 mins. Do NOT share OTP with anyone. Bank never calls to ask for OTP.'
    }
  },
  {
    id: 'legit_sbi_email',
    name: 'Legitimate SBI E-Statement (Email)',
    channel: 'email',
    category: 'Benign Notification',
    expectedRisk: 'SAFE',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Official e-statement from verified banking domain without coercive urgency.',
    data: {
      sender_email: 'alerts@sbi.co.in',
      subject: 'Your Monthly E-Statement for Account ending 4829',
      body: 'Dear Customer,\n\nYour monthly account e-statement for the month of July 2026 has been generated and is attached as a password-protected PDF. The password is your Date of Birth followed by the last 4 digits of your registered mobile number.\n\nThank you for banking with State Bank of India.\nVisit https://www.onlinesbi.sbi for secure banking.'
    }
  }
];
