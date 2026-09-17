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
      <div className="w-full max-w-md theme-glass-card-static rounded-3xl p-6 sm:p-8 border border-[var(--glass-border)] shadow-2xl relative">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-12 h-12 mb-2 filter drop-shadow-[0_0_12px_rgba(224,0,255,0.4)]">
            <Image
              src="/logo.png"
              alt="Yarrowplay"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-1 text-lg font-black tracking-tight text-white mb-3">
            <span>YARROW</span>
            <span className="theme-gradient-heading font-black">PLAY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {role === 'advertiser' ? 'ADVERTISER REGISTRATION' : 'CREATE ACCOUNT'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-normal">
            {role === 'advertiser'
              ? 'Register your company and launch sponsored campaigns'
              : 'Select your account type to get started'}
          </p>
        </div>

        {/* Role Selection: Advertiser tab is hidden entirely from standard signup! */}
        {role === 'advertiser' ? (
          <div className="mb-6 p-3 rounded-2xl bg-[var(--color-purple-bright)]/15 border border-[var(--glass-border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-2 text-[var(--color-pink)] font-semibold">
              <Megaphone className="w-4 h-4" />
              <span>Partner / Advertiser Account</span>
            </div>
            <Link href="/register" className="text-xs text-[var(--text-muted)] hover:text-white underline">
              Switch to Viewer
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 bg-[var(--bg-secondary)] p-1.5 rounded-2xl mb-6 border border-[var(--glass-border)]">
            <button
              type="button"
              onClick={() => setRole('viewer')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                role === 'viewer'
                  ? 'theme-active-pill'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Viewer</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('creator')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                role === 'creator'
                  ? 'theme-active-pill'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Creator</span>
            </button>
          </div>
        )}

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[var(--status-error)]/15 border border-[var(--status-error)]/30 text-[var(--status-error)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[var(--status-success)]/15 border border-[var(--status-success)]/30 text-[var(--status-success)] text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {role === 'advertiser' ? (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
                COMPANY NAME
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] text-white placeholder-[var(--text-muted)] text-sm rounded-xl pl-10 pr-4 py-3 border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-purple-bright)]/30 transition-all"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
                DISPLAY NAME
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] text-white placeholder-[var(--text-muted)] text-sm rounded-xl pl-10 pr-4 py-3 border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-purple-bright)]/30 transition-all"
                />
              </div>
            </div>
          )}

          {/* Creator Sub-Role Dropdown */}
          {role === 'creator' && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
                CREATOR TYPE
              </label>
              <div className="relative">
                <select
                  value={subRole}
                  onChange={(e) => setSubRole(e.target.value as CreatorSubRole)}
                  className="w-full bg-[var(--bg-secondary)] text-white text-sm rounded-xl pl-4 pr-10 py-3 border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-purple-bright)]/30 transition-all appearance-none cursor-pointer"
                >
                  <option value="Professional" className="bg-[#100020] text-white">Professional</option>
                  <option value="Student" className="bg-[#100020] text-white">Student</option>
                  <option value="Hobbyist" className="bg-[#100020] text-white">Hobbyist</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                {subRoleDescriptions[subRole]}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] text-white placeholder-[var(--text-muted)] text-sm rounded-xl pl-10 pr-4 py-3 border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-purple-bright)]/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] text-white placeholder-[var(--text-muted)] text-sm rounded-xl pl-10 pr-10 py-3 border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-purple-bright)]/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl theme-neon-button text-white text-sm font-bold tracking-wide transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
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
        <div className="mt-6 pt-4 border-t border-[var(--glass-border-subtle)] text-center text-xs text-[var(--text-muted)]">
          <span>Already have an account? </span>
          <Link href="/login" className="text-[var(--color-pink)] hover:underline font-semibold ml-1">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-[var(--color-pink)] border-t-transparent animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
