import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Mail, MessageSquare, Globe, Phone, 
  Layers, ExternalLink, ShieldAlert, Eye, RefreshCw, X, Copy, Check 
} from 'lucide-react';
import { fetchScanHistory } from '../services/api';
import IndicatorsList from '../components/IndicatorsList';
import RiskGauge from '../components/RiskGauge';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterChannel, setFilterChannel] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchScanHistory(50, 0);
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    const matchChannel = filterChannel === 'ALL' || item.channel?.toLowerCase() === filterChannel.toLowerCase();
    let matchRisk = true;
    if (filterRisk === 'HIGH') matchRisk = item.risk_score >= 60;
    else if (filterRisk === 'SUSPICIOUS') matchRisk = item.risk_score >= 30 && item.risk_score < 60;
    else if (filterRisk === 'SAFE') matchRisk = item.risk_score < 30;

    const query = searchQuery.toLowerCase();
    const matchQuery = !searchQuery || 
      item.summary?.toLowerCase().includes(query) ||
      item.id?.toLowerCase().includes(query) ||
      JSON.stringify(item.raw_input || {}).toLowerCase().includes(query);

    return matchChannel && matchRisk && matchQuery;
  });

  const getChannelIcon = (ch) => {
    switch (ch?.toLowerCase()) {
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'whatsapp': return MessageSquare;
      case 'url': return Globe;
      case 'phone': return Phone;
      default: return Layers;
    }
  };

  const handleCopyJson = (obj) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Detection Audit Log & History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of evaluated banking communications, threat scores, and heuristic triggers.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search scan ID, summary, content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full pb-1 md:pb-0">
          <span className="text-[11px] font-mono text-slate-500 mr-1 select-none">Channel:</span>
          {['ALL', 'whatsapp', 'sms', 'email', 'url', 'phone'].map((ch) => (
            <button
              key={ch}
              onClick={() => setFilterChannel(ch)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-md border uppercase transition-colors shrink-0 ${
                filterChannel === ch
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        {/* Risk Level Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full pb-1 md:pb-0">
          <span className="text-[11px] font-mono text-slate-500 mr-1 select-none">Risk:</span>
          {[
            { id: 'ALL', label: 'ALL' },
            { id: 'HIGH', label: 'HIGH RISK' },
            { id: 'SUSPICIOUS', label: 'SUSPICIOUS' },
            { id: 'SAFE', label: 'SAFE' }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setFilterRisk(r.id)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-md border uppercase transition-colors shrink-0 ${
                filterRisk === r.id
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="cyber-card rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Scan ID / Timestamp</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Threat Rating</th>
                <th className="py-3 px-4">Executive Summary</th>
                <th className="py-3 px-4">Indicators</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((row) => {
                  const Icon = getChannelIcon(row.channel);
                  const isHigh = row.risk_score >= 60;
                  const isSusp = row.risk_score >= 30 && row.risk_score < 60;

                  return (
                    <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="font-bold text-slate-200">{row.id}</div>
                        <div className="text-[10px] text-slate-500">{row.timestamp}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-semibold uppercase font-mono text-slate-200">{row.channel}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                          isHigh 
                            ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                            : isSusp 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {row.risk_score} / 100 — {row.classification}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {row.summary}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {row.indicators?.length || 0} flagged
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedScan(row)}
                          className="flex items-center space-x-1 ml-auto text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                    No scan records match the current search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal Drawer */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cyber-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-cyan-500/30 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Scan Forensic Inspection
                </span>
                <span className="text-xs font-mono text-slate-400">({selectedScan.id})</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyJson(selectedScan)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setSelectedScan(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5 flex justify-center">
                <RiskGauge
                  score={selectedScan.risk_score}
                  classification={selectedScan.classification}
                  confidence={selectedScan.confidence}
                />
              </div>
              <div className="md:col-span-7 space-y-2 text-xs">
                <p className="font-semibold text-slate-100">{selectedScan.summary}</p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                  <div><strong className="text-slate-400">Channel:</strong> <span className="text-cyan-300 uppercase">{selectedScan.channel}</span></div>
                  <div><strong className="text-slate-400">Timestamp:</strong> <span className="text-slate-200">{selectedScan.timestamp}</span></div>
                  <div><strong className="text-slate-400">Payload:</strong> <span className="text-slate-300">{JSON.stringify(selectedScan.raw_input)}</span></div>
                </div>
              </div>
            </div>

            {/* Indicators */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                Detected Indicators
              </h4>
              <IndicatorsList indicators={selectedScan.indicators} />
            </div>

            {/* Recommendations */}
            {selectedScan.recommendations && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <strong className="text-cyan-300 block mb-1">Recommended Banking Protection Actions:</strong>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {selectedScan.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
