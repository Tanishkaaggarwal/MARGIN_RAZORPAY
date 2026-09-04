import React from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle, Clock, Zap, ArrowUpRight, TrendingDown } from 'lucide-react';

export function NearMissPanel({ 
  nearMissesData, 
  forecastNearMisses, 
  user 
}) {
  const problemsAvoidedCount = nearMissesData?.problemsAvoidedCounter || 2;
  const avoidedLog = nearMissesData?.problemsAvoidedLog || [];
  const activeNearMisses = forecastNearMisses || nearMissesData?.activeForecastNearMisses || [];

  return (
    <div className="bg-fintech-card/95 border border-fintech-border rounded-2xl p-5 lg:p-6 shadow-xl">
      
      {/* Top Banner: Problems Avoided Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Near-Miss Intelligence Center
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Active Guardian
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous detection of cash buffer dips and simulated decision hazards.
            </p>
          </div>
        </div>

        {/* Big Counter Stat */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Problems Caught For You
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {problemsAvoidedCount}
              </span>
              <span className="text-xs text-slate-400">preempted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Active Timeline Warnings vs Saved Problems Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left Column: Projected Near-Misses on Upcoming Timeline */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Projected Timeline Near-Misses ({activeNearMisses.length})</span>
          </h4>

          {activeNearMisses.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-white">All Clear on Baseline Timeline</p>
              <p className="text-xs text-slate-400 mt-1">
                Your regular income comfortably covers all scheduled commitments without breaching your ₹{user?.safetyBufferTarget?.toLocaleString('en-IN')} buffer.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeNearMisses.map((miss, idx) => (
                <div 
                  key={idx}
                  className="bg-amber-950/15 border border-amber-500/30 rounded-xl p-4 transition-all hover:border-amber-500/50"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {miss.severity?.toUpperCase()} RISK
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Dip starts: {miss.startDate}
                    </span>
                  </div>

                  <p className="text-xs text-white font-medium mb-2">
                    {miss.cause}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/80 rounded-lg p-2 mb-2.5">
                    <div>
                      <span className="text-slate-500 block">Lowest Balance</span>
                      <span className="text-amber-400 font-bold">₹{miss.lowestBalance?.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Buffer Shortfall</span>
                      <span className="text-rose-400 font-bold">₹{miss.maxShortfall?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-relaxed">
                    <Zap className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{miss.preventiveAction}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Running Log of Preempted Decisions (Pitch Narrative) */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Decisions Shielded By MARGIN</span>
          </h4>

          <div className="space-y-2.5">
            {avoidedLog.map((log) => (
              <div 
                key={log.id}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-white truncate max-w-[220px]">
                    "{log.query}"
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    {log.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1.5">
                  <span>Amount: <strong className="text-white font-mono">₹{log.amount?.toLocaleString('en-IN')}</strong></span>
                  <span>Protected: <strong className="text-emerald-400 font-mono">₹{log.preventedDeficit?.toLocaleString('en-IN')}</strong></span>
                </div>

                <p className="text-[11px] text-slate-400 bg-slate-950/60 rounded px-2 py-1 font-sans">
                  🛡️ {log.actionTaken}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
