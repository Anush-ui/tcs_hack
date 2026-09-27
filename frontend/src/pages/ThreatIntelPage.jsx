import React, { useState, useEffect } from 'react';
import { 
  Radio, ShieldAlert, Globe, Phone, Server, Search, 
  ExternalLink, CheckCircle, AlertTriangle, Layers, Zap 
} from 'lucide-react';
import { fetchThreatIntel } from '../services/api';

export default function ThreatIntelPage() {
  const [intelData, setIntelData] = useState({ feeds: [] });
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('ALL');

  useEffect(() => {
    async function load() {
      const data = await fetchThreatIntel();
      if (data) setIntelData(data);
    }
    load();
  }, []);

  const feeds = intelData.feeds || [];

  const filteredFeeds = feeds.filter((f) => {
    const matchType = activeType === 'ALL' || f.type === activeType;
    const matchQuery = !search ||
      f.indicator.toLowerCase().includes(search.toLowerCase()) ||
      f.target_bank?.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase());
    return matchType && matchQuery;
  });

  const getThreatBadge = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Demo Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center space-x-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>Threat Intelligence Radar & Active Campaigns</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active monitoring of malicious banking infrastructure, smishing campaigns, and rogue domain registrations.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
          Demo Threat Intelligence Feed (Simulated for Evaluation)
        </div>
      </div>

      {/* Architecture Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { name: 'VirusTotal API', status: 'Ready (Local Fallback)', icon: Globe },
          { name: 'URLhaus Abuse Feed', status: 'Ready (Local Fallback)', icon: Server },
          { name: 'Google Safe Browsing', status: 'Ready (Local Fallback)', icon: ShieldAlert },
          { name: 'AbuseIPDB Network', status: 'Ready (Local Fallback)', icon: Radio },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="cyber-card p-3.5 rounded-xl border border-slate-800 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-900 text-cyan-400 border border-slate-800">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{item.name}</p>
                <p className="text-[10px] font-mono text-emerald-400 mt-0.5 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span>{item.status}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search indicator, target bank, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full">
          <span className="text-[11px] font-mono text-slate-500 mr-1 select-none">Type:</span>
          {['ALL', 'campaign', 'domain', 'ip'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`text-[11px] font-mono px-3 py-1 rounded-md border uppercase transition-colors ${
                activeType === t
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Threat Feed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFeeds.map((feed) => (
          <div
            key={feed.id}
            className="cyber-card p-5 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-all duration-200 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-slate-400">{feed.id}</span>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getThreatBadge(feed.threat_level)}`}>
                    {feed.threat_level}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 font-mono mt-1">
                  {feed.indicator}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{feed.reported_date}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Target Entity</span>
                <span className="text-cyan-300 font-semibold">{feed.target_bank || 'Generic'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Threat Category</span>
                <span className="text-slate-300">{feed.category}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {feed.description}
            </p>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
              <span>Source: {feed.source}</span>
              <span className="text-cyan-400 flex items-center space-x-1">
                <span>Active Signature</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
