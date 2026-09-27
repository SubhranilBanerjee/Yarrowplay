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

  const handleRazorpay = () => {
    closeUnlockModal();
    if (onOpenPayment) {
      onOpenPayment(video);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#101820] border border-[#27313A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="relative bg-[#151F28] p-5 border-b border-[#27313A]">
          <button
            onClick={closeUnlockModal}
            className="absolute top-4 right-4 p-2 rounded-full text-[#7F8993] hover:text-[#F5F1E8] hover:bg-[#101820] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#F4C95D]/20 border border-[#F4C95D]/40 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-[#F4C95D]" />
            </div>
            <div className="min-w-0 pr-6">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F4C95D]/20 text-[#F4C95D] border border-[#F4C95D]/30 inline-block mb-1">
                DramaBox Paywall
              </span>
              <h3 className="text-base font-bold text-[#F5F1E8] truncate">
                Episode {epNum}: {video.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Video Thumbnail Preview Banner */}
        <div className="relative h-28 bg-[#090D12] overflow-hidden border-b border-[#27313A]">
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-transparent to-transparent" />
          <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-xs">
            <span className="text-[#F5F1E8] font-semibold flex items-center gap-1.5 drop-shadow">
              <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
              Episodes 1 & 2 are Free
            </span>
            <span className="text-[#F4C95D] font-bold drop-shadow">
              Cost: {EPISODE_UNLOCK_COINS} Coins
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* User Wallet Balance Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#151F28] border border-[#27313A]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#B7BEC6]">Your Balance:</span>
              <span className="text-sm font-bold text-[#F4C95D] flex items-center gap-1">
                🪙 {coins} coins
              </span>
            </div>
            {!hasEnoughCoins && (
              <button
                onClick={() => openCoinStore('coins')}
                className="text-xs font-semibold text-[#F4C95D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Get More Coins <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Success / Error Messages */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-[#68B88A]/15 border border-[#68B88A]/30 text-xs text-[#68B88A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#D96868]/15 border border-[#D96868]/30 text-xs text-[#D96868]">
              {errorMsg}
            </div>
          )}

          {/* Option 1: Unlock with Coins (Primary) */}
          <button
            onClick={handleUnlockWithCoins}
            disabled={isLoading}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
              hasEnoughCoins
                ? 'bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0F13]'
                : 'bg-[#151F28] text-[#F4C95D] border border-[#F4C95D]/40 hover:bg-[#151F28]/80'
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
          <label className="flex items-center gap-2.5 text-xs text-[#B7BEC6] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoUnlockNext}
              onChange={(e) => setAutoUnlockNext(e.target.checked)}
              className="w-4 h-4 rounded border-[#27313A] bg-[#151F28] accent-[#F4C95D] cursor-pointer"
            />
            <span>Auto-unlock next episodes when current finishes</span>
          </label>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#27313A]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#101820] px-2 text-[#7F8993] font-semibold">Or Choose</span>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-2">
            {/* Watch Rewarded Ad */}
            <button
              onClick={handleWatchAd}
              className="w-full py-2.5 px-4 rounded-xl border border-[#27313A] bg-[#141D26] hover:bg-[#19232D] text-xs font-semibold text-[#F5F1E8] flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-[#F4C95D]" />
                <span>Watch 1 Ad to Unlock (Free)</span>
              </div>
              <span className="text-[10px] text-[#68B88A] bg-[#68B88A]/15 px-2 py-0.5 rounded border border-[#68B88A]/30">
                +2 Coins
              </span>
            </button>

            {/* VIP Pass */}
            <button
              onClick={handleGetVIP}
              className="w-full py-2.5 px-4 rounded-xl border border-[#F4C95D]/30 bg-[#F4C95D]/10 hover:bg-[#F4C95D]/15 text-xs font-semibold text-[#F4C95D] flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#F4C95D]" />
                <span>Get VIP Pass (Unlimited Series)</span>
              </div>
              <span className="text-[10px] font-bold text-[#F4C95D]">From ₹199</span>
            </button>

            {/* Razorpay Direct Cash Pay */}
            {(video.price_inr || 19) > 0 && (
              <button
                onClick={handleRazorpay}
                className="w-full py-2 px-4 rounded-xl text-xs text-[#7F8993] hover:text-[#B7BEC6] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
