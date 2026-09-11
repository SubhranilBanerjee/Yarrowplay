'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Video, Megaphone, Mail, Lock, Eye, EyeOff, Building, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<'viewer' | 'creator' | 'advertiser'>('viewer');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

      // Supabase sign up
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role,
            display_name: metadataName.trim(),
            company_name: role === 'advertiser' ? companyName.trim() : null,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Upsert initial profile
        const username = metadataName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + data.user.id.slice(0, 5);
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          username,
          display_name: metadataName.trim(),
          role,
          company_name: role === 'advertiser' ? companyName.trim() : null,
        });

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

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      {/* Registration Card - matching screenshot */}
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
            CREATE ACCOUNT
          </h1>
          <p className="text-xs sm:text-sm text-[#85858B] mt-1">
            Select your account type to get started
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-[#333336] p-1.5 rounded-2xl mb-6 border border-[#454549]">
          <button
            type="button"
            onClick={() => setRole('viewer')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              role === 'viewer'
                ? 'bg-[#FF0080] text-white shadow-md'
                : 'text-[#B8B8BD] hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Viewer</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('creator')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              role === 'creator'
                ? 'bg-[#FF0080] text-white shadow-md'
                : 'text-[#B8B8BD] hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Creator</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('advertiser')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              role === 'advertiser'
                ? 'bg-[#FF0080] text-white shadow-md'
                : 'text-[#B8B8BD] hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Advertiser</span>
          </button>
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

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {role === 'advertiser' ? (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                COMPANY NAME
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85858B]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#333336] text-white placeholder-[#85858B] text-sm rounded-xl pl-10 pr-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080] transition-colors"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                DISPLAY NAME
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85858B]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#333336] text-white placeholder-[#85858B] text-sm rounded-xl pl-10 pr-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080] transition-colors"
                />
              </div>
            </div>
          )}

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

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white text-sm font-semibold tracking-wide transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
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
        <div className="mt-6 text-center text-xs text-[#85858B]">
          <span>Already have an account? </span>
          <Link href="/login" className="text-[#FF0080] hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
