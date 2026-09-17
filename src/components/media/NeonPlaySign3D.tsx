'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Zap, Sparkles } from 'lucide-react';

export function NeonPlaySign3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isOn, setIsOn] = useState(true);
  const [flickering, setFlickering] = useState(false);

  const [scrollY, setScrollY] = useState(0);

  // Smooth dampening target values
  const [transformStyle, setTransformStyle] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
  });

  // Scroll listener for subtle 3D depth reaction
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1

    const tiltX = (0.5 - y) * 26; // max 13deg rotation around X
    const tiltY = (x - 0.5) * 28; // max 14deg rotation around Y

    setCoords({ x: (x - 0.5) * 2, y: (y - 0.5) * 2 });
    setTransformStyle({
      rotateX: tiltX,
      rotateY: tiltY,
      glareX: x * 100,
      glareY: y * 100,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
    setTransformStyle({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
    });
  };

  // Click toggle interaction with neon flicker
  const togglePower = () => {
    setFlickering(true);
    setTimeout(() => {
      setIsOn((prev) => !prev);
      setTimeout(() => setFlickering(false), 350);
    }, 120);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        setIsHovered(true);
        handleMouseMove(e);
      }}
      onMouseLeave={handleMouseLeave}
      onClick={togglePower}
      title="Click sign to toggle neon power"
      className="relative w-full max-w-[560px] aspect-[16/10] sm:aspect-[16/9.5] mx-auto select-none cursor-pointer perspective-[1200px] group flex items-center justify-center"
      style={{ perspective: '1200px' }}
    >
      {/* ── Background Wall Ambient Texture & Glow (Reacts to cursor) ── */}
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden transition-opacity duration-700 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at ${transformStyle.glareX}% ${transformStyle.glareY}%, 
              rgba(224, 0, 255, ${isOn ? (isHovered ? 0.28 : 0.18) : 0.03}) 0%, 
              rgba(124, 0, 255, ${isOn ? 0.12 : 0.02}) 40%, 
              transparent 70%
            ),
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.015) 0px, rgba(255, 255, 255, 0.015) 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.015) 0px, rgba(255, 255, 255, 0.015) 1px, transparent 1px, transparent 40px)
          `,
        }}
      />

      {/* ── Ground Light Reflection (Floor bounce from the neon) ── */}
      <div
        className="absolute -bottom-6 left-8 right-8 h-12 rounded-full blur-2xl transition-all duration-300 pointer-events-none"
        style={{
          background: isOn
            ? `radial-gradient(ellipse at center, rgba(255, 32, 217, 0.6) 0%, rgba(161, 0, 255, 0.3) 50%, transparent 80%)`
            : 'transparent',
          transform: `scaleX(${isHovered ? 1.15 : 1}) translateY(${coords.y * 5}px)`,
          opacity: isOn ? (flickering ? 0.3 : 0.85) : 0,
        }}
      />

      {/* ── Floating Bokeh Orbs (Multi-plane Parallax) ── */}
      <div
        className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-[#4D7BFF]/30 blur-2xl pointer-events-none transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${coords.x * -18}px, ${coords.y * -18}px, 40px)`,
        }}
      />
      <div
        className="absolute top-1/4 -right-6 w-24 h-24 rounded-full bg-[#FF20D9]/35 blur-2xl pointer-events-none transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${coords.x * 24}px, ${coords.y * 24}px, 60px)`,
        }}
      />
      <div
        className="absolute -bottom-8 left-1/3 w-28 h-28 rounded-full bg-[#A100FF]/30 blur-3xl pointer-events-none transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${coords.x * -12}px, ${coords.y * -12}px, 30px)`,
        }}
      />

      {/* ── CONSTANT AMBIENT MOTION WRAPPER ── */}
      <div 
        className="relative w-full h-full flex items-center justify-center will-change-transform"
        style={{
          animation: 'constantFloatingSign 5s ease-in-out infinite alternate',
          transform: `translateY(${Math.min(scrollY * 0.12, 50)}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* ── 3D TRANSFORM CONTAINER (All sign layers tilt together in true 3D) ── */}
        <div
          className={`relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out ${
            flickering ? 'animate-pulse' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${transformStyle.rotateX}deg) rotateY(${transformStyle.rotateY}deg)`,
          }}
        >
          {/* Layer 0: Cast Shadow on Wall (Depth = -30px) */}
          <div
            className="absolute inset-4 rounded-[40px] transition-all duration-300 pointer-events-none"
            style={{
              transform: `translateZ(-30px) translate3d(${coords.x * -15}px, ${coords.y * -15}px, 0)`,
              boxShadow: isOn
                ? `0 25px 60px rgba(0, 0, 0, 0.9), 0 0 100px rgba(224, 0, 255, ${isHovered ? 0.45 : 0.25})`
                : '0 20px 40px rgba(0, 0, 0, 0.8)',
            }}
          />

        {/* Layer 1: Mounting Brackets & Electrical Hardware (Depth = 15px) */}
        <div
          className="absolute inset-3 sm:inset-5 pointer-events-none"
          style={{ transform: 'translateZ(15px)' }}
        >
          {/* Top mounts */}
          <div className="absolute top-2 left-1/4 w-3.5 h-6 bg-[#1a0833] rounded-sm border border-white/20 shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
          <div className="absolute top-2 right-1/4 w-3.5 h-6 bg-[#1a0833] rounded-sm border border-white/20 shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>

          {/* Bottom mounts */}
          <div className="absolute bottom-2 left-1/4 w-3.5 h-6 bg-[#1a0833] rounded-sm border border-white/20 shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
          <div className="absolute bottom-2 right-1/4 w-3.5 h-6 bg-[#1a0833] rounded-sm border border-white/20 shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>

          {/* Transformers & Wiring Clips (matching reference photo) */}
          <div className="absolute top-5 right-12 w-8 h-4 bg-[#0a0014] rounded border border-white/10 flex items-center justify-center shadow-inner">
            <div className="w-5 h-1 bg-white/10 rounded-full" />
          </div>
          <div className="absolute bottom-5 right-14 w-8 h-4 bg-[#0a0014] rounded border border-white/10 flex items-center justify-center shadow-inner">
            <div className="w-5 h-1 bg-white/10 rounded-full" />
          </div>

          {/* Thin wiring paths */}
          <svg className="absolute inset-0 w-full h-full opacity-35" preserveAspectRatio="none">
            <path
              d="M 120 40 Q 180 80, 240 100 T 360 60"
              stroke="#B9A9D6"
              strokeWidth="1.2"
              fill="none"
              strokeDasharray="3 3"
            />
            <path
              d="M 380 180 Q 320 220, 220 230"
              stroke="#B9A9D6"
              strokeWidth="1.2"
              fill="none"
              strokeDasharray="4 2"
            />
          </svg>
        </div>

        {/* Layer 2: Outer Rounded Neon Tube Frame (Depth = 35px) */}
        <div
          className="absolute inset-4 sm:inset-6 rounded-[34px] sm:rounded-[44px] pointer-events-none transition-all duration-300"
          style={{
            transform: `translateZ(35px) translate3d(${coords.x * 6}px, ${coords.y * 6}px, 0)`,
            border: isOn
              ? '4px solid #FFFFFF'
              : '4px solid rgba(255, 255, 255, 0.15)',
            boxShadow: isOn
              ? `
                0 0 5px #FFFFFF,
                0 0 14px #E000FF,
                0 0 35px #A100FF,
                0 0 65px #7C00FF,
                inset 0 0 14px #E000FF,
                inset 0 0 30px #A100FF
              `
              : 'none',
          }}
        >
          {/* Secondary Outer Glass Tube Reflection Rim */}
          <div
            className="absolute -inset-[5px] rounded-[38px] sm:rounded-[48px] pointer-events-none transition-all duration-300"
            style={{
              border: isOn
                ? '2px solid rgba(255, 32, 217, 0.7)'
                : '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: isOn
                ? '0 0 20px rgba(255, 32, 217, 0.6), 0 0 45px rgba(224, 0, 255, 0.35)'
                : 'none',
            }}
          />
        </div>

        {/* Layer 3: Central Neon Play Triangle (Depth = 60px for maximum 3D popup!) */}
        <div
          className="relative flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44 pointer-events-none transition-all duration-300"
          style={{
            transform: `translateZ(60px) translate3d(${coords.x * 12}px, ${coords.y * 12}px, 0)`,
          }}
        >
          {/* Neon Triangle Inner Core Glow */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full filter overflow-visible"
            style={{
              filter: isOn
                ? 'drop-shadow(0 0 6px #FFFFFF) drop-shadow(0 0 18px #FF20D9) drop-shadow(0 0 40px #E000FF)'
                : 'none',
            }}
          >
            {/* Subtle Neon Center Backlight fill */}
            {isOn && (
              <polygon
                points="30,16 88,50 30,84"
                fill="url(#neonCenterGrad)"
                opacity={isHovered ? '0.45' : '0.28'}
                className="transition-opacity duration-300"
              />
            )}

            {/* Neon Outer Tube Path */}
            <polygon
              points="30,16 88,50 30,84"
              fill="none"
              stroke={isOn ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)'}
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Neon Inner High-Voltage Line */}
            <polygon
              points="30,16 88,50 30,84"
              fill="none"
              stroke={isOn ? '#FF20D9' : 'rgba(255, 32, 217, 0.15)'}
              strokeWidth="7"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={isOn ? '0.85' : '0.2'}
            />

            <defs>
              <radialGradient id="neonCenterGrad" cx="45%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#E000FF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7C00FF" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Layer 4: Front Glare & Power Indicator (Depth = 80px) */}
        <div
          className="absolute bottom-3 right-6 flex items-center gap-2 pointer-events-none transition-all duration-300"
          style={{ transform: 'translateZ(80px)' }}
        >
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isOn
                ? 'bg-[#22C55E] shadow-[0_0_10px_#22C55E]'
                : 'bg-white/20'
            }`}
          />
          <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-muted)] font-semibold">
            {isOn ? 'NEON ACTIVE' : 'STANDBY'}
          </span>
        </div>
        </div>
      </div>

      {/* Interaction Hint Badge */}
      <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--glass-surface-subtle)] border border-[var(--glass-border-subtle)] text-[10px] font-medium text-[var(--text-muted)] opacity-75 group-hover:opacity-100 group-hover:text-[var(--color-pink)] transition-all pointer-events-none">
        <Sparkles className="w-3 h-3 text-[var(--color-pink)]" />
        <span>Move cursor for 3D parallax · Click to toggle neon</span>
      </div>

      <style jsx>{`
        @keyframes constantFloatingSign {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-9px) rotate(0.6deg);
          }
          100% {
            transform: translateY(6px) rotate(-0.5deg);
          }
        }
      `}</style>
    </div>
  );
}
