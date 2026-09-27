import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Activity, Cpu } from 'lucide-react';

export default function StatsCards({ stats = {} }) {
  const cards = [
    {
      label: 'Total Scans Evaluated',
      value: stats.total_scans ?? 0,
      icon: Activity,
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      label: 'High-Risk Threats Blocked',
      value: stats.high_risk_count ?? 0,
      icon: ShieldAlert,
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      label: 'Suspicious Anomalies',
      value: stats.suspicious_count ?? 0,
      icon: AlertTriangle,
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      label: 'Verified Safe Traffic',
      value: stats.safe_count ?? 0,
      icon: ShieldCheck,
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`cyber-card p-4 rounded-xl border ${c.borderColor} flex items-center justify-between`}
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{c.label}</p>
              <h3 className={`text-2xl sm:text-3xl font-extrabold font-mono mt-1 ${c.textColor}`}>
                {c.value}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${c.bgColor} border ${c.borderColor}`}>
              <Icon className={`w-5 h-5 ${c.textColor}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
