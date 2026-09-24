'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { DAILY_STREAK_REWARDS } from '@/data/coinPacks';
import { X, Gift, CheckCircle2, Flame, Sparkles } from 'lucide-react';

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
      <div className="relative w-full max-w-lg bg-[#101820] border border-[#27313A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-[#151F28] p-6 border-b border-[#27313A] text-center">
          <button
            onClick={closeDailyRewards}
            className="absolute top-4 right-4 p-2 rounded-full text-[#7F8993] hover:text-[#F5F1E8] hover:bg-[#101820] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#F4C95D] flex items-center justify-center shadow-md mb-3">
            <Gift className="w-8 h-8 text-[#0B0F13]" />
          </div>

          <h2 className="text-xl font-bold text-[#F5F1E8] flex items-center justify-center gap-2">
            7-Day Streak Rewards
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4C95D]/15 text-[#F4C95D] border border-[#F4C95D]/30 flex items-center gap-1 font-semibold">
              <Flame className="w-3 h-3 text-[#F4C95D] fill-[#F4C95D]" /> {streak} Day Streak
            </span>
          </h2>
          <p className="text-xs text-[#B7BEC6] mt-1">
            Check in every single day to claim free coins and unlock episodes!
          </p>
        </div>

        {/* Claimed Celebration Banner */}
        {claimedReward && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-[#F4C95D]/15 border border-[#F4C95D]/30 text-center animate-bounce">
            <p className="text-sm font-bold text-[#F4C95D] flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F4C95D]" />
              Claimed +{claimedReward} Free Coins!
            </p>
            <p className="text-xs text-[#B7BEC6] mt-0.5">Your updated balance is 🪙 {coins} coins</p>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-3">
            {DAILY_STREAK_REWARDS.map((item) => {
              const isClaimed = streak >= item.day && !canCheckIn;
              const isToday = canCheckIn && streak + 1 === item.day;
              const isGrandPrize = item.day === 7;

              return (
                <div
                  key={item.day}
                  className={`relative p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isGrandPrize ? 'col-span-2 bg-[#151F28] border-[#F4C95D]/60' : ''
                  } ${
                    isToday
                      ? 'bg-[#F4C95D]/15 border-[#F4C95D] ring-2 ring-[#F4C95D]/40 shadow-md'
                      : isClaimed
                      ? 'bg-[#111A22]/50 border-[#27313A]/60 opacity-60'
                      : 'bg-[#111A22] border-[#27313A]'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-[#7F8993]">Day {item.day}</span>

                  <div className="my-2 flex flex-col items-center">
                    <span className="text-xl">🪙</span>
                    <span className="text-sm font-black text-[#F4C95D]">+{item.coins}</span>
                  </div>

                  {isClaimed ? (
                    <span className="text-[10px] text-[#68B88A] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  ) : isToday ? (
                    <span className="text-[10px] text-[#F4C95D] font-bold animate-pulse">
                      Ready!
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#7F8993]">Upcoming</span>
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
                  ? 'bg-[#F4C95D] hover:bg-[#FFD978] active:bg-[#DDB347] text-[#0B0F13]'
                  : 'bg-[#141D26] text-[#7F8993] border border-[#27313A]'
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
