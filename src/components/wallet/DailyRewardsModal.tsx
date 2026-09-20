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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-600/30 via-amber-600/30 to-orange-600/30 p-6 border-b border-neutral-800 text-center">
          <button
            onClick={closeDailyRewards}
            className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-3">
            <Gift className="w-8 h-8 text-neutral-950" />
          </div>

          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            7-Day Streak Rewards
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1 font-semibold">
              <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> {streak} Day Streak
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Check in every single day to claim free drama coins and unlock episodes!
          </p>
        </div>

        {/* Claimed Celebration Banner */}
        {claimedReward && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-center animate-bounce">
            <p className="text-sm font-bold text-amber-300 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Claimed +{claimedReward} Free Drama Coins!
            </p>
            <p className="text-xs text-neutral-300 mt-0.5">Your updated balance is 🪙 {coins} coins</p>
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
                    isGrandPrize ? 'col-span-2 bg-gradient-to-br from-amber-950/60 to-neutral-900 border-amber-500/60' : ''
                  } ${
                    isToday
                      ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/20'
                      : isClaimed
                      ? 'bg-neutral-900/40 border-neutral-800/60 opacity-60'
                      : 'bg-neutral-900/80 border-neutral-800'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-neutral-400">Day {item.day}</span>

                  <div className="my-2 flex flex-col items-center">
                    <span className="text-xl">🪙</span>
                    <span className="text-sm font-black text-amber-400">+{item.coins}</span>
                  </div>

                  {isClaimed ? (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  ) : isToday ? (
                    <span className="text-[10px] text-amber-300 font-bold animate-pulse">
                      Ready!
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">Upcoming</span>
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
              className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wide shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                canCheckIn
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 shadow-orange-500/30'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
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
