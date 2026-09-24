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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#101820] border border-[#27313A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-[#151F28] p-6 border-b border-[#27313A]">
          <button
            onClick={closeCoinStore}
            className="absolute top-4 right-4 p-2 rounded-full text-[#7F8993] hover:text-[#F5F1E8] hover:bg-[#101820] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#F4C95D] flex items-center justify-center shadow-md">
              <Coins className="w-7 h-7 text-[#0B0F13]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F5F1E8] flex items-center gap-2">
                Lighthouse Reels Coin Store
                {isVIP && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F4C95D]/20 text-[#F4C95D] border border-[#F4C95D]/40 flex items-center gap-1 font-semibold">
                    <Crown className="w-3 h-3" /> VIP ACTIVE
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#B7BEC6]">
                Unlock episodes immediately or get unlimited VIP streaming
              </p>
            </div>
          </div>

          {/* Current Balance Bar */}
          <div className="mt-4 flex items-center justify-between bg-[#0B1117] rounded-xl px-4 py-2.5 border border-[#27313A]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#B7BEC6]">Your Wallet:</span>
              <span className="text-lg font-black text-[#F4C95D] flex items-center gap-1">
                🪙 {coins} <span className="text-xs font-normal text-[#B7BEC6]">coins</span>
              </span>
            </div>
            <button
              onClick={() => {
                closeCoinStore();
                openRewardedAd();
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#151F28] hover:bg-[#101820] text-[#F4C95D] border border-[#27313A] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-[#F4C95D]" />
              Watch Ad (+2 Free)
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#27313A] bg-[#0B1117] px-6 pt-2">
          <button
            onClick={() => setActiveTab('coins')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'coins'
                ? 'border-[#F4C95D] text-[#F4C95D]'
                : 'border-transparent text-[#7F8993] hover:text-[#F5F1E8]'
            }`}
          >
            <Coins className="w-4 h-4" /> Coin Packs
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'vip'
                ? 'border-[#F4C95D] text-[#F4C95D]'
                : 'border-transparent text-[#7F8993] hover:text-[#F5F1E8]'
            }`}
          >
            <Crown className="w-4 h-4" /> VIP Passes (Unlimited)
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#68B88A]/15 border border-[#68B88A]/30 text-[#68B88A] text-sm flex items-center gap-2">
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
                      ? 'bg-[#151F28] border-[#F4C95D]/60 shadow-md'
                      : 'bg-[#111A22] border-[#27313A] hover:border-[#27313A]/80'
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#F4C95D] text-[#0B0F13] shadow-md">
                      Best Value
                    </span>
                  )}
                  {pack.tag && !pack.popular && (
                    <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1C252D] text-[#F5F1E8] border border-[#27313A] shadow-md">
                      {pack.tag}
                    </span>
                  )}

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#F4C95D]">🪙 {pack.coins}</span>
                      {pack.bonus_coins > 0 && (
                        <span className="text-xs font-bold text-[#68B88A] bg-[#68B88A]/15 px-2 py-0.5 rounded border border-[#68B88A]/30">
                          +{pack.bonus_coins} Bonus
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#7F8993] mt-1">
                      Unlocks ~{Math.floor((pack.coins + pack.bonus_coins) / 10)} full cliffhanger episodes
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#27313A] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#7F8993]">${pack.price_usd} / </span>
                      <span className="text-sm font-bold text-[#F5F1E8]">₹{pack.price_inr}</span>
                    </div>
                    <button
                      onClick={() => handleBuyPack(pack.id)}
                      disabled={loadingId === pack.id}
                      className="px-4 py-2 rounded-lg bg-[#F4C95D] hover:bg-[#FFD978] active:bg-[#DDB347] text-[#0B0F13] font-bold text-xs shadow-md active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
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
                      ? 'bg-[#151F28] border-[#F4C95D]/60 shadow-md'
                      : 'bg-[#111A22] border-[#27313A] hover:border-[#27313A]/80'
                  }`}
                >
                  {tier.id === 'annual' ? (
                    <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#F4C95D] text-[#0B0F13] shadow-md">
                      Save 70%
                    </span>
                  ) : tier.intro_price_inr ? (
                    <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#F4C95D] text-[#0B0F13] shadow-md">
                      Intro ₹{tier.intro_price_inr}
                    </span>
                  ) : null}

                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-[#F4C95D]" />
                      <h3 className="text-lg font-black text-[#F5F1E8]">{tier.name}</h3>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#F4C95D]">₹{tier.price_inr}</span>
                      <span className="text-xs text-[#7F8993]">(${tier.price_usd})</span>
                    </div>
                    <p className="text-xs text-[#B7BEC6] mt-1">
                      Unlimited access for {tier.duration_days} days
                    </p>

                    <ul className="mt-4 space-y-2">
                      {tier.benefits.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-[#B7BEC6]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#68B88A] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#27313A]">
                    <button
                      onClick={() => handleBuyVIP(tier.id)}
                      disabled={loadingId === tier.id || (isVIP && vipTier === tier.id)}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                        isVIP && vipTier === tier.id
                          ? 'bg-[#68B88A]/20 text-[#68B88A] border border-[#68B88A]/40'
                          : 'bg-[#F4C95D] hover:bg-[#FFD978] active:bg-[#DDB347] text-[#0B0F13]'
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
            <p className="text-[11px] text-[#7F8993]">
              * Episodes 1–5 are completely free to enjoy. Episode 6+ unlock with 10 coins or unlimited with VIP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
