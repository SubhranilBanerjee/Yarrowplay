'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

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
  claimDailyCheckIn: () => Promise<{ success: boolean; coins_earned?: number; coins_awarded?: number; message?: string; error?: string }>;
  watchRewardAd: (campaignId?: string) => Promise<{ success: boolean; coins_earned?: number; message?: string; error?: string }>;
  purchaseCoins: (packId: string) => Promise<{ success: boolean; message?: string; error?: string; new_balance?: number }>;
  purchaseVIP: (vipTierId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  // Modal controllers
  isCoinStoreOpen: boolean;
  isStoreOpen: boolean; // alias
  openCoinStore: () => void;
  closeCoinStore: () => void;
  isDailyRewardsOpen: boolean;
  openDailyRewards: () => void;
  closeDailyRewards: () => void;
  isRewardAdOpen: boolean;
  isRewardedAdOpen: boolean; // alias
  openRewardAd: () => void;
  openRewardedAd: () => void; // alias
  closeRewardAd: () => void;
  closeRewardedAd: () => void; // alias
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

  // Auto unlock preference (saved in localStorage)
  const [autoUnlockNext, setAutoUnlockNextState] = useState<boolean>(true);

  // Modals state
  const [isCoinStoreOpen, setIsCoinStoreOpen] = useState<boolean>(false);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState<boolean>(false);
  const [isRewardAdOpen, setIsRewardAdOpen] = useState<boolean>(false);

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

  const refreshWallet = useCallback(async () => {
    if (!user) {
      setCoins(0);
      setIsVIP(false);
      setVipTier('none');
      setCheckInStreak(0);
      setCanCheckIn(false);
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
          setIsCoinStoreOpen(true);
        }
        return { success: false, error: data.error, message: data.message };
      }

      if (data.new_balance !== undefined) {
        setCoins(data.new_balance);
      } else {
        refreshWallet();
      }

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
        return { success: true, coins_earned: data.coins_earned, coins_awarded: data.coins_earned, message: data.message };
      }
      return { success: false, error: data.error, message: data.error };
    } catch (err: any) {
      return { success: false, error: err?.message, message: err?.message };
    }
  };

  const watchRewardAd = async (campaignId?: string) => {
    try {
      const res = await fetch('/api/wallet/reward-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoins(data.new_balance);
        return { success: true, coins_earned: data.coins_earned, message: data.message };
      }
      return { success: false, error: data.error, message: data.error };
    } catch (err: any) {
      return { success: false, error: err?.message, message: err?.message };
    }
  };

  const purchaseCoins = async (packId: string) => {
    try {
      const res = await fetch('/api/wallet/purchase-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: packId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoins(data.new_balance);
        setIsCoinStoreOpen(false);
        return { success: true, message: data.message, new_balance: data.new_balance };
      }
      return { success: false, error: data.error, message: data.error };
    } catch (err: any) {
      return { success: false, error: err?.message, message: err?.message };
    }
  };

  const purchaseVIP = async (vipTierId: string) => {
    try {
      const res = await fetch('/api/wallet/purchase-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vip_tier_id: vipTierId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsVIP(true);
        setVipTier(data.vip_tier);
        setVipExpiresAt(data.vip_expires_at);
        setIsCoinStoreOpen(false);
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error, message: data.error };
    } catch (err: any) {
      return { success: false, error: err?.message, message: err?.message };
    }
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
        claimDailyCheckIn,
        watchRewardAd,
        purchaseCoins,
        purchaseVIP,
        isCoinStoreOpen,
        isStoreOpen: isCoinStoreOpen,
        openCoinStore: () => setIsCoinStoreOpen(true),
        closeCoinStore: () => setIsCoinStoreOpen(false),
        isDailyRewardsOpen,
        openDailyRewards: () => setIsDailyRewardsOpen(true),
        closeDailyRewards: () => setIsDailyRewardsOpen(false),
        isRewardAdOpen,
        isRewardedAdOpen: isRewardAdOpen,
        openRewardAd: () => setIsRewardAdOpen(true),
        openRewardedAd: () => setIsRewardAdOpen(true),
        closeRewardAd: () => setIsRewardAdOpen(false),
        closeRewardedAd: () => setIsRewardAdOpen(false),
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
