'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Film,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Globe,
  Smartphone,
  Monitor,
  Download,
  Check,
  RefreshCw,
  LogOut,
  Sliders,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStoredSiteContent, saveStoredSiteContent, resetStoredSiteContent, SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/siteContent';

type AdminTab = 'analytics' | 'users' | 'moderation' | 'text';

export default function AdminHubPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  // Local admin bypass / session token
  const [localAdminAuth, setLocalAdminAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@admin.com');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Analytics data
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Users data
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Moderation data
  const [moderationVideos, setModerationVideos] = useState<any[]>([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationFilter, setModerationFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [activeVideoModal, setActiveVideoModal] = useState<any | null>(null);
  const [rejectionModalVideo, setRejectionModalVideo] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Content does not comply with community guidelines');

  // Site Text CMS state
  const [siteText, setSiteText] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [textSaveSuccess, setTextSaveSuccess] = useState(false);
  const [textSaving, setTextSaving] = useState(false);

  // Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Check auth
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lighthouse_admin_token') : null;
    if (token === 'lighthouse_admin_secret_token_2026') {
      setLocalAdminAuth(true);
    }
  }, []);

  const isAdmin =
    localAdminAuth ||
    user?.email === 'admin@admin.com' ||
    user?.email === 'admin@dramabox.stream' ||
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    profile?.role === 'admin';

  // Handle Admin Direct Sign In
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('lighthouse_admin_token', data.token);
        setLocalAdminAuth(true);
        showNotification('success', 'Super Admin authenticated successfully!');
      } else {
        setLoginError(data.error || 'Authentication failed. Please check credentials.');
      }
    } catch {
      // Fallback local check
      if (loginEmail.trim() === 'admin@admin.com' && loginPassword.trim() === '123456') {
        localStorage.setItem('lighthouse_admin_token', 'lighthouse_admin_secret_token_2026');
        setLocalAdminAuth(true);
        showNotification('success', 'Logged in as Admin');
      } else {
        setLoginError('Invalid admin email or password.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('lighthouse_admin_token');
    setLocalAdminAuth(false);
    showNotification('success', 'Admin session terminated.');
  };

  // Load data when tab changes
  useEffect(() => {
    if (!isAdmin) return;

    if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'moderation') {
      loadModeration();
    } else if (activeTab === 'text') {
      setSiteText(getStoredSiteContent());
    }
  }, [isAdmin, activeTab]);

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'x-admin-auth': 'lighthouse_admin_secret_token_2026',
    };
  };

  // 1. Fetch Analytics
  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/admin/analytics', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // 2. Fetch Users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.set('q', userSearch.trim());
      if (userRoleFilter !== 'all') params.set('role', userRoleFilter);
      const res = await fetch(`/api/admin/crm?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Users load error:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Delete User Action
  const handleDeleteUser = async (targetUser: any) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/crm?userId=${targetUser.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== targetUser.id));
        showNotification('success', `User ${targetUser.display_name || targetUser.email} was permanently deleted.`);
        setUserToDelete(null);
      } else {
        const errData = await res.json();
        showNotification('error', errData.error || 'Failed to delete user.');
      }
    } catch {
      showNotification('error', 'Network error during user deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 3. Fetch Moderation Videos
  const loadModeration = async () => {
    setModerationLoading(true);
    try {
      const res = await fetch(`/api/admin/moderation?filter=${moderationFilter}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setModerationVideos(data.videos || []);
      }
    } catch (err) {
      console.error('Moderation load error:', err);
    } finally {
      setModerationLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'moderation') {
      loadModeration();
    }
  }, [moderationFilter]);

  // Approve / Reject Video
  const handleModerateVideo = async (videoId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ videoId, action, rejectionReason: reason }),
      });
      if (res.ok) {
        showNotification(
          'success',
          action === 'approve'
            ? 'Content approved! It is now published and live across the platform.'
            : 'Content rejected and removed from public feed.'
        );
        setModerationVideos((prev) => prev.filter((v) => v.id !== videoId));
        setRejectionModalVideo(null);
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'Action failed.');
      }
    } catch {
      showNotification('error', 'Network error during moderation.');
    }
  };

  // 4. Save Site Text CMS
  const handleSaveSiteText = async () => {
    setTextSaving(true);
    try {
      saveStoredSiteContent(siteText);
      await fetch('/api/admin/site-text', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content: siteText }),
      });
      setTextSaveSuccess(true);
      showNotification('success', 'Site text updated dynamically! Changes are live across the site.');
      setTimeout(() => setTextSaveSuccess(false), 3000);
    } catch {
      showNotification('error', 'Failed to save site text.');
    } finally {
      setTextSaving(false);
    }
  };

  const handleResetSiteText = () => {
    if (confirm('Reset all site text back to default values?')) {
      const def = resetStoredSiteContent();
      setSiteText(def);
      showNotification('success', 'Restored default site text.');
    }
  };

  // Render Login Card if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#070314] text-[#F3E8FF] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-pink-600/15 blur-[120px] pointer-events-none" />

        <div className="relative w-full max-w-md p-8 rounded-3xl bg-[#110926]/90 backdrop-blur-2xl border border-purple-500/30 shadow-[0_0_80px_rgba(147,51,234,0.25)] space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 mx-auto shadow-lg shadow-purple-600/40 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-[#0E0824] flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-purple-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Super Admin Portal</h1>
            <p className="text-xs text-purple-300/70">
              Sign in with administrative credentials to access platform controls.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-purple-400" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#1B0F38]/80 border border-purple-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-purple-400" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#1B0F38]/80 border border-purple-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-400/20 text-[11px] text-purple-200/80 space-y-1">
              <p className="font-semibold text-purple-300">Authorized Admin Credentials:</p>
              <p>Email: <code className="text-white font-mono font-bold">admin@admin.com</code></p>
              <p>Password: <code className="text-white font-mono font-bold">123456</code></p>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Sign In as Super Admin</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
              ← Return to Lighthouse Reels
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070314] text-[#F3E8FF] pb-24 font-sans selection:bg-purple-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 text-sm font-semibold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/90 border-red-500/50 text-red-200'
          }`}
        >
          {notification.type === 'success' ? <Check className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0E0824]/90 backdrop-blur-xl border-b border-purple-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[10px] bg-[#0E0824] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight">
                LightHouse <span className="text-purple-400">Reels</span>
              </span>
              <span className="ml-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                ADMIN CONSOLE
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1038] border border-purple-500/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-purple-300 font-medium">Logged in as:</span>
            <span className="font-mono font-bold text-white">admin@admin.com</span>
          </div>

          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-400/30 text-xs font-semibold text-purple-200 hover:text-white transition-all"
          >
            View Live Site ↗
          </Link>

          <button
            onClick={handleAdminLogout}
            title="Sign out of admin"
            className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900/50 border border-red-500/30 text-red-300 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#120A2E]/90 border border-purple-500/25 max-w-2xl">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>3a. Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3b. Users</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'moderation'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3c. Moderation</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3d. Site Text</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ANALYTICS (Requirement 3a - 100% Dynamic from Supabase)             */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header info & Supabase Live Connection Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#11082B]/80 backdrop-blur-xl border border-purple-500/25">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                    Live Supabase Database Sync
                  </span>
                  <span className="text-[10px] text-purple-300/70 font-mono">
                    (postgres:yhtejnjrjqpzyowldhky)
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">Platform Analytics Hub</h2>
                <p className="text-xs text-purple-300/80">
                  Dynamic database aggregates: Profiles ({analytics?.signups?.total ?? 0}), Videos ({analytics?.content?.totalVideos ?? 0}), Series ({analytics?.content?.totalSeries ?? 0}), Comments ({analytics?.content?.commentsCount ?? 0}).
                </p>
              </div>
              <button
                onClick={loadAnalytics}
                className="px-4 py-2 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/40 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                <span>Sync Supabase Now</span>
              </button>
            </div>

            {/* Top Counters Grid (Purely dynamic Supabase data) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Logins */}
              <div className="p-5 rounded-2xl bg-[#140A33]/80 border border-purple-500/25 space-y-2">
                <span className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">Active Logins</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">
                    {analytics?.logins?.total ?? 0}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {analytics?.logins?.today ?? 0} today
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/70">
                  Profiles logged in: {analytics?.logins?.total ?? 0} / {analytics?.signups?.total ?? 0}
                </p>
              </div>

              {/* Signups */}
              <div className="p-5 rounded-2xl bg-[#140A33]/80 border border-purple-500/25 space-y-2">
                <span className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">Registered Signups</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">
                    {analytics?.signups?.total ?? 0}
                  </span>
                  <span className="text-xs font-bold text-pink-400 bg-pink-950/50 px-2 py-0.5 rounded-full border border-pink-500/30">
                    +{analytics?.signups?.today ?? 0} today
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/70">
                  Last 30 days: +{analytics?.signups?.last30Days ?? 0}
                </p>
              </div>

              {/* Page Views */}
              <div className="p-5 rounded-2xl bg-[#140A33]/80 border border-purple-500/25 space-y-2">
                <span className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">Page Views</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">
                    {analytics?.pageViews?.total ?? 0}
                  </span>
                  <span className="text-xs font-bold text-purple-300">
                    {analytics?.pageViews?.pagesPerSession ?? 1.0} / stream
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/70">
                  Unique page visitors: {analytics?.pageViews?.unique ?? 0}
                </p>
              </div>

              {/* Unique Viewers */}
              <div className="p-5 rounded-2xl bg-[#140A33]/80 border border-purple-500/25 space-y-2">
                <span className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">Unique Viewers</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">
                    {analytics?.uniqueViewers?.total ?? 0}
                  </span>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/70">
                  Monthly active: {analytics?.uniqueViewers?.monthlyActive ?? 0}
                </p>
              </div>
            </div>

            {/* WATCHES WITH SIGN UP vs WITHOUT SIGN UP (100% Dynamic from Supabase) */}
            <div className="p-6 rounded-3xl bg-[#11082B]/90 border border-purple-500/30 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Film className="w-5 h-5 text-purple-400" />
                    <span>Video Watches: With Sign-Up vs Without Sign-Up</span>
                  </h3>
                  <p className="text-xs text-purple-300/70">
                    Aggregated directly from Supabase videos view counts and watch history records.
                  </p>
                </div>
                <span className="text-sm font-extrabold text-white">
                  Total Views in DB: {analytics?.watches?.total ?? 0}
                </span>
              </div>

              {/* Visual Split Bar */}
              <div className="space-y-2">
                <div className="w-full h-5 rounded-full bg-[#1F1042] overflow-hidden flex p-0.5 border border-purple-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-l-full transition-all duration-700"
                    style={{ width: `${analytics?.watches?.withSignupPct ?? 50}%` }}
                    title={`Watches with Sign-Up: ${analytics?.watches?.withSignupPct ?? 0}%`}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-r-full transition-all duration-700"
                    style={{ width: `${analytics?.watches?.withoutSignupPct ?? 50}%` }}
                    title={`Watches without Sign-Up: ${analytics?.watches?.withoutSignupPct ?? 0}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-semibold px-1">
                  <div className="flex items-center gap-2 text-purple-300">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                    <span>
                      Watches with Sign-Up (Authenticated): {analytics?.watches?.withSignup ?? 0} ({analytics?.watches?.withSignupPct ?? 0}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-300">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-600 to-blue-500" />
                    <span>
                      Watches without Sign-Up (Guest): {analytics?.watches?.withoutSignup ?? 0} ({analytics?.watches?.withoutSignupPct ?? 0}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#170C3B] border border-purple-500/20 space-y-1">
                  <p className="text-xs text-purple-300">Supabase Content Breakdown</p>
                  <p className="text-xl font-black text-white">{analytics?.content?.totalVideos ?? 0} Videos across {analytics?.content?.totalSeries ?? 0} Series</p>
                  <p className="text-[11px] text-purple-400/80">Approved: {analytics?.content?.approvedVideos ?? 0} • Pending Moderation: {analytics?.content?.pendingModeration ?? 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#170C3B] border border-cyan-500/20 space-y-1">
                  <p className="text-xs text-cyan-300">Community Engagement</p>
                  <p className="text-xl font-black text-white">{analytics?.content?.commentsCount ?? 0} Comments & {analytics?.watches?.totalLikes ?? 0} Video Likes</p>
                  <p className="text-[11px] text-cyan-400/80">Creators: {analytics?.content?.creatorsCount ?? 0} • Advertisers: {analytics?.content?.advertisersCount ?? 0} • Viewers: {analytics?.content?.viewersCount ?? 0}</p>
                </div>
              </div>
            </div>

            {/* TWO COLUMNS: Session Duration & Device Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Duration */}
              <div className="p-6 rounded-3xl bg-[#11082B]/80 border border-purple-500/25 space-y-5">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>Session Duration</span>
                    </h3>
                    <p className="text-xs text-purple-300/70">Average time spent per user session (based on DB videos)</p>
                  </div>
                  <span className="text-base font-black text-pink-400 bg-pink-950/40 px-3 py-1 rounded-xl border border-pink-500/30">
                    {analytics?.sessionDuration?.formattedAvg ?? '1m 30s'}
                  </span>
                </div>

                <div className="space-y-3">
                  {(analytics?.sessionDuration?.distribution || []).map((item: any) => (
                    <div key={item.bracket} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-200">{item.bracket}</span>
                        <span className="text-white font-bold">{item.percentage}% ({item.count} viewers)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1C103F] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Type */}
              <div className="p-6 rounded-3xl bg-[#11082B]/80 border border-purple-500/25 space-y-5">
                <div className="border-b border-purple-500/20 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                    <span>Device Type Breakdown</span>
                  </h3>
                  <p className="text-xs text-purple-300/70">Traffic origin across mobile, desktop, and tablet</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(analytics?.deviceType || []).map((dev: any) => (
                    <div key={dev.type} className="p-3.5 rounded-2xl bg-[#170C3B] border border-purple-500/20 space-y-1">
                      <p className="text-[11px] font-semibold text-purple-300">{dev.type}</p>
                      <p className="text-2xl font-black text-white">{dev.percentage}%</p>
                      <span className="text-[10px] text-purple-400/80">{dev.count} users</span>
                      <div className="w-full h-1.5 rounded-full bg-[#201147] overflow-hidden mt-2">
                        <div
                          className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                          style={{ width: `${dev.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TWO COLUMNS: App Downloads & Location Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* App Downloads */}
              <div className="p-6 rounded-3xl bg-[#11082B]/80 border border-purple-500/25 space-y-5">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-purple-400" />
                      <span>App Downloads & Installs</span>
                    </h3>
                    <p className="text-xs text-purple-300/70">Native application distribution across stores</p>
                  </div>
                  <span className="text-sm font-black text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                    {(analytics?.appDownloads?.total ?? 0).toLocaleString()} Total
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20">
                    <p className="text-[11px] text-purple-300 font-semibold">Google Play (Android)</p>
                    <p className="text-xl font-black text-white">{(analytics?.appDownloads?.android ?? 0).toLocaleString()}</p>
                    <span className="text-[10px] text-emerald-400">{analytics?.appDownloads?.growthRate ?? '+0%'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20">
                    <p className="text-[11px] text-purple-300 font-semibold">Apple App Store (iOS)</p>
                    <p className="text-xl font-black text-white">{(analytics?.appDownloads?.ios ?? 0).toLocaleString()}</p>
                    <span className="text-[10px] text-emerald-400">{analytics?.appDownloads?.growthRate ?? '+0%'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20">
                    <p className="text-[11px] text-purple-300 font-semibold">PWA / Web App</p>
                    <p className="text-xl font-black text-white">{(analytics?.appDownloads?.pwa ?? 0).toLocaleString()}</p>
                    <span className="text-[10px] text-purple-400">Desktop + Mobile</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20">
                    <p className="text-[11px] text-purple-300 font-semibold">Windows Store / App</p>
                    <p className="text-xl font-black text-white">{(analytics?.appDownloads?.windows ?? 0).toLocaleString()}</p>
                    <span className="text-[10px] text-purple-400">Direct install</span>
                  </div>
                </div>
              </div>

              {/* Geographic / Location Breakdown */}
              <div className="p-6 rounded-3xl bg-[#11082B]/80 border border-purple-500/25 space-y-5">
                <div className="border-b border-purple-500/20 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span>Location Breakdown</span>
                  </h3>
                  <p className="text-xs text-purple-300/70">Top countries and audience distribution</p>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {(analytics?.locations?.countries || []).map((loc: any) => (
                    <div key={loc.country} className="flex items-center justify-between p-2 rounded-xl bg-[#160B37]/60 border border-purple-500/15">
                      <span className="flex items-center gap-1.5 text-purple-200">
                        <span>{loc.flag}</span>
                        <span>{loc.country}</span>
                      </span>
                      <span className="font-bold text-white">{loc.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: USER MANAGEMENT & DELETION (Requirement 3b)                         */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Controls */}
            <div className="p-6 rounded-3xl bg-[#11082B]/80 backdrop-blur-xl border border-purple-500/25 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">User Management Portal</h2>
                  <p className="text-xs text-purple-300/80 mt-1">
                    List of all platform users (Viewers, Creators, Advertisers, Admins) with full power to delete or manage permissions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-purple-900/50 border border-purple-500/30 text-purple-200 font-bold">
                    {usersList.length} Users Listed
                  </span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by username, display name, or email..."
                    className="w-full bg-[#180E38] border border-purple-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-[#180E38] border border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                  >
                    <option value="all">All User Roles</option>
                    <option value="viewer">Viewers</option>
                    <option value="creator">Creators</option>
                    <option value="advertiser">Advertisers</option>
                    <option value="admin">Administrators</option>
                  </select>

                  <button
                    onClick={loadUsers}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-3xl bg-[#11082B]/80 border border-purple-500/25 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#180C3B] text-purple-300 font-semibold uppercase tracking-wider border-b border-purple-500/20">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Joined</th>
                      <th className="py-3.5 px-4">Coins / Balance</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/15 text-purple-100">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-purple-300/70">
                          {usersLoading ? 'Loading users...' : 'No users found matching query.'}
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => {
                        const roleColor =
                          u.role === 'creator'
                            ? 'bg-purple-900/60 text-purple-300 border-purple-500/30'
                            : u.role === 'advertiser'
                            ? 'bg-blue-900/60 text-blue-300 border-blue-500/30'
                            : u.role === 'admin'
                            ? 'bg-amber-900/60 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-900/60 text-emerald-300 border-emerald-500/30';

                        return (
                          <tr key={u.id} className="hover:bg-purple-900/20 transition-colors">
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-700/50 border border-purple-400/40 flex items-center justify-center font-bold text-white uppercase text-xs shrink-0">
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    (u.display_name || u.username || u.email || 'U')[0]
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate">{u.display_name || u.username || 'Unnamed User'}</p>
                                  <p className="text-[11px] text-purple-300/70 truncate">{u.email || `@${u.username}`}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${roleColor}`}>
                                {u.role || 'viewer'}
                              </span>
                              {u.sub_role && <span className="block text-[10px] text-purple-300/70 mt-0.5">{u.sub_role}</span>}
                            </td>

                            <td className="py-3.5 px-4 text-purple-300/80">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                              🪙 {u.coin_balance ?? u.coins_balance ?? 0}
                            </td>

                            <td className="py-3.5 px-4">
                              {u.is_suspended ? (
                                <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" /> Suspended
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                  <CheckCircle className="w-3.5 h-3.5" /> Active
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              <button
                                onClick={() => setUserToDelete(u)}
                                className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-800 border border-red-500/40 text-red-200 hover:text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Delete user permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {userToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="relative w-full max-w-md bg-[#130A2E] border border-red-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-white">Permanently Delete User?</h3>
                    <p className="text-xs text-purple-200/80">
                      Are you sure you want to delete <strong className="text-white">{userToDelete.display_name || userToDelete.email}</strong>?
                      This will revoke their access and remove their profile immediately.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setUserToDelete(null)}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteUser(userToDelete)}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Delete User</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CONTENT MODERATION QUEUE (Requirement 3c)                           */}
        {/* ========================================================================= */}
        {activeTab === 'moderation' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Filter tabs */}
            <div className="p-6 rounded-3xl bg-[#11082B]/80 backdrop-blur-xl border border-purple-500/25 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Content Moderation & Approval</h2>
                  <p className="text-xs text-purple-300/80 mt-1">
                    All uploaded videos must first pass this admin checkpoint. Content is only published live when an administrator approves it.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(['pending', 'approved', 'rejected'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setModerationFilter(filter)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        moderationFilter === filter
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-[#180E38] text-purple-300 hover:text-white border border-purple-500/20'
                      }`}
                    >
                      {filter} Queue
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Moderation Items Grid */}
            {moderationLoading ? (
              <div className="text-center py-16 text-purple-300/70">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
                <p>Loading moderation queue...</p>
              </div>
            ) : moderationVideos.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#11082B]/60 border border-purple-500/20 space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Queue is Clean!</h3>
                <p className="text-xs text-purple-300/70">
                  There are no videos currently in the <strong className="text-purple-200 capitalize">{moderationFilter}</strong> queue.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moderationVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="rounded-3xl bg-[#11082B]/90 border border-purple-500/30 overflow-hidden shadow-lg hover:border-purple-400/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Thumbnail with duration badge & play button */}
                      <div className="relative aspect-video w-full bg-black/60 group">
                        {vid.thumbnail_url ? (
                          <img src={vid.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-950/40 text-purple-400">
                            <Film className="w-10 h-10 opacity-50" />
                          </div>
                        )}
                        <button
                          onClick={() => setActiveVideoModal(vid)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xl">
                            <Play className="w-5 h-5 ml-0.5 fill-white" />
                          </div>
                        </button>
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono font-bold text-white">
                          {vid.duration_seconds ? `${Math.round(vid.duration_seconds)}s` : 'Short'}
                        </span>
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-purple-600/90 text-[10px] font-bold text-white uppercase tracking-wider">
                          {vid.category || 'General'}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-white text-sm line-clamp-1">{vid.title}</h4>
                        <p className="text-xs text-purple-300/80 line-clamp-2 leading-relaxed">
                          {vid.description || 'No description provided.'}
                        </p>

                        <div className="pt-2 flex items-center justify-between text-[11px] text-purple-300/70 border-t border-purple-500/15">
                          <span>Creator: <strong className="text-white">{vid.creator?.display_name || vid.creator?.username || 'Creator'}</strong></span>
                          <span>{vid.created_at ? new Date(vid.created_at).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleModerateVideo(vid.id, 'approve')}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/30"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => setRejectionModalVideo(vid)}
                        className="py-2 px-3 rounded-xl bg-red-950/80 hover:bg-red-800 border border-red-500/40 text-red-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIDEO PLAYER PREVIEW MODAL */}
            {activeVideoModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="relative w-full max-w-2xl bg-[#120A2E] border border-purple-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                    <h3 className="text-base font-bold text-white line-clamp-1">{activeVideoModal.title}</h3>
                    <button
                      onClick={() => setActiveVideoModal(null)}
                      className="p-1 rounded-full text-purple-300 hover:text-white cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center">
                    <video
                      src={activeVideoModal.video_url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* REJECTION REASON MODAL */}
            {rejectionModalVideo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="relative w-full max-w-md bg-[#130A2E] border border-red-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
                  <h3 className="text-base font-bold text-white">Reject Video & Set Reason</h3>
                  <p className="text-xs text-purple-200">
                    Explain why <strong className="text-white">&ldquo;{rejectionModalVideo.title}&rdquo;</strong> is rejected.
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full bg-[#180E38] border border-purple-500/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-400"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRejectionModalVideo(null)}
                      className="flex-1 py-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleModerateVideo(rejectionModalVideo.id, 'reject', rejectionReason)}
                      className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SITE TEXT DYNAMIC CMS (Requirement 3d)                              */}
        {/* ========================================================================= */}
        {activeTab === 'text' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#11082B]/80 backdrop-blur-xl border border-purple-500/25">
              <div>
                <h2 className="text-2xl font-black text-white">Dynamic Site Text CMS</h2>
                <p className="text-xs text-purple-300/80 mt-1">
                  Change all headings, subtitles, button texts, stats, and promotional cards across the site in real-time.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetSiteText}
                  className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-xs font-bold text-purple-200 transition-all cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={handleSaveSiteText}
                  disabled={textSaving}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-600/40 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {textSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save All Changes</span>
                </button>
              </div>
            </div>

            {textSaveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Changes saved successfully and broadcast live to all visitors!</span>
              </div>
            )}

            {/* SECTION 1: HERO SECTION COPY */}
            <div className="p-6 rounded-3xl bg-[#11082B]/80 border border-purple-500/25 space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-purple-500/20 pb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Landing Hero Section Texts</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Eyebrow Badge Text</label>
                  <input
                    type="text"
                    value={siteText.hero.badgeText}
                    onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, badgeText: e.target.value } })}
                    className="w-full bg-[#180E38] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Headline Line 1</label>
                  <input
                    type="text"
                    value={siteText.hero.headlineLine1}
                    onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, headlineLine1: e.target.value } })}
                    className="w-full bg-[#180E38] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Headline Line 2 (Accent)</label>
                  <input
                    type="text"
                    value={siteText.hero.headlineLine2}
                    onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, headlineLine2: e.target.value } })}
                    className="w-full bg-[#180E38] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Hero Subtitle</label>
                  <input
                    type="text"
                    value={siteText.hero.subtitle}
                    onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, subtitle: e.target.value } })}
                    className="w-full bg-[#180E38] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Primary CTA Button Label</label>
                  <input
                    type="text"
                    value={siteText.hero.ctaPrimary}
                    onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, ctaPrimary: e.target.value } })}
                    className="w-full bg-[#180E38] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Secondary CTA Button Label</label>
                  <input
                    type="text"
                    value={siteText.hero.ctaSecondary}
                    onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, ctaSecondary: e.target.value } })}
                    className="w-full bg-[#180E38] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* 3 Feature Pills */}
              <div className="pt-2 space-y-3">
                <p className="text-xs font-bold text-white">Feature Pills (Row of 3)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20 space-y-2">
                    <input
                      type="text"
                      value={siteText.hero.feature1Title}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, feature1Title: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white font-bold"
                    />
                    <input
                      type="text"
                      value={siteText.hero.feature1Subtitle}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, feature1Subtitle: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-purple-300 text-[11px]"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20 space-y-2">
                    <input
                      type="text"
                      value={siteText.hero.feature2Title}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, feature2Title: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white font-bold"
                    />
                    <input
                      type="text"
                      value={siteText.hero.feature2Subtitle}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, feature2Subtitle: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-purple-300 text-[11px]"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20 space-y-2">
                    <input
                      type="text"
                      value={siteText.hero.feature3Title}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, feature3Title: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white font-bold"
                    />
                    <input
                      type="text"
                      value={siteText.hero.feature3Subtitle}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, feature3Subtitle: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-purple-300 text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* 4 Stats */}
              <div className="pt-2 space-y-3">
                <p className="text-xs font-bold text-white">Hero Bottom Stats Dock</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20 space-y-1.5">
                    <input
                      type="text"
                      value={siteText.hero.stat1Value}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, stat1Value: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white font-black"
                    />
                    <input
                      type="text"
                      value={siteText.hero.stat1Label}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, stat1Label: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-purple-300 text-[11px]"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20 space-y-1.5">
                    <input
                      type="text"
                      value={siteText.hero.stat2Value}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, stat2Value: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white font-black"
                    />
                    <input
                      type="text"
                      value={siteText.hero.stat2Label}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, stat2Label: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-purple-300 text-[11px]"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20 space-y-1.5">
                    <input
                      type="text"
                      value={siteText.hero.stat3Value}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, stat3Value: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white font-black"
                    />
                    <input
                      type="text"
                      value={siteText.hero.stat3Label}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, stat3Label: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-purple-300 text-[11px]"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-[#160B37] border border-purple-500/20 space-y-1.5">
                    <input
                      type="text"
                      value={siteText.hero.stat4Value}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, stat4Value: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white font-black"
                    />
                    <input
                      type="text"
                      value={siteText.hero.stat4Label}
                      onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, stat4Label: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-purple-300 text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: CREATOR & ADVERTISER PROMO CARDS COPY */}
            <div className="p-6 rounded-3xl bg-[#11082B]/80 border border-purple-500/25 space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-purple-500/20 pb-3">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Creator & Advertiser Signup Cards Copy</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                {/* Creator Card */}
                <div className="p-4 rounded-2xl bg-[#160B37] border border-purple-500/30 space-y-3">
                  <h4 className="font-bold text-purple-300">Creator Signup Card</h4>
                  <div>
                    <label className="block text-purple-200/80 mb-1">Title</label>
                    <input
                      type="text"
                      value={siteText.creatorCard.title}
                      onChange={(e) => setSiteText({ ...siteText, creatorCard: { ...siteText.creatorCard, title: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200/80 mb-1">Subtitle</label>
                    <textarea
                      value={siteText.creatorCard.subtitle}
                      onChange={(e) => setSiteText({ ...siteText, creatorCard: { ...siteText.creatorCard, subtitle: e.target.value } })}
                      rows={2}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200/80 mb-1">Button CTA Text</label>
                    <input
                      type="text"
                      value={siteText.creatorCard.ctaText}
                      onChange={(e) => setSiteText({ ...siteText, creatorCard: { ...siteText.creatorCard, ctaText: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>

                {/* Advertiser Card */}
                <div className="p-4 rounded-2xl bg-[#160B37] border border-purple-500/30 space-y-3">
                  <h4 className="font-bold text-purple-300">Advertiser Signup Card</h4>
                  <div>
                    <label className="block text-purple-200/80 mb-1">Title</label>
                    <input
                      type="text"
                      value={siteText.advertiserCard.title}
                      onChange={(e) => setSiteText({ ...siteText, advertiserCard: { ...siteText.advertiserCard, title: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200/80 mb-1">Subtitle</label>
                    <textarea
                      value={siteText.advertiserCard.subtitle}
                      onChange={(e) => setSiteText({ ...siteText, advertiserCard: { ...siteText.advertiserCard, subtitle: e.target.value } })}
                      rows={2}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200/80 mb-1">Button CTA Text</label>
                    <input
                      type="text"
                      value={siteText.advertiserCard.ctaText}
                      onChange={(e) => setSiteText({ ...siteText, advertiserCard: { ...siteText.advertiserCard, ctaText: e.target.value } })}
                      className="w-full bg-[#1E0F45] border border-purple-500/30 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleResetSiteText}
                className="px-5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-xs font-bold text-purple-200 cursor-pointer"
              >
                Reset Defaults
              </button>
              <button
                onClick={handleSaveSiteText}
                disabled={textSaving}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-600/40 flex items-center gap-2 cursor-pointer"
              >
                {textSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
