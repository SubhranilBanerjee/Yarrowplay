'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

interface HeroLighthouseBackgroundProps {
  isLight?: boolean;
}

interface MistParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  twinkleSpeed: number;
}

function normalizeAngle(deg: number): number {
  let a = deg;
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
}

export function HeroLighthouseBackground({ isLight = false }: HeroLighthouseBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lanternRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Rotational physics state (damped inertia)
    let currentAngle = 195;
    let angularVelocity = 0;
    let targetAngle = 195;
    let hasMouseMoved = false;
    let idleTime = 0;

    let mouseX = width * 0.35;
    let mouseY = height * 0.4;

    // Coastal mist / dust particles for Tyndall scattering inside the beam
    const PARTICLE_COUNT = 85;
    const particles: MistParticle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: -0.18 - Math.random() * 0.25,
      vy: (Math.random() - 0.5) * 0.14,
      radius: 0.9 + Math.random() * 2.1,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.015 + Math.random() * 0.025,
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      hasMouseMoved = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      hasMouseMoved = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    /**
     * Draw a physically-modeled Fresnel beam cone with:
     * - Finite lens aperture waist at origin (not a sharp pinpoint)
     * - Inverse-square + Beer-Lambert exponential atmospheric attenuation
     */
    const drawVolumetricCone = (
      ox: number,
      oy: number,
      angleRad: number,
      halfAngleRad: number,
      length: number,
      apertureRadius: number,
      stops: Array<{ offset: number; color: string }>
    ) => {
      const perpX = -Math.sin(angleRad);
      const perpY = Math.cos(angleRad);

      const startTopX = ox + perpX * apertureRadius;
      const startTopY = oy + perpY * apertureRadius;
      const startBotX = ox - perpX * apertureRadius;
      const startBotY = oy - perpY * apertureRadius;

      const leftAngle = angleRad - halfAngleRad;
      const rightAngle = angleRad + halfAngleRad;

      const endLeftX = ox + Math.cos(leftAngle) * length;
      const endLeftY = oy + Math.sin(leftAngle) * length;
      const endRightX = ox + Math.cos(rightAngle) * length;
      const endRightY = oy + Math.sin(rightAngle) * length;

      const grad = ctx.createRadialGradient(ox, oy, apertureRadius * 0.5, ox, oy, length);
      for (const stop of stops) {
        grad.addColorStop(stop.offset, stop.color);
      }

      ctx.beginPath();
      ctx.moveTo(startTopX, startTopY);
      ctx.lineTo(endRightX, endRightY);
      ctx.arc(ox, oy, length, rightAngle, leftAngle, true);
      ctx.lineTo(startBotX, startBotY);
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Determine exact viewport coordinates of the lantern glass center
      let ox = width * 0.64;
      let oy = height * 0.19;
      if (lanternRef.current) {
        const rect = lanternRef.current.getBoundingClientRect();
        ox = rect.left + rect.width / 2;
        oy = rect.top + rect.height / 2;
      }

      // Compute target angle from lantern to mouse (or smooth autonomous sweep when idle)
      if (hasMouseMoved) {
        const dx = mouseX - ox;
        const dy = mouseY - oy;
        targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      } else {
        idleTime += 0.008;
        targetAngle = 192 + Math.sin(idleTime) * 30;
      }

      // Damped rotational inertia (Fresnel optic mass & friction)
      const diff = normalizeAngle(targetAngle - currentAngle);
      angularVelocity = angularVelocity * 0.80 + diff * 0.05;
      currentAngle += angularVelocity;

      const angleRad = (currentAngle * Math.PI) / 180;
      const maxDist = Math.hypot(width, height) * 1.15;

      ctx.save();
      ctx.globalCompositeOperation = isLight ? 'multiply' : 'screen';

      if (!isLight) {
        // 1. Wide Atmospheric Mie Scattering Halo (±21°, soft deep violet)
        drawVolumetricCone(ox, oy, angleRad, (21 * Math.PI) / 180, maxDist, 16, [
          { offset: 0.0, color: 'rgba(192, 132, 252, 0.34)' },
          { offset: 0.08, color: 'rgba(168, 85, 247, 0.22)' },
          { offset: 0.24, color: 'rgba(139, 92, 246, 0.11)' },
          { offset: 0.52, color: 'rgba(109, 40, 217, 0.04)' },
          { offset: 0.82, color: 'rgba(88, 28, 135, 0.01)' },
          { offset: 1.0, color: 'rgba(88, 28, 135, 0)' },
        ]);

        // 2. Primary Fresnel Collimated Beam (±10.5°, bright lavender-fuchsia)
        drawVolumetricCone(ox, oy, angleRad, (10.5 * Math.PI) / 180, maxDist, 12, [
          { offset: 0.0, color: 'rgba(250, 232, 255, 0.62)' },
          { offset: 0.06, color: 'rgba(232, 121, 249, 0.42)' },
          { offset: 0.20, color: 'rgba(192, 132, 252, 0.22)' },
          { offset: 0.45, color: 'rgba(147, 51, 234, 0.08)' },
          { offset: 0.78, color: 'rgba(126, 34, 206, 0.015)' },
          { offset: 1.0, color: 'rgba(88, 28, 135, 0)' },
        ]);

        // 3. Intense Paraxial Core Ray (±3.8°, incandescent warm-white to violet dispersion)
        drawVolumetricCone(ox, oy, angleRad, (3.8 * Math.PI) / 180, maxDist * 0.92, 7, [
          { offset: 0.0, color: 'rgba(255, 251, 235, 0.92)' },
          { offset: 0.04, color: 'rgba(245, 208, 254, 0.68)' },
          { offset: 0.15, color: 'rgba(232, 121, 249, 0.30)' },
          { offset: 0.38, color: 'rgba(168, 85, 247, 0.09)' },
          { offset: 0.72, color: 'rgba(139, 92, 246, 0.01)' },
          { offset: 1.0, color: 'rgba(139, 92, 246, 0)' },
        ]);

        // 4. Secondary Opposite Fresnel Optic Reflection (180° counter-beam, ~12% intensity)
        drawVolumetricCone(ox, oy, angleRad + Math.PI, (8.5 * Math.PI) / 180, maxDist * 0.55, 10, [
          { offset: 0.0, color: 'rgba(216, 180, 254, 0.20)' },
          { offset: 0.16, color: 'rgba(168, 85, 247, 0.09)' },
          { offset: 0.50, color: 'rgba(126, 34, 206, 0.02)' },
          { offset: 1.0, color: 'rgba(88, 28, 135, 0)' },
        ]);
      } else {
        // Light mode: subtle violet atmospheric beam
        ctx.globalCompositeOperation = 'source-over';
        drawVolumetricCone(ox, oy, angleRad, (17 * Math.PI) / 180, maxDist, 14, [
          { offset: 0.0, color: 'rgba(147, 51, 234, 0.28)' },
          { offset: 0.12, color: 'rgba(168, 85, 247, 0.16)' },
          { offset: 0.35, color: 'rgba(192, 132, 252, 0.07)' },
          { offset: 0.75, color: 'rgba(192, 132, 252, 0.01)' },
          { offset: 1.0, color: 'rgba(192, 132, 252, 0)' },
        ]);
        drawVolumetricCone(ox, oy, angleRad, (6 * Math.PI) / 180, maxDist * 0.85, 8, [
          { offset: 0.0, color: 'rgba(255, 255, 255, 0.55)' },
          { offset: 0.12, color: 'rgba(233, 213, 255, 0.28)' },
          { offset: 0.45, color: 'rgba(168, 85, 247, 0.06)' },
          { offset: 1.0, color: 'rgba(168, 85, 247, 0)' },
        ]);
      }

      // 5. Lantern Aperture Bloom & Diffraction Halo
      const bloomRadius = isLight ? 140 : 190;
      const bloomGrad = ctx.createRadialGradient(ox, oy, 2, ox, oy, bloomRadius);
      if (!isLight) {
        bloomGrad.addColorStop(0.0, 'rgba(255, 251, 235, 0.95)');
        bloomGrad.addColorStop(0.12, 'rgba(245, 208, 254, 0.65)');
        bloomGrad.addColorStop(0.35, 'rgba(192, 132, 252, 0.28)');
        bloomGrad.addColorStop(0.7, 'rgba(124, 58, 237, 0.08)');
        bloomGrad.addColorStop(1.0, 'rgba(88, 28, 135, 0)');
      } else {
        bloomGrad.addColorStop(0.0, 'rgba(255, 251, 235, 0.85)');
        bloomGrad.addColorStop(0.25, 'rgba(192, 132, 252, 0.30)');
        bloomGrad.addColorStop(1.0, 'rgba(168, 85, 247, 0)');
      }
      ctx.beginPath();
      ctx.arc(ox, oy, bloomRadius, 0, Math.PI * 2);
      ctx.fillStyle = bloomGrad;
      ctx.fill();

      // 6. Tyndall Effect: Illuminated Mist / Dust Motes strictly inside the light cone
      const beamSigma = 11.5; // degrees Gaussian width
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy + Math.sin(p.phase) * 0.08;
        p.phase += p.twinkleSpeed;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const dx = p.x - ox;
        const dy = p.y - oy;
        const dist = Math.hypot(dx, dy);
        if (dist < 16) continue;

        const pAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const angDiff = Math.abs(normalizeAngle(pAngle - currentAngle));

        // Gaussian angular falloff + inverse-square radial attenuation
        const angFactor = Math.exp(-(angDiff * angDiff) / (2 * beamSigma * beamSigma));
        const distFactor = 1 / (1 + Math.pow(dist / 340, 2));
        const twinkle = 0.65 + 0.35 * Math.sin(p.phase * 2.2);
        const intensity = angFactor * distFactor * twinkle;

        if (intensity > 0.025) {
          const alpha = Math.min(0.85, intensity * (isLight ? 0.45 : 0.95));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (0.8 + intensity * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = isLight
            ? `rgba(147, 51, 234, ${alpha})`
            : `rgba(250, 232, 255, ${alpha})`;
          ctx.fill();
        }
      }

      // 7. Subtle atmospheric spotlight where the beam meets the cursor
      if (hasMouseMoved && !isLight) {
        const dx = mouseX - ox;
        const dy = mouseY - oy;
        const cursorDist = Math.hypot(dx, dy);
        const cursorFalloff = 1 / (1 + Math.pow(cursorDist / 520, 2));
        const spotAlpha = 0.16 * cursorFalloff;

        if (spotAlpha > 0.01) {
          const spotGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 220);
          spotGrad.addColorStop(0, `rgba(232, 121, 249, ${spotAlpha})`);
          spotGrad.addColorStop(0.5, `rgba(139, 92, 246, ${spotAlpha * 0.4})`);
          spotGrad.addColorStop(1, 'rgba(88, 28, 135, 0)');
          ctx.beginPath();
          ctx.arc(mouseX, mouseY, 220, 0, Math.PI * 2);
          ctx.fillStyle = spotGrad;
          ctx.fill();
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLight]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0"
    >
      {/* Full-Viewport 3D Clay Lighthouse Image */}
      <Image
        src="/images/auth_lighthouse_clay.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className={`object-cover object-[64%_19%] transition-all duration-500 ${
          isLight
            ? 'opacity-40 saturate-[1.08]'
            : 'opacity-48 brightness-[0.62] contrast-[1.12] saturate-[1.22]'
        }`}
      />

      {/* Deep Violet Atmospheric Grade */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isLight
            ? 'bg-gradient-to-b from-white/55 via-purple-50/45 to-white/70'
            : 'bg-gradient-to-b from-[#160535]/65 via-[#0F0426]/55 to-[#070314]/88'
        }`}
      />

      {/* Subtle Radial Vignette for Text Readability */}
      <div
        className={`absolute inset-0 ${
          isLight
            ? 'bg-[radial-gradient(ellipse_80%_70%_at_50%_40%,rgba(255,255,255,0.28),transparent_80%)]'
            : 'bg-[radial-gradient(ellipse_85%_75%_at_50%_45%,rgba(124,58,237,0.16),rgba(7,3,20,0.45)_85%)]'
        }`}
      />

      {/* Lantern Room Exact Viewport Anchor (matches object-[64%_19%]) */}
      <div
        ref={lanternRef}
        className="absolute top-[19%] left-[64%] -translate-x-1/2 -translate-y-1/2 w-6 h-6"
      />

      {/* Real-Time Physics-Based Volumetric Light Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
