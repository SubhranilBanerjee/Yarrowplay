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
        heroTitle="Stream, Discover, and Relax"
        heroSubtitle="Your stories, guided by the light."
        cardTitle="Welcome back"
        cardSubtitle="Login to your Light House Reels account"
        showGoogleAuth={true}
        googleLabel="Sign in with Google"
        onGoogleError={(err) => setErrorMsg(err)}
        footerLink={{
          text: "Don't have an account?",
          linkText: 'Sign up',
          href: '/register',
        }}
      >
        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#1E144F] mb-1.5 ml-0.5">
              Email
            </label>
            <div className="relative flex items-center bg-[#F3EEFC]/90 hover:bg-[#F3EEFC] focus-within:bg-white focus-within:border-[#6355DE] focus-within:ring-2 focus-within:ring-[#6355DE]/15 border border-purple-200/70 rounded-xl px-3.5 py-2.5 transition-all">
              <Mail className="w-4 h-4 text-[#7C6FA0] shrink-0 mr-2.5" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-[#1E144F] placeholder-[#8E82AA] text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[#1E144F] mb-1.5 ml-0.5">
              Password
            </label>
            <div className="relative flex items-center bg-[#F3EEFC]/90 hover:bg-[#F3EEFC] focus-within:bg-white focus-within:border-[#6355DE] focus-within:ring-2 focus-within:ring-[#6355DE]/15 border border-purple-200/70 rounded-xl px-3.5 py-2.5 transition-all">
              <Lock className="w-4 h-4 text-[#7C6FA0] shrink-0 mr-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-[#1E144F] placeholder-[#8E82AA] text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#7C6FA0] hover:text-[#1E144F] transition-colors p-1 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-[#4A3E6B] font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-purple-300 text-[#6355DE] accent-[#6355DE] focus:ring-[#6355DE]/20 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-[#6355DE] font-semibold hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#6355DE] via-[#7563E6] to-[#8F66E8] hover:opacity-95 text-white font-bold text-base tracking-wide transition-all shadow-lg shadow-purple-500/25 active:scale-[0.99] disabled:opacity-50 mt-3 cursor-pointer"
          >
            {isLoading ? 'Logging in...' : 'Sign In'}
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
