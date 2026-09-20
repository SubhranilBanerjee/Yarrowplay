'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { X, Play, Volume2, VolumeX, CheckCircle, Coins, Sparkles } from 'lucide-react';

const SPONSOR_ADS = [
  {
    title: 'DramaBox Premium - Binge Short Dramas Anywhere',
    sponsor: 'DramaBox Entertainment',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        <div className="p-4 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 uppercase tracking-wide">
              Rewarded Sponsor
            </span>
            <span className="text-xs text-neutral-400 font-medium">
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
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {adFinished && (
              <button
                onClick={closeRewardedAd}
                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
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
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-xs font-mono font-bold text-white border border-white/20">
              ⏱ {timeLeft}s
            </div>
          )}

          {/* Claim celebration overlay */}
          {rewardClaimed && (
            <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in zoom-in-95 duration-200">
              <CheckCircle className="w-16 h-16 text-emerald-400 mb-2" />
              <h3 className="text-xl font-black text-white">Reward Claimed!</h3>
              <p className="text-sm text-amber-300 font-bold mt-1">
                🪙 +2 Free Coins added to your wallet!
              </p>
              <p className="text-xs text-neutral-400 mt-2">New Balance: {coins} coins</p>
            </div>
          )}
        </div>

        {/* Ad details & Claim button footer */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex flex-col gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
              {ad.sponsor}
            </span>
            <h4 className="text-sm font-bold text-white leading-snug">{ad.title}</h4>
            <p className="text-xs text-neutral-400 mt-0.5">{ad.tagline}</p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
              <Coins className="w-4 h-4" />
              <span>Reward: 2 Coins</span>
            </div>

            <button
              onClick={handleClaimReward}
              disabled={!adFinished || claiming || rewardClaimed}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                rewardClaimed
                  ? 'bg-emerald-600 text-white'
                  : adFinished
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 shadow-amber-500/20'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
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
