'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
      <div className="w-full max-w-md bg-[#2B2B2D] border border-[#454549] rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-12 h-12 mb-2">
            <Image
              src="/logo.png"
              alt="Yarrowplay"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-1 text-lg font-bold tracking-tight text-white mb-3">
            <span>YARROW</span>
            <span className="text-[#FF0080]">PLAY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            WELCOME BACK
          </h1>
          <p className="text-xs sm:text-sm text-[#85858B] mt-1">
            Sign in to continue to your account
          </p>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85858B]" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#333336] text-white placeholder-[#85858B] text-sm rounded-xl pl-10 pr-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85858B]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#333336] text-white placeholder-[#85858B] text-sm rounded-xl pl-10 pr-10 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#85858B] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white text-sm font-semibold tracking-wide transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Quick fill admin credentials for testing */}
        <div className="mt-4 pt-4 border-t border-[#454549] text-center">
          <button
            type="button"
            onClick={handleFillAdmin}
            className="inline-flex items-center gap-1.5 text-xs text-[#85858B] hover:text-[#FF0080] transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Use Admin Credentials</span>
          </button>
        </div>

        {/* Footer link */}
        <div className="mt-4 text-center text-xs text-[#85858B]">
          <span>Don&apos;t have an account? </span>
          <Link href="/register" className="text-[#FF0080] hover:underline font-medium">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
