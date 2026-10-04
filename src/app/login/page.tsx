'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BottomToast } from '@/components/ui/BottomToast';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { AuthCardWrapper } from '@/components/auth/AuthCardWrapper';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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

  return (
    <>
      <AuthCardWrapper
        heroTitle={'Welcome back to\nLight House Reels'}
        heroSubtitle="Watch. Discover. Shine."
        cardTitle="Login to your account"
        showGoogleAuth={true}
        googleLabel="Google"
        onGoogleError={(err) => setErrorMsg(err)}
        footerLink={{
          text: "Don't have an account?",
          linkText: "Sign up",
          href: "/register"
        }}
      >
        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-[#D96868]/15 border border-[#D96868]/30 text-[#D96868] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-[#68B88A]/15 border border-[#68B88A]/30 text-[#68B88A] text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1.5 ml-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] placeholder-[#94A3B8] dark:placeholder-[#64748B] text-sm rounded-2xl px-4 py-3 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] placeholder-[#94A3B8] dark:placeholder-[#64748B] text-sm rounded-2xl pl-4 pr-11 py-3 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C84A7] hover:text-[#4C407B] dark:hover:text-[#EDE8FC] transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-[#6B5E99] dark:text-[#9DA4B0] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#CBD5E1] text-[#7C3AED] focus:ring-[#7C3AED]/30 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-[#6366F1] dark:text-[#A78BFA] font-semibold hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#6366F1] hover:from-[#6D28D9] hover:to-[#4F46E5] text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-purple-500/25 active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </AuthCardWrapper>

      <BottomToast
        message={errorMsg ? { type: 'error', text: errorMsg } : null}
        onClose={() => setErrorMsg(null)}
      />
    </>
  );
}
