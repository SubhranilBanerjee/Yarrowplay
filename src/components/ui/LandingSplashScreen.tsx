'use client';

import React, { useEffect, useState } from 'react';
import DriftWall, { DriftWallItem } from './DriftWall';
import { X, Play, Sparkles } from 'lucide-react';

export interface LandingSplashScreenProps {
  thumbnails: DriftWallItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const LandingSplashScreen: React.FC<LandingSplashScreenProps> = ({
  thumbnails,
  isOpen,
  onClose,
}) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#07060D]/90 backdrop-blur-xl transition-opacity duration-700 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome Splash Screen"
    >
      {/* Background 3D DriftWall filled exclusively with dynamic thumbnails */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto opacity-75">
        <DriftWall
          items={thumbnails}
          columns={5}
          tileWidth={210}
          tileHeight={135}
          gap={18}
          tilt={16}
          turn={-14}
          perspective={1100}
          depth={130}
          speed={38}
          direction="up"
          variance={0.4}
          parallax={0.5}
          lift={60}
          fade={0.55}
          dim={0.5}
          overlayColor="#07060D"
        />
      </div>

      {/* Radial Dark Vignette Overlay for focus */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#07060D] via-transparent to-[#07060D]/80" />

      {/* Top Controls: Skip Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg"
          aria-label="Skip splash screen"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Cinematic Card */}
      <div className="relative z-10 max-w-md w-[92%] p-8 rounded-3xl bg-[#12111A]/85 border border-white/15 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.25)] text-center flex flex-col items-center select-none transform transition-all duration-500 scale-100">
        {/* Glow pill badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#8B5CF6]/25 to-[#EC4899]/25 border border-[#8B5CF6]/40 text-[#EC4899] text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Now Live On Yarrowplay</span>
        </div>

        {/* Brand Headline */}
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-2 bg-gradient-to-r from-[#FFE600] via-[#FF6E00] to-[#FF20D9] bg-clip-text text-transparent filter drop-shadow-md">
          YARROWPLAY
        </h2>

        <p className="text-xs sm:text-sm text-gray-300 font-normal leading-relaxed mb-6 max-w-sm">
          Watch original mini-series, stream lossless tracks, and read creator stories in one unified universe.
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#6366F1] hover:brightness-110 text-white font-bold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(236,72,153,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Enter Yarrowplay</span>
          <span className="text-white/70 text-xs font-normal">({countdown}s)</span>
        </button>
      </div>
    </div>
  );
};

export default LandingSplashScreen;
