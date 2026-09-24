'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { X, Play, Volume2, VolumeX, CheckCircle, Coins, Sparkles } from 'lucide-react';

const SPONSOR_ADS = [
  {
    title: 'Lighthouse Reels VIP - Binge Short Dramas Anywhere',
    sponsor: 'Lighthouse Reels',
    videoUrl: 'https://commondatastream.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    tagline: 'Unlock endless romance, revenge, and mystery series in bite-sized episodes!',
  },
  {
    title: 'Pulse Gaming Headset - Ultra Low Latency 3D Audio',
    sponsor: 'Apex Audio Tech',
    videoUrl: 'https://commondatastream.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tagline: 'Experience cinema quality sound in every pocket thriller.',
  },
];

export default function RewardedAdModal() {
  const { isRewardedAdOpen, closeRewardedAd, watchRewardAd, coins } = useWallet();

  const [timeLeft, setTimeLeft] = useState(15);
  const [adFinished, setAdFinished] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const ad = SPONSOR_ADS[0];

  useEffect(() => {
    if (!isRewardedAdOpen) {
      setTimeLeft(15);
      setAdFinished(false);
      setClaiming(false);
      setRewardClaimed(false);
      return;
    }

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
    const res = await watchRewardAd();
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
      <div className="relative w-full max-w-lg bg-[#101820] border border-[#27313A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        <div className="p-4 bg-[#151F28] border-b border-[#27313A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-[#F4C95D]/20 text-[#F4C95D] font-bold border border-[#F4C95D]/30 uppercase tracking-wide">
              Rewarded Sponsor
            </span>
            <span className="text-xs text-[#B7BEC6] font-medium">
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
              className="p-1.5 rounded-lg bg-[#101820] text-[#B7BEC6] hover:text-[#F5F1E8] cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {adFinished && (
              <button
                onClick={closeRewardedAd}
                className="p-1.5 rounded-lg bg-[#101820] text-[#7F8993] hover:text-[#F5F1E8] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-[#05080B] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={ad.videoUrl}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
            onEnded={() => setAdFinished(true)}
          />

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
              <p className="text-sm text-[#F4C95D] font-bold mt-1">
                🪙 +2 Free Coins added to your wallet!
              </p>
              <p className="text-xs text-[#B7BEC6] mt-2">New Balance: {coins} coins</p>
            </div>
          )}
        </div>

        {/* Ad details & Claim button footer */}
        <div className="p-4 bg-[#111A22] border-t border-[#27313A] flex flex-col gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#F4C95D] tracking-wider">
              {ad.sponsor}
            </span>
            <h4 className="text-sm font-bold text-[#F5F1E8] leading-snug">{ad.title}</h4>
            <p className="text-xs text-[#B7BEC6] mt-0.5">{ad.tagline}</p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#F4C95D] font-bold">
              <Coins className="w-4 h-4" />
              <span>Reward: 2 Coins</span>
            </div>

            <button
              onClick={handleClaimReward}
              disabled={!adFinished || claiming || rewardClaimed}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                rewardClaimed
                  ? 'bg-[#68B88A] text-[#0B0F13]'
                  : adFinished
                  ? 'bg-[#F4C95D] hover:bg-[#FFD978] active:bg-[#DDB347] text-[#0B0F13]'
                  : 'bg-[#141D26] text-[#7F8993] cursor-not-allowed border border-[#27313A]'
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
