'use client';

import React, { useEffect, useState, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleDelay: number;
}

interface ConstellationNode {
  x: number;
  y: number;
}

export function SpaceHeroCanvas() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [stars, setStars] = useState<Star[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate deterministic stars on mount
  useEffect(() => {
    const generatedStars: Star[] = [];
    const count = 100;
    for (let i = 0; i < count; i++) {
      generatedStars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.2 + 0.8,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 3 + 2,
        twinkleDelay: Math.random() * 5,
      });
    }
    setStars(generatedStars);
  }, []);

  // Smooth scroll listener
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

  // Subtle mouse tracking for cosmic depth
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  // Pre-configured celestial constellations matching Reference Image 1
  const constellations: { nodes: ConstellationNode[]; connections: [number, number][] }[] = [
    // Top-left constellation (Cassiopeia / Orion style)
    {
      nodes: [
        { x: 12, y: 16 },
        { x: 18, y: 12 },
        { x: 25, y: 19 },
        { x: 32, y: 14 },
        { x: 38, y: 22 },
      ],
      connections: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ],
    },
    // Top-right constellation (Ursa style cluster)
    {
      nodes: [
        { x: 68, y: 10 },
        { x: 74, y: 16 },
        { x: 82, y: 14 },
        { x: 88, y: 22 },
        { x: 80, y: 26 },
        { x: 72, y: 24 },
      ],
      connections: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 1],
      ],
    },
    // Mid-left constellation
    {
      nodes: [
        { x: 8, y: 55 },
        { x: 15, y: 48 },
        { x: 22, y: 58 },
        { x: 19, y: 70 },
        { x: 10, y: 68 },
      ],
      connections: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 0],
      ],
    },
    // Lower-right constellation
    {
      nodes: [
        { x: 75, y: 65 },
        { x: 82, y: 58 },
        { x: 90, y: 66 },
        { x: 86, y: 78 },
      ],
      connections: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
    },
  ];

  // Motion calculation derived from scroll
  const scrollRatio = Math.min(scrollY / 800, 1.5);
  const nebulaOffsetY = scrollY * 0.35;
  const starsOffsetY = scrollY * 0.15;
  const plasmaOffsetY = scrollY * 0.6;
  const plasmaScale = 1 + scrollRatio * 0.15;
  const plasmaRotate = scrollRatio * 6;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none"
      style={{
        background: 'transparent',
      }}
    >
      {/* ── 1. CINEMATIC AMBIENT LIGHTING LAYERS ── */}
      <div
        className="absolute inset-0 transition-transform duration-75 ease-out will-change-transform"
        style={{
          transform: `translate3d(${(mousePos.x - 0.5) * -15}px, ${nebulaOffsetY * 0.8}px, 0)`,
        }}
      >
        {/* Deep Slate/Obsidian Base Ambiance */}
        <div
          className="absolute -top-24 -left-20 w-[650px] h-[650px] rounded-full blur-[140px] opacity-40 mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(16,24,32,0.7) 0%, rgba(11,17,23,0.4) 60%, transparent 80%)',
            transform: `translateY(${scrollY * -0.1}px)`,
          }}
        />

        {/* Subtle Blue-Gray Mid Ambiance */}
        <div
          className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full blur-[130px] opacity-30 mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(21,31,40,0.6) 0%, rgba(11,17,23,0.3) 50%, transparent 80%)',
            transform: `translateY(${scrollY * 0.25}px) rotate(${scrollY * 0.02}deg)`,
          }}
        />

        {/* Champagne Warm Light Glow */}
        <div
          className="absolute -bottom-20 left-1/4 w-[700px] h-[550px] rounded-full blur-[150px] opacity-25 mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(244,201,93,0.12) 0%, rgba(201,154,50,0.04) 45%, transparent 75%)',
            transform: `translateY(${scrollY * -0.2}px)`,
          }}
        />

        {/* Gold Accent Core */}
        <div
          className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full blur-[90px] opacity-20 mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(244,201,93,0.2) 0%, transparent 70%)',
            transform: `scale(${1 + scrollRatio * 0.2}) translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
          }}
        />
      </div>

      {/* ── 2. CINEMATIC LIGHT BEAM STREAM ── */}
      <div
        className="absolute inset-0 transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `translate3d(${scrollY * -0.15}px, ${plasmaOffsetY * 0.5}px, 0) scale(${plasmaScale}) rotate(${plasmaRotate}deg)`,
          transformOrigin: 'bottom left',
        }}
      >
        <svg
          viewBox="0 0 1000 800"
          preserveAspectRatio="none"
          className="w-full h-full opacity-30 mix-blend-screen filter blur-[24px]"
        >
          <defs>
            <linearGradient id="plasmaGrad" x1="0%" y1="100%" x2="80%" y2="20%">
              <stop offset="0%" stopColor="#C99A32" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#F4C95D" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#101820" stopOpacity="0" />
            </linearGradient>
            <filter id="plasmaGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="25" result="blur" />
            </filter>
          </defs>
          <path
            d="M -100,850 Q 150,600 280,420 T 600,180 Q 750,50 900,-50"
            fill="none"
            stroke="url(#plasmaGrad)"
            strokeWidth="90"
            strokeLinecap="round"
            filter="url(#plasmaGlow)"
          />
          <path
            d="M -80,820 Q 180,580 320,380 T 640,160 Q 790,40 920,-20"
            fill="none"
            stroke="#F4C95D"
            strokeWidth="15"
            strokeLinecap="round"
            opacity="0.4"
            filter="url(#plasmaGlow)"
          />
        </svg>
      </div>

      {/* ── 3. CELESTIAL CONSTELLATION MESH ── */}
      <svg
        className="absolute inset-0 w-full h-full transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `translate3d(${(mousePos.x - 0.5) * 10}px, ${starsOffsetY * 0.7}px, 0)`,
        }}
      >
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F5F1E8" stopOpacity="1" />
            <stop offset="40%" stopColor="#F4C95D" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C99A32" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Constellation Lines */}
        {constellations.map((constellation, cIdx) => (
          <g key={cIdx} className="opacity-30">
            {constellation.connections.map(([fromIdx, toIdx], lIdx) => {
              const from = constellation.nodes[fromIdx];
              const to = constellation.nodes[toIdx];
              return (
                <line
                  key={lIdx}
                  x1={`${from.x}%`}
                  y1={`${from.y}%`}
                  x2={`${to.x}%`}
                  y2={`${to.y}%`}
                  stroke="rgba(244, 201, 93, 0.25)"
                  strokeWidth="0.85"
                  strokeDasharray="4 2"
                />
              );
            })}

            {/* Star Nodes in Constellation */}
            {constellation.nodes.map((node, nIdx) => (
              <g key={nIdx}>
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r="2"
                  fill="#F5F1E8"
                  className="filter drop-shadow-[0_0_4px_#F4C95D]"
                />
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r="5"
                  fill="url(#starGlow)"
                />
              </g>
            ))}
          </g>
        ))}
      </svg>

      {/* ── 4. STARRY DEEP SPACE PARTICLES ── */}
      <div
        className="absolute inset-0 transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `translate3d(0, ${starsOffsetY}px, 0)`,
        }}
      >
        {stars.map((star, idx) => (
          <div
            key={idx}
            className="absolute rounded-full bg-[#F5F1E8] transition-opacity"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity * 0.7,
              boxShadow: star.size > 1.8 ? '0 0 4px 1px rgba(244, 201, 93, 0.4)' : 'none',
              animation: `spaceTwinkle ${star.twinkleSpeed}s infinite ease-in-out ${star.twinkleDelay}s`,
            }}
          />
        ))}
      </div>

      {/* ── 5. SUBTLE BOTTOM FADE INTO CONTENT FEED ── */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/70 to-transparent pointer-events-none" />

      {/* Inline animation keyframes for star twinkling */}
      <style jsx>{`
        @keyframes spaceTwinkle {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.85);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}
