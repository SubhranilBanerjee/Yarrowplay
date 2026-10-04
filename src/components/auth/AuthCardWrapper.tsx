'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GoogleAuthButton } from './GoogleAuthButton';

interface AuthCardWrapperProps {
  heroTitle?: string;
  heroSubtitle?: string;
  cardTitle: string;
  cardSubtitle?: string;
  children: React.ReactNode;
  footerLink?: {
    text: string;
    linkText: string;
    href: string;
  };
  showGoogleAuth?: boolean;
  googleLabel?: string;
  onGoogleError?: (error: string) => void;
  maxWidthClass?: string;
}

export function AuthCardWrapper({
  heroTitle = 'Welcome back to\nLight House Reels',
  heroSubtitle = 'Watch. Discover. Shine.',
  cardTitle,
  cardSubtitle,
  children,
  footerLink,
  showGoogleAuth = false,
  googleLabel = 'Google',
  onGoogleError,
  maxWidthClass = 'max-w-md',
}: AuthCardWrapperProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 md:p-10 bg-gradient-to-br from-[#EAE5FC] via-[#F4F1FD] to-[#E5DCFA] dark:from-[#070B0F] dark:via-[#0B1117] dark:to-[#111A22] transition-colors duration-300">
      {/* Main Container Card / Dual Panel */}
      <div className="w-full max-w-5xl bg-white/75 dark:bg-[#111A22]/85 backdrop-blur-2xl border border-white/80 dark:border-[#27313A] rounded-[28px] sm:rounded-[36px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Side: 3D Lighthouse Hero (Visible on Desktop / Hero banner on Mobile) */}
        <div className="lg:col-span-6 relative flex flex-col justify-between items-center text-center p-6 sm:p-10 bg-gradient-to-b from-[#D8CEF8]/60 via-[#E4DCFC]/40 to-[#CEC0F6]/50 dark:from-[#151D28] dark:via-[#11171E] dark:to-[#0B1117] overflow-hidden border-b lg:border-b-0 lg:border-r border-[#E2D9F8] dark:border-[#27313A]">
          {/* Soft background glow circles */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
          
          {/* Hero Typography */}
          <div className="relative z-10 pt-2 sm:pt-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#2E2856] dark:text-[#EDE8FC] leading-tight whitespace-pre-line">
              {heroTitle}
            </h1>
            <p className="mt-2 text-sm sm:text-base font-semibold text-[#6B5E99] dark:text-[#B7AEE2] tracking-wide">
              {heroSubtitle}
            </p>
          </div>

          {/* 3D Lighthouse Image */}
          <div className="relative z-10 my-4 sm:my-6 w-full max-w-[280px] sm:max-w-[340px] aspect-square rounded-3xl overflow-hidden shadow-xl border border-white/60 dark:border-white/10 group hover:scale-[1.02] transition-transform duration-500">
            <Image
              src="/branding/auth_lighthouse_hero.jpg"
              alt="Light House Reels"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Bottom subtle badge */}
          <div className="relative z-10 hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 text-xs font-medium text-[#4C407B] dark:text-[#C2BAE7] backdrop-blur-md">
            <span>✨ Premium Streaming & Creator Community</span>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="lg:col-span-6 flex flex-col justify-center p-6 sm:p-10 md:p-12 bg-white/90 dark:bg-[#0E151E]/90 backdrop-blur-md">
          <div className={`w-full mx-auto ${maxWidthClass}`}>
            
            {/* Header with Lighthouse Icon & App Name */}
            <div className="flex flex-col items-center text-center mb-6">
              <Link href="/" className="group inline-flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L9 7h6l-3-5zm-2 6l-1 5h6l-1-5h-4zm-1.5 6l-1.5 8h9l-1.5-8h-6z" />
                  </svg>
                </div>
                <span className="text-lg font-black tracking-tight text-[#2E2856] dark:text-[#EDE8FC]">
                  Light House <span className="text-[#7C3AED] dark:text-[#A855F7]">Reels</span>
                </span>
              </Link>
              
              <h2 className="text-xl sm:text-2xl font-black text-[#1E1838] dark:text-[#F5F1E8] tracking-tight">
                {cardTitle}
              </h2>
              {cardSubtitle && (
                <p className="text-xs sm:text-sm text-[#6B5E99] dark:text-[#9DA4B0] mt-1 font-medium">
                  {cardSubtitle}
                </p>
              )}
            </div>

            {/* Form Content */}
            {children}

            {/* Social Auth (Google Only, No Apple) */}
            {showGoogleAuth && (
              <div className="mt-6">
                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E2E8F0] dark:border-[#27313A]" />
                  </div>
                  <span className="relative bg-white dark:bg-[#0E151E] px-3 text-[11px] font-semibold text-[#8C84A7] dark:text-[#7F8993]">
                    Or continue with
                  </span>
                </div>
                
                <div className="flex justify-center">
                  <GoogleAuthButton
                    label={googleLabel}
                    onError={onGoogleError}
                    className="!bg-white dark:!bg-[#141D26] !text-[#1E1838] dark:!text-[#F5F1E8] !border-[#E2E8F0] dark:!border-[#27313A] !rounded-2xl !py-3 !shadow-sm hover:!bg-slate-50 dark:hover:!bg-[#1B2735] font-semibold text-sm"
                  />
                </div>
              </div>
            )}

            {/* Footer Navigation Link */}
            {footerLink && (
              <div className="mt-6 text-center text-xs text-[#6B5E99] dark:text-[#9DA4B0]">
                <span>{footerLink.text} </span>
                <Link
                  href={footerLink.href}
                  className="text-[#7C3AED] dark:text-[#A855F7] font-bold hover:underline ml-1"
                >
                  {footerLink.linkText}
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
