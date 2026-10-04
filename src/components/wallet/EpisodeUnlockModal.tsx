'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Lock,
  Coins,
  Crown,
  PlayCircle,
  CreditCard,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { EPISODE_UNLOCK_COINS } from '@/data/coinPacks';
import { CoinIcon } from '@/components/ui/CoinIcon';

export default function EpisodeUnlockModal({
  onUnlocked,
  onOpenPayment,
}: {
  onUnlocked?: () => void;
  onOpenPayment?: (video: any) => void;
}) {
  const { user } = useAuth();
  const {
    coins,
    isVIP,
    isUnlockModalOpen,
    unlockModalVideo,
    closeUnlockModal,
    unlockEpisode,
    openCoinStore,
    openRewardAd,
    autoUnlockNext,
    setAutoUnlockNext,
  } = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isUnlockModalOpen || !unlockModalVideo) return null;

  const video = unlockModalVideo;
  const epNum = video.episode_number || 3;
  const hasEnoughCoins = coins >= EPISODE_UNLOCK_COINS;

  const handleUnlockWithCoins = async () => {
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (!hasEnoughCoins) {
      openCoinStore('coins');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    const res = await unlockEpisode(video.id);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(`Episode ${epNum} unlocked successfully!`);
      if (onUnlocked) onUnlocked();
      setTimeout(() => {
        setSuccessMsg(null);
        closeUnlockModal();
      }, 1000);
    } else {
      setErrorMsg(res.message || res.error || 'Failed to unlock episode');
    }
  };

  const handleWatchAd = () => {
    openRewardAd(video.id);
  };

  const handleGetVIP = () => {
    closeUnlockModal();
    openCoinStore('vip');
  };

  const handleRazorpay = async () => {
    if (onOpenPayment) {
      closeUnlockModal();
      onOpenPayment(video);
      return;
    }

    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: video.id }),
      });
      const orderData = await res.json();
      if (!res.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        throw new Error('Payment gateway not ready. Please refresh the page.');
      }

      const rzp = new Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Lighthouse Reels',
        description: orderData.description || `Episode ${epNum}`,
        order_id: orderData.order_id,
        prefill: {
          name: user.user_metadata?.display_name || user.email?.split('@')[0],
          email: user.email,
        },
        theme: { color: '#F4C95D' },
        handler: async (response: any) => {
          try {
            const vRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                video_id: video.id,
              }),
            });
            const vData = await vRes.json();
            if (vRes.ok && vData.success) {
              setSuccessMsg('Payment successful! Episode unlocked.');
              if (onUnlocked) onUnlocked();
              setTimeout(() => {
                closeUnlockModal();
                window.location.reload();
              }, 1200);
            } else {
              setErrorMsg(vData.error || 'Payment verification failed');
            }
          } catch (err: any) {
            setErrorMsg(err.message || 'Verification error');
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      });

      rzp.on('payment.failed', (resp: any) => {
        setErrorMsg(resp?.error?.description || 'Payment failed');
        setIsLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#101820] border border-slate-200 dark:border-[#27313A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="relative bg-slate-50 dark:bg-[#151F28] p-5 border-b border-slate-200 dark:border-[#27313A]">
          <button
            onClick={closeUnlockModal}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 dark:text-[#7F8993] dark:hover:text-[#F5F1E8] dark:hover:bg-[#101820] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-amber-600 dark:text-[#F4C95D]" />
            </div>
            <div className="min-w-0 pr-6">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-[#F4C95D]/20 dark:text-[#F4C95D] dark:border-[#F4C95D]/30 inline-block mb-1">
                DramaBox Paywall
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F1E8] truncate">
                Episode {epNum}: {video.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Video Thumbnail Preview Banner */}
        <div className="relative h-28 bg-[#090D12] overflow-hidden border-b border-slate-200 dark:border-[#27313A]">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              fill
              className="object-cover opacity-60 filter blur-[1px]"
            />
          ) : (
            <div className="w-full h-full bg-[#111A22] flex items-center justify-center text-[#7F8993]">
              <Lock className="w-8 h-8 opacity-40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-xs">
            <span className="text-white font-semibold flex items-center gap-1.5 drop-shadow">
              <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
              Episodes 1 & 2 are Free
            </span>
            <span className="text-[#F4C95D] font-bold drop-shadow">
              Cost: {EPISODE_UNLOCK_COINS} Coins
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 bg-white dark:bg-[#0B1117] flex-1">
          {/* User Wallet Balance Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#151F28] border border-slate-200 dark:border-[#27313A] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-[#B7BEC6] font-medium">Your Balance:</span>
              <span className="text-sm font-bold text-amber-600 dark:text-[#F4C95D] flex items-center gap-1">
                <CoinIcon className="w-4 h-4" /> {coins} coins
              </span>
            </div>
            {!hasEnoughCoins && (
              <button
                onClick={() => openCoinStore('coins')}
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 dark:text-[#F4C95D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Get More Coins <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Success / Error Messages */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 dark:bg-[#68B88A]/15 dark:border-[#68B88A]/30 dark:text-[#68B88A] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-[#68B88A]" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 dark:bg-[#D96868]/15 dark:border-[#D96868]/30 dark:text-[#D96868] font-medium">
              {errorMsg}
            </div>
          )}

          {/* Option 1: Unlock with Coins (Primary) */}
          <button
            onClick={handleUnlockWithCoins}
            disabled={isLoading}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
              hasEnoughCoins
                ? 'btn-primary text-white font-bold'
                : 'btn-secondary text-white'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Unlocking...
              </>
            ) : hasEnoughCoins ? (
              <>
                <Coins className="w-4 h-4" />
                Unlock with {EPISODE_UNLOCK_COINS} Coins
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" />
                Need {EPISODE_UNLOCK_COINS} Coins · Top Up Now
              </>
            )}
          </button>

          {/* Auto-Unlock Next Episode Toggle */}
          <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-[#B7BEC6] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoUnlockNext}
              onChange={(e) => setAutoUnlockNext(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-[#27313A] bg-white dark:bg-[#151F28] accent-purple-600 dark:accent-[#F4C95D] cursor-pointer"
            />
            <span>Auto-unlock next episodes when current finishes</span>
          </label>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-[#27313A]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white dark:bg-[#101820] px-2 text-slate-500 dark:text-[#7F8993] font-semibold">Or Choose</span>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-2">
            {/* Watch Rewarded Ad */}
            <button
              onClick={handleWatchAd}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#27313A] bg-white hover:bg-slate-50 dark:bg-[#141D26] dark:hover:bg-[#19232D] text-xs font-semibold text-slate-800 dark:text-[#F5F1E8] flex items-center justify-between shadow-sm transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-purple-600 dark:text-[#F4C95D]" />
                <span>Watch 1 Ad to Unlock (Free)</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:text-[#68B88A] dark:bg-[#68B88A]/15 px-2 py-0.5 rounded border border-emerald-200 dark:border-[#68B88A]/30 font-bold">
                +2 Coins
              </span>
            </button>

            {/* VIP Pass */}
            <button
              onClick={handleGetVIP}
              className="w-full py-2.5 px-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 dark:border-[#F4C95D]/30 dark:bg-[#F4C95D]/10 dark:hover:bg-[#F4C95D]/15 dark:text-[#F4C95D] text-xs font-semibold flex items-center justify-between shadow-sm transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-600 dark:text-[#F4C95D]" />
                <span>Get VIP Pass (Unlimited Series)</span>
              </div>
              <span className="text-[10px] font-bold text-purple-700 dark:text-[#F4C95D]">From ₹199</span>
            </button>

            {/* Razorpay Direct Cash Pay */}
            {(video.price_inr || 19) > 0 && (
              <button
                onClick={handleRazorpay}
                className="w-full py-2 px-4 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:text-[#7F8993] dark:hover:text-[#B7BEC6] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Or pay one-time ₹{(video.price_inr || 19).toFixed(0)} via Razorpay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
