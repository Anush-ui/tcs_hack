import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldX } from 'lucide-react';

export default function IndicatorsList({ indicators = [] }) {
  if (!indicators || indicators.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <p className="text-sm text-slate-300 font-medium">No malicious or suspicious indicators detected.</p>
        <p className="text-xs text-slate-500 mt-1">The submitted content did not trigger known phishing heuristics or lexical anomalies.</p>
      </div>
    );
  }

  const getSeverityStyle = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return {
          icon: ShieldX,
          border: 'border-red-500/40 bg-red-500/10',
          badge: 'bg-red-500/20 text-red-300 border-red-500/40',
          iconColor: 'text-red-400'
        };
      case 'MEDIUM':
        return {
          icon: AlertTriangle,
          border: 'border-amber-500/40 bg-amber-500/10',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          iconColor: 'text-amber-400'
        };
      case 'INFO':
        return {
          icon: Info,
          border: 'border-cyan-500/30 bg-cyan-500/5',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          iconColor: 'text-cyan-400'
        };
      default:
        return {
          icon: AlertCircle,
          border: 'border-slate-700 bg-slate-800/40',
          badge: 'bg-slate-700 text-slate-300 border-slate-600',
          iconColor: 'text-slate-400'
        };
    }
  };

  return (
    <div className="space-y-3">
      {indicators.map((ind, idx) => {
        const style = getSeverityStyle(ind.severity);
        const Icon = style.icon;

        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${style.border} transition-all duration-200 hover:scale-[1.01]`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className={`p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 ${style.iconColor} mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">{ind.title}</h4>
                    {ind.category && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {ind.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{ind.description}</p>

                  {/* Evidence snippet */}
                  {ind.evidence && (
                    <div className="mt-2.5 flex items-center space-x-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                      <span className="text-slate-500 select-none">Evidence:</span>
                      <span className="truncate">{ind.evidence}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Severity Pill */}
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-md border shrink-0 ${style.badge}`}>
                {ind.severity || 'LOW'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
