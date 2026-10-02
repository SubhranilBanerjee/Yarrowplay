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
        className="relative w-full max-w-3xl bg-[var(--lr-bg-modal,#101820)] border border-[var(--lr-border-primary,#27313A)] rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#ECC979]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#ECC979]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close subscription window"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-[var(--lr-text-muted,#86929F)] hover:text-[var(--lr-text-primary,#F5F1E8)] hover:bg-[var(--lr-bg-elevated,#1A232D)] transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ─── SUCCESS STATE ──────────────────────────────────────────────── */}
        {paymentState === 'success' ? (
          <div className="py-8 sm:py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#68B88A]/20 border-2 border-[#68B88A] flex items-center justify-center text-[#68B88A] mb-5 shadow-lg shadow-[#68B88A]/20">
              <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4C95D]/15 text-[#F4C95D] border border-[#F4C95D]/30 text-xs font-bold uppercase tracking-wider mb-3">
              <Crown className="w-3.5 h-3.5" />
              <span>VIP Subscription Active</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--lr-text-primary,#F5F1E8)] tracking-tight">
              Welcome to Lighthouse VIP!
            </h2>
            <p className="text-sm text-[var(--lr-text-secondary,#B7BEC6)] mt-2 max-w-md">
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
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#D96868]/20 border-2 border-[#D96868] flex items-center justify-center text-[#D96868] mb-5 shadow-lg shadow-[#D96868]/20">
              <AlertCircle className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--lr-text-primary,#F5F1E8)] tracking-tight">
              Subscription Incomplete
            </h2>
            <p className="text-sm text-[var(--lr-text-secondary,#B7BEC6)] mt-2 max-w-md">
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
                className="w-full py-3 px-6 rounded-xl bg-transparent hover:bg-[var(--lr-bg-elevated,#1A232D)] border border-[var(--lr-border-primary,#27313A)] text-[var(--lr-text-primary,#F5F1E8)] font-semibold text-sm transition-all cursor-pointer"
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECC979]/15 text-[#ECC979] border border-[#ECC979]/30 text-xs font-bold uppercase tracking-wider mb-2.5">
                <Crown className="w-3.5 h-3.5" />
                <span>Lighthouse Reels VIP Pass</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--lr-text-primary,#F5F1E8)] tracking-tight">
                Choose Your Subscription Plan
              </h2>
              <p className="text-xs sm:text-sm text-[var(--lr-text-secondary,#B7BEC6)] mt-1.5 max-w-lg">
                Unlock 100% ad-free streaming, all series episodes, offline downloads, and exclusive creator releases.
              </p>

              {/* Current Plan Indicator */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--lr-bg-elevated,#141D26)] border border-[var(--lr-border-primary,#27313A)] text-xs text-[var(--lr-text-secondary,#B7BEC6)]">
                <span>Current Plan:</span>
                {isVIP ? (
                  <span className="font-bold text-[#68B88A] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Active VIP ({vipTier?.toUpperCase()}){formattedExpiry ? ` • Renews ${formattedExpiry}` : ''}
                  </span>
                ) : (
                  <span className="font-semibold text-[var(--lr-text-primary,#F5F1E8)]">
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
                    className={`relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#221C13] to-[#161D26] border-2 border-[#ECC979] shadow-[0_0_25px_rgba(236,201,121,0.18)] scale-[1.02]'
                        : 'bg-[var(--lr-bg-surface,#131920)] border border-[var(--lr-border-primary,#232D38)] hover:border-[#ECC979]/40 hover:bg-[var(--lr-bg-elevated,#18212B)]'
                    }`}
                  >
                    {/* Badge */}
                    {tier.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ECC979] text-[#101418] text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                        MOST POPULAR
                      </span>
                    )}
                    {tier.best_value && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#68B88A] text-[#0A160F] text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                        BEST VALUE • SAVE 70%
                      </span>
                    )}

                    <div>
                      {/* Plan Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base text-[var(--lr-text-primary,#F5F1E8)]">
                          {tier.name}
                        </h3>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#ECC979] text-[#101418] flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="mt-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-extrabold text-[#ECC979]">
                            ₹{tier.intro_price_inr || tier.price_inr}
                          </span>
                          {tier.intro_price_inr && (
                            <span className="text-xs text-[var(--lr-text-muted,#86929F)] line-through">
                              ₹{tier.price_inr}
                            </span>
                          )}
                          <span className="text-xs text-[var(--lr-text-muted,#86929F)] ml-1">
                            (${tier.price_usd})
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--lr-text-secondary,#A0AEC0)] mt-0.5">
                          {tier.billing_frequency}
                        </p>
                      </div>

                      {/* Features List */}
                      <ul className="mt-4 space-y-2 text-xs text-[var(--lr-text-secondary,#C6D2DC)]">
                        {tier.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-[#68B88A] shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isCurrentActive && (
                      <div className="mt-4 py-1.5 px-3 rounded-lg bg-[#68B88A]/15 border border-[#68B88A]/30 text-[#68B88A] text-center text-xs font-bold">
                        Your Current Plan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Subscribe Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--lr-border-primary,#212A34)]">
              <div className="flex items-center gap-2 text-xs text-[var(--lr-text-muted,#86929F)]">
                <ShieldCheck className="w-4 h-4 text-[#68B88A]" />
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
