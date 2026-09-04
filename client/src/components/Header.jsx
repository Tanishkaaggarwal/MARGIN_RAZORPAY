import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Users, TrendingUp, Edit3, Check, AlertCircle } from 'lucide-react';

export function Header({ 
  user, 
  usersList, 
  onSwitchUser, 
  onUpdateBuffer, 
  healthScore, 
  safetyStatus 
}) {
  const [isEditingBuffer, setIsEditingBuffer] = useState(false);
  const [bufferInput, setBufferInput] = useState(user?.safetyBufferTarget || 10000);

  const handleSaveBuffer = (e) => {
    e.preventDefault();
    onUpdateBuffer(Number(bufferInput));
    setIsEditingBuffer(false);
  };

  const cushion = (user?.currentBalance || 0) - (user?.safetyBufferTarget || 0);

  return (
    <header className="border-b border-fintech-border bg-fintech-card/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-mono">MARGIN</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Razorpay Buildathon
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Financial Safety & Pre-Spend Forecast Agent</p>
            </div>
          </div>

          {/* Persona Switcher for Quick Judge Demo */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1">
            <Users className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={user?.id}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium py-1 px-1.5 focus:outline-none cursor-pointer"
            >
              {usersList.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                  {u.name} ({u.role.split('(')[0].trim()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial KPI Strip */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-end">
          
          {/* Current Balance */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-3.5 py-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">Current Balance</span>
            <span className="text-lg font-bold text-white font-mono">
              ₹{user?.currentBalance?.toLocaleString('en-IN') || 0}
            </span>
          </div>

          {/* Safety Buffer Target (Editable) */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-3.5 py-2 relative group">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">Safety Buffer</span>
              {!isEditingBuffer && (
                <button 
                  onClick={() => { setBufferInput(user.safetyBufferTarget); setIsEditingBuffer(true); }}
                  className="text-slate-500 hover:text-emerald-400 transition-colors"
                  title="Change safety buffer target"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
            
            {isEditingBuffer ? (
              <form onSubmit={handleSaveBuffer} className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  value={bufferInput}
                  onChange={(e) => setBufferInput(e.target.value)}
                  className="w-20 bg-slate-950 border border-emerald-500/50 rounded px-1.5 py-0.5 text-sm font-mono text-white focus:outline-none"
                  autoFocus
                />
                <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-0.5">
                  <Check className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <span className="text-lg font-bold text-amber-400 font-mono">
                ₹{user?.safetyBufferTarget?.toLocaleString('en-IN') || 0}
              </span>
            )}
          </div>

          {/* Current Cushion */}
          <div className="hidden sm:block bg-slate-900/90 border border-slate-800/80 rounded-xl px-3.5 py-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">Buffer Cushion</span>
            <span className={`text-lg font-bold font-mono ${cushion >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {cushion >= 0 ? '+' : ''}₹{cushion.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Safety Health Score Badge */}
          <div className={`flex items-center gap-2 border rounded-xl px-3.5 py-2 ${
            healthScore >= 75 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
              : healthScore >= 45 
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
          }`}>
            <TrendingUp className="w-4 h-4" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">Health Index</span>
              <span className="text-base font-extrabold font-mono">{healthScore || 85}/100</span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
