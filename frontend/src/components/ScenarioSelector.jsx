import React from 'react';
import { Sparkles, Flame, ShieldCheck } from 'lucide-react';
import { DEMO_SCENARIOS } from '../services/api';

export default function ScenarioSelector({ onSelectScenario, selectedId }) {
  return (
    <div className="cyber-card p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            Demo Attack Scenarios & Benchmarks
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">1-Click Fast Preload</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {DEMO_SCENARIOS.map((sc) => {
          const isSelected = selectedId === sc.id;
          const isHighRisk = sc.expectedRisk === 'HIGH RISK';

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              className={`text-left p-2.5 rounded-lg border text-xs transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-1 w-full">
                <span className="font-semibold text-slate-100 line-clamp-1">{sc.name}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${sc.badgeColor}`}>
                  {sc.channel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{sc.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
