'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BottomToast } from '@/components/ui/BottomToast';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

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


  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#101820] border border-[#27313A] rounded-2xl p-6 sm:p-8 relative shadow-2xl">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#151F28] to-[#0B1117] border border-[#27313A] flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-[#F4C95D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M8 6l8 4M8 18l8-4M5 10l14 4" />
                <circle cx="12" cy="12" r="3" fill="#F4C95D" fillOpacity="0.2" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5 text-lg font-black tracking-wider">
              <span className="text-[#F5F1E8]">LIGHTHOUSE</span>
              <span className="text-[#F4C95D]">REELS</span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#F5F1E8]">
            WELCOME BACK
          </h1>
          <p className="text-xs sm:text-sm text-[#B7BEC6] mt-1 font-normal">
            Sign in to continue to your account
          </p>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#D96868]/15 border border-[#D96868]/30 text-[#D96868] text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#68B88A]/15 border border-[#68B88A]/30 text-[#68B88A] text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#B7BEC6] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8993]" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#141D26] text-[#F5F1E8] placeholder-[#7F8993] text-sm rounded-xl pl-10 pr-4 py-3 border border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#B7BEC6] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8993]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141D26] text-[#F5F1E8] placeholder-[#7F8993] text-sm rounded-xl pl-10 pr-11 py-3 border border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7F8993] hover:text-[#F5F1E8] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#F4C95D] hover:bg-[#FFD978] active:bg-[#DDB347] text-[#0B0F13] font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-6 text-center text-xs text-[#B7BEC6]">
          <span>Don&apos;t have an account? </span>
          <Link href="/register" className="text-[#F4C95D] hover:underline font-semibold ml-1">
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
