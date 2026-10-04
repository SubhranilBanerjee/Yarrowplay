'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, StoreTab } from '@/context/WalletContext';
import { VIP_TIERS } from '@/data/coinPacks';
import {
  X,
  Sparkles,
  Zap,
  Crown,
  Check,
  Coins,
  ShieldCheck,
  PlayCircle,
  Tag,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { CoinIcon } from '@/components/ui/CoinIcon';

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
    packages,
    promotions,
    transactions,
    fetchTransactions,
    redeemPromo,
    activeStoreTab,
    setActiveStoreTab,
  } = useWallet();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Promo code input state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Transaction history filter
  const [historyFilter, setHistoryFilter] = useState<'all' | 'earned' | 'spent'>('all');
  const [historyList, setHistoryList] = useState<any[]>(transactions);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeStoreTab === 'history' && isStoreOpen) {
      setIsLoadingHistory(true);
      fetchTransactions(historyFilter).then((data) => {
        setHistoryList(data);
        setIsLoadingHistory(false);
      });
    }
  }, [activeStoreTab, historyFilter, isStoreOpen]);

  if (!isStoreOpen) return null;

  const handleBuyPack = async (packId: string) => {
    setLoadingId(packId);
    setSuccessMsg(null);
    setErrorMsg(null);
    const res = await purchaseCoins(packId);
    setLoadingId(null);
    if (res.success) {
      setSuccessMsg(`🎉 Successfully acquired coins! New Balance: ${res.new_balance}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || 'Failed to complete transaction');
    }
  };

  const handleBuyVIP = async (tierId: string) => {
    setLoadingId(tierId);
    setSuccessMsg(null);
    setErrorMsg(null);
    const res = await purchaseVIP(tierId);
    setLoadingId(null);
    if (res.success) {
      setSuccessMsg(`👑 VIP Membership Activated! Enjoy unlimited ad-free access.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || 'Failed to activate VIP');
    }
  };

  const handleRedeemPromo = async (codeToRedeem?: string) => {
    const code = codeToRedeem || promoCodeInput;
    if (!code.trim()) return;

    setIsRedeeming(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await redeemPromo(code.trim());
    setIsRedeeming(false);

    if (res.success) {
      setSuccessMsg(res.message || '🎉 Promotion code redeemed successfully!');
      setPromoCodeInput('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || 'Invalid or expired promotional code.');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setPromoCodeInput(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#101820] border border-slate-200 dark:border-[#27313A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-white dark:bg-[#151F28] p-5 sm:p-6 border-b border-slate-200 dark:border-[#27313A]">
          <button
            onClick={closeCoinStore}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-[#7F8993] dark:hover:text-[#F5F1E8] dark:hover:bg-[#101820] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center shadow-md">
              <Coins className="w-7 h-7 text-[#0B0F13]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-[#F5F1E8] flex items-center gap-2">
                Lighthouse Reels Coin Store
                {isVIP && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-[#F4C95D] border border-amber-500/30 flex items-center gap-1 font-semibold">
                    <Crown className="w-3 h-3" /> VIP ACTIVE
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#B7BEC6]">
                DramaBox-style episode unlocks, VIP subscriptions, promotions & coins
              </p>
            </div>
          </div>

          {/* Current Balance Bar */}
          <div className="mt-4 flex items-center justify-between bg-white dark:bg-[#0B1117] rounded-xl px-4 py-2.5 border border-slate-200 dark:border-[#27313A] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-[#B7BEC6] font-medium">Your Wallet:</span>
              <span className="text-lg font-black text-amber-600 dark:text-[#F4C95D] flex items-center gap-1.5">
                <CoinIcon className="w-5 h-5" /> {coins} <span className="text-xs font-normal text-slate-500 dark:text-[#B7BEC6]">coins</span>
              </span>
            </div>
            <button
              onClick={() => {
                closeCoinStore();
                openRewardedAd();
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 dark:bg-[#151F28] dark:hover:bg-[#101820] dark:text-[#F4C95D] dark:border-[#27313A] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <PlayCircle className="w-3.5 h-3.5 text-amber-600 dark:text-[#F4C95D]" />
              Watch Ad (+2 Free)
            </button>
          </div>
        </div>

        {/* 4 Tabs: Coins, VIP, Promotions, Transaction History */}
        <div className="flex border-b border-slate-200 dark:border-[#27313A] bg-white dark:bg-[#0B1117] px-4 pt-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveStoreTab('coins')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeStoreTab === 'coins'
                ? 'border-purple-600 text-purple-700 dark:border-[#F4C95D] dark:text-[#F4C95D]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-[#7F8993] dark:hover:text-[#F5F1E8]'
            }`}
          >
            <Coins className="w-4 h-4" /> Coin Packs
          </button>
          <button
            onClick={() => setActiveStoreTab('vip')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeStoreTab === 'vip'
                ? 'border-purple-600 text-purple-700 dark:border-[#F4C95D] dark:text-[#F4C95D]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-[#7F8993] dark:hover:text-[#F5F1E8]'
            }`}
          >
            <Crown className="w-4 h-4" /> VIP Passes
          </button>
          <button
            onClick={() => setActiveStoreTab('promo')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeStoreTab === 'promo'
                ? 'border-purple-600 text-purple-700 dark:border-[#F4C95D] dark:text-[#F4C95D]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-[#7F8993] dark:hover:text-[#F5F1E8]'
            }`}
          >
            <Tag className="w-4 h-4" /> Promotions
          </button>
          <button
            onClick={() => setActiveStoreTab('history')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeStoreTab === 'history'
                ? 'border-purple-600 text-purple-700 dark:border-[#F4C95D] dark:text-[#F4C95D]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-[#7F8993] dark:hover:text-[#F5F1E8]'
            }`}
          >
            <History className="w-4 h-4" /> History
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-[#68B88A]/15 dark:border-[#68B88A]/30 dark:text-[#68B88A] text-xs sm:text-sm flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-[#68B88A]" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 dark:bg-[#D96868]/15 dark:border-[#D96868]/30 dark:text-[#D96868] text-xs sm:text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-white dark:bg-[#0B1117] flex-1">
          {/* TAB 1: COIN PACKS */}
          {activeStoreTab === 'coins' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    pack.popular || pack.best_value
                      ? 'bg-white dark:bg-[#151F28] border-purple-400 dark:border-[#F4C95D]/60 shadow-md ring-1 ring-purple-400/20'
                      : 'bg-white dark:bg-[#111A22] border-slate-200 dark:border-[#27313A] hover:border-purple-300 dark:hover:border-[#27313A]/80 shadow-sm hover:shadow-md'
                  }`}
                >
                  {(pack.popular || pack.best_value || pack.tag) && (
                    <span
                      className={`absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-sm ${
                        pack.popular || pack.best_value
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-[#1C252D] dark:text-[#F5F1E8] dark:border-[#27313A]'
                      }`}
                    >
                      {pack.tag || (pack.best_value ? 'BEST VALUE' : 'MOST POPULAR')}
                    </span>
                  )}

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-600 dark:text-[#F4C95D] flex items-center gap-1.5">
                        <CoinIcon className="w-6 h-6" /> {pack.coins}
                      </span>
                      {pack.bonus_coins > 0 && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-[#68B88A] dark:bg-[#68B88A]/15 dark:border-[#68B88A]/30 px-2 py-0.5 rounded">
                          +{pack.bonus_coins} Bonus
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#7F8993] mt-1 font-medium">
                      Unlocks ~{Math.floor((pack.coins + (pack.bonus_coins || 0)) / 10)} cliffhanger episodes
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#27313A] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-[#7F8993] font-medium">${pack.price_usd} / </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-[#F5F1E8]">₹{pack.price_inr}</span>
                    </div>
                    <button
                      onClick={() => handleBuyPack(pack.id)}
                      disabled={loadingId === pack.id}
                      className="btn-primary px-4 py-2 rounded-lg text-white font-bold text-xs shadow-md transition-transform disabled:opacity-50 cursor-pointer"
                    >
                      {loadingId === pack.id ? 'Processing...' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: VIP PASSES */}
          {activeStoreTab === 'vip' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VIP_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative p-5 rounded-xl border transition-all flex flex-col justify-between ${
                    tier.id === 'annual'
                      ? 'bg-white dark:bg-[#151F28] border-purple-400 dark:border-[#F4C95D]/60 shadow-md ring-1 ring-purple-400/20'
                      : 'bg-white dark:bg-[#111A22] border-slate-200 dark:border-[#27313A] hover:border-purple-300 dark:hover:border-[#27313A]/80 shadow-sm hover:shadow-md'
                  }`}
                >
                  {tier.id === 'annual' ? (
                    <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                      Save 70%
                    </span>
                  ) : tier.intro_price_inr ? (
                    <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm">
                      Intro ₹{tier.intro_price_inr}
                    </span>
                  ) : null}

                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500 dark:text-[#F4C95D]" />
                      <h3 className="text-lg font-black text-slate-900 dark:text-[#F5F1E8]">{tier.name}</h3>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-[#F4C95D]">₹{tier.price_inr}</span>
                      <span className="text-xs text-slate-500 dark:text-[#7F8993] font-medium">(${tier.price_usd})</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#B7BEC6] mt-1 font-medium">
                      Unlimited access for {tier.duration_days} days
                    </p>

                    <ul className="mt-4 space-y-2">
                      {tier.benefits.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-[#B7BEC6]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#68B88A] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-[#27313A]">
                    <button
                      onClick={() => handleBuyVIP(tier.id)}
                      disabled={loadingId === tier.id || (isVIP && vipTier === tier.id)}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                        isVIP && vipTier === tier.id
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-[#68B88A]/20 dark:text-[#68B88A] dark:border-[#68B88A]/40'
                          : 'btn-primary text-white font-bold'
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

          {/* TAB 3: PROMOTIONS */}
          {activeStoreTab === 'promo' && (
            <div className="space-y-5">
              {/* Promo Code Input Box */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#151F28] border border-slate-200 dark:border-[#27313A] shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F1E8] mb-1 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-600 dark:text-[#F4C95D]" />
                  Redeem Promo Code
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#B7BEC6] mb-3">
                  Enter your promotional coupon code to unlock free coins or instant VIP access.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME50, DRAMABOX"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1117] border border-slate-300 dark:border-[#27313A] text-slate-900 dark:text-[#F5F1E8] text-xs font-mono uppercase focus:outline-none focus:border-purple-500 dark:focus:border-[#F4C95D] focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => handleRedeemPromo()}
                    disabled={isRedeeming || !promoCodeInput.trim()}
                    className="btn-primary px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isRedeeming ? 'Applying...' : 'Apply Code'}
                  </button>
                </div>
              </div>

              {/* Active Promotional Deals */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 dark:text-[#7F8993] uppercase tracking-wider mb-3">
                  Featured Offers & Coupon Codes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promotions.map((promo) => (
                    <div
                      key={promo.id || promo.code}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-[#27313A] bg-white dark:bg-[#111A22] flex flex-col justify-between hover:border-purple-400 dark:hover:border-[#F4C95D]/40 shadow-sm transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-700 dark:text-[#F4C95D] flex items-center gap-1">
                            {promo.reward_type === 'coins' ? (
                              <><CoinIcon className="w-4 h-4" /> +{promo.reward_value} Coins</>
                            ) : (
                              <>👑 {promo.reward_value} Days VIP</>
                            )}
                          </span>
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#151F28] dark:hover:bg-[#101820] dark:text-[#B7BEC6] dark:hover:text-[#F5F1E8] border border-slate-200 dark:border-[#27313A] flex items-center gap-1 cursor-pointer"
                            title="Click to copy"
                          >
                            {copiedCode === promo.code ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#68B88A]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {promo.code}
                          </button>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-[#F5F1E8] mt-2">{promo.title}</h5>
                        {promo.description && (
                          <p className="text-[11px] text-slate-600 dark:text-[#7F8993] mt-1 leading-snug">
                            {promo.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#27313A]/60 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-600 dark:text-[#68B88A] font-semibold">Active Offer</span>
                        <button
                          onClick={() => handleRedeemPromo(promo.code)}
                          className="text-[11px] font-bold text-purple-700 hover:text-purple-900 dark:text-[#F4C95D] dark:hover:underline cursor-pointer"
                        >
                          Claim Now →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRANSACTION HISTORY */}
          {activeStoreTab === 'history' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                {(['all', 'earned', 'spent'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setHistoryFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      historyFilter === filter
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-[#151F28] dark:text-[#B7BEC6] dark:hover:text-[#F5F1E8] border border-slate-200 dark:border-[#27313A]'
                    }`}
                  >
                    {filter === 'all' ? 'All Transactions' : filter === 'earned' ? 'Coins Earned (+)' : 'Coins Spent (-)'}
                  </button>
                ))}
              </div>

              {/* Transactions Ledger */}
              {isLoadingHistory ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-[#7F8993]">
                  Loading transactions...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center rounded-xl bg-white dark:bg-[#111A22] border border-slate-200 dark:border-[#27313A] shadow-sm">
                  <Coins className="w-8 h-8 text-slate-400 dark:text-[#7F8993] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-[#F5F1E8]">No transactions found</p>
                  <p className="text-[11px] text-slate-500 dark:text-[#7F8993] mt-1">
                    Your coin rewards, episode unlocks, and top-ups will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
                  {historyList.map((tx: any) => {
                    const isPositive = Number(tx.amount) > 0;
                    return (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl bg-white dark:bg-[#111A22] border border-slate-200 dark:border-[#27313A] flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-[#27313A]/80 shadow-sm transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-[#68B88A]/15 dark:text-[#68B88A] dark:border-[#68B88A]/30'
                                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-[#D96868]/15 dark:text-[#D96868] dark:border-[#D96868]/30'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-[#F5F1E8] truncate">
                              {tx.description || tx.type}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-[#7F8993]">
                              {new Date(tx.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-black ${
                              isPositive ? 'text-emerald-700 dark:text-[#68B88A]' : 'text-red-600 dark:text-[#D96868]'
                            }`}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount} coins
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-[#7F8993] capitalize">{tx.type?.replace('_', ' ')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Micro-footnote */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500 dark:text-[#7F8993]">
              * Episodes 1–2 are completely free to enjoy. Episode 3+ unlock with coins or unlimited with VIP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
