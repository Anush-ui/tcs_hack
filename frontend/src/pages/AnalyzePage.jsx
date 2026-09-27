import React, { useState } from 'react';
import { 
  Mail, MessageSquare, Phone, Globe, ShieldAlert, Sparkles, 
  Send, RotateCcw, Copy, Check, ExternalLink, ShieldCheck, 
  AlertTriangle, Layers, Terminal, ArrowRight
} from 'lucide-react';
import RiskGauge from '../components/RiskGauge';
import IndicatorsList from '../components/IndicatorsList';
import ScenarioSelector from '../components/ScenarioSelector';
import { analyzeChannel, DEMO_SCENARIOS } from '../services/api';
import confetti from 'canvas-confetti';

export default function AnalyzePage({ onScanCompleted }) {
  const [channel, setChannel] = useState('whatsapp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    // Email
    sender_email: '',
    subject: '',
    body: '',
    // SMS / WhatsApp
    sender: '',
    message: 'URGENT: Your SBI account 4829 will be blocked today. Complete KYC immediately at http://sbi-kyc-verification.xyz to avoid permanent suspension.',
    // URL
    url: '',
    // Phone
    phone_number: '',
    country_code: 'IN'
  });

  const channels = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, badge: 'Popular Target' },
    { id: 'sms', label: 'SMS Smishing', icon: MessageSquare },
    { id: 'email', label: 'Email Phishing', icon: Mail },
    { id: 'url', label: 'Malicious URL', icon: Globe },
    { id: 'phone', label: 'Phone / Vishing', icon: Phone },
    { id: 'unified', label: 'Multi-Signal Fusion', icon: Layers, badge: 'Unified AI' },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectScenario = (scenario) => {
    setSelectedScenarioId(scenario.id);
    setChannel(scenario.channel);
    setFormData((prev) => ({
      ...prev,
      ...scenario.data
    }));
    setResult(null);
    setError(null);
  };

  const handleQuickLoadAttack = () => {
    // Pick the high-risk scenario matching current channel or default to sbi kyc
    const match = DEMO_SCENARIOS.find((s) => s.channel === channel && s.expectedRisk === 'HIGH RISK') || DEMO_SCENARIOS[0];
    handleSelectScenario(match);
  };

  const handleResetForm = () => {
    setFormData({
      sender_email: '',
      subject: '',
      body: '',
      sender: '',
      message: '',
      url: '',
      phone_number: '',
      country_code: 'IN'
    });
    setResult(null);
    setError(null);
    setSelectedScenarioId(null);
  };

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let payload = {};
      if (channel === 'email') {
        payload = {
          sender_email: formData.sender_email,
          subject: formData.subject,
          body: formData.body || formData.message
        };
      } else if (channel === 'sms' || channel === 'whatsapp') {
        payload = {
          sender: formData.sender,
          message: formData.message
        };
      } else if (channel === 'url') {
        payload = { url: formData.url };
      } else if (channel === 'phone') {
        payload = {
          phone_number: formData.phone_number,
          country_code: formData.country_code
        };
      } else if (channel === 'unified') {
        payload = {
          channel: 'unified',
          sender: formData.sender || formData.phone_number,
          subject: formData.subject,
          message: formData.message || formData.body,
          url: formData.url,
          phone_number: formData.phone_number
        };
      }

      const res = await analyzeChannel(channel, payload);
      setResult(res);

      if (res.risk_score < 30) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10B981', '#06B6D4', '#3B82F6']
        });
      }

      if (onScanCompleted) {
        onScanCompleted();
      }
    } catch (err) {
      setError(err.message || 'Error communicating with detection engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Scenario Presets */}
      <ScenarioSelector onSelectScenario={handleSelectScenario} selectedId={selectedScenarioId} />

      {/* Main Analysis Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Channel Input Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="cyber-card p-5 rounded-2xl border border-slate-800">
            {/* Channel Tabs */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Select Attack Vector Channel
              </span>
              <button
                type="button"
                onClick={handleQuickLoadAttack}
                className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-md transition-all duration-150"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo Attack</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
              {channels.map((ch) => {
                const Icon = ch.icon;
                const isSelected = channel === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setChannel(ch.id);
                      setResult(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                      {ch.badge && (
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {ch.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold mt-2">{ch.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Form by Channel */}
            <form onSubmit={handleAnalyze} className="space-y-4">
              {/* EMAIL CHANNEL */}
              {channel === 'email' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sender Email Header / Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SBI Alerts <security-support@gmail.com>"
                      value={formData.sender_email}
                      onChange={(e) => handleInputChange('sender_email', e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. URGENT: NetBanking Access Suspended"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Body Content
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Paste complete email body text here..."
                      value={formData.body}
                      onChange={(e) => handleInputChange('body', e.target.value)}
                      required
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* SMS / WHATSAPP CHANNEL */}
              {(channel === 'sms' || channel === 'whatsapp') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sender {channel === 'whatsapp' ? 'Phone Number' : 'Header / Phone Number'}
                    </label>
                    <input
                      type="text"
                      placeholder={channel === 'whatsapp' ? 'e.g. +919876543210' : 'e.g. +919876543210 or VK-SBIINB'}
                      value={formData.sender}
                      onChange={(e) => handleInputChange('sender', e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {channel.toUpperCase()} Message Text
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Paste suspicious SMS or WhatsApp message text..."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center space-x-2">
                    <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Embedded URLs inside the message will be extracted and lexically inspected automatically.</span>
                  </div>
                </>
              )}

              {/* URL CHANNEL */}
              {channel === 'url' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Suspicious URL to Analyze
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="e.g. http://sbi-kyc-verification.xyz/login.php or http://192.168.1.100/login"
                        value={formData.url}
                        onChange={(e) => handleInputChange('url', e.target.value)}
                        required
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                    <p className="font-medium text-slate-300 mb-1">🛡️ Air-Gapped Static Analysis:</p>
                    <p>URLs are evaluated safely via lexical, homograph, and domain spoofing algorithms without performing external network requests.</p>
                  </div>
                </>
              )}

              {/* PHONE CHANNEL */}
              {channel === 'phone' && (
                <>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Indian Phone Number
                        </label>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                          🇮🇳 DoT / TRAI (6, 7, 8, 9 Series)
                        </span>
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="e.g. 9876543210 or +91 98765 43210 or 09876543210"
                          value={formData.phone_number}
                          onChange={(e) => handleInputChange('phone_number', e.target.value)}
                          required
                          className="w-full bg-slate-950/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Quick test pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono text-slate-500">Quick Test:</span>
                      <button
                        type="button"
                        onClick={() => handleInputChange('phone_number', '+919876543210')}
                        className="text-[10px] font-mono bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded transition-colors"
                      >
                        🚨 Known Fraud (+919876543210)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('phone_number', '9845123456')}
                        className="text-[10px] font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded transition-colors"
                      >
                        ✓ Clean Indian Number (9845123456)
                      </button>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300 flex items-center space-x-1.5">
                      <span>🇮🇳 Indian Numbering Plan Validation:</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Strict regex validates 10-digit Indian cellular numbers starting with <strong>6, 7, 8, or 9</strong> (with optional <code className="text-cyan-300">+91</code>, <code className="text-cyan-300">91</code>, or <code className="text-cyan-300">0</code> prefixes), toll-free 1800 lines, and cross-references crowd-sourced vishing reports.
                    </p>
                  </div>
                </>
              )}

              {/* UNIFIED MULTI-SIGNAL FUSION */}
              {channel === 'unified' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Sender (Phone or Email)
                      </label>
                      <input
                        type="text"
                        placeholder="+919876543210"
                        value={formData.sender}
                        onChange={(e) => handleInputChange('sender', e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Target Bank URL (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="http://sbi-kyc-verification.xyz"
                        value={formData.url}
                        onChange={(e) => handleInputChange('url', e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Message / Communication Text
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Paste suspicious multi-vector message..."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* Error Box */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 text-sm tracking-wide uppercase"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing Threat Vectors...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-slate-950" />
                      <span>Analyze For Threats</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all duration-150"
                  title="Reset form"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Dynamic Analysis Results */}
        <div className="lg:col-span-6 space-y-4">
          {result ? (
            <div className="cyber-card p-5 rounded-2xl border border-slate-800 space-y-5 animate-in fade-in duration-300">
              {/* Header result bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Threat Assessment Report
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: <strong className="text-slate-200">{result.id}</strong>
                  </span>
                  <button
                    onClick={handleCopyReport}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy full JSON report"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Gauge & Classification Display */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5 flex justify-center">
                  <RiskGauge
                    score={result.risk_score}
                    classification={result.classification}
                    confidence={result.confidence}
                  />
                </div>
                <div className="md:col-span-7 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Executive Summary</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{result.summary}</p>
                  </div>

                  {/* Multi-Signal Breakdown Pills */}
                  {result.breakdown && Object.keys(result.breakdown).length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">
                        Signal Fusion Breakdown:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(result.breakdown).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300"
                          >
                            {k.replace('_score', '')}: <strong>{v}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Why Flagged (Indicators) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Why Was This Flagged? ({result.indicators?.length || 0} Indicators)
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Ranked by Severity</span>
                </div>
                <IndicatorsList indicators={result.indicators} />
              </div>

              {/* Phone Telecom Forensics Panel */}
              {result.phone_details && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Telecom & Vishing Forensics</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      result.phone_details.valid
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}>
                      {result.phone_details.valid ? '✓ Valid Indian Format' : '⚠️ Non-Indian / Invalid'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-mono block">Formatted Number:</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {result.phone_details.formatted_number || result.phone_details.phone_number}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-mono block">Number Type:</span>
                      <span className="text-slate-200 text-[11px]">
                        {result.phone_details.number_type || 'Indian Cellular'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-mono block">Carrier / Series:</span>
                      <span className="text-slate-200 text-[11px]">
                        {result.phone_details.carrier || 'Indian Mobile Series'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-mono block">Reputation Intelligence:</span>
                      <span className={`text-[11px] font-bold ${
                        result.phone_details.report_count > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {result.phone_details.reputation}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted URLs deep inspect */}
              {result.extracted_urls && result.extracted_urls.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Extracted URL Deep Lexical Analysis</span>
                  </div>
                  {result.extracted_urls.map((u, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-cyan-300 truncate max-w-[280px]">{u.url}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          u.risk_score >= 60 ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          Score: {u.risk_score}/100
                        </span>
                      </div>
                      {u.features?.matched_bank_impersonation && (
                        <p className="text-[11px] text-red-400">
                          ⚠️ Spoofed Brand: <strong>{u.features.matched_bank_impersonation}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Actionable Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-cyan-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Recommended Security Actions</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="cyber-card p-10 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <ShieldAlert className="w-12 h-12 text-cyan-400 animate-pulse" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-extrabold text-slate-100">Ready For Multi-Channel Analysis</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select a channel on the left, load a realistic demo scenario preset, or paste real-world suspicious content to generate comprehensive AI risk scoring, brand mismatch checks, and actionable intelligence.
                </p>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={handleQuickLoadAttack}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono transition-all duration-150"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Test Demo Attack (Fast Demo)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
