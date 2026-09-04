import React, { useState } from 'react';
import { X, ShieldCheck, ShieldAlert, ExternalLink, Calendar, Check, Lock, ArrowRight, Zap } from 'lucide-react';
import { requestRazorpayCheckout } from '../services/api';

export function RazorpayShieldModal({ isOpen, onClose, simulationResult, user }) {
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMandateScheduled, setIsMandateScheduled] = useState(false);

  if (!isOpen || !simulationResult) return null;

  const isSafe = simulationResult.isSafe;
  const amount = simulationResult.purchase.amount;
  const description = simulationResult.purchase.description;
  const earliestSafeDate = simulationResult.earliestSafeDate;

  const handleTriggerCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await requestRazorpayCheckout({
        amount,
        description,
        isSafe,
        earliestSafeDate,
        user
      });
      setCheckoutStatus(response);
    } catch (err) {
      console.error("Razorpay Shield error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScheduleMandate = () => {
    setIsMandateScheduled(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        
        {/* Modal Header with Razorpay Co-branding */}
        <div className="bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-white">Razorpay Safe Checkout</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                  Shield API
                </span>
              </div>
              <p className="text-[11px] text-slate-400">MARGIN Pre-Spend Guard Integration</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* Purchase Details */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 mb-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Purchase Item</span>
              <span className="text-sm font-semibold text-white">{description}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Amount</span>
              <span className="text-base font-extrabold font-mono text-white">₹{amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Conditional: SAFE Decision Flow vs BLOCKED Shield Flow */}
          {isSafe ? (
            <div className="space-y-4">
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                    Pre-Approved by MARGIN Safety Engine
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    This ₹{amount.toLocaleString('en-IN')} spend leaves your ₹{user?.safetyBufferTarget?.toLocaleString('en-IN')} safety buffer 100% intact through upcoming bills.
                  </p>
                </div>
              </div>

              {/* Order Simulation Results if generated */}
              {checkoutStatus?.allowed ? (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold mb-2">
                    <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Razorpay Order Created</span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">TEST MODE</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Order ID:</span>
                    <span className="text-white">{checkoutStatus.orderId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shield Token:</span>
                    <span className="text-emerald-300 truncate max-w-[180px]">{checkoutStatus.safetyShieldToken}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payment Link:</span>
                    <span className="text-blue-400 underline">{checkoutStatus.paymentUrl}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleTriggerCheckout}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  {isProcessing ? 'Generating Secure Order...' : 'Generate Razorpay Safe Order'}
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    MARGIN Shield Intervention
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Executing this spend today would push your liquidity into risk, creating a deficit before upcoming commitments.
                  </p>
                </div>
              </div>

              {/* Scheduling recommendation via Razorpay Mandates */}
              {earliestSafeDate && earliestSafeDate.date && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>Smart Deferral Recommendation:</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Waiting until <strong className="text-white font-mono">{earliestSafeDate.formattedDate}</strong> ensures your safety buffer stays protected.
                  </p>

                  {isMandateScheduled ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-300 flex items-center gap-2 font-mono">
                      <Check className="w-4 h-4" />
                      <span>Razorpay Payment Mandate scheduled for {earliestSafeDate.formattedDate}!</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleScheduleMandate}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Schedule Auto-Pay for {earliestSafeDate.formattedDate}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" /> 256-bit FinTech Simulation Hook
            </span>
            <span>Razorpay Hackathon Track</span>
          </div>

        </div>

      </div>
    </div>
  );
}
