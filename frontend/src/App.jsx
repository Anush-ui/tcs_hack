import React, { useState } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import AnalyzePage from './pages/AnalyzePage';
import HistoryPage from './pages/HistoryPage';
import ThreatIntelPage from './pages/ThreatIntelPage';
import SystemPage from './pages/SystemPage';
import { Shield, ShieldAlert, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [selectedScenario, setSelectedScenario] = useState(null);

  const handleSelectScenarioFromDashboard = (scenario) => {
    setSelectedScenario(scenario);
    setActiveTab('analyze');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Navbar Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigateToAnalyze={() => setActiveTab('analyze')}
            onSelectScenario={handleSelectScenarioFromDashboard}
          />
        )}

        {activeTab === 'analyze' && (
          <AnalyzePage />
        )}

        {activeTab === 'history' && (
          <HistoryPage />
        )}

        {activeTab === 'intel' && (
          <ThreatIntelPage />
        )}

        {activeTab === 'system' && (
          <SystemPage />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#070B14] border-t border-slate-800/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">BankShield AI</span>
            <span>— AI Multi-Channel Fraud & Phishing Detection</span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-500 font-mono">
            <span>Notice: Heuristic & ML threat assessment. Demo intelligence data is simulated for evaluation.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
