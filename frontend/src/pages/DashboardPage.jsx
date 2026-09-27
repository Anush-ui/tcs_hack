import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, ArrowUpRight, Zap, ShieldCheck, 
  AlertTriangle, Radio, Sparkles, Clock, Globe, MessageSquare, 
  Mail, Phone, ExternalLink 
} from 'lucide-react';
import StatsCards from '../components/StatsCards';
import { fetchStats, fetchScanHistory, DEMO_SCENARIOS } from '../services/api';

export default function DashboardPage({ onNavigateToAnalyze, onSelectScenario }) {
  const [stats, setStats] = useState({
    total_scans: 12,
    high_risk_count: 7,
    suspicious_count: 3,
    safe_count: 2,
    channels_breakdown: { whatsapp: 4, email: 3, sms: 3, url: 1, phone: 1 },
    average_risk_score: 68.4
  });
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [st, hist] = await Promise.all([fetchStats(), fetchScanHistory(6, 0)]);
        if (st) setStats(st);
        if (hist && hist.length > 0) setRecentScans(hist);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getChannelIcon = (ch) => {
    switch (ch?.toLowerCase()) {
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'whatsapp': return MessageSquare;
      case 'url': return Globe;
      case 'phone': return Phone;
      default: return Activity;
    }
  };

  const getRiskBadge = (score, classification) => {
    if (score >= 60) {
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    } else if (score >= 30) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden cyber-card p-6 sm:p-8 rounded-2xl border border-cyan-500/30">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                AI Defense Grid Operational
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Banking Smishing & Phishing Detection System
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time multi-signal analysis correlating NLP linguistic intents, brand lookalike domains, unverified telecom sender IDs, and threat intelligence into actionable cyber risk scores.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateToAnalyze()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold py-3 px-5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 text-xs uppercase tracking-wider font-mono"
            >
              <ShieldAlert className="w-4 h-4 text-slate-950" />
              <span>Launch Threat Scanner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Stats */}
      <StatsCards stats={stats} />

      {/* Main Grid: Recent Detections + Quick Attack Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Threat Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="cyber-card p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Live Threat Interceptions
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Real-Time Event Stream</span>
            </div>

            <div className="divide-y divide-slate-800/60 mt-2">
              {recentScans.length > 0 ? (
                recentScans.map((scan) => {
                  const Icon = getChannelIcon(scan.channel);
                  const badgeStyle = getRiskBadge(scan.risk_score, scan.classification);

                  return (
                    <div
                      key={scan.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-900/40 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                              {scan.channel}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {scan.timestamp?.split(' ')[1] || scan.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-sm mt-0.5">
                            {scan.summary}
                          </p>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border ${badgeStyle}`}>
                          {scan.risk_score} / 100
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  No scan records recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Fast Demo Attack Launcher */}
        <div className="lg:col-span-5 space-y-4">
          <div className="cyber-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Interactive Attack Launcher
                </h3>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">Demo Presets</span>
            </div>

            <p className="text-xs text-slate-400">
              Evaluate how BankShield AI dismantles state-of-the-art banking fraud tactics across different communication channels:
            </p>

            <div className="space-y-2">
              {DEMO_SCENARIOS.slice(0, 4).map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    onSelectScenario(sc);
                    onNavigateToAnalyze();
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all duration-150 flex items-center justify-between group"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {sc.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{sc.description}</p>
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${sc.badgeColor}`}>
                    {sc.expectedRisk}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
