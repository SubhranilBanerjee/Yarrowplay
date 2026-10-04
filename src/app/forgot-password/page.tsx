'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { AuthCardWrapper } from '@/components/auth/AuthCardWrapper';
import { BottomToast } from '@/components/ui/BottomToast';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(
          'Password reset link has been sent to your email address! Please check your inbox.'
        );
        setEmail('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthCardWrapper
        heroTitle={'Reset Your\nPassword'}
        heroSubtitle="We'll help you get back to watching & creating."
        cardTitle="Forgot password?"
        cardSubtitle="Enter your email to receive a password reset link"
        footerLink={{
          text: 'Remember your password?',
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

        <form onSubmit={handleResetRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1.5 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] placeholder-[#94A3B8] dark:placeholder-[#64748B] text-sm rounded-2xl px-4 py-3 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#6366F1] hover:from-[#6D28D9] hover:to-[#4F46E5] text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-purple-500/25 active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
          >
            {isLoading ? 'Sending Link...' : 'Send Reset Link'}
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
