import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { TrendingUp, AlertCircle, Calendar, Shield, Sparkles } from 'lucide-react';

export function ForecastChart({ 
  forecastData, 
  simulationResult, 
  safetyBufferTarget,
  horizonDays,
  onSetHorizonDays 
}) {
  const [activeTooltipItem, setActiveTooltipItem] = useState(null);

  if (!forecastData || !forecastData.timeline) {
    return (
      <div className="bg-fintech-card/90 border border-fintech-border rounded-2xl p-8 flex items-center justify-center min-h-[360px]">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Generating Cash Flow Forecast...</span>
        </div>
      </div>
    );
  }

  // Merge baseline timeline with simulation timeline (if active)
  const chartData = forecastData.timeline.map((day, idx) => {
    const simDay = simulationResult?.simulatedTimeline?.[idx];
    return {
      date: day.date,
      formattedDate: new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      dayName: day.dayName,
      dayOfMonth: day.dayOfMonth,
      baselineBalance: day.closingBalance,
      simulatedBalance: simDay ? simDay.balance : null,
      incomeToday: day.incomeToday,
      recurringToday: day.recurringToday,
      recurringDetails: day.recurringDetails,
      incomeDetails: day.incomeDetails,
      isBufferBreached: day.isBufferBreached,
      simIsBufferBreached: simDay?.isBufferBreached || false,
      isOverdraft: day.isOverdraft
    };
  });

  // Calculate chart boundaries
  const allBalances = chartData.flatMap(d => [
    d.baselineBalance, 
    d.simulatedBalance !== null ? d.simulatedBalance : d.baselineBalance
  ]);
  const minVal = Math.min(0, ...allBalances);
  const maxVal = Math.max(...allBalances, safetyBufferTarget * 1.5);
  const yDomainMin = Math.floor((minVal - 5000) / 5000) * 5000;
  const yDomainMax = Math.ceil((maxVal + 5000) / 5000) * 5000;

  return (
    <div className="bg-fintech-card/95 border border-fintech-border rounded-2xl p-5 lg:p-6 shadow-xl">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              Cash Flow Forecast Timeline
            </h3>
            {simulationResult && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-mono">
                <Sparkles className="w-2.5 h-2.5" /> What-If Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulates daily net liquidity forward considering regular salary, fixed obligations & variable burn.
          </p>
        </div>

        {/* Horizon Toggle & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Legend Items */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-1 rounded-full bg-emerald-400" />
              <span>Baseline</span>
            </div>
            {simulationResult && (
              <div className="flex items-center gap-1.5 text-purple-300">
                <span className="w-3 h-1 rounded-full bg-purple-400 border border-dashed border-purple-200" />
                <span>Simulated Spend</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-0.5 bg-amber-400 border border-dashed" />
              <span>Buffer (₹{safetyBufferTarget?.toLocaleString('en-IN')})</span>
            </div>
          </div>

          {/* 30 vs 60 days button group */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => onSetHorizonDays(30)}
              className={`px-2.5 py-1 rounded transition-all ${
                horizonDays === 30 ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => onSetHorizonDays(60)}
              className={`px-2.5 py-1 rounded transition-all ${
                horizonDays === 60 ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              60 Days
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[320px] sm:h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="simulatedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />

            <XAxis
              dataKey="formattedDate"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1E293B' }}
              interval="preserveStartEnd"
              minTickGap={24}
            />

            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1E293B' }}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              domain={[yDomainMin, yDomainMax]}
            />

            <Tooltip content={<CustomForecastTooltip safetyBufferTarget={safetyBufferTarget} />} />

            {/* Safety Buffer Target Reference Line */}
            <ReferenceLine
              y={safetyBufferTarget}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Buffer: ₹${(safetyBufferTarget / 1000).toFixed(0)}k`,
                position: 'right',
                fill: '#F59E0B',
                fontSize: 10,
                fontWeight: 600
              }}
            />

            {/* Zero Overdraft Line */}
            <ReferenceLine
              y={0}
              stroke="#EF4444"
              strokeWidth={1}
              strokeDasharray="2 2"
            />

            {/* Baseline Cash Flow Area */}
            <Area
              type="monotone"
              dataKey="baselineBalance"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#baselineGradient)"
              name="Baseline Balance"
            />

            {/* What-If Simulated Line (overlaid when query active) */}
            {simulationResult && (
              <Line
                type="monotone"
                dataKey="simulatedBalance"
                stroke="#A855F7"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 2, fill: '#A855F7' }}
                activeDot={{ r: 5, fill: '#C084FC' }}
                name="Simulated Balance"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Indicator */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Salary credits create upward spikes</span>
          <span className="text-slate-600">|</span>
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Rent & EMIs create downward steps</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Average Variable Spend: ~₹{forecastData.avgDailySpend?.toLocaleString('en-IN')}/day
        </div>
      </div>

    </div>
  );
}

// Custom Rich Interactive Tooltip
function CustomForecastTooltip({ active, payload, label, safetyBufferTarget }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isBreached = data.baselineBalance < safetyBufferTarget;
  const isSimBreached = data.simulatedBalance !== null && data.simulatedBalance < safetyBufferTarget;

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md max-w-xs text-xs font-sans">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2 font-mono">
        <span className="font-bold text-white text-sm">
          {data.formattedDate} ({data.dayName})
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          isBreached ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          {isBreached ? 'Buffer Breach' : 'Healthy'}
        </span>
      </div>

      {/* Balance stats */}
      <div className="space-y-1.5 font-mono mb-2.5">
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Baseline Balance:</span>
          <span className="font-bold text-white">₹{data.baselineBalance?.toLocaleString('en-IN')}</span>
        </div>

        {data.simulatedBalance !== null && (
          <div className="flex justify-between items-center text-purple-300 font-bold bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/20">
            <span>What-If Balance:</span>
            <span className={data.simulatedBalance < 0 ? 'text-rose-400' : 'text-purple-200'}>
              ₹{data.simulatedBalance?.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-400">
          <span>Buffer Target:</span>
          <span className="text-amber-400">₹{safetyBufferTarget?.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Events on this day */}
      {(data.incomeToday > 0 || data.recurringToday > 0) && (
        <div className="border-t border-slate-800/80 pt-2 space-y-1">
          {data.incomeToday > 0 && (
            <div className="text-emerald-400 font-medium flex items-center justify-between">
              <span>💰 Salary Inflow:</span>
              <span className="font-mono font-bold">+₹{data.incomeToday.toLocaleString('en-IN')}</span>
            </div>
          )}
          {data.recurringToday > 0 && (
            <div>
              <div className="text-rose-400 font-medium flex items-center justify-between">
                <span>🗓️ Scheduled Outflows:</span>
                <span className="font-mono font-bold">-₹{data.recurringToday.toLocaleString('en-IN')}</span>
              </div>
              {data.recurringDetails && (
                <ul className="text-[10px] text-slate-400 pl-2 mt-0.5 list-disc list-inside">
                  {data.recurringDetails.map((bill, i) => (
                    <li key={i}>{bill.name} (₹{bill.amount.toLocaleString('en-IN')})</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
