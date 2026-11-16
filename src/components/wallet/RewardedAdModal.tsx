'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { X, Play, Volume2, VolumeX, CheckCircle, Coins, Sparkles, Loader2 } from 'lucide-react';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { createClient } from '@/lib/supabase/client';

interface AdItem {
  id?: string;
  title: string;
  sponsor: string;
  videoUrl: string;
  tagline: string;
}

export default function RewardedAdModal() {
  const { isRewardedAdOpen, closeRewardedAd, watchRewardAd, coins } = useWallet();

  const [timeLeft, setTimeLeft] = useState(15);
  const [adFinished, setAdFinished] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [ad, setAd] = useState<AdItem | null>(null);
  const [loadingAd, setLoadingAd] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isRewardedAdOpen) {
      setTimeLeft(15);
      setAdFinished(false);
      setClaiming(false);
      setRewardClaimed(false);
      return;
    }

    async function fetchAd() {
      setLoadingAd(true);
      try {
        const supabase = createClient();
        // 1. Try to fetch from advertiser_campaigns
        const { data: campaign } = await supabase
          .from('advertiser_campaigns')
          .select('id, name, video_url, headline, advertiser_name, cta_text')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (campaign && campaign.video_url) {
          setAd({
            id: campaign.id,
            title: campaign.headline || campaign.name || 'Sponsored Promotion',
            sponsor: campaign.advertiser_name || 'Verified Partner',
            videoUrl: campaign.video_url,
            tagline: campaign.cta_text || 'Watch to support creators and earn free reward coins.',
          });
          return;
        }

        // 2. Fetch popular video from database as spotlight preview
        const { data: videos } = await supabase
          .from('videos')
          .select('id, title, video_url, description')
          .order('views_count', { ascending: false })
          .limit(5);

        if (videos && videos.length > 0) {
          const selected = videos[Math.floor(Math.random() * videos.length)];
          setAd({
            id: selected.id,
            title: selected.title,
            sponsor: 'Lighthouse Reels Spotlight',
            videoUrl: selected.video_url,
            tagline: selected.description || 'Watch to support creators and unlock your reward.',
          });
        }
      } catch (err) {
        console.warn('Failed to load dynamic ad from Supabase:', err);
      } finally {
        setLoadingAd(false);
      }
    }

    fetchAd();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAdFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRewardedAdOpen]);

  if (!isRewardedAdOpen) return null;

  const handleClaimReward = async () => {
    setClaiming(true);
    const res = await watchRewardAd(ad?.id);
    setClaiming(false);
    if (res.success) {
      setRewardClaimed(true);
      setTimeout(() => {
        closeRewardedAd();
      }, 2000);
    } else {
      alert(res.error || res.message || 'Failed to claim ad reward');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#101820] border border-slate-200 dark:border-[#27313A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-50 dark:bg-[#151F28] border-b border-slate-200 dark:border-[#27313A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 dark:bg-[#F4C95D]/20 dark:text-[#F4C95D] dark:border-[#F4C95D]/30 font-bold uppercase tracking-wide">
              Rewarded Sponsor
            </span>
            <span className="text-xs text-slate-600 dark:text-[#B7BEC6] font-medium">
              {adFinished ? 'Reward Unlocked!' : `Reward in ${timeLeft}s`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !videoRef.current.muted;
                  setIsMuted(videoRef.current.muted);
                }
              }}
              className="p-1.5 rounded-lg bg-white dark:bg-[#101820] text-slate-600 hover:text-slate-900 border border-slate-200 dark:border-transparent dark:text-[#B7BEC6] dark:hover:text-[#F5F1E8] cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {adFinished && (
              <button
                onClick={closeRewardedAd}
                className="p-1.5 rounded-lg bg-white dark:bg-[#101820] text-slate-400 hover:text-slate-800 border border-slate-200 dark:border-transparent dark:text-[#7F8993] dark:hover:text-[#F5F1E8] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-[#05080B] flex items-center justify-center overflow-hidden">
          {loadingAd ? (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <p className="text-xs">Loading sponsor broadcast...</p>
            </div>
          ) : ad?.videoUrl ? (
            <video
              ref={videoRef}
              src={ad.videoUrl}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover"
              onEnded={() => setAdFinished(true)}
            />
          ) : (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm font-semibold">Sponsored Presentation</p>
              <p className="text-xs mt-1 text-slate-500">Connecting to sponsor stream...</p>
            </div>
          )}

          {/* Countdown badge over video */}
          {!adFinished && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-[#070B0F]/85 backdrop-blur-md rounded-full text-xs font-mono font-bold text-[#F5F1E8] border border-white/10">
              ⏱ {timeLeft}s
            </div>
          )}

          {/* Claim celebration overlay */}
          {rewardClaimed && (
            <div className="absolute inset-0 bg-[#070B0F]/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in zoom-in-95 duration-200">
              <CheckCircle className="w-16 h-16 text-[#68B88A] mb-2" />
              <h3 className="text-xl font-black text-[#F5F1E8]">Reward Claimed!</h3>
              <p className="text-sm text-[#F4C95D] font-bold mt-1 flex items-center justify-center gap-1">
                <CoinIcon className="w-4 h-4" /> +2 Free Coins added to your wallet!
              </p>
              <p className="text-xs text-[#B7BEC6] mt-2">New Balance: {coins} coins</p>
            </div>
          )}
        </div>

        {/* Ad details & Claim button footer */}
        <div className="p-4 bg-white dark:bg-[#111A22] border-t border-slate-200 dark:border-[#27313A] flex flex-col gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-[#F4C95D] tracking-wider">
              {ad?.sponsor || 'Sponsor Broadcast'}
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#F5F1E8] leading-snug">
              {ad?.title || 'Featured Micro-Drama'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-[#B7BEC6] mt-0.5">
              {ad?.tagline || 'Watch sponsored previews to claim free wallet coins.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-[#F4C95D] font-bold">
              <Coins className="w-4 h-4" />
              <span>Reward: 2 Coins</span>
            </div>

            <button
              onClick={handleClaimReward}
              disabled={!adFinished || claiming || rewardClaimed}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                rewardClaimed
                  ? 'bg-emerald-600 text-white'
                  : adFinished
                  ? 'btn-primary text-white font-bold'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-[#141D26] dark:text-[#7F8993] dark:border-[#27313A] cursor-not-allowed'
              }`}
            >
              {rewardClaimed
                ? 'Claimed!'
                : claiming
                ? 'Claiming...'
                : adFinished
                ? 'Claim +2 Free Coins'
                : `Watch ${timeLeft}s to Claim`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
