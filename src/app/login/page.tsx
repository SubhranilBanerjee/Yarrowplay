'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BottomToast } from '@/components/ui/BottomToast';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Fetch role to redirect to correct destination
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => {
          if (profile?.role === 'creator') {
            router.push('/creator/studio');
          } else if (profile?.role === 'advertiser') {
            router.push('/advertiser');
          } else {
            router.push('/home');
          }
          router.refresh();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@dramabox.stream');
    setPassword(process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@DramaBox2026!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md theme-form-card p-6 sm:p-8 relative">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-12 h-12 mb-2 filter drop-shadow-[0_0_12px_rgba(224,0,255,0.4)]">
            <Image
              src="/logo.png"
              alt="Yarrowplay"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-1 text-lg font-black tracking-tight text-white mb-3">
            <span>YARROW</span>
            <span className="theme-gradient-heading font-black">PLAY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            WELCOME BACK
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-normal">
            Sign in to continue to your account
          </p>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-[var(--status-error)]/15 border border-[var(--status-error)]/30 text-[var(--status-error)] text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-[var(--status-success)]/15 border border-[var(--status-success)]/30 text-[var(--status-success)] text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] text-white placeholder-[var(--text-muted)] text-sm rounded-xl pl-10 pr-4 py-3 border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-pink)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] text-white placeholder-[var(--text-muted)] text-sm rounded-xl pl-10 pr-11 py-3 border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-pink)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl theme-neon-button font-bold text-sm tracking-wide transition-all shadow-lg active:scale-98 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>

          {/* Quick Admin fill button */}
          <div className="pt-2 border-t border-[var(--glass-border)]">
            <button
              type="button"
              onClick={handleFillAdmin}
              className="w-full py-2 px-3 rounded-lg bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] hover:border-[var(--color-magenta)] text-[var(--text-secondary)] hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[var(--color-pink)]" />
              <span>Fill Admin Credentials</span>
            </button>
          </div>
        </form>

        {/* Footer link */}
        <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          <span>Don&apos;t have an account? </span>
          <Link href="/register" className="text-[var(--color-pink)] hover:underline font-semibold ml-1">
            Create Account
          </Link>
        </div>
      </div>

      {/* Floating Bottom Toast for errors */}
      <BottomToast
        message={errorMsg ? { type: 'error', text: errorMsg } : null}
        onClose={() => setErrorMsg(null)}
      />
    </div>
  );
}
