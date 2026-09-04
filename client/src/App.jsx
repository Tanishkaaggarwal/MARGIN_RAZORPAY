import React, { useState, useEffect } from 'react';
import { 
  fetchUserData, 
  fetchUsers, 
  switchUser, 
  updateBufferTarget, 
  fetchForecast, 
  runWhatIf, 
  sendChatMessage, 
  fetchNearMisses 
} from './services/api';

import { Header } from './components/Header';
import { WhatIfConsole } from './components/WhatIfConsole';
import { ForecastChart } from './components/ForecastChart';
import { NearMissPanel } from './components/NearMissPanel';
import { UpcomingBills } from './components/UpcomingBills';
import { RecentTransactions } from './components/RecentTransactions';
import { RazorpayShieldModal } from './components/RazorpayShieldModal';
import { ShieldCheck, Sparkles, HelpCircle, Code, Layers } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [nearMissesData, setNearMissesData] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [horizonDays, setHorizonDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);

  // Initialize data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const [userData, usersData, forecast, nearMisses] = await Promise.all([
        fetchUserData(),
        fetchUsers(),
        fetchForecast(30),
        fetchNearMisses()
      ]);

      setUser(userData);
      setUsersList(usersData.users || []);
      setForecastData(forecast);
      setNearMissesData(nearMisses);
    } catch (err) {
      console.error("Initialization error:", err);
      setError("Failed to connect to MARGIN backend. Ensure the server is running on port 5001.");
    } finally {
      setIsInitializing(false);
    }
  };

  // Switch demo persona
  const handleSwitchUser = async (userId) => {
    setIsLoading(true);
    try {
      await switchUser(userId);
      setSimulationResult(null); // reset active simulation
      const [updatedUser, forecast, nearMisses] = await Promise.all([
        fetchUserData(),
        fetchForecast(horizonDays),
        fetchNearMisses()
      ]);
      setUser(updatedUser);
      setForecastData(forecast);
      setNearMissesData(nearMisses);
    } catch (err) {
      console.error("Switch persona error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update Safety Buffer Target
  const handleUpdateBuffer = async (newTarget) => {
    try {
      await updateBufferTarget(newTarget);
      setUser(prev => ({ ...prev, safetyBufferTarget: newTarget }));
      const [forecast, nearMisses] = await Promise.all([
        fetchForecast(horizonDays),
        fetchNearMisses()
      ]);
      setForecastData(forecast);
      setNearMissesData(nearMisses);
      // Re-run simulation if one was active
      if (simulationResult) {
        handleSimulateSpend({
          type: 'direct',
          amount: simulationResult.purchase.amount,
          description: simulationResult.purchase.description
        });
      }
    } catch (err) {
      console.error("Update buffer error:", err);
    }
  };

  // Run What-If Simulation
  const handleSimulateSpend = async (params) => {
    setIsLoading(true);
    try {
      if (params.type === 'chat') {
        const response = await sendChatMessage(params.text);
        if (response.success && response.simulation) {
          setSimulationResult(response.simulation);
        } else {
          alert(response.error || "Could not parse query.");
        }
      } else {
        const result = await runWhatIf(params.amount, null, params.description);
        setSimulationResult(result);
      }
      // Refresh near-misses log to reflect newly caught problem if unsafe
      const updatedNearMisses = await fetchNearMisses();
      setNearMissesData(updatedNearMisses);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSimulation = () => {
    setSimulationResult(null);
  };

  const handleSetHorizonDays = async (days) => {
    setHorizonDays(days);
    try {
      const forecast = await fetchForecast(days);
      setForecastData(forecast);
    } catch (err) {
      console.error("Horizon change error:", err);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#080C14] text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 animate-pulse">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold font-mono tracking-tight">MARGIN</h2>
        <p className="text-sm text-slate-400 mt-1">Initializing Financial Safety Agent...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080C14] text-white flex flex-col items-center justify-center p-4">
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-6 max-w-md text-center">
          <h2 className="text-lg font-bold text-rose-300 mb-2">Backend Connection Error</h2>
          <p className="text-sm text-slate-300 mb-4">{error}</p>
          <button
            onClick={loadInitialData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold text-white transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Header Strip */}
      <Header
        user={user}
        usersList={usersList}
        onSwitchUser={handleSwitchUser}
        onUpdateBuffer={handleUpdateBuffer}
        healthScore={forecastData?.summary?.healthScore || 88}
        safetyStatus={forecastData?.summary?.safetyStatus || 'healthy'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Banner: Core Value Proposition */}
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white">
                Pre-Spend Safety Simulation
              </h1>
              <p className="text-xs text-slate-300">
                Most apps show what you spent in the past. <strong>MARGIN</strong> simulates the downstream future of every transaction before you commit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Empirical Burn Engine Active
            </span>
          </div>
        </div>

        {/* 1. What-If Console (The Headline Feature & Natural Language Chat) */}
        <WhatIfConsole
          user={user}
          onSimulate={handleSimulateSpend}
          simulationResult={simulationResult}
          onClearSimulation={handleClearSimulation}
          isLoading={isLoading}
          onOpenRazorpayModal={() => setIsRazorpayModalOpen(true)}
        />

        {/* 2. Interactive Cash Flow Forecast Chart (30/60 Days) */}
        <ForecastChart
          forecastData={forecastData}
          simulationResult={simulationResult}
          safetyBufferTarget={user?.safetyBufferTarget || 10000}
          horizonDays={horizonDays}
          onSetHorizonDays={handleSetHorizonDays}
        />

        {/* 3. Two-Column Intelligence Grid: Near-Misses & Upcoming Commitments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <NearMissPanel
              nearMissesData={nearMissesData}
              forecastNearMisses={forecastData?.nearMisses}
              user={user}
            />
          </div>
          <div className="lg:col-span-5">
            <UpcomingBills user={user} />
          </div>
        </div>

        {/* 4. Discretionary Spending & Historical Ledger */}
        <RecentTransactions
          transactions={user?.transactions}
          avgDailySpend={forecastData?.avgDailySpend}
        />

      </main>

      {/* Razorpay Safe Checkout Modal */}
      <RazorpayShieldModal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        simulationResult={simulationResult}
        user={user}
      />

      {/* Footer */}
      <footer className="border-t border-fintech-border bg-fintech-card/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-bold text-slate-300">MARGIN</span>
            <span>— Autonomous Financial Safety Agent</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Razorpay Buildathon 2026</span>
            <span>•</span>
            <span>Forecast Formula: <code className="text-slate-400 font-mono">B_t = B_(t-1) + I_t - R_t - D_avg</code></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
