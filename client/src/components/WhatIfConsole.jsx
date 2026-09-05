import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Zap
} from 'lucide-react';

export function WhatIfConsole({
  onSimulate,
  simulationResult,
  onClearSimulation,
  isLoading,
  onOpenRazorpayModal,
  user
}) {
  const [queryText, setQueryText] = useState('');
  const [directAmount, setDirectAmount] = useState('');
  const [directDescription, setDirectDescription] = useState('');
  const [mode, setMode] = useState('chat');

  // ---------------------------------------------------------
  // Demo Scenarios
  // ---------------------------------------------------------
  const quickChips = [
    {
      label: "Coffee & Lunch (₹450)",
      query: "Can I spend ₹450 on lunch today?",
      tag: "Safe"
    },
    {
      label: "Sneakers (₹4,500)",
      query: "Can I buy sneakers for ₹4,500?",
      tag: "Safe"
    },
    {
      label: "Sony XM5 Headphones (₹16,000)",
      query: "Can I spend ₹16,000 on noise cancelling headphones today?",
      tag: "Buffer Risk"
    },
    {
      label: "Goa Flight & Resort (₹28,000)",
      query: "Can I spend 28k on a Goa trip right now?",
      tag: "Deficit"
    },
    {
      label: "Gaming Laptop (₹65,000)",
      query: "Can I buy a laptop for ₹65,000 today?",
      tag: "Critical"
    }
  ];

  // ---------------------------------------------------------
  // Chat Simulation
  // ---------------------------------------------------------
  const handleSubmitChat = (e) => {
    e.preventDefault();

    if (!queryText.trim() || isLoading) return;

    onSimulate({
      type: 'chat',
      text: queryText.trim()
    });
  };

  // ---------------------------------------------------------
  // Demo Chip
  // ---------------------------------------------------------
  const handleQuickChipClick = (chipQuery) => {
    setQueryText(chipQuery);

    onSimulate({
      type: 'chat',
      text: chipQuery
    });
  };

  // ---------------------------------------------------------
  // Direct Numeric Simulation
  // ---------------------------------------------------------
  const handleSubmitDirect = (e) => {
    e.preventDefault();

    if (!directAmount || isLoading) return;

    onSimulate({
      type: 'direct',
      amount: Number(directAmount),
      description:
        directDescription || "Direct Spend Simulation"
    });
  };

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------
  const formatMoney = (amount) => {
    if (amount === undefined || amount === null) {
      return '₹0';
    }

    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const commitments =
    simulationResult?.upcomingCommitments?.items || [];

  const totalCommitments =
    simulationResult?.upcomingCommitments?.totalAmount || 0;

  return (
    <div className="bg-fintech-card/95 border border-fintech-border rounded-2xl p-5 lg:p-6 shadow-xl relative overflow-hidden">

      {/* Decorative gradient glow background */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* --------------------------------------------------- */}
      {/* Header */}
      {/* --------------------------------------------------- */}
      <div className="flex items-center justify-between gap-3 mb-4">

        <div className="flex items-center gap-2.5">

          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Sparkles className="w-4 h-4" />
          </div>

          <div>

            <h2 className="text-base font-bold text-white flex items-center gap-2">

              What-If Financial Simulation Engine

              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                Headline Feature
              </span>

            </h2>

            <p className="text-xs text-slate-400">
              Simulate any spending decision against upcoming bills, salary, and your{' '}
              {formatMoney(user?.safetyBufferTarget)} buffer.
            </p>

          </div>

        </div>

        {/* Input Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">

          <button
            onClick={() => setMode('chat')}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              mode === 'chat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ask in Plain English
          </button>

          <button
            onClick={() => setMode('direct')}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              mode === 'direct'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Numeric Input
          </button>

        </div>

      </div>

      {/* --------------------------------------------------- */}
      {/* Chat Query Form */}
      {/* --------------------------------------------------- */}
      {mode === 'chat' ? (

        <form
          onSubmit={handleSubmitChat}
          className="relative mb-3"
        >

          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="e.g. 'Can I spend ₹15,000 on Sony headphones today?' or '18k for trip'"
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-3 pl-4 pr-24 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all font-sans shadow-inner"
          />

          <button
            type="submit"
            disabled={!queryText.trim() || isLoading}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >

            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}

            <span>Simulate</span>

          </button>

        </form>

      ) : (

        <form
          onSubmit={handleSubmitDirect}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-3"
        >

          <div className="sm:col-span-5 relative">

            <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">
              ₹
            </span>

            <input
              type="number"
              value={directAmount}
              onChange={(e) => setDirectAmount(e.target.value)}
              placeholder="Amount (e.g. 15000)"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2.5 pl-8 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />

          </div>

          <div className="sm:col-span-5">

            <input
              type="text"
              value={directDescription}
              onChange={(e) => setDirectDescription(e.target.value)}
              placeholder="Item name / Description (Optional)"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />

          </div>

          <div className="sm:col-span-2">

            <button
              type="submit"
              disabled={!directAmount || isLoading}
              className="w-full h-full min-h-[42px] rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >

              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}

              <span>Test</span>

            </button>

          </div>

        </form>

      )}

      {/* --------------------------------------------------- */}
      {/* Demo Scenarios */}
      {/* --------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">

        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mr-1">
          Demo Scenarios:
        </span>

        {quickChips.map((chip, idx) => (

          <button
            key={idx}
            onClick={() => handleQuickChipClick(chip.query)}
            className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 transition-all flex items-center gap-1.5"
          >

            <span>{chip.label}</span>

            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                chip.tag === 'Safe'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : chip.tag === 'Buffer Risk'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {chip.tag}
            </span>

          </button>

        ))}

      </div>

      {/* --------------------------------------------------- */}
      {/* Simulation Result */}
      {/* --------------------------------------------------- */}
      {simulationResult && (

        <div
          className={`mt-4 rounded-xl border p-4 sm:p-5 transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
            simulationResult.verdict === 'SAFE'
              ? 'bg-emerald-950/20 border-emerald-500/40 glow-emerald'
              : simulationResult.verdict === 'BUFFER_BREACH'
                ? 'bg-amber-950/20 border-amber-500/40 glow-amber'
                : 'bg-rose-950/20 border-rose-500/40 glow-rose'
          }`}
        >

          {/* ------------------------------------------------ */}
          {/* Verdict Header */}
          {/* ------------------------------------------------ */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-white/10 pb-3.5 mb-3.5">

            <div className="flex items-center gap-2.5">

              {simulationResult.verdict === 'SAFE' ? (

                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>

              ) : simulationResult.verdict === 'BUFFER_BREACH' ? (

                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>

              ) : (

                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>

              )}

              <div>

                <span
                  className={`text-[11px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded font-mono ${
                    simulationResult.verdict === 'SAFE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : simulationResult.verdict === 'BUFFER_BREACH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {simulationResult.explanation?.tag}
                </span>

                <h3 className="text-base font-bold text-white mt-1">
                  {simulationResult.explanation?.headline}
                </h3>

              </div>

            </div>

            <div className="text-right md:min-w-[120px]">

              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
                Simulated Spend
              </span>

              <span className="text-lg font-bold font-mono text-white">
                {formatMoney(simulationResult.purchase?.amount)}
              </span>

            </div>

          </div>

          {/* ------------------------------------------------ */}
          {/* Explanation */}
          {/* ------------------------------------------------ */}
          <div className="text-sm text-slate-300 leading-relaxed mb-4">

            <p>
              {simulationResult.explanation?.details}
            </p>

          </div>

          {/* ------------------------------------------------ */}
          {/* WHY IS THIS RISKY? */}
          {/* ------------------------------------------------ */}
          {simulationResult.verdict !== 'SAFE' &&
            commitments.length > 0 && (

              <div className="mb-4 rounded-xl bg-slate-950/80 border border-slate-800 p-4">

                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">

                  <div className="flex items-start gap-2.5">

                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-rose-400" />
                    </div>

                    <div>

                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Why is this risky?
                      </h4>

                      <p className="text-[11px] text-slate-400 mt-0.5">
                        MARGIN is protecting your upcoming financial commitments.
                      </p>

                    </div>

                  </div>

                  <div className="text-left sm:text-right">

                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                      Upcoming commitments
                    </span>

                    <span className="text-sm font-bold font-mono text-rose-400">
                      {formatMoney(totalCommitments)}
                    </span>

                  </div>

                </div>

                {/* Commitment List */}
                <div className="space-y-2">

                  {commitments.map((bill, index) => (

                    <div
                      key={`${bill.id || bill.name}-${bill.dueDate || index}`}
                      className="flex items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-lg p-3"
                    >

                      <div className="flex items-center gap-3 min-w-0">

                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">

                          <span className="text-xs font-semibold text-white block truncate">
                            {bill.name || 'Scheduled Commitment'}
                          </span>

                          <span className="text-[10px] text-slate-500 block truncate">
                            {bill.recipient || bill.category || 'Recurring obligation'}
                          </span>

                        </div>

                      </div>

                      <div className="text-right flex-shrink-0">

                        <span className="text-xs font-bold font-mono text-white block">
                          {formatMoney(bill.amount)}
                        </span>

                        <span
                          className={`text-[10px] font-mono ${
                            bill.daysUntilDue <= 3
                              ? 'text-rose-400'
                              : bill.daysUntilDue <= 7
                                ? 'text-amber-400'
                                : 'text-slate-400'
                          }`}
                        >
                          Due in {bill.daysUntilDue}{' '}
                          {bill.daysUntilDue === 1 ? 'day' : 'days'}
                        </span>

                      </div>

                    </div>

                  ))}

                </div>

                {/* Protection Message */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">

                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />

                  <span className="text-[11px] text-slate-400">
                    MARGIN protects these commitments before discretionary spending.
                  </span>

                </div>

              </div>

            )}

          {/* ------------------------------------------------ */}
          {/* Metrics */}
          {/* ------------------------------------------------ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-xs font-mono">

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">

              <span className="text-[10px] text-slate-400 uppercase block font-sans">
                Baseline Min Balance
              </span>

              <span className="font-bold text-slate-200">
                {formatMoney(simulationResult.metrics?.baselineMinBalance)}
              </span>

            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">

              <span className="text-[10px] text-slate-400 uppercase block font-sans">
                Simulated Min Balance
              </span>

              <span
                className={`font-bold ${
                  simulationResult.metrics?.simulatedMinBalance < 0
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                {formatMoney(simulationResult.metrics?.simulatedMinBalance)}
              </span>

            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">

              <span className="text-[10px] text-slate-400 uppercase block font-sans">
                Buffer Deficit
              </span>

              <span
                className={`font-bold ${
                  simulationResult.metrics?.simulatedBufferShortfall > 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {simulationResult.metrics?.simulatedBufferShortfall > 0
                  ? formatMoney(simulationResult.metrics.simulatedBufferShortfall)
                  : '₹0 (Intact)'}
              </span>

            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">

              <span className="text-[10px] text-slate-400 uppercase block font-sans">
                Health Score Impact
              </span>

              <span className="font-bold text-slate-300">

                {simulationResult.metrics?.healthScoreBefore}

                {' → '}

                <span
                  className={
                    simulationResult.metrics?.healthScoreAfter < 50
                      ? 'text-rose-400'
                      : 'text-amber-300'
                  }
                >
                  {simulationResult.metrics?.healthScoreAfter}
                </span>

              </span>

            </div>

          </div>

          {/* ------------------------------------------------ */}
          {/* Earliest Safe Date */}
          {/* ------------------------------------------------ */}
          {simulationResult.earliestSafeDate &&
            simulationResult.earliestSafeDate.date && (

              <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>

                  <div>

                    <div className="flex items-center gap-2 flex-wrap">

                      <span className="text-xs font-bold text-blue-300">
                        Earliest Safe Date:
                      </span>

                      <span className="text-xs font-extrabold text-white px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 font-mono">
                        {simulationResult.earliestSafeDate.formattedDate}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        (in {simulationResult.earliestSafeDate.daysToWait} days)
                      </span>

                    </div>

                    <p className="text-xs text-slate-300 mt-0.5">
                      {simulationResult.earliestSafeDate.enablingFactor}
                    </p>

                  </div>

                </div>

              </div>

            )}

          {/* ------------------------------------------------ */}
          {/* Action CTAs */}
          {/* ------------------------------------------------ */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">

            <p className="text-xs text-slate-400 flex items-center gap-1.5">

              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />

              <span>
                Simulated trajectory is currently overlaid on the 30-day chart below.
              </span>

            </p>

            <div className="flex items-center gap-2">

              <button
                onClick={onClearSimulation}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                Reset to Baseline
              </button>

              <button
                onClick={onOpenRazorpayModal}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                  simulationResult.isSafe
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >

                <ShieldCheck className="w-3.5 h-3.5" />

                <span>
                  {simulationResult.isSafe
                    ? 'Razorpay Safe Checkout'
                    : 'Verify Razorpay Shield'}
                </span>

                <ArrowRight className="w-3 h-3 ml-0.5" />

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}