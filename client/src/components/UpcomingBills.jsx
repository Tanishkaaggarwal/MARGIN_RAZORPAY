import React from 'react';
import { Calendar, CreditCard, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export function UpcomingBills({ user }) {
  const recurring = user?.recurringExpenses || [];
  const salaryDay = user?.incomeDayOfMonth || 1;
  const salaryAmount = user?.monthlyIncome || 0;

  const totalMonthlyBills = recurring.reduce((sum, b) => sum + b.amount, 0);

  // Calculate days until next due for each bill
  const today = new Date();
  const currentDayOfMonth = today.getDate();

  const billsWithCountdown = recurring.map(bill => {
    let daysUntil = bill.dueDayOfMonth - currentDayOfMonth;
    if (daysUntil < 0) {
      // Due next month
      const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      daysUntil = (daysInCurrentMonth - currentDayOfMonth) + bill.dueDayOfMonth;
    }
    return { ...bill, daysUntil };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="bg-fintech-card/95 border border-fintech-border rounded-2xl p-5 lg:p-6 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Scheduled Cash Commitments
            </h3>
            <p className="text-xs text-slate-400">
              Fixed recurring outflows and verified salary credits.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
            Total Monthly Bills
          </span>
          <span className="text-sm font-bold font-mono text-rose-400">
            ₹{totalMonthlyBills.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Salary Credit Banner */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{user?.incomeSource || 'Salary Credit'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Credited on {salaryDay}st
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Processed automatically via RazorpayX Payroll</p>
          </div>
        </div>
        <span className="text-sm font-bold font-mono text-emerald-400">
          +₹{salaryAmount.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Bills List */}
      <div className="space-y-2.5">
        {billsWithCountdown.map((bill) => (
          <div
            key={bill.id}
            className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-all text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white block">{bill.name}</span>
                <span className="text-[11px] text-slate-400">{bill.recipient} • {bill.category}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="font-bold font-mono text-white block">
                ₹{bill.amount.toLocaleString('en-IN')}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded inline-block ${
                bill.daysUntil <= 3 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                Due in {bill.daysUntil} {bill.daysUntil === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
