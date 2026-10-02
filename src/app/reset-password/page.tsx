'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { BrandLogo } from '@/components/landing/BrandLogo';
import { BottomToast } from '@/components/ui/BottomToast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Your password has been updated successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#101820] border border-[#27313A] rounded-2xl p-6 sm:p-8 relative shadow-2xl">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <BrandLogo href="/" size="lg" priority />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#F5F1E8]">
            SET NEW PASSWORD
          </h1>
          <p className="text-xs sm:text-sm text-[#B7BEC6] mt-1 font-normal">
            Enter your new secure password below
          </p>
        </div>

        {/* Feedback */}
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
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#B7BEC6] mb-1.5">
              New Password
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7F8993] hover:text-[#F5F1E8]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#B7BEC6] mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8993]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#141D26] text-[#F5F1E8] placeholder-[#7F8993] text-sm rounded-xl pl-10 pr-11 py-3 border border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-900 hover:from-purple-500 hover:to-indigo-800 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-purple-900/30 active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#B7BEC6]">
          <Link href="/login" className="text-[#F4C95D] hover:underline font-semibold">
            Return to Login
          </Link>
        </div>
      </div>

      <BottomToast
        message={errorMsg ? { type: 'error', text: errorMsg } : null}
        onClose={() => setErrorMsg(null)}
      />
    </div>
  );
}
