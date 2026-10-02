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
                DramaBox-style episode unlocks, VIP subscriptions, promotions & coins
              </p>
            </div>
          </div>

          {/* Current Balance Bar */}
          <div className="mt-4 flex items-center justify-between bg-[#0B1117] rounded-xl px-4 py-2.5 border border-[#27313A]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#B7BEC6]">Your Wallet:</span>
              <span className="text-lg font-black text-[#F4C95D] flex items-center gap-1.5">
                <CoinIcon className="w-5 h-5" /> {coins} <span className="text-xs font-normal text-[#B7BEC6]">coins</span>
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

        {/* 4 Tabs: Coins, VIP, Promotions, Transaction History */}
        <div className="flex border-b border-[#27313A] bg-[#0B1117] px-4 pt-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveStoreTab('coins')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeStoreTab === 'coins'
                ? 'border-[#F4C95D] text-[#F4C95D]'
                : 'border-transparent text-[#7F8993] hover:text-[#F5F1E8]'
            }`}
          >
            <Coins className="w-4 h-4" /> Coin Packs
          </button>
          <button
            onClick={() => setActiveStoreTab('vip')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeStoreTab === 'vip'
                ? 'border-[#F4C95D] text-[#F4C95D]'
                : 'border-transparent text-[#7F8993] hover:text-[#F5F1E8]'
            }`}
          >
            <Crown className="w-4 h-4" /> VIP Passes
          </button>
          <button
            onClick={() => setActiveStoreTab('promo')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeStoreTab === 'promo'
                ? 'border-[#F4C95D] text-[#F4C95D]'
                : 'border-transparent text-[#7F8993] hover:text-[#F5F1E8]'
            }`}
          >
            <Tag className="w-4 h-4" /> Promotions
          </button>
          <button
            onClick={() => setActiveStoreTab('history')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeStoreTab === 'history'
                ? 'border-[#F4C95D] text-[#F4C95D]'
                : 'border-transparent text-[#7F8993] hover:text-[#F5F1E8]'
            }`}
          >
            <History className="w-4 h-4" /> History
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#68B88A]/15 border border-[#68B88A]/30 text-[#68B88A] text-xs sm:text-sm flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#D96868]/15 border border-[#D96868]/30 text-[#D96868] text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* TAB 1: COIN PACKS */}
          {activeStoreTab === 'coins' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    pack.popular || pack.best_value
                      ? 'bg-[#151F28] border-[#F4C95D]/60 shadow-md'
                      : 'bg-[#111A22] border-[#27313A] hover:border-[#27313A]/80'
                  }`}
                >
                  {(pack.popular || pack.best_value || pack.tag) && (
                    <span
                      className={`absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-md ${
                        pack.popular || pack.best_value
                          ? 'bg-[#F4C95D] text-[#0B0F13]'
                          : 'bg-[#1C252D] text-[#F5F1E8] border border-[#27313A]'
                      }`}
                    >
                      {pack.tag || (pack.best_value ? 'BEST VALUE' : 'MOST POPULAR')}
                    </span>
                  )}

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#F4C95D] flex items-center gap-1.5"><CoinIcon className="w-6 h-6" /> {pack.coins}</span>
                      {pack.bonus_coins > 0 && (
                        <span className="text-xs font-bold text-[#68B88A] bg-[#68B88A]/15 px-2 py-0.5 rounded border border-[#68B88A]/30">
                          +{pack.bonus_coins} Bonus
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#7F8993] mt-1">
                      Unlocks ~{Math.floor((pack.coins + (pack.bonus_coins || 0)) / 10)} cliffhanger episodes
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
              <div className="p-4 rounded-xl bg-[#151F28] border border-[#27313A]">
                <h3 className="text-sm font-bold text-[#F5F1E8] mb-1 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#F4C95D]" />
                  Redeem Promo Code
                </h3>
                <p className="text-xs text-[#B7BEC6] mb-3">
                  Enter your promotional coupon code to unlock free coins or instant VIP access.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME50, DRAMABOX"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0B1117] border border-[#27313A] text-[#F5F1E8] text-xs font-mono uppercase focus:outline-none focus:border-[#F4C95D]"
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
                <h4 className="text-xs font-bold text-[#7F8993] uppercase tracking-wider mb-3">
                  Featured Offers & Coupon Codes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promotions.map((promo) => (
                    <div
                      key={promo.id || promo.code}
                      className="p-3.5 rounded-xl border border-[#27313A] bg-[#111A22] flex flex-col justify-between hover:border-[#F4C95D]/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#F4C95D] flex items-center gap-1">
                            {promo.reward_type === 'coins' ? (
                              <><CoinIcon className="w-4 h-4" /> +{promo.reward_value} Coins</>
                            ) : (
                              <>👑 {promo.reward_value} Days VIP</>
                            )}
                          </span>
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#151F28] hover:bg-[#101820] text-[#B7BEC6] hover:text-[#F5F1E8] border border-[#27313A] flex items-center gap-1 cursor-pointer"
                            title="Click to copy"
                          >
                            {copiedCode === promo.code ? (
                              <CheckCircle2 className="w-3 h-3 text-[#68B88A]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {promo.code}
                          </button>
                        </div>
                        <h5 className="text-xs font-bold text-[#F5F1E8] mt-2">{promo.title}</h5>
                        {promo.description && (
                          <p className="text-[11px] text-[#7F8993] mt-1 leading-snug">
                            {promo.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#27313A]/60 flex items-center justify-between">
                        <span className="text-[10px] text-[#68B88A] font-semibold">Active Offer</span>
                        <button
                          onClick={() => handleRedeemPromo(promo.code)}
                          className="text-[11px] font-bold text-[#F4C95D] hover:underline cursor-pointer"
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
                        ? 'bg-[#F4C95D] text-[#0B0F13] font-bold shadow-sm'
                        : 'bg-[#151F28] text-[#B7BEC6] hover:text-[#F5F1E8] border border-[#27313A]'
                    }`}
                  >
                    {filter === 'all' ? 'All Transactions' : filter === 'earned' ? 'Coins Earned (+)' : 'Coins Spent (-)'}
                  </button>
                ))}
              </div>

              {/* Transactions Ledger */}
              {isLoadingHistory ? (
                <div className="py-12 text-center text-xs text-[#7F8993]">
                  Loading transactions...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center rounded-xl bg-[#111A22] border border-[#27313A]">
                  <Coins className="w-8 h-8 text-[#7F8993] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-[#F5F1E8]">No transactions found</p>
                  <p className="text-[11px] text-[#7F8993] mt-1">
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
                        className="p-3 rounded-xl bg-[#111A22] border border-[#27313A] flex items-center justify-between gap-3 hover:border-[#27313A]/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isPositive
                                ? 'bg-[#68B88A]/15 text-[#68B88A] border border-[#68B88A]/30'
                                : 'bg-[#D96868]/15 text-[#D96868] border border-[#D96868]/30'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#F5F1E8] truncate">
                              {tx.description || tx.type}
                            </p>
                            <p className="text-[10px] text-[#7F8993]">
                              {new Date(tx.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-black ${
                              isPositive ? 'text-[#68B88A]' : 'text-[#D96868]'
                            }`}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount} coins
                          </span>
                          <p className="text-[10px] text-[#7F8993] capitalize">{tx.type?.replace('_', ' ')}</p>
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
            <p className="text-[11px] text-[#7F8993]">
              * Episodes 1–2 are completely free to enjoy. Episode 3+ unlock with coins or unlimited with VIP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
