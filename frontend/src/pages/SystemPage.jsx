import React from 'react';
import { Cpu, Layers, ShieldCheck, Database, GitBranch, Terminal, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function SystemPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span>System Architecture & Detection Pipeline</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Deep-dive into BankShield AI's hybrid multi-signal fusion engine and explainable AI algorithms.
        </p>
      </div>

      {/* Detection Pipeline Flowchart */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
          Hybrid Multi-Signal Detection Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs font-mono">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">1</span>
              <span>Input Ingestion</span>
            </div>
            <p className="text-xs text-slate-300">
              Multi-channel ingestion parsing Email MIME headers, SMS/WhatsApp texts, raw URLs, and E.164 phone numbers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs font-mono">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">2</span>
              <span>Parallel Analyzers</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>TF-IDF + Logistic Reg NLP</li>
              <li>Static Lexical URL Parser</li>
              <li>Brand Spoofing Rules</li>
              <li>Phone Reputation Radar</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs font-mono">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">3</span>
              <span>Hybrid Risk Fusion</span>
            </div>
            <p className="text-xs text-slate-300">
              Dynamic multi-signal weighting combining ML text probability (40%), rule severity (30%), and URL threat score (30%).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs font-mono">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">4</span>
              <span>Explainable Output</span>
            </div>
            <p className="text-xs text-slate-300">
              Generates 0-100 risk score, severity badges, raw evidence snippets, and tailored customer safety actions.
            </p>
          </div>
        </div>
      </div>

      {/* Thresholds & Banking Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="cyber-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Risk Tier Classification Thresholds
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-red-400 font-mono">60 — 100</span>
                <p className="text-xs text-slate-300 font-medium mt-0.5">PHISHING / HIGH RISK</p>
              </div>
              <span className="text-[11px] text-red-300 font-mono">Immediate Action Required</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 font-mono">30 — 59</span>
                <p className="text-xs text-slate-300 font-medium mt-0.5">SUSPICIOUS</p>
              </div>
              <span className="text-[11px] text-amber-300 font-mono">Secondary Verification</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 font-mono">0 — 29</span>
                <p className="text-xs text-slate-300 font-medium mt-0.5">SAFE</p>
              </div>
              <span className="text-[11px] text-emerald-300 font-mono">Standard Hygiene</span>
            </div>
          </div>
        </div>

        <div className="cyber-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Monitored Banking Institutions
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              { name: 'State Bank of India', domain: 'onlinesbi.sbi' },
              { name: 'HDFC Bank', domain: 'hdfcbank.com' },
              { name: 'ICICI Bank', domain: 'icicibank.com' },
              { name: 'Axis Bank', domain: 'axisbank.com' },
              { name: 'Kotak Mahindra', domain: 'kotak.com' },
              { name: 'Bank of Baroda', domain: 'bankofbaroda.in' },
              { name: 'Punjab National Bank', domain: 'pnbindia.in' },
              { name: 'Canara Bank', domain: 'canarabank.com' }
            ].map((b, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-200 block font-semibold">{b.name}</span>
                <span className="text-[10px] text-cyan-400">{b.domain}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
