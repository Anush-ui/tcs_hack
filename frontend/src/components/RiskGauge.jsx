import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Zap } from 'lucide-react';

export default function RiskGauge({ score = 0, classification = 'SAFE', confidence = 0.9 }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorScheme = {
    ring: '#10B981',
    glow: 'rgba(16, 185, 129, 0.35)',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: CheckCircle
  };

  if (score >= 60) {
    colorScheme = {
      ring: '#EF4444',
      glow: 'rgba(239, 68, 68, 0.45)',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-300 border-red-500/40',
      icon: ShieldAlert
    };
  } else if (score >= 30) {
    colorScheme = {
      ring: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.35)',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: AlertTriangle
    };
  }

  const StatusIcon = colorScheme.icon;

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl ${colorScheme.bg} border ${colorScheme.border} transition-all duration-300`}>
      <div className="relative flex items-center justify-center">
        {/* SVG Circular Dial */}
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="#1E293B"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Foreground risk score bar */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke={colorScheme.ring}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 12px ${colorScheme.glow})`
            }}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-mono font-semibold">
            Risk Score
          </span>
          <span className={`text-5xl font-extrabold tracking-tight font-mono ${colorScheme.text}`}>
            {score}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            out of 100
          </span>
        </div>
      </div>

      {/* Classification Tag */}
      <div className="mt-4 flex flex-col items-center">
        <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide uppercase ${colorScheme.badge}`}>
          <StatusIcon className="w-4 h-4" />
          <span>{classification}</span>
        </div>

        {/* Confidence metric */}
        <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Confidence: <strong className="text-slate-200">{(confidence * 100).toFixed(0)}%</strong></span>
        </div>
      </div>
    </div>
  );
}
