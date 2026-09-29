'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { COIN_PACKS, VIP_TIERS, DEFAULT_PROMOTIONS, CoinPack, VIPTier, Promotion } from '@/data/coinPacks';

export type StoreTab = 'coins' | 'vip' | 'promo' | 'history';

interface WalletContextType {
  coins: number;
  isVIP: boolean;
  vipTier: string;
  vipExpiresAt: string | null;
  checkInStreak: number;
  streak: number; // alias
  canCheckIn: boolean;
  isLoading: boolean;
  autoUnlockNext: boolean;
  setAutoUnlockNext: (val: boolean) => void;
  refreshWallet: () => Promise<void>;
  unlockEpisode: (videoId: string) => Promise<{ success: boolean; error?: string; message?: string; new_balance?: number }>;
  unlockEpisodeWithCoins: (videoId: string) => Promise<{ success: boolean; error?: string; message?: string; new_balance?: number }>; // alias
  unlockEpisodeWithAd: (videoId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  claimDailyCheckIn: () => Promise<{ success: boolean; coins_earned?: number; coins_awarded?: number; message?: string; error?: string }>;
  watchRewardAd: (campaignId?: string, unlockVideoId?: string) => Promise<{ success: boolean; coins_earned?: number; message?: string; error?: string }>;
  purchaseCoins: (packId: string) => Promise<{ success: boolean; message?: string; error?: string; new_balance?: number }>;
  purchaseVIP: (vipTierId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  redeemPromo: (code: string) => Promise<{ success: boolean; message?: string; error?: string; new_balance?: number; vip_tier?: string; vip_expires_at?: string }>;
  
  // Data
  packages: CoinPack[];
  promotions: Promotion[];
  transactions: any[];
  fetchTransactions: (type?: string) => Promise<any[]>;

  // Modal controllers
  isCoinStoreOpen: boolean;
  isStoreOpen: boolean; // alias
  activeStoreTab: StoreTab;
  setActiveStoreTab: (tab: StoreTab) => void;
  openCoinStore: (tab?: StoreTab) => void;
  closeCoinStore: () => void;

  isDailyRewardsOpen: boolean;
  openDailyRewards: () => void;
  closeDailyRewards: () => void;

  isRewardAdOpen: boolean;
  isRewardedAdOpen: boolean; // alias
  rewardAdVideoId: string | null;
  openRewardAd: (unlockVideoId?: string) => void;
  openRewardedAd: (unlockVideoId?: string) => void; // alias
  closeRewardAd: () => void;
  closeRewardedAd: () => void; // alias

  // DramaBox Episode Unlock Modal
  isUnlockModalOpen: boolean;
  unlockModalVideo: any | null;
  openUnlockModal: (video: any) => void;
  closeUnlockModal: () => void;

  // Lighthouse Reels Subscription Modal
  isSubscriptionModalOpen: boolean;
  subscriptionDefaultTier: 'weekly' | 'monthly' | 'yearly';
  openSubscriptionModal: (tier?: 'weekly' | 'monthly' | 'yearly') => void;
  closeSubscriptionModal: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [coins, setCoins] = useState<number>(0);
  const [isVIP, setIsVIP] = useState<boolean>(false);
  const [vipTier, setVipTier] = useState<string>('none');
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null);
  const [checkInStreak, setCheckInStreak] = useState<number>(0);
  const [canCheckIn, setCanCheckIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Configurable packages & promotions from DB (or fallback)
  const [packages, setPackages] = useState<CoinPack[]>(COIN_PACKS);
  const [promotions, setPromotions] = useState<Promotion[]>(DEFAULT_PROMOTIONS);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Auto unlock preference (saved in localStorage)
  const [autoUnlockNext, setAutoUnlockNextState] = useState<boolean>(true);

  // Modals state
  const [isCoinStoreOpen, setIsCoinStoreOpen] = useState<boolean>(false);
  const [activeStoreTab, setActiveStoreTab] = useState<StoreTab>('coins');
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState<boolean>(false);
  const [isRewardAdOpen, setIsRewardAdOpen] = useState<boolean>(false);
  const [rewardAdVideoId, setRewardAdVideoId] = useState<string | null>(null);

  // DramaBox Episode Unlock Modal state
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [unlockModalVideo, setUnlockModalVideo] = useState<any | null>(null);

  // Subscription Modal state
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [subscriptionDefaultTier, setSubscriptionDefaultTier] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const openSubscriptionModal = (tier: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    setSubscriptionDefaultTier(tier);
    setIsSubscriptionModalOpen(true);
  };
  const closeSubscriptionModal = () => setIsSubscriptionModalOpen(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('yarrowplay_auto_unlock');
      if (saved !== null) {
        setAutoUnlockNextState(saved === 'true');
      }
    } catch {}
  }, []);

  const setAutoUnlockNext = (val: boolean) => {
    setAutoUnlockNextState(val);
    try {
      localStorage.setItem('yarrowplay_auto_unlock', String(val));
    } catch {}
  };

  // Fetch dynamic packages & promotions
  const loadPackagesAndPromos = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/packages');
      if (res.ok) {
        const data = await res.json();
        if (data.packages && data.packages.length > 0) {
          setPackages(data.packages);
        }
        if (data.promotions && data.promotions.length > 0) {
          setPromotions(data.promotions);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadPackagesAndPromos();
  }, [loadPackagesAndPromos]);

  const refreshWallet = useCallback(async () => {
    if (!user) {
      setCoins(0);
      setIsVIP(false);
      setVipTier('none');
      setVipExpiresAt(null);
      setCheckInStreak(0);
      setCanCheckIn(false);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        setCoins(data.coins_balance ?? 50);
        setIsVIP(!!data.is_vip);
        setVipTier(data.vip_tier || 'none');
        setVipExpiresAt(data.vip_expires_at || null);
        setCheckInStreak(data.check_in_streak || 0);
        setCanCheckIn(!!data.can_check_in);
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const fetchTransactions = async (type: string = 'all') => {
    if (!user) return [];
    try {
      const res = await fetch(`/api/wallet/transactions?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        return data.transactions || [];
      }
      return [];
    } catch {
      return [];
    }
  };

  const unlockEpisode = async (videoId: string) => {
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return { success: false, error: 'Authentication required' };
    }

    try {
      const res = await fetch('/api/episodes/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'INSUFFICIENT_COINS') {
          setActiveStoreTab('coins');
          setIsCoinStoreOpen(true);
        }
        return { success: false, error: data.error, message: data.message };
      }

      if (data.new_balance !== undefined) {
        setCoins(data.new_balance);
      } else {
        refreshWallet();
      }

      setIsUnlockModalOpen(false);
      return { success: true, message: data.message, new_balance: data.new_balance };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to unlock' };
    }
  };

  const claimDailyCheckIn = async () => {
    try {
      const res = await fetch('/api/wallet/daily-checkin', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoins(data.new_balance);
        setCheckInStreak(data.current_streak);
        setCanCheckIn(false);
        fetchTransactions();
        return { success: true, coins_earned: data.coins_earned, coins_awarded: data.coins_earned, message: data.message };
      }
      return { success: false, error: data.error, message: data.error };
    } catch (err: any) {
      return { success: false, error: err?.message, message: err?.message };
    }
  };

  const watchRewardAd = async (campaignId?: string, unlockVideoId?: string) => {
    try {
      const targetVideoId = unlockVideoId || rewardAdVideoId;
      const res = await fetch('/api/wallet/reward-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, unlock_video_id: targetVideoId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoins(data.new_balance);
        if (targetVideoId) {
          setIsUnlockModalOpen(false);
        }
        fetchTransactions();
        return { success: true, coins_earned: data.coins_earned, message: data.message };
      }
      return { success: false, error: data.error, message: data.error };
    } catch (err: any) {
      return { success: false, error: err?.message, message: err?.message };
    }
  };

  const unlockEpisodeWithAd = async (videoId: string) => {
    setRewardAdVideoId(videoId);
    setIsRewardAdOpen(true);
    return { success: true };
  };

  const ensureRazorpayLoaded = (): Promise<boolean> => {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if ((window as any).Razorpay) return Promise.resolve(true);
    return new Promise((resolve) => {
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        if ((window as any).Razorpay) return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const purchaseCoins = async (packId: string): Promise<{ success: boolean; message?: string; error?: string; new_balance?: number }> => {
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    try {
      // 1. Create order on server
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: packId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

      // 2. Ensure Razorpay checkout script is loaded
      await ensureRazorpayLoaded();
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        throw new Error('Payment gateway failed to load. Please refresh and try again.');
      }

      // 3. Open Razorpay checkout modal
      return new Promise((resolve) => {
        const rzp = new Razorpay({
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Lighthouse Reels',
          description: orderData.description || 'Coin Pack Purchase',
          order_id: orderData.order_id,
          prefill: {
            name: user.user_metadata?.display_name || user.email?.split('@')[0],
            email: user.email,
          },
          theme: { color: '#F4C95D' },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  pack_id: packId,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                if (verifyData.new_balance !== undefined) {
                  setCoins(verifyData.new_balance);
                }
                refreshWallet();
                fetchTransactions();
                resolve({
                  success: true,
                  message: verifyData.message || 'Successfully purchased coins!',
                  new_balance: verifyData.new_balance,
                });
              } else {
                resolve({
                  success: false,
                  error: verifyData.error || 'Payment verification failed',
                });
              }
            } catch (err: any) {
              resolve({ success: false, error: err.message || 'Payment verification error' });
            }
          },
          modal: {
            ondismiss: () => {
              resolve({ success: false, error: 'Payment window was closed' });
            },
          },
        });

        rzp.on('payment.failed', (resp: any) => {
          resolve({
            success: false,
            error: resp?.error?.description || 'Payment failed',
          });
        });

        rzp.open();
      });
    } catch (err: any) {
      return { success: false, error: err.message || 'Payment initiation failed' };
    }
  };

  const purchaseVIP = async (vipTierId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    try {
      // 1. Create order on server
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vip_tier_id: vipTierId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to initialize VIP pass order');
      }

      // 2. Ensure Razorpay checkout script is loaded
      await ensureRazorpayLoaded();
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        throw new Error('Payment gateway failed to load. Please refresh and try again.');
      }

      // 3. Open Razorpay checkout modal
      return new Promise((resolve) => {
        const rzp = new Razorpay({
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Lighthouse Reels VIP',
          description: orderData.description || 'VIP Pass Subscription',
          order_id: orderData.order_id,
          prefill: {
            name: user.user_metadata?.display_name || user.email?.split('@')[0],
            email: user.email,
          },
          theme: { color: '#F4C95D' },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  vip_tier_id: vipTierId,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                setIsVIP(true);
                if (verifyData.vip_tier) setVipTier(verifyData.vip_tier);
                if (verifyData.vip_expires_at) setVipExpiresAt(verifyData.vip_expires_at);
                refreshWallet();
                fetchTransactions();
                resolve({
                  success: true,
                  message: verifyData.message || 'VIP Pass activated successfully!',
                });
              } else {
                resolve({
                  success: false,
                  error: verifyData.error || 'Payment verification failed',
                });
              }
            } catch (err: any) {
              resolve({ success: false, error: err.message || 'Payment verification error' });
            }
          },
          modal: {
            ondismiss: () => {
              resolve({ success: false, error: 'Payment window was closed' });
            },
          },
        });

        rzp.on('payment.failed', (resp: any) => {
          resolve({
            success: false,
            error: resp?.error?.description || 'Payment failed',
          });
        });

        rzp.open();
      });
    } catch (err: any) {
      return { success: false, error: err.message || 'Payment initiation failed' };
    }
  };

  const redeemPromo = async (code: string) => {
    try {
      const res = await fetch('/api/wallet/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.new_balance !== undefined) {
          setCoins(data.new_balance);
        }
        if (data.vip_tier && data.vip_tier !== 'none') {
          setIsVIP(true);
          setVipTier(data.vip_tier);
          setVipExpiresAt(data.vip_expires_at);
        }
        fetchTransactions();
        return {
          success: true,
          message: data.message,
          new_balance: data.new_balance,
          vip_tier: data.vip_tier,
          vip_expires_at: data.vip_expires_at,
        };
      }
      return { success: false, error: data.error, message: data.error };
    } catch (err: any) {
      return { success: false, error: err?.message, message: err?.message };
    }
  };

  const openCoinStore = (tab: StoreTab = 'coins') => {
    setActiveStoreTab(tab);
    setIsCoinStoreOpen(true);
  };

  const openUnlockModal = (video: any) => {
    setUnlockModalVideo(video);
    setIsUnlockModalOpen(true);
  };

  const closeUnlockModal = () => {
    setIsUnlockModalOpen(false);
    setUnlockModalVideo(null);
  };

  return (
    <WalletContext.Provider
      value={{
        coins,
        isVIP,
        vipTier,
        vipExpiresAt,
        checkInStreak,
        streak: checkInStreak,
        canCheckIn,
        isLoading,
        autoUnlockNext,
        setAutoUnlockNext,
        refreshWallet,
        unlockEpisode,
        unlockEpisodeWithCoins: unlockEpisode,
        unlockEpisodeWithAd,
        claimDailyCheckIn,
        watchRewardAd,
        purchaseCoins,
        purchaseVIP,
        redeemPromo,
        packages,
        promotions,
        transactions,
        fetchTransactions,
        isCoinStoreOpen,
        isStoreOpen: isCoinStoreOpen,
        activeStoreTab,
        setActiveStoreTab,
        openCoinStore,
        closeCoinStore: () => setIsCoinStoreOpen(false),
        isDailyRewardsOpen,
        openDailyRewards: () => setIsDailyRewardsOpen(true),
        closeDailyRewards: () => setIsDailyRewardsOpen(false),
        isRewardAdOpen,
        isRewardedAdOpen: isRewardAdOpen,
        rewardAdVideoId,
        openRewardAd: (vidId?: string) => {
          if (vidId) setRewardAdVideoId(vidId);
          setIsRewardAdOpen(true);
        },
        openRewardedAd: (vidId?: string) => {
          if (vidId) setRewardAdVideoId(vidId);
          setIsRewardAdOpen(true);
        },
        closeRewardAd: () => {
          setIsRewardAdOpen(false);
          setRewardAdVideoId(null);
        },
        closeRewardedAd: () => {
          setIsRewardAdOpen(false);
          setRewardAdVideoId(null);
        },
        isUnlockModalOpen,
        unlockModalVideo,
        openUnlockModal,
        closeUnlockModal,
        isSubscriptionModalOpen,
        subscriptionDefaultTier,
        openSubscriptionModal,
        closeSubscriptionModal,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
