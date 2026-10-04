'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  User, Video, Megaphone, Lock, Eye, EyeOff, Building,
  AlertCircle, CheckCircle, ChevronDown, CreditCard, FileText,
} from 'lucide-react';
import { BottomToast } from '@/components/ui/BottomToast';
import { AuthCardWrapper } from '@/components/auth/AuthCardWrapper';

type CreatorSubRole = 'Professional' | 'Student' | 'Hobbyist';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get('role');
  const supabase = createClient();

  const [role, setRole] = useState<'viewer' | 'creator' | 'advertiser'>(
    requestedRole === 'advertiser' ? 'advertiser' : requestedRole === 'creator' ? 'creator' : 'viewer'
  );
  const [subRole, setSubRole] = useState<CreatorSubRole>('Professional');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (requestedRole === 'advertiser') {
      setRole('advertiser');
    } else if (requestedRole === 'creator') {
      setRole('creator');
    }
  }, [requestedRole]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (!agreeTerms) {
        setErrorMsg('You must agree to the Terms of Use and Privacy Policy to register.');
        setIsLoading(false);
        return;
      }

      const metadataName = role === 'advertiser' ? companyName : displayName;

      if (!metadataName.trim()) {
        setErrorMsg(role === 'advertiser' ? 'Please enter your company name.' : 'Please enter your display name.');
        setIsLoading(false);
        return;
      }

      if (role === 'creator') {
        if (!panNumber.trim()) {
          setErrorMsg('Please enter your PAN number for Creator verification.');
          setIsLoading(false);
          return;
        }
        if (!bankAccountNumber.trim()) {
          setErrorMsg('Please enter your Bank Account number for Creator payout processing.');
          setIsLoading(false);
          return;
        }
      }

      if (!email.trim() || !password) {
        setErrorMsg('Please provide a valid email and password.');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        setIsLoading(false);
        return;
      }

      const signUpMeta: Record<string, any> = {
        role,
        display_name: metadataName.trim(),
        company_name: role === 'advertiser' ? companyName.trim() : null,
      };
      if (role === 'creator') {
        signUpMeta.sub_role = subRole;
        signUpMeta.pan_number = panNumber.trim().toUpperCase();
        signUpMeta.bank_account_number = bankAccountNumber.trim();
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: signUpMeta },
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const username =
          metadataName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + data.user.id.slice(0, 5);

        const profilePayload: Record<string, any> = {
          id: data.user.id,
          email: data.user.email,
          username,
          display_name: metadataName.trim(),
          role,
          company_name: role === 'advertiser' ? companyName.trim() : null,
        };
        if (role === 'creator') {
          profilePayload.sub_role = subRole;
          profilePayload.pan_number = panNumber.trim().toUpperCase();
          profilePayload.bank_account_number = bankAccountNumber.trim();
        }

        await supabase.from('profiles').upsert(profilePayload);

        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          if (role === 'creator') {
            router.push('/creator/studio');
          } else if (role === 'advertiser') {
            router.push('/advertiser');
          } else {
            router.push('/home');
          }
          router.refresh();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const heroTitles: Record<string, string> = {
    viewer: 'Welcome to\nLight House Reels',
    creator: 'Welcome to\nCreator Studio',
    advertiser: 'Welcome to\nLight House Ads',
  };

  const heroSubtitles: Record<string, string> = {
    viewer: 'Watch. Discover. Shine.',
    creator: 'Publish Reels. Monetize. Shine.',
    advertiser: 'Target Audience. Scale. Shine.',
  };

  const cardTitles: Record<string, string> = {
    viewer: 'Create your account',
    creator: 'Creator Registration',
    advertiser: 'Advertiser Portal',
  };

  return (
    <>
      <AuthCardWrapper
        heroTitle={heroTitles[role] || 'Welcome to\nLight House Reels'}
        heroSubtitle={heroSubtitles[role] || 'Watch. Discover. Shine.'}
        cardTitle={cardTitles[role] || 'Create your account'}
        cardSubtitle="Join the next generation short video ecosystem"
        showGoogleAuth={role === 'viewer'}
        googleLabel="Google"
        onGoogleError={(err) => setErrorMsg(err)}
        footerLink={{
          text: 'Already have an account?',
          linkText: 'Sign in',
          href: '/login',
        }}
      >
        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#EEF2F6] dark:bg-[#141D26] rounded-2xl mb-5 border border-[#E2E8F0] dark:border-[#27313A]">
          <button
            type="button"
            onClick={() => setRole('viewer')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              role === 'viewer'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white shadow-md shadow-purple-500/20'
                : 'text-[#6B5E99] dark:text-[#9DA4B0] hover:text-[#2E2856] dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Viewer</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('creator')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              role === 'creator'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white shadow-md shadow-purple-500/20'
                : 'text-[#6B5E99] dark:text-[#9DA4B0] hover:text-[#2E2856] dark:hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Creator</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('advertiser')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              role === 'advertiser'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white shadow-md shadow-purple-500/20'
                : 'text-[#6B5E99] dark:text-[#9DA4B0] hover:text-[#2E2856] dark:hover:text-white'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Advertiser</span>
          </button>
        </div>

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

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          {role === 'advertiser' ? (
            <div>
              <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1 ml-1">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] placeholder-[#94A3B8] dark:placeholder-[#64748B] text-sm rounded-2xl px-4 py-2.5 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1 ml-1">
                Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] placeholder-[#94A3B8] dark:placeholder-[#64748B] text-sm rounded-2xl px-4 py-2.5 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Creator Details */}
          {role === 'creator' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1 ml-1">
                  Creator Type
                </label>
                <div className="relative">
                  <select
                    value={subRole}
                    onChange={(e) => setSubRole(e.target.value as CreatorSubRole)}
                    className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] text-sm rounded-2xl pl-4 pr-10 py-2.5 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] transition-all appearance-none cursor-pointer"
                  >
                    <option value="Professional">Professional (Studio/Filmmaker)</option>
                    <option value="Student">Student</option>
                    <option value="Hobbyist">Hobbyist / Independent</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C84A7] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1 ml-1">
                  PAN Number <span className="text-[#7C3AED]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] placeholder-[#94A3B8] dark:placeholder-[#64748B] text-sm font-mono uppercase rounded-2xl px-4 py-2.5 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1 ml-1">
                  Bank Account Number <span className="text-[#7C3AED]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210987"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] placeholder-[#94A3B8] dark:placeholder-[#64748B] text-sm font-mono rounded-2xl px-4 py-2.5 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] transition-all"
                />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] placeholder-[#94A3B8] dark:placeholder-[#64748B] text-sm rounded-2xl px-4 py-2.5 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[#3B3463] dark:text-[#C2BAE7] mb-1 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#EEF2F6] dark:bg-[#141D26] text-[#0F172A] dark:text-[#F5F1E8] placeholder-[#94A3B8] dark:placeholder-[#64748B] text-sm rounded-2xl pl-4 pr-11 py-2.5 border border-[#E2E8F0] dark:border-[#27313A] focus:outline-none focus:bg-white dark:focus:bg-[#1A2533] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
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

          {/* Terms Agreement */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none group text-xs text-[#6B5E99] dark:text-[#9DA4B0]">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] text-[#7C3AED] focus:ring-[#7C3AED]/30 cursor-pointer"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="text-[#6366F1] dark:text-[#A78BFA] font-bold hover:underline">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="text-[#6366F1] dark:text-[#A78BFA] font-bold hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !agreeTerms}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#6366F1] hover:from-[#6D28D9] hover:to-[#4F46E5] text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-purple-500/25 active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isLoading
              ? 'Creating Account...'
              : role === 'viewer'
              ? 'Create Account'
              : role === 'creator'
              ? 'Register as Creator'
              : 'Register as Advertiser'}
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EAE5FC] via-[#F4F1FD] to-[#E5DCFA] dark:from-[#070B0F] dark:to-[#111A22]">
          <div className="w-10 h-10 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
