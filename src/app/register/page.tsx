'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  User, Video, Megaphone, Mail, Lock, Eye, EyeOff, Building,
  AlertCircle, CheckCircle, ChevronDown,
} from 'lucide-react';
import { BottomToast } from '@/components/ui/BottomToast';

type CreatorSubRole = 'Professional' | 'Student' | 'Hobbyist';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get('role');
  const supabase = createClient();

  const [role, setRole] = useState<'viewer' | 'creator' | 'advertiser'>(
    requestedRole === 'advertiser' ? 'advertiser' : 'viewer'
  );
  const [subRole, setSubRole] = useState<CreatorSubRole>('Professional');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
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

      // Build sign-up metadata
      const signUpMeta: Record<string, any> = {
        role,
        display_name: metadataName.trim(),
        company_name: role === 'advertiser' ? companyName.trim() : null,
      };
      if (role === 'creator') {
        signUpMeta.sub_role = subRole;
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

  const subRoleDescriptions: Record<CreatorSubRole, string> = {
    Professional: 'Working professionally in content creation or media',
    Student: 'Enrolled in an educational program',
    Hobbyist: 'Creating content as a personal passion project',
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
            {role === 'advertiser' ? 'ADVERTISER REGISTRATION' : 'CREATE ACCOUNT'}
          </h1>
          <p className="text-xs sm:text-sm text-[#B7BEC6] mt-1 font-normal">
            {role === 'advertiser'
              ? 'Register your company and launch sponsored campaigns'
              : 'Select your account type to get started'}
          </p>
        </div>

        {/* Role Selection: Advertiser tab is hidden entirely from standard signup! */}
        {role === 'advertiser' ? (
          <div className="mb-6 p-3 rounded-2xl bg-[#141D26] border border-[#27313A] flex items-center justify-between text-xs text-[#B7BEC6]">
            <div className="flex items-center gap-2 text-[#F4C95D] font-semibold">
              <Megaphone className="w-4 h-4" />
              <span>Partner / Advertiser Account</span>
            </div>
            <Link href="/register" className="text-xs text-[#7F8993] hover:text-[#F5F1E8] underline">
              Switch to Viewer
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 bg-[#141D26] p-1.5 rounded-xl mb-6 border border-[#27313A]">
            <button
              type="button"
              onClick={() => setRole('viewer')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                role === 'viewer'
                  ? 'bg-[#F4C95D] text-[#0B0F13] shadow'
                  : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Viewer</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('creator')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                role === 'creator'
                  ? 'bg-[#F4C95D] text-[#0B0F13] shadow'
                  : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Creator</span>
            </button>
          </div>
        )}

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#D96868]/15 border border-[#D96868]/30 text-[#D96868] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#68B88A]/15 border border-[#68B88A]/30 text-[#68B88A] text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {role === 'advertiser' ? (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#B7BEC6] mb-1.5">
                COMPANY NAME
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8993]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#141D26] text-[#F5F1E8] placeholder-[#7F8993] text-sm rounded-xl pl-10 pr-4 py-3 border border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-all"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#B7BEC6] mb-1.5">
                DISPLAY NAME
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8993]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#141D26] text-[#F5F1E8] placeholder-[#7F8993] text-sm rounded-xl pl-10 pr-4 py-3 border border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-all"
                />
              </div>
            </div>
          )}

          {/* Creator Sub-Role Dropdown */}
          {role === 'creator' && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#B7BEC6] mb-1.5">
                CREATOR TYPE
              </label>
              <div className="relative">
                <select
                  value={subRole}
                  onChange={(e) => setSubRole(e.target.value as CreatorSubRole)}
                  className="w-full bg-[#141D26] text-[#F5F1E8] text-sm rounded-xl pl-4 pr-10 py-3 border border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-all appearance-none cursor-pointer"
                >
                  <option value="Professional" className="bg-[#101820] text-[#F5F1E8]">Professional</option>
                  <option value="Student" className="bg-[#101820] text-[#F5F1E8]">Student</option>
                  <option value="Hobbyist" className="bg-[#101820] text-[#F5F1E8]">Hobbyist</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8993] pointer-events-none" />
              </div>
              <p className="mt-1.5 text-[11px] text-[#7F8993] leading-relaxed">
                {subRoleDescriptions[subRole]}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#B7BEC6] mb-1.5">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8993]" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#141D26] text-[#F5F1E8] placeholder-[#7F8993] text-sm rounded-xl pl-10 pr-4 py-3 border border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#B7BEC6] mb-1.5">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8993]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141D26] text-[#F5F1E8] placeholder-[#7F8993] text-sm rounded-xl pl-10 pr-10 py-3 border border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-all"
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

          {/* Terms and Privacy Checkbox */}
          <div className="pt-1 pb-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#27313A] text-[#F4C95D] bg-[#141D26] accent-[#F4C95D] focus:ring-0 transition-colors cursor-pointer shrink-0"
              />
              <span className="text-xs text-[#B7BEC6] leading-tight group-hover:text-[#F5F1E8] transition-colors">
                I agree to the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-[#F4C95D] hover:underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-[#F4C95D] hover:underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
                <span className="text-[#F4C95D] ml-0.5">*</span>
              </span>
            </label>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading || !agreeTerms}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#F4C95D] hover:bg-[#FFD978] active:bg-[#DDB347] text-[#0B0F13] text-sm font-bold tracking-wide transition-all shadow-md active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading
              ? 'Creating Account...'
              : role === 'viewer'
              ? 'Register as Viewer'
              : role === 'creator'
              ? 'Register as Creator'
              : 'Register as Advertiser'}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-6 pt-4 border-t border-[#1C252D] text-center text-xs text-[#7F8993]">
          <span>Already have an account? </span>
          <Link href="/login" className="text-[#F4C95D] hover:underline font-semibold ml-1">
            Sign In
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-[#F4C95D] border-t-transparent animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
