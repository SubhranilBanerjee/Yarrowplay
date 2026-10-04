'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { DAILY_STREAK_REWARDS } from '@/data/coinPacks';
import { X, Gift, CheckCircle2, Flame, Sparkles } from 'lucide-react';
import { CoinIcon } from '@/components/ui/CoinIcon';

export default function DailyRewardsModal() {
  const {
    coins,
    streak,
    canCheckIn,
    isDailyRewardsOpen,
    closeDailyRewards,
    claimDailyCheckIn,
  } = useWallet();

  const [loading, setLoading] = useState(false);
  const [claimedReward, setClaimedReward] = useState<number | null>(null);

  if (!isDailyRewardsOpen) return null;

  const handleClaim = async () => {
    setLoading(true);
    const res = await claimDailyCheckIn();
    setLoading(false);
    const coinsWon = res.coins_earned ?? res.coins_awarded;
    if (res.success && coinsWon) {
      setClaimedReward(coinsWon);
    } else if (res.error || res.message) {
      alert(res.error || res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#101820] border border-slate-200 dark:border-[#27313A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-slate-50 dark:bg-[#151F28] p-6 border-b border-slate-200 dark:border-[#27313A] text-center">
          <button
            onClick={closeDailyRewards}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 dark:text-[#7F8993] dark:hover:text-[#F5F1E8] dark:hover:bg-[#101820] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center shadow-md mb-3">
            <Gift className="w-8 h-8 text-[#0B0F13]" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-[#F5F1E8] flex items-center justify-center gap-2">
            7-Day Streak Rewards
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-[#F4C95D]/15 dark:text-[#F4C95D] dark:border-[#F4C95D]/30 flex items-center gap-1 font-semibold">
              <Flame className="w-3 h-3 text-amber-600 fill-amber-600 dark:text-[#F4C95D] dark:fill-[#F4C95D]" /> {streak} Day Streak
            </span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#B7BEC6] mt-1">
            Check in every single day to claim free coins and unlock episodes!
          </p>
        </div>

        {/* Claimed Celebration Banner */}
        {claimedReward && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-[#F4C95D]/15 dark:border-[#F4C95D]/30 text-center animate-bounce">
            <p className="text-sm font-bold text-amber-700 dark:text-[#F4C95D] flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-[#F4C95D]" />
              Claimed +{claimedReward} Free Coins!
            </p>
            <p className="text-xs text-slate-600 dark:text-[#B7BEC6] mt-0.5 flex items-center justify-center gap-1">Your updated balance is <CoinIcon className="w-3.5 h-3.5" /> {coins} coins</p>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="p-6 bg-white dark:bg-[#0B1117] flex-1">
          <div className="grid grid-cols-4 gap-3">
            {DAILY_STREAK_REWARDS.map((item) => {
              const isClaimed = streak >= item.day && !canCheckIn;
              const isToday = canCheckIn && streak + 1 === item.day;
              const isGrandPrize = item.day === 7;

              return (
                <div
                  key={item.day}
                  className={`relative p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isGrandPrize ? 'col-span-2 bg-white dark:bg-[#151F28] border-purple-400 dark:border-[#F4C95D]/60 shadow-md ring-1 ring-purple-400/20' : ''
                  } ${
                    isToday
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 dark:bg-[#F4C95D]/15 dark:border-[#F4C95D] dark:ring-[#F4C95D]/40 shadow-md'
                      : isClaimed
                      ? 'bg-slate-100/60 border-slate-200 dark:bg-[#111A22]/50 dark:border-[#27313A]/60 opacity-60'
                      : 'bg-white border-slate-200 dark:bg-[#111A22] dark:border-[#27313A] shadow-sm'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-[#7F8993]">Day {item.day}</span>

                  <div className="my-2 flex flex-col items-center">
                    <CoinIcon className="w-5 h-5 my-0.5" />
                    <span className="text-sm font-black text-amber-600 dark:text-[#F4C95D]">+{item.coins}</span>
                  </div>

                  {isClaimed ? (
                    <span className="text-[10px] text-emerald-700 dark:text-[#68B88A] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  ) : isToday ? (
                    <span className="text-[10px] text-amber-700 dark:text-[#F4C95D] font-bold animate-pulse">
                      Ready!
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-[#7F8993]">Upcoming</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="mt-6">
            <button
              onClick={handleClaim}
              disabled={!canCheckIn || loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                canCheckIn
                  ? 'btn-primary text-white font-bold'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-[#141D26] dark:text-[#7F8993] dark:border-[#27313A]'
              }`}
            >
              {loading
                ? 'Claiming Reward...'
                : canCheckIn
                ? `Claim Day ${streak + 1} Reward!`
                : 'Checked In Today! Come Back Tomorrow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
