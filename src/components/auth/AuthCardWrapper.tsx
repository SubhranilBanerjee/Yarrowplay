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
  heroTitle = 'Stream, Discover, and Relax',
  heroSubtitle = 'Your stories, guided by the light.',
  cardTitle,
  cardSubtitle = 'Join Light House Reels and start streaming today',
  children,
  footerLink,
  showGoogleAuth = false,
  googleLabel = 'Google',
  onGoogleError,
  maxWidthClass = 'max-w-[440px]',
}: AuthCardWrapperProps) {
  return (
    <main className="min-h-screen w-full overflow-hidden bg-[#EAE3F7]">
      {/* =========================================================
          FULL PAGE 2-COLUMN SPLIT (Matching Picture 2)
      ========================================================= */}
      <div className="min-h-screen w-full lg:grid lg:grid-cols-2">

        {/* =======================================================
            LEFT SIDE — 3D LIGHTHOUSE VISUAL (Desktop only)
        ======================================================= */}
        <section className="hidden lg:flex relative min-h-screen overflow-hidden flex-col justify-between">
          {/* Background 3D Clay Lighthouse Image */}
          <Image
            src="/images/auth_lighthouse_clay.jpg"
            alt="Light House Reels"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />

          {/* Gentle lavender haze tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#cfc1f3]/15 via-transparent to-[#8a72be]/25 pointer-events-none" />

          {/* TOP-LEFT BRAND (Lighthouse Icon + "Light House Reels") */}
          <div className="absolute left-6 top-6 sm:left-9 sm:top-9 lg:left-10 lg:top-10 z-20">
            <Link href="/" className="group flex items-center gap-3">
              {/* Clean Lighthouse Outline Icon from Picture 2 */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 text-[#30206D]"
              >
                <path
                  d="M13 4L10 9H22L19 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 9H21L22.5 12H9.5L11 9Z"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M11 12L9.5 27H22.5L21 12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 14H18V19H14V14Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M8 27H24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M7 10L3.5 8.5M25 10L28.5 8.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>

              <span className="text-xl sm:text-2xl lg:text-[27px] font-bold tracking-tight text-[#30206D]">
                Light House Reels
              </span>
            </Link>
          </div>

          {/* BOTTOM HERO CAPTION from Picture 2 */}
          <div className="absolute inset-x-0 bottom-6 sm:bottom-10 z-20 px-6 text-center">
            <p className="text-base sm:text-lg font-bold text-[#3E306E] drop-shadow-sm">
              {heroTitle}
            </p>
            <p className="text-xs sm:text-sm font-medium text-[#564882]/90 mt-1">
              {heroSubtitle}
            </p>
          </div>
        </section>

        {/* =======================================================
            RIGHT SIDE — FROSTED GLASS FORM CARD (Picture 2)
        ======================================================= */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#EAE4F8] via-[#E2D8F6] to-[#D5C6F0] px-4 py-8 sm:px-8 lg:px-10">
          {/* Ambient Decorative Glowing Blobs */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-white/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-[380px] w-[380px] rounded-full bg-[#B99EE8]/30 blur-3xl" />

          {/* Frosted Glass Form Card */}
          <div
            className={`relative z-10 w-full ${maxWidthClass} rounded-[32px] border border-white/80 bg-white/70 px-6 py-8 shadow-[0_20px_50px_rgba(95,65,160,0.14)] backdrop-blur-2xl sm:px-9 sm:py-10`}
          >
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-center gap-2.5 mb-5">
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 text-[#30206D]"
              >
                <path
                  d="M13 4L10 9H22L19 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 9H21L22.5 12H9.5L11 9Z"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M11 12L9.5 27H22.5L21 12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 14H18V19H14V14Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M8 27H24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xl font-bold tracking-tight text-[#30206D]">
                Light House Reels
              </span>
            </div>
            {/* CARD HEADER */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-[28px] font-extrabold leading-tight tracking-tight text-[#1E144F]">
                {cardTitle}
              </h2>

              {cardSubtitle && (
                <p className="mx-auto mt-1.5 text-xs sm:text-sm font-medium text-[#645982] leading-relaxed">
                  {cardSubtitle}
                </p>
              )}
            </div>

            {/* FORM CONTENT (CHILDREN) */}
            <div className="w-full">{children}</div>

            {/* SOCIAL LOGIN (Google & Apple Side-by-Side as in Picture 2) */}
            {showGoogleAuth && (
              <div className="mt-5">
                {/* Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-x-0 h-px bg-purple-200/60" />
                  <span className="relative z-10 bg-transparent px-3 text-xs font-medium text-[#7E7399]">
                    or continue with
                  </span>
                </div>

                {/* Full-Width Google Sign-In Button */}
                <div className="mt-3">
                  <GoogleAuthButton
                    label={googleLabel}
                    onError={onGoogleError}
                  />
                </div>
              </div>
            )}

            {/* FOOTER LINK */}
            {footerLink && (
              <div className="mt-6 text-center text-xs sm:text-sm text-[#645982] font-medium">
                <span>{footerLink.text} </span>
                <Link
                  href={footerLink.href}
                  className="font-bold text-[#6355DE] transition-colors hover:text-[#4F3EC7] hover:underline"
                >
                  {footerLink.linkText}
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
