'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { VIP_TIERS, VIPTier } from '@/data/coinPacks';
import {
  Crown,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTier?: 'weekly' | 'monthly' | 'yearly';
}

export function SubscriptionModal({
  isOpen,
  onClose,
  defaultTier = 'monthly',
}: SubscriptionModalProps) {
  const { user } = useAuth();
  const { isVIP, vipTier, vipExpiresAt, purchaseVIP, refreshWallet } = useWallet();

  const [selectedTierId, setSelectedTierId] = useState<'weekly' | 'monthly' | 'yearly'>(
    defaultTier
  );
  const [paymentState, setPaymentState] = useState<
    'idle' | 'initiating' | 'verifying' | 'success' | 'failed'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<any | null>(null);

  if (!isOpen) return null;

  const tiersToShow = VIP_TIERS.filter((t) => t.id !== 'annual') as VIPTier[];
  const selectedTier = tiersToShow.find((t) => t.id === selectedTierId) || tiersToShow[1];

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setPaymentState('initiating');
    setErrorMessage(null);

    try {
      const res = await purchaseVIP(selectedTierId);
      if (res.success) {
        setPaymentState('success');
        setSuccessDetails({
          tierName: selectedTier.name,
          message: res.message,
        });
        await refreshWallet();
      } else {
        setPaymentState('failed');
        setErrorMessage(res.error || 'Subscription payment could not be completed.');
      }
    } catch (err: any) {
      setPaymentState('failed');
      setErrorMessage(err.message || 'An unexpected error occurred during subscription checkout.');
    }
  };

  const handleReset = () => {
    setPaymentState('idle');
    setErrorMessage(null);
  };

  const formattedExpiry = vipExpiresAt
    ? new Date(vipExpiresAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-[#101820] border border-slate-200 dark:border-[var(--lr-border-primary,#27313A)] rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close subscription window"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-[var(--lr-text-muted,#86929F)] dark:hover:text-[var(--lr-text-primary,#F5F1E8)] dark:hover:bg-[var(--lr-bg-elevated,#1A232D)] transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ─── SUCCESS STATE ──────────────────────────────────────────────── */}
        {paymentState === 'success' ? (
          <div className="py-8 sm:py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 dark:bg-[#68B88A]/20 dark:border-[#68B88A] flex items-center justify-center text-emerald-600 dark:text-[#68B88A] mb-5 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 dark:bg-[#F4C95D]/15 dark:text-[#F4C95D] dark:border-[#F4C95D]/30 text-xs font-bold uppercase tracking-wider mb-3">
              <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-[#F4C95D]" />
              <span>VIP Subscription Active</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[var(--lr-text-primary,#F5F1E8)] tracking-tight">
              Welcome to Lighthouse VIP!
            </h2>
            <p className="text-sm text-slate-600 dark:text-[var(--lr-text-secondary,#B7BEC6)] mt-2 max-w-md">
              {successDetails?.message || 'Your subscription is now active! Enjoy unlimited episodes, zero ads, and early access.'}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={onClose}
                className="btn-primary w-full py-3 px-6 rounded-xl text-white font-bold text-sm transition-all shadow-md cursor-pointer"
              >
                Start Watching Now
              </button>
            </div>
          </div>
        ) : paymentState === 'failed' ? (
          /* ─── FAILED / CANCELLED STATE ────────────────────────────────────── */
          <div className="py-8 sm:py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 border-2 border-red-500 dark:bg-[#D96868]/20 dark:border-[#D96868] flex items-center justify-center text-red-600 dark:text-[#D96868] mb-5 shadow-lg shadow-red-500/20">
              <AlertCircle className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[var(--lr-text-primary,#F5F1E8)] tracking-tight">
              Subscription Incomplete
            </h2>
            <p className="text-sm text-slate-600 dark:text-[var(--lr-text-secondary,#B7BEC6)] mt-2 max-w-md">
              {errorMessage || 'The payment was not completed or was cancelled. No charges were made to your account.'}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={handleReset}
                className="btn-primary w-full py-3 px-6 rounded-xl text-white font-bold text-sm transition-all shadow-md cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-transparent dark:hover:bg-[var(--lr-bg-elevated,#1A232D)] dark:border-[var(--lr-border-primary,#27313A)] dark:text-[var(--lr-text-primary,#F5F1E8)] font-semibold text-sm transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ─── ACTIVE SUBSCRIPTION SELECTION FORM ────────────────────────── */
          <div>
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 dark:bg-[#ECC979]/15 dark:text-[#ECC979] dark:border-[#ECC979]/30 text-xs font-bold uppercase tracking-wider mb-2.5">
                <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-[#ECC979]" />
                <span>Lighthouse Reels VIP Pass</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[var(--lr-text-primary,#F5F1E8)] tracking-tight">
                Choose Your Subscription Plan
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[var(--lr-text-secondary,#B7BEC6)] mt-1.5 max-w-lg">
                Unlock 100% ad-free streaming, all series episodes, offline downloads, and exclusive creator releases.
              </p>

              {/* Current Plan Indicator */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[var(--lr-bg-elevated,#141D26)] border border-slate-200 dark:border-[var(--lr-border-primary,#27313A)] text-xs text-slate-700 dark:text-[var(--lr-text-secondary,#B7BEC6)]">
                <span>Current Plan:</span>
                {isVIP ? (
                  <span className="font-bold text-emerald-600 dark:text-[#68B88A] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Active VIP ({vipTier?.toUpperCase()}){formattedExpiry ? ` • Renews ${formattedExpiry}` : ''}
                  </span>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-[var(--lr-text-primary,#F5F1E8)]">
                    Free Viewer
                  </span>
                )}
              </div>
            </div>

            {/* Plan Cards Grid: Weekly, Monthly, Yearly */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mb-6 sm:mb-8">
              {tiersToShow.map((tier) => {
                const isSelected = selectedTierId === tier.id;
                const isCurrentActive = isVIP && vipTier === tier.id;

                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTierId(tier.id as any)}
                    className={`relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-white dark:bg-[#181428] border-2 border-[#A78BFA] shadow-[0_0_24px_rgba(167,139,250,0.35),0_8px_20px_rgba(139,92,246,0.12)] ring-2 ring-[#C4B5FD]/40 scale-[1.02] hover:shadow-[0_0_30px_rgba(167,139,250,0.50)] hover:border-[#8B5CF6]'
                        : 'bg-white dark:bg-[#131920] border border-slate-200 dark:border-[#232D38] hover:border-[#A78BFA] hover:shadow-[0_0_20px_rgba(167,139,250,0.25)] hover:bg-purple-50/20 dark:hover:bg-purple-950/20 hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Badge */}
                    {tier.popular && (
                      <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white ring-1 ring-white/50'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      }`}>
                        MOST POPULAR
                      </span>
                    )}
                    {tier.best_value && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                        BEST VALUE • SAVE 70%
                      </span>
                    )}

                    <div>
                      {/* Plan Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base text-slate-900 dark:text-[var(--lr-text-primary,#F5F1E8)]">
                          {tier.name}
                        </h3>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="mt-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-2xl sm:text-3xl font-extrabold ${
                            isSelected ? 'text-[#7C3AED] dark:text-[#C4B5FD]' : 'text-slate-900 dark:text-white'
                          }`}>
                            ₹{tier.intro_price_inr || tier.price_inr}
                          </span>
                          {tier.intro_price_inr && (
                            <span className="text-xs text-slate-400 dark:text-[var(--lr-text-muted,#86929F)] line-through">
                              ₹{tier.price_inr}
                            </span>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                            (${tier.price_usd})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[var(--lr-text-secondary,#A0AEC0)] mt-0.5 font-medium">
                          {tier.billing_frequency}
                        </p>
                      </div>

                      {/* Features List */}
                      <ul className="mt-4 space-y-2 text-xs text-slate-700 dark:text-[var(--lr-text-secondary,#C6D2DC)]">
                        {tier.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-[#8B5CF6] dark:text-[#A78BFA]' : 'text-emerald-600 dark:text-[#68B88A]'}`} />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isCurrentActive && (
                      <div className="mt-4 py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700 dark:bg-[#68B88A]/15 dark:border-[#68B88A]/30 dark:text-[#68B88A] text-center text-xs font-bold">
                        Your Current Plan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Subscribe Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-[var(--lr-border-primary,#212A34)]">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-[var(--lr-text-muted,#86929F)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#68B88A]" />
                <span>Secure payment via Razorpay. Cancel anytime in settings.</span>
              </div>

              <button
                type="button"
                disabled={paymentState === 'initiating'}
                onClick={handleSubscribe}
                className="btn-primary w-full sm:w-auto px-8 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer font-sans"
              >
                {paymentState === 'initiating' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Checkout...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>
                      Subscribe for ₹{selectedTier.intro_price_inr || selectedTier.price_inr} /{' '}
                      {selectedTierId === 'weekly'
                        ? 'week'
                        : selectedTierId === 'monthly'
                        ? 'month'
                        : 'year'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
