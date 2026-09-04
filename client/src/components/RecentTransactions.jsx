import React, { useState } from 'react';
import { History, PieChart, ArrowDownRight, ArrowUpRight, Filter } from 'lucide-react';

export function RecentTransactions({ transactions, avgDailySpend }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const txs = transactions || [];

  // Group by category to display distribution
  const categoryStats = txs
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const totalSpent = Object.values(categoryStats).reduce((a, b) => a + b, 0);

  const categories = ['All', ...Object.keys(categoryStats)];

  const filteredTxs = selectedCategory === 'All' 
    ? txs 
    : txs.filter(t => t.category === selectedCategory);

  return (
    <div className="bg-fintech-card/95 border border-fintech-border rounded-2xl p-5 lg:p-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Discretionary Spend Analytics
            </h3>
            <p className="text-xs text-slate-400">
              60-day transaction history powering MARGIN's daily burn forecasting model.
            </p>
          </div>
        </div>

        {/* Algorithm Insight Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-right font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Empirical Daily Burn</span>
          <span className="text-xs font-bold text-emerald-400">
            ~₹{avgDailySpend?.toLocaleString('en-IN') || 450}/day
          </span>
        </div>
      </div>

      {/* Category Distribution Bar */}
      <div className="mb-5 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium">Category Breakdown (Past 60 Days):</span>
          <span className="font-mono text-slate-300">Total: ₹{totalSpent.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(categoryStats).map(([cat, amt]) => {
            const pct = Math.round((amt / (totalSpent || 1)) * 100);
            return (
              <div 
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? 'All' : cat)}
                className={`cursor-pointer px-2.5 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat 
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200' 
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>{cat}</span>
                <span className="font-mono font-bold text-slate-400">({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {filteredTxs.slice(0, 15).map((tx) => (
          <div
            key={tx.id}
            className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                tx.type === 'credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {tx.type === 'credit' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              </div>
              <div>
                <span className="font-medium text-white block">{tx.description}</span>
                <span className="text-[10px] text-slate-400">{tx.date} • {tx.category}</span>
              </div>
            </div>

            <span className={`font-mono font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-200'}`}>
              {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
