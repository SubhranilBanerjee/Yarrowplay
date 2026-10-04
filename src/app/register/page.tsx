'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Video,
  Megaphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  CreditCard,
  FileText,
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
  const [agreeTerms, setAgreeTerms] = useState(true);

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
        setErrorMsg('You must agree to the Terms & Privacy Policy to register.');
        setIsLoading(false);
        return;
      }

      const metadataName = role === 'advertiser' ? companyName : displayName;

      if (!metadataName.trim()) {
        setErrorMsg(role === 'advertiser' ? 'Please enter your company name.' : 'Please enter your full name.');
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
    viewer: 'Stream, Discover, and Relax',
    creator: 'Publish, Monetize, and Grow',
    advertiser: 'Reach, Engage, and Convert',
  };

  const heroSubtitles: Record<string, string> = {
    viewer: 'Your stories, guided by the light.',
    creator: 'Empower your vision with our global audience.',
    advertiser: 'Connect with engaged short-video viewers.',
  };

  const cardTitles: Record<string, string> = {
    viewer: 'Create your account',
    creator: 'Creator Registration',
    advertiser: 'Advertiser Portal',
  };

  return (
    <>
      <AuthCardWrapper
        heroTitle={heroTitles[role] || 'Stream, Discover, and Relax'}
        heroSubtitle={heroSubtitles[role] || 'Your stories, guided by the light.'}
        cardTitle={cardTitles[role] || 'Create your account'}
        cardSubtitle="Join Light House Reels and start streaming today"
        showGoogleAuth={true}
        googleLabel="Sign up with Google"
        onGoogleError={(err) => setErrorMsg(err)}
        footerLink={{
          text: 'Already have an account?',
          linkText: 'Login',
          href: '/login',
        }}
      >
        {/* Role Switcher Tabs (Soft lavender frosted pill) */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#F0EBFC]/80 border border-purple-200/50 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setRole('viewer')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              role === 'viewer'
                ? 'bg-gradient-to-r from-[#6355DE] to-[#7563E6] text-white shadow-sm'
                : 'text-[#6B5E99] hover:text-[#1E144F]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Viewer</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('creator')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              role === 'creator'
                ? 'bg-gradient-to-r from-[#6355DE] to-[#7563E6] text-white shadow-sm'
                : 'text-[#6B5E99] hover:text-[#1E144F]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Creator</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('advertiser')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              role === 'advertiser'
                ? 'bg-gradient-to-r from-[#6355DE] to-[#7563E6] text-white shadow-sm'
                : 'text-[#6B5E99] hover:text-[#1E144F]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Advertiser</span>
          </button>
        </div>

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

        {/* Form matching Picture 2 */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Full Name / Display Name / Company Name */}
          <div>
            <label className="block text-xs font-bold text-[#1E144F] mb-1.5 ml-0.5">
              {role === 'advertiser' ? 'Company Name' : 'Full Name'}
            </label>
            <div className="relative flex items-center bg-[#F3EEFC]/90 hover:bg-[#F3EEFC] focus-within:bg-white focus-within:border-[#6355DE] focus-within:ring-2 focus-within:ring-[#6355DE]/15 border border-purple-200/70 rounded-xl px-3.5 py-2.5 transition-all">
              {role === 'advertiser' ? (
                <Building className="w-4 h-4 text-[#7C6FA0] shrink-0 mr-2.5" />
              ) : (
                <User className="w-4 h-4 text-[#7C6FA0] shrink-0 mr-2.5" />
              )}
              <input
                type="text"
                required
                placeholder={role === 'advertiser' ? 'e.g. Acme Corp' : 'Enter your full name'}
                value={role === 'advertiser' ? companyName : displayName}
                onChange={(e) =>
                  role === 'advertiser'
                    ? setCompanyName(e.target.value)
                    : setDisplayName(e.target.value)
                }
                className="w-full bg-transparent text-[#1E144F] placeholder-[#8E82AA] text-sm focus:outline-none"
              />
            </div>
          </div>

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
                placeholder="Create a password"
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

          {/* Creator Details (If Creator Role Selected) */}
          {role === 'creator' && (
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#1E144F] mb-1.5 ml-0.5">
                  Creator Type
                </label>
                <div className="relative flex items-center bg-[#F3EEFC]/90 hover:bg-[#F3EEFC] focus-within:bg-white focus-within:border-[#6355DE] border border-purple-200/70 rounded-xl px-3.5 py-2.5 transition-all">
                  <select
                    value={subRole}
                    onChange={(e) => setSubRole(e.target.value as CreatorSubRole)}
                    className="w-full bg-transparent text-[#1E144F] text-sm focus:outline-none appearance-none cursor-pointer pr-6"
                  >
                    <option value="Professional">Professional (Studio/Filmmaker)</option>
                    <option value="Student">Student</option>
                    <option value="Hobbyist">Hobbyist / Independent</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C6FA0] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E144F] mb-1.5 ml-0.5">
                  PAN Number <span className="text-[#6355DE]">*</span>
                </label>
                <div className="relative flex items-center bg-[#F3EEFC]/90 hover:bg-[#F3EEFC] focus-within:bg-white focus-within:border-[#6355DE] border border-purple-200/70 rounded-xl px-3.5 py-2.5 transition-all">
                  <CreditCard className="w-4 h-4 text-[#7C6FA0] shrink-0 mr-2.5" />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="w-full bg-transparent text-[#1E144F] placeholder-[#8E82AA] text-sm font-mono uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E144F] mb-1.5 ml-0.5">
                  Bank Account Number <span className="text-[#6355DE]">*</span>
                </label>
                <div className="relative flex items-center bg-[#F3EEFC]/90 hover:bg-[#F3EEFC] focus-within:bg-white focus-within:border-[#6355DE] border border-purple-200/70 rounded-xl px-3.5 py-2.5 transition-all">
                  <FileText className="w-4 h-4 text-[#7C6FA0] shrink-0 mr-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210987"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full bg-transparent text-[#1E144F] placeholder-[#8E82AA] text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Terms Agreement matching Picture 2 */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group text-xs text-[#1E144F] font-medium">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-purple-300 text-[#6355DE] accent-[#6355DE] focus:ring-[#6355DE]/20 cursor-pointer"
              />
              <span>
                I agree to the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-[#6355DE] font-semibold hover:underline"
                >
                  Terms &amp; Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          {/* Submit Button ("Sign Up" in Picture 2) */}
          <button
            type="submit"
            disabled={isLoading || !agreeTerms}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#6355DE] via-[#7563E6] to-[#8F66E8] hover:opacity-95 text-white font-bold text-base tracking-wide transition-all shadow-lg shadow-purple-500/25 active:scale-[0.99] disabled:opacity-50 mt-3 cursor-pointer"
          >
            {isLoading
              ? 'Creating Account...'
              : role === 'viewer'
              ? 'Sign Up'
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
        <div className="min-h-screen flex items-center justify-center bg-[#EAE3F7]">
          <div className="w-10 h-10 rounded-full border-2 border-[#6355DE] border-t-transparent animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
