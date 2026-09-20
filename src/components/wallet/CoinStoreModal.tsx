'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { COIN_PACKS, VIP_TIERS } from '@/data/coinPacks';
import { X, Sparkles, Zap, Crown, Check, Coins, ShieldCheck, PlayCircle } from 'lucide-react';

export default function CoinStoreModal() {
  const {
    coins,
    isVIP,
    vipTier,
    vipExpiresAt,
    isStoreOpen,
    closeCoinStore,
    openRewardedAd,
    purchaseCoins,
    purchaseVIP,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<'coins' | 'vip'>('coins');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isStoreOpen) return null;

  const handleBuyPack = async (packId: string) => {
    setLoadingId(packId);
    setSuccessMsg(null);
    const res = await purchaseCoins(packId);
    setLoadingId(null);
    if (res.success) {
      setSuccessMsg(`🎉 Successfully acquired coins! New Balance: ${res.new_balance}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      alert(res.error || 'Failed to complete transaction');
    }
  };

  const handleBuyVIP = async (tierId: string) => {
    setLoadingId(tierId);
    setSuccessMsg(null);
    const res = await purchaseVIP(tierId);
    setLoadingId(null);
    if (res.success) {
      setSuccessMsg(`👑 VIP Membership Activated! Enjoy unlimited ad-free access.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      alert(res.error || 'Failed to activate VIP');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-600/30 via-purple-600/30 to-amber-600/30 p-6 border-b border-neutral-800">
          <button
            onClick={closeCoinStore}
            className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Coins className="w-7 h-7 text-neutral-950" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                DramaBox Coin Store
                {isVIP && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> VIP ACTIVE
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-400">
                Unlock cliffhanger episodes immediately or get unlimited VIP streaming
              </p>
            </div>
          </div>

          {/* Current Balance Bar */}
          <div className="mt-4 flex items-center justify-between bg-neutral-950/60 rounded-xl px-4 py-2.5 border border-neutral-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Your Wallet:</span>
              <span className="text-lg font-black text-amber-400 flex items-center gap-1">
                🪙 {coins} <span className="text-xs font-normal text-amber-500/80">coins</span>
              </span>
            </div>
            <button
              onClick={() => {
                closeCoinStore();
                openRewardedAd();
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 transition-all flex items-center gap-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5 text-purple-400" />
              Watch Ad (+2 Free)
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('coins')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'coins'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Coins className="w-4 h-4" /> Coin Packs
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'vip'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Crown className="w-4 h-4" /> VIP Passes (Unlimited)
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'coins' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COIN_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    pack.popular
                      ? 'bg-gradient-to-b from-amber-950/40 to-neutral-900 border-amber-500/60 shadow-lg shadow-amber-950/40'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md">
                      Best Value
                    </span>
                  )}
                  {pack.tag && !pack.popular && (
                    <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-md">
                      {pack.tag}
                    </span>
                  )}

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-400">🪙 {pack.coins}</span>
                      {pack.bonus_coins > 0 && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          +{pack.bonus_coins} Bonus
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Unlocks ~{Math.floor((pack.coins + pack.bonus_coins) / 10)} full cliffhanger episodes
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-neutral-500">${pack.price_usd} / </span>
                      <span className="text-sm font-bold text-white">₹{pack.price_inr}</span>
                    </div>
                    <button
                      onClick={() => handleBuyPack(pack.id)}
                      disabled={loadingId === pack.id}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {loadingId === pack.id ? 'Processing...' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VIP_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative p-5 rounded-xl border transition-all flex flex-col justify-between ${
                    tier.id === 'annual'
                      ? 'bg-gradient-to-b from-purple-950/40 to-neutral-900 border-purple-500/60 shadow-lg shadow-purple-950/40'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {tier.id === 'annual' ? (
                    <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
                      Save 70%
                    </span>
                  ) : tier.intro_price_inr ? (
                    <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 shadow-md">
                      Intro ₹{tier.intro_price_inr}
                    </span>
                  ) : null}

                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-black text-white">{tier.name}</h3>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-purple-300">₹{tier.price_inr}</span>
                      <span className="text-xs text-neutral-400">(${tier.price_usd})</span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Unlimited access for {tier.duration_days} days
                    </p>

                    <ul className="mt-4 space-y-2">
                      {tier.benefits.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-neutral-800">
                    <button
                      onClick={() => handleBuyVIP(tier.id)}
                      disabled={loadingId === tier.id || (isVIP && vipTier === tier.id)}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                        isVIP && vipTier === tier.id
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-600/30'
                      }`}
                    >
                      {loadingId === tier.id
                        ? 'Processing...'
                        : isVIP && vipTier === tier.id
                        ? 'Current Active Plan'
                        : `Subscribe ${tier.name}`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Micro-footnote */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-neutral-500">
              * Episodes 1–5 are completely free to enjoy. Episode 6+ unlock with 10 coins or unlimited with VIP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
