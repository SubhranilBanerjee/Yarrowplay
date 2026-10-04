'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { AuthCardWrapper } from '@/components/auth/AuthCardWrapper';
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
    <>
      <AuthCardWrapper
        heroTitle={'Set New\nPassword'}
        heroSubtitle="Choose a strong, memorable password for your account."
        cardTitle="Set New Password"
        cardSubtitle="Enter your new secure password below"
        footerLink={{
          text: 'Return to',
          linkText: 'Sign in',
          href: '/login',
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

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1.5 ml-1">
              New Password
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

          <div>
            <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1.5 ml-1">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] placeholder-[#94A3B8] dark:placeholder-[#64748B] text-sm rounded-2xl px-4 py-3 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#6366F1] hover:from-[#6D28D9] hover:to-[#4F46E5] text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-purple-500/25 active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
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
