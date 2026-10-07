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
  Layers,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getStoredSiteContent, saveStoredSiteContent, resetStoredSiteContent, SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/siteContent';

type AdminTab = 'analytics' | 'users' | 'moderation' | 'text';

export default function AdminHubPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
  const [moderationContentType, setModerationContentType] = useState<'videos' | 'series'>('videos');
  const [moderationVideos, setModerationVideos] = useState<any[]>([]);
  const [moderationSeries, setModerationSeries] = useState<any[]>([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationFilter, setModerationFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('approved');
  const [moderationSearch, setModerationSearch] = useState('');
  const [activeVideoModal, setActiveVideoModal] = useState<any | null>(null);
  const [rejectionModalVideo, setRejectionModalVideo] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Content does not comply with community guidelines');
  const [videoToDelete, setVideoToDelete] = useState<any | null>(null);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<any | null>(null);
  const [isDeletingSeries, setIsDeletingSeries] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Site Text CMS state
  const [siteText, setSiteText] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [textSaveSuccess, setTextSaveSuccess] = useState(false);
  const [textSaving, setTextSaving] = useState(false);
  const [customKeyName, setCustomKeyName] = useState('');
  const [customKeyValue, setCustomKeyValue] = useState('');
  const [textSearchFilter, setTextSearchFilter] = useState('');

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
      if (userRoleFilter !== 'all') params.set('role', userRoleFilter);
      if (userSearch.trim()) params.set('q', userSearch.trim());
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

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      const timer = setTimeout(() => {
        loadUsers();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [userRoleFilter, userSearch]);

  // Delete User from Supabase
  const handleDeleteUser = async (targetUser: any) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/crm?userId=${targetUser.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== targetUser.id));
        showNotification('success', `User ${targetUser.display_name || targetUser.email} deleted successfully.`);
        setUserToDelete(null);
        loadAnalytics();
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'Failed to delete user.');
      }
    } catch {
      showNotification('error', 'Network error during user deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 3. Fetch Moderation Content (Videos or Series)
  const loadModeration = async () => {
    setModerationLoading(true);
    try {
      if (moderationContentType === 'series') {
        const params = new URLSearchParams();
        params.set('type', 'series');
        if (moderationSearch.trim()) params.set('q', moderationSearch.trim());
        const res = await fetch(`/api/admin/moderation?${params.toString()}`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          setModerationSeries(data.series || []);
        }
      } else {
        const params = new URLSearchParams();
        params.set('type', 'videos');
        params.set('filter', moderationFilter);
        if (moderationSearch.trim()) params.set('q', moderationSearch.trim());
        const res = await fetch(`/api/admin/moderation?${params.toString()}`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          setModerationVideos(data.videos || []);
        }
      }
    } catch (err) {
      console.error('Moderation load error:', err);
    } finally {
      setModerationLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'moderation') {
      const timer = setTimeout(() => {
        loadModeration();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [moderationContentType, moderationFilter, moderationSearch]);

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

  // Delete Single Uploaded Video from Supabase
  const handleDeleteVideo = async (targetVid: any) => {
    setIsDeletingVideo(true);
    try {
      const res = await fetch(`/api/admin/moderation?videoId=${targetVid.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setModerationVideos((prev) => prev.filter((v) => v.id !== targetVid.id));
        showNotification('success', `Content "${targetVid.title}" permanently deleted from Supabase.`);
        setVideoToDelete(null);
        loadAnalytics();
        loadModeration();
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'Failed to delete content.');
      }
    } catch {
      showNotification('error', 'Network error during content deletion.');
    } finally {
      setIsDeletingVideo(false);
    }
  };

  // Delete Single Content Series from Supabase
  const handleDeleteSeries = async (targetSeries: any) => {
    setIsDeletingSeries(true);
    try {
      const res = await fetch(`/api/admin/moderation?seriesId=${targetSeries.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setModerationSeries((prev) => prev.filter((s) => s.id !== targetSeries.id));
        showNotification('success', `Series "${targetSeries.title}" and its episodes deleted from Supabase.`);
        setSeriesToDelete(null);
        loadAnalytics();
        loadModeration();
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'Failed to delete series.');
      }
    } catch {
      showNotification('error', 'Network error during series deletion.');
    } finally {
      setIsDeletingSeries(false);
    }
  };

  // Delete All (Videos or Series) from Supabase
  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const params = new URLSearchParams();
      params.set('action', 'delete_all');
      params.set('targetType', moderationContentType);
      if (moderationContentType === 'videos') {
        params.set('filter', moderationFilter);
      }
      const res = await fetch(`/api/admin/moderation?${params.toString()}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        if (moderationContentType === 'series') {
          setModerationSeries([]);
          showNotification('success', 'All content series and episodes permanently deleted from Supabase.');
        } else {
          setModerationVideos([]);
          showNotification('success', `All ${moderationFilter === 'all' ? '' : moderationFilter + ' '}videos permanently deleted from Supabase.`);
        }
        setShowDeleteAllModal(false);
        loadAnalytics();
        loadModeration();
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'Failed to delete all items.');
      }
    } catch {
      showNotification('error', 'Network error during bulk deletion.');
    } finally {
      setIsDeletingAll(false);
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
      <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#070314] text-[#F3E8FF]'
      }`}>
        {/* Glow ambient background */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-pink-600/15 blur-[120px] pointer-events-none" />

        <div className={`relative w-full max-w-md p-8 rounded-3xl backdrop-blur-2xl border shadow-2xl space-y-6 transition-colors ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50'
            : 'bg-[#110926]/90 border-purple-500/30 text-white shadow-[0_0_80px_rgba(147,51,234,0.25)]'
        }`}>
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 mx-auto shadow-lg shadow-purple-600/40 flex items-center justify-center">
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${isLight ? 'bg-white' : 'bg-[#0E0824]'}`}>
                <ShieldCheck className="w-7 h-7 text-purple-600" />
              </div>
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Super Admin Portal</h1>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-purple-300/70'}`}>
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
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-purple-500" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                      : 'bg-[#1B0F38]/80 border-purple-500/30 text-white focus:border-purple-400'
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-purple-500" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                      : 'bg-[#1B0F38]/80 border-purple-500/30 text-white focus:border-purple-400'
                  }`}
                  required
                />
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
              isLight
                ? 'bg-purple-50 border-purple-200 text-purple-900'
                : 'bg-purple-900/30 border-purple-400/20 text-purple-200/80'
            }`}>
              <p className="font-semibold text-purple-600">Authorized Admin Credentials:</p>
              <p>Email: <code className="font-mono font-bold">admin@admin.com</code></p>
              <p>Password: <code className="font-mono font-bold">123456</code></p>
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
            <Link href="/" className="text-xs text-purple-600 hover:text-purple-700 transition-colors">
              ← Return to Lighthouse Reels
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 font-sans transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#070314] text-[#F3E8FF] selection:bg-purple-600 selection:text-white'
    }`}>
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
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors ${
        isLight ? 'bg-white/95 border-slate-200 shadow-xs' : 'bg-[#0E0824]/90 border-purple-500/20'
      }`}>
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isLight ? 'bg-white' : 'bg-[#0E0824]'}`}>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div>
              <span className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                LightHouse <span className="text-purple-600">Reels</span>
              </span>
              <span className="ml-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs">
                ADMIN CONSOLE
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#1A1038] border-purple-500/30 text-purple-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium">Logged in as:</span>
            <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.email || (localAdminAuth ? 'admin@admin.com' : 'Admin')}</span>
          </div>

          <Link
            href="/"
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-purple-950/60 hover:bg-purple-900/60 border-purple-400/30 text-purple-200 hover:text-white'
            }`}
          >
            View Live Site ↗
          </Link>

          <button
            onClick={handleAdminLogout}
            title="Sign out of admin"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'
                : 'bg-red-950/50 hover:bg-red-900/50 border-red-500/30 text-red-300 hover:text-white'
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Navigation Tabs */}
        <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border max-w-2xl transition-colors ${
          isLight ? 'bg-slate-200/80 border-slate-300/80 shadow-inner' : 'bg-[#120A2E]/90 border-purple-500/25'
        }`}>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                : isLight
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
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
                : isLight
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
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
                : isLight
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
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
                : isLight
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
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
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-xl border transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    Live Supabase Database Sync
                  </span>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                    (postgres:yhtejnjrjqpzyowldhky)
                  </span>
                </div>
                <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Platform Analytics Hub</h2>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-purple-300/80'}`}>
                  Live database aggregates: {analytics?.totalUsers ?? 0} Users, {analytics?.totalSeries ?? 0} Series, {analytics?.totalVideos ?? 0} Videos, {analytics?.totalComments ?? 0} Comments, {analytics?.totalLikes ?? 0} Likes.
                </p>
              </div>
              <button
                onClick={loadAnalytics}
                className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto shadow-xs ${
                  isLight
                    ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                    : 'bg-purple-900/50 hover:bg-purple-800/60 border-purple-500/40 text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                <span>Sync Supabase Now</span>
              </button>
            </div>

            {/* Top Counters Grid (100% Real Database Metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Registered Users */}
              <div className={`p-5 rounded-2xl border space-y-2 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#140A33]/80 border-purple-500/25'
              }`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-purple-300/80'}`}>Total Registered Users</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {analytics?.totalUsers ?? 0}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                    +{analytics?.signups?.today ?? 0} today
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] pt-1">
                  <span className="text-purple-400 font-semibold">{analytics?.content?.creatorsCount ?? 0} Creators</span>
                  <span>•</span>
                  <span className="text-blue-400 font-semibold">{analytics?.content?.viewersCount ?? 0} Viewers</span>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">{analytics?.content?.advertisersCount ?? 0} Ads</span>
                </div>
              </div>

              {/* Total Content Series */}
              <div className={`p-5 rounded-2xl border space-y-2 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#140A33]/80 border-purple-500/25'
              }`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-purple-300/80'}`}>Content Series</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {analytics?.totalSeries ?? 0}
                  </span>
                  <span className="text-xs font-bold text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-950/50 px-2 py-0.5 rounded-full border border-pink-300 dark:border-pink-500/30">
                    {analytics?.categoriesBreakdown?.length ?? 0} Genres
                  </span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                  Original shows registered in database
                </p>
              </div>

              {/* Videos & Episodes */}
              <div className={`p-5 rounded-2xl border space-y-2 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#140A33]/80 border-purple-500/25'
              }`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-purple-300/80'}`}>Videos & Episodes</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {analytics?.totalVideos ?? 0}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    (analytics?.pendingVideos ?? 0) > 0
                      ? 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                      : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                  }`}>
                    {analytics?.publishedVideos ?? 0} Live
                  </span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                  Pending Review: {analytics?.pendingVideos ?? 0}
                </p>
              </div>

              {/* Community & Economy */}
              <div className={`p-5 rounded-2xl border space-y-2 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#140A33]/80 border-purple-500/25'
              }`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-purple-300/80'}`}>Economy & Coins</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-3xl font-black font-mono ${isLight ? 'text-amber-600' : 'text-amber-300'}`}>
                    🪙 {analytics?.totalCoinsInCirculation ?? 0}
                  </span>
                  <span className="text-xs font-bold text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-300 dark:border-cyan-500/30">
                    {analytics?.vipSubscribersCount ?? 0} VIP
                  </span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                  Total user coin balances in circulation
                </p>
              </div>
            </div>

            {/* REAL DATABASE BREAKDOWN: CATEGORIES & ROLES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real Series Categories */}
              <div className={`p-6 rounded-3xl border space-y-5 shadow-sm transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#11082B]/80 border-purple-500/25'
              }`}>
                <div className={`flex items-center justify-between border-b pb-3 ${
                  isLight ? 'border-slate-200' : 'border-purple-500/20'
                }`}>
                  <div>
                    <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <Film className="w-4 h-4 text-purple-500" />
                      <span>Series Category Distribution (Real DB Data)</span>
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                      Actual distribution of the {analytics?.totalSeries ?? 0} series across genres
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-400 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded-xl">
                    {analytics?.totalSeries ?? 0} Series
                  </span>
                </div>

                <div className="space-y-3">
                  {(analytics?.categoriesBreakdown && analytics.categoriesBreakdown.length > 0) ? (
                    analytics.categoriesBreakdown.map((item: any) => (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>{item.category}</span>
                          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {item.count} series ({item.percentage}%)
                          </span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1C103F]'}`}>
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs opacity-60">No series categories recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Real User Roles Breakdown */}
              <div className={`p-6 rounded-3xl border space-y-5 shadow-sm transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#11082B]/80 border-purple-500/25'
              }`}>
                <div className={`flex items-center justify-between border-b pb-3 ${
                  isLight ? 'border-slate-200' : 'border-purple-500/20'
                }`}>
                  <div>
                    <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>User Roles Breakdown (Real DB Data)</span>
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                      Real membership composition of the {analytics?.totalUsers ?? 0} registered profiles
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                    {analytics?.totalUsers ?? 0} Profiles
                  </span>
                </div>

                <div className="space-y-3">
                  {(analytics?.rolesBreakdown && analytics.rolesBreakdown.length > 0) ? (
                    analytics.rolesBreakdown.map((item: any) => (
                      <div key={item.role} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>{item.role}</span>
                          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {item.count} users ({item.percentage}%)
                          </span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1C103F]'}`}>
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs opacity-60">No user profiles found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* REAL COMMUNITY & ENGAGEMENT STATS */}
            <div className={`p-6 rounded-3xl border space-y-4 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#11082B]/90 border-purple-500/30'
            }`}>
              <div className="flex items-center justify-between border-b pb-3 border-purple-500/20">
                <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>Real Platform Activity & Engagement Counts</span>
                </h3>
                <span className="text-xs opacity-60">Direct Table Queries</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#170C3B] border-purple-500/20'}`}>
                  <p className="text-[11px] opacity-70">Video Views</p>
                  <p className="text-xl font-black mt-1">{analytics?.totalViews ?? 0}</p>
                  <span className="text-[10px] text-purple-400">Total Playbacks</span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#170C3B] border-purple-500/20'}`}>
                  <p className="text-[11px] opacity-70">Video Likes</p>
                  <p className="text-xl font-black mt-1">{analytics?.totalLikes ?? 0}</p>
                  <span className="text-[10px] text-pink-400">Reactions</span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#170C3B] border-purple-500/20'}`}>
                  <p className="text-[11px] opacity-70">Comments</p>
                  <p className="text-xl font-black mt-1">{analytics?.totalComments ?? 0}</p>
                  <span className="text-[10px] text-cyan-400">Discussion</span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#170C3B] border-purple-500/20'}`}>
                  <p className="text-[11px] opacity-70">Watch History</p>
                  <p className="text-xl font-black mt-1">{analytics?.watchHistoryCount ?? 0}</p>
                  <span className="text-[10px] text-emerald-400">Sessions</span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#170C3B] border-purple-500/20'}`}>
                  <p className="text-[11px] opacity-70">Favorites & Saved</p>
                  <p className="text-xl font-black mt-1">{(analytics?.favoritesCount ?? 0) + (analytics?.watchlistsCount ?? 0)}</p>
                  <span className="text-[10px] text-amber-400">Bookmarked</span>
                </div>
              </div>
            </div>

            {/* REAL DATABASE SERIES INVENTORY LIST */}
            <div className={`p-6 rounded-3xl border space-y-4 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#11082B]/80 border-purple-500/25'
            }`}>
              <div className="flex items-center justify-between border-b pb-3 border-purple-500/20">
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Film className="w-4 h-4 text-purple-500" />
                    <span>Real Content Series in Database</span>
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                    The actual content series rows stored in Supabase content_series table
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModerationContentType('series');
                    setActiveTab('moderation');
                  }}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Manage All Series →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`font-semibold uppercase tracking-wider border-b ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#180C3B] text-purple-300 border-purple-500/20'
                  }`}>
                    <tr>
                      <th className="py-2.5 px-4">Series Title</th>
                      <th className="py-2.5 px-4">Genre / Category</th>
                      <th className="py-2.5 px-4">Episodes</th>
                      <th className="py-2.5 px-4">Created Date</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isLight ? 'divide-slate-200 text-slate-800' : 'divide-purple-500/15 text-purple-100'
                  }`}>
                    {(analytics?.recentSeries && analytics.recentSeries.length > 0) ? (
                      analytics.recentSeries.map((s: any) => (
                        <tr key={s.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-purple-900/20'}>
                          <td className="py-2.5 px-4 font-bold">{s.title}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/50 text-purple-300 border border-purple-500/30">
                              {s.category || 'Drama'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">{s.total_episodes || 0} eps</td>
                          <td className="py-2.5 px-4 opacity-70">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setModerationContentType('series');
                                setActiveTab('moderation');
                              }}
                              className="text-xs font-bold text-purple-400 hover:underline"
                            >
                              View / Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center opacity-60">
                          No series found in the database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
            <div className={`p-6 rounded-3xl border space-y-4 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>User Management Portal</h2>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-purple-300/80'}`}>
                    List of all platform users (Viewers, Creators, Advertisers, Admins) with full power to delete or manage permissions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full border font-bold ${
                    isLight ? 'bg-purple-100 border-purple-200 text-purple-800' : 'bg-purple-900/50 border-purple-500/30 text-purple-200'
                  }`}>
                    {usersList.length} Users Listed
                  </span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-purple-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by username, display name, or email..."
                    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className={`border rounded-xl px-4 py-2.5 text-xs focus:outline-none cursor-pointer transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  >
                    <option value="all">All User Roles</option>
                    <option value="viewer">Viewers</option>
                    <option value="creator">Creators</option>
                    <option value="advertiser">Advertisers</option>
                    <option value="admin">Administrators</option>
                  </select>

                  <button
                    onClick={loadUsers}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className={`rounded-3xl border overflow-hidden shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#11082B]/80 border-purple-500/25'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`font-semibold uppercase tracking-wider border-b transition-colors ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#180C3B] text-purple-300 border-purple-500/20'
                  }`}>
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Joined</th>
                      <th className="py-3.5 px-4">Coins / Balance</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors ${
                    isLight ? 'divide-slate-200 text-slate-800' : 'divide-purple-500/15 text-purple-100'
                  }`}>
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`py-12 text-center ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                          {usersLoading ? 'Loading users...' : 'No users found matching query.'}
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => {
                        const roleColor =
                          u.role === 'creator'
                            ? isLight ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-purple-900/60 text-purple-300 border-purple-500/30'
                            : u.role === 'advertiser'
                            ? isLight ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-blue-900/60 text-blue-300 border-blue-500/30'
                            : u.role === 'admin'
                            ? isLight ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-amber-900/60 text-amber-300 border-amber-500/30'
                            : isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-900/60 text-emerald-300 border-emerald-500/30';

                        return (
                          <tr key={u.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-purple-900/20'}`}>
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold uppercase text-xs shrink-0 overflow-hidden">
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    (u.display_name || u.username || u.email || 'U')[0]
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{u.display_name || u.username || 'Unnamed User'}</p>
                                  <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>{u.email || `@${u.username}`}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${roleColor}`}>
                                {u.role || 'viewer'}
                              </span>
                              {u.sub_role && <span className={`block text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>{u.sub_role}</span>}
                            </td>

                            <td className={`py-3.5 px-4 ${isLight ? 'text-slate-600' : 'text-purple-300/80'}`}>
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                            </td>

                            <td className={`py-3.5 px-4 font-mono font-bold ${isLight ? 'text-amber-600' : 'text-amber-300'}`}>
                              🪙 {u.coin_balance ?? u.coins_balance ?? 0}
                            </td>

                            <td className="py-3.5 px-4">
                              {u.is_suspended ? (
                                <span className="inline-flex items-center gap-1 text-red-500 font-semibold text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" /> Suspended
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                  <CheckCircle className="w-3.5 h-3.5" /> Active
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              <button
                                onClick={() => setUserToDelete(u)}
                                className={`px-3 py-1.5 rounded-xl border font-bold text-[11px] inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isLight
                                    ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                                    : 'bg-red-950/60 hover:bg-red-800 border-red-500/40 text-red-200 hover:text-white'
                                }`}
                                title="Delete user permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
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

            {/* DELETE USER CONFIRMATION MODAL */}
            {userToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                <div className={`relative w-full max-w-md border rounded-3xl p-6 space-y-4 shadow-2xl transition-colors ${
                  isLight ? 'bg-white border-red-200 text-slate-900' : 'bg-[#130A2E] border-red-500/40 text-white'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/50 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Permanently Delete User?</h3>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-purple-200/80'}`}>
                      Are you sure you want to delete <strong className={isLight ? 'text-slate-900' : 'text-white'}>{userToDelete.display_name || userToDelete.email}</strong>?
                      This will revoke their access and remove their profile immediately.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setUserToDelete(null)}
                      disabled={isDeleting}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-purple-950/60 border-purple-500/30 text-purple-200 hover:text-white'
                      }`}
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
        {/* TAB 3: CONTENT MODERATION & UPLOADED CONTENT MANAGEMENT (Requirement 3c)   */}
        {/* ========================================================================= */}
        {activeTab === 'moderation' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Controls */}
            <div className={`p-6 rounded-3xl border space-y-5 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Content Moderation & Upload Management</h2>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-xs">
                      {moderationContentType === 'videos' ? `${moderationVideos.length} Videos` : `${moderationSeries.length} Series`}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-purple-300/80'}`}>
                    Review pending uploads, manage live content, delete entire series, or delete all content permanently from Supabase.
                  </p>
                </div>

                {/* Top Actions: Content Type Toggle & DELETE ALL OPTION */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Toggle Content Type: Videos vs Series */}
                  <div className={`flex items-center p-1 rounded-2xl border ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#180E38] border-purple-500/30'
                  }`}>
                    <button
                      onClick={() => setModerationContentType('videos')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        moderationContentType === 'videos'
                          ? 'bg-purple-600 text-white shadow-md'
                          : isLight
                          ? 'text-slate-700 hover:text-slate-900'
                          : 'text-purple-300 hover:text-white'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Videos / Reels ({moderationVideos.length})</span>
                    </button>
                    <button
                      onClick={() => setModerationContentType('series')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        moderationContentType === 'series'
                          ? 'bg-purple-600 text-white shadow-md'
                          : isLight
                          ? 'text-slate-700 hover:text-slate-900'
                          : 'text-purple-300 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Content Series ({moderationSeries.length})</span>
                    </button>
                  </div>

                  {/* DELETE ALL OPTION BUTTON */}
                  <button
                    onClick={() => setShowDeleteAllModal(true)}
                    disabled={moderationContentType === 'videos' ? moderationVideos.length === 0 : moderationSeries.length === 0}
                    className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 border border-red-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    title={`Delete all ${moderationContentType === 'videos' ? 'videos in current filter' : 'series and episodes'} permanently`}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>
                      Delete All {moderationContentType === 'videos' ? `Videos (${moderationVideos.length})` : `Series (${moderationSeries.length})`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Sub-toolbar: Filter Pills (for Videos) and Search */}
              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t ${
                isLight ? 'border-slate-200' : 'border-purple-500/20'
              }`}>
                {moderationContentType === 'videos' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setModerationFilter('approved')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        moderationFilter === 'approved'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          : 'bg-[#180E38] text-purple-300 hover:text-white border border-purple-500/20'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Uploaded (Live)</span>
                    </button>

                    <button
                      onClick={() => setModerationFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        moderationFilter === 'pending'
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          : 'bg-[#180E38] text-purple-300 hover:text-white border border-purple-500/20'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Pending Review</span>
                    </button>

                    <button
                      onClick={() => setModerationFilter('rejected')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        moderationFilter === 'rejected'
                          ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          : 'bg-[#180E38] text-purple-300 hover:text-white border border-purple-500/20'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-300" />
                      <span>Archived / Rejected</span>
                    </button>

                    <button
                      onClick={() => setModerationFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        moderationFilter === 'all'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          : 'bg-[#180E38] text-purple-300 hover:text-white border border-purple-500/20'
                      }`}
                    >
                      All Videos
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className={`px-3 py-1 rounded-xl border ${
                      isLight ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-purple-900/50 border-purple-500/30 text-purple-300'
                    }`}>
                      All Content Series in Supabase
                    </span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-purple-400'}`}>
                      Deleting a series permanently removes all linked episodes and purchases.
                    </span>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-purple-500" />
                  <input
                    type="text"
                    value={moderationSearch}
                    onChange={(e) => setModerationSearch(e.target.value)}
                    placeholder={
                      moderationContentType === 'videos'
                        ? 'Search videos by title, description, category...'
                        : 'Search series by title, description, category...'
                    }
                    className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Moderation Items Grid */}
            {moderationLoading ? (
              <div className={`text-center py-16 ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
                <p>Loading {moderationContentType} from Supabase...</p>
              </div>
            ) : moderationContentType === 'videos' ? (
              /* VIDEOS GRID */
              moderationVideos.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl border space-y-2 transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#11082B]/60 border-purple-500/20'
                }`}>
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>No Videos Found</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-purple-300/70'}`}>
                    There are no videos matching the <strong className="capitalize">{moderationFilter}</strong> filter in Supabase.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {moderationVideos.map((vid) => {
                    const isPublished = vid.status === 'published';
                    const isPending = ['processing', 'pending', 'pending_approval', 'draft'].includes(vid.status);

                    return (
                      <div
                        key={vid.id}
                        className={`rounded-3xl border overflow-hidden shadow-sm hover:border-purple-400 transition-all flex flex-col justify-between ${
                          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/90 border-purple-500/30 text-purple-100'
                        }`}
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
                            <span
                              className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isPublished
                                  ? 'bg-emerald-600 text-white'
                                  : isPending
                                  ? 'bg-amber-500 text-black font-extrabold'
                                  : 'bg-red-600 text-white'
                              }`}
                            >
                              {isPublished ? 'Uploaded & Live' : isPending ? 'Pending Review' : 'Archived'}
                            </span>
                          </div>

                          {/* Content details */}
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`font-bold text-sm line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{vid.title}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${
                                isLight ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-purple-900/60 text-purple-200 border-purple-500/30'
                              }`}>
                                {vid.category || 'General'}
                              </span>
                            </div>
                            <p className={`text-xs line-clamp-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-purple-300/80'}`}>
                              {vid.description || 'No description provided.'}
                            </p>

                            <div className={`pt-2 flex items-center justify-between text-[11px] border-t ${
                              isLight ? 'border-slate-100 text-slate-500' : 'border-purple-500/15 text-purple-300/70'
                            }`}>
                              <span>By: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>{vid.creator?.display_name || vid.creator?.username || 'Creator'}</strong></span>
                              <span className="flex items-center gap-1 font-mono">
                                <Eye className="w-3 h-3 text-purple-500" /> {vid.views_count ?? 0} views
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="p-4 pt-0 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleModerateVideo(vid.id, 'approve')}
                                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>

                                <button
                                  onClick={() => setRejectionModalVideo(vid)}
                                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    isLight
                                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                                      : 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/40 text-amber-200 hover:text-white'
                                  }`}
                                >
                                  <XCircle className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setActiveVideoModal(vid)}
                                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    isLight
                                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                                      : 'bg-purple-950/70 hover:bg-purple-900 border-purple-500/30 text-purple-200'
                                  }`}
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </button>

                                <button
                                  onClick={() => setRejectionModalVideo(vid)}
                                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    isLight
                                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                                      : 'bg-purple-950/70 hover:bg-purple-900 border-purple-500/30 text-purple-200'
                                  }`}
                                >
                                  <span>{isPublished ? 'Archive' : 'Restore'}</span>
                                </button>
                              </>
                            )}
                          </div>

                          {/* DELETE UPLOADED CONTENT BUTTON */}
                          <button
                            onClick={() => setVideoToDelete(vid)}
                            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
                              isLight
                                ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                                : 'bg-red-950/60 hover:bg-red-900/90 border-red-500/40 text-red-200 hover:text-white'
                            }`}
                            title="Permanently delete this uploaded content from database"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>Delete Uploaded Video</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* CONTENT SERIES GRID */
              moderationSeries.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl border space-y-2 transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#11082B]/60 border-purple-500/20'
                }`}>
                  <Layers className="w-12 h-12 text-purple-500 mx-auto opacity-70" />
                  <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>No Content Series Found</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-purple-300/70'}`}>
                    There are no content series in Supabase matching your search query.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {moderationSeries.map((series) => (
                    <div
                      key={series.id}
                      className={`rounded-3xl border overflow-hidden shadow-sm hover:border-purple-400 transition-all flex flex-col justify-between ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/90 border-purple-500/30 text-purple-100'
                      }`}
                    >
                      <div>
                        {/* Cover Image & Badges */}
                        <div className="relative aspect-[16/10] w-full bg-black/60 group overflow-hidden">
                          {series.cover_url ? (
                            <img src={series.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-purple-950/40 text-purple-400">
                              <Layers className="w-12 h-12 opacity-40" />
                            </div>
                          )}
                          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-600 text-white shadow-md">
                            Series
                          </span>
                          <span className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md bg-black/85 text-[10px] font-mono font-bold text-white">
                            {series.total_episodes || 0} Episodes
                          </span>
                        </div>

                        {/* Series Details */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-bold text-base line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{series.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 font-medium ${
                              isLight ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-purple-900/60 text-purple-200 border-purple-500/30'
                            }`}>
                              {series.category || 'General'}
                            </span>
                          </div>
                          <p className={`text-xs line-clamp-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-purple-300/80'}`}>
                            {series.description || 'No description provided.'}
                          </p>

                          <div className={`pt-2 flex items-center justify-between text-[11px] border-t ${
                            isLight ? 'border-slate-100 text-slate-500' : 'border-purple-500/15 text-purple-300/70'
                          }`}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                                {series.creator?.avatar_url ? (
                                  <img src={series.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  (series.creator?.display_name || series.creator?.username || 'C')[0]
                                )}
                              </div>
                              <span className={`font-medium truncate max-w-[140px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {series.creator?.display_name || series.creator?.username || 'Creator'}
                              </span>
                            </div>
                            <span className={`font-mono text-[10px] ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                              {series.created_at ? new Date(series.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="p-4 pt-0 space-y-2">
                        <button
                          onClick={() => setSeriesToDelete(series)}
                          className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
                            isLight
                              ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                              : 'bg-red-950/70 hover:bg-red-900 border-red-500/50 text-red-200 hover:text-white'
                          }`}
                          title="Permanently delete this series and all episodes from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Delete Series</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* DELETE UPLOADED VIDEO CONFIRMATION MODAL */}
            {videoToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                <div className={`relative w-full max-w-md border rounded-3xl p-6 space-y-4 shadow-2xl transition-colors ${
                  isLight ? 'bg-white border-red-200 text-slate-900' : 'bg-[#130A2E] border-red-500/40 text-white'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/50 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Permanently Delete Uploaded Content?</h3>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-purple-200/80'}`}>
                      Are you sure you want to delete <strong className={isLight ? 'text-slate-900' : 'text-white'}>&ldquo;{videoToDelete.title}&rdquo;</strong> uploaded by <strong className={isLight ? 'text-slate-900' : 'text-white'}>{videoToDelete.creator?.display_name || videoToDelete.creator?.username || 'Creator'}</strong>?
                    </p>
                    <div className={`p-3 rounded-xl border text-[11px] text-left space-y-1 ${
                      isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-950/50 border-red-500/30 text-red-200'
                    }`}>
                      <p className="font-semibold text-red-600">⚠️ Permanent Database Action:</p>
                      <p>• Video record will be deleted from Supabase <code className="font-mono font-bold">public.videos</code>.</p>
                      <p>• Associated comments, reactions, and watchlist links will be purged.</p>
                      <p>• Content will immediately disappear from all viewer feeds.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setVideoToDelete(null)}
                      disabled={isDeletingVideo}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-purple-950/60 border-purple-500/30 text-purple-200 hover:text-white'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(videoToDelete)}
                      disabled={isDeletingVideo}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isDeletingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Delete Content</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DELETE SERIES CONFIRMATION MODAL */}
            {seriesToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                <div className={`relative w-full max-w-md border rounded-3xl p-6 space-y-4 shadow-2xl transition-colors ${
                  isLight ? 'bg-white border-red-200 text-slate-900' : 'bg-[#130A2E] border-red-500/50 text-white'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/50 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Permanently Delete Series?</h3>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-purple-200/80'}`}>
                      Are you sure you want to delete <strong className={isLight ? 'text-slate-900' : 'text-white'}>&ldquo;{seriesToDelete.title}&rdquo;</strong> and all associated episodes?
                    </p>
                    <div className={`p-3.5 rounded-xl border text-[11px] text-left space-y-1.5 ${
                      isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-950/60 border-red-500/40 text-red-200'
                    }`}>
                      <p className="font-bold text-red-600">⚠️ Permanent Series Deletion:</p>
                      <p>• Series record will be deleted from Supabase <code className="font-mono font-bold">public.content_series</code>.</p>
                      <p>• All episodes belonging to this series will be purged from <code className="font-mono font-bold">public.videos</code>.</p>
                      <p>• This action cannot be reversed.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setSeriesToDelete(null)}
                      disabled={isDeletingSeries}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-purple-950/60 border-purple-500/30 text-purple-200 hover:text-white'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteSeries(seriesToDelete)}
                      disabled={isDeletingSeries}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isDeletingSeries ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Delete Series</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DELETE ALL CONFIRMATION MODAL */}
            {showDeleteAllModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className={`relative w-full max-w-lg border-2 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl transition-colors ${
                  isLight ? 'bg-white border-red-400 text-slate-900' : 'bg-[#150A30] border-red-500/60 text-white'
                }`}>
                  <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/90 border border-red-400 dark:border-red-500 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto shadow-lg shadow-red-900/30">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 animate-pulse" />
                  </div>

                  <div className="text-center space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:border dark:border-red-500 dark:text-red-300 inline-block">
                      Danger Zone • Bulk Deletion
                    </span>
                    <h3 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Delete All {moderationContentType === 'videos' ? `${moderationFilter.toUpperCase()} Videos` : 'Content Series'}?
                    </h3>
                    <p className={`text-xs leading-relaxed max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-purple-200/90'}`}>
                      You are about to permanently delete{' '}
                      <strong className="text-red-600 font-bold">
                        {moderationContentType === 'videos' ? `${moderationVideos.length} videos` : `${moderationSeries.length} series and all their episodes`}
                      </strong>{' '}
                      from Supabase.
                    </p>

                    <div className={`p-4 rounded-2xl border text-xs text-left space-y-2 ${
                      isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-950/80 border-red-500/50 text-red-200'
                    }`}>
                      <p className="font-bold text-red-600 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> This action is immediate & permanent:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-[11px]">
                        {moderationContentType === 'videos' ? (
                          <>
                            <li>All {moderationVideos.length} records matching &ldquo;{moderationFilter}&rdquo; in <code className="font-mono font-bold">public.videos</code> will be wiped.</li>
                            <li>Associated comments, watch history, and user watchlist links will be removed.</li>
                            <li>Platform feeds will update instantly to reflect zero remaining items.</li>
                          </>
                        ) : (
                          <>
                            <li>All {moderationSeries.length} records in <code className="font-mono font-bold">public.content_series</code> will be wiped.</li>
                            <li>All child episodes and videos associated with these series will be deleted.</li>
                            <li>Series carousels and playlists will be emptied platform-wide.</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setShowDeleteAllModal(false)}
                      disabled={isDeletingAll}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-purple-950/70 border-purple-500/30 text-purple-200 hover:text-white'
                      }`}
                    >
                      Cancel & Keep Data
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      disabled={isDeletingAll}
                      className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xl shadow-red-600/50 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isDeletingAll ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Deleting Supabase Data...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Yes, Delete All</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIDEO PLAYER PREVIEW MODAL */}
            {activeVideoModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className={`relative w-full max-w-2xl border rounded-3xl p-6 space-y-4 shadow-2xl transition-colors ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#120A2E] border-purple-500/40 text-white'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-3 ${
                    isLight ? 'border-slate-200' : 'border-purple-500/20'
                  }`}>
                    <h3 className={`text-base font-bold line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeVideoModal.title}</h3>
                    <button
                      onClick={() => setActiveVideoModal(null)}
                      className={`p-1 rounded-full cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-purple-300 hover:text-white'}`}
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
                <div className={`relative w-full max-w-md border rounded-3xl p-6 space-y-4 shadow-2xl transition-colors ${
                  isLight ? 'bg-white border-red-200 text-slate-900' : 'bg-[#130A2E] border-red-500/40 text-white'
                }`}>
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Reject Video & Set Reason</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-purple-200'}`}>
                    Explain why <strong className={isLight ? 'text-slate-900' : 'text-white'}>&ldquo;{rejectionModalVideo.title}&rdquo;</strong> is rejected.
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className={`w-full border rounded-xl p-3 text-xs focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-red-500'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-red-400'
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRejectionModalVideo(null)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-purple-950/60 border-purple-500/30 text-purple-200'
                      }`}
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
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <div>
                <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Dynamic Site Text CMS</h2>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-purple-300/80'}`}>
                  Change all headings, subtitles, button texts, stats, and promotional cards across the site in real-time.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetSiteText}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-purple-950/60 hover:bg-purple-900 border-purple-500/30 text-purple-200'
                  }`}
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
              <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:border dark:border-emerald-500/40 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Changes saved successfully and broadcast live to all visitors!</span>
              </div>
            )}

            {/* SECTION 1: HERO SECTION COPY */}
            <div className={`p-6 rounded-3xl border space-y-6 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-2 border-b pb-3 ${
                isLight ? 'border-slate-200 text-slate-900' : 'border-purple-500/20 text-white'
              }`}>
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Landing Hero Section Texts</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Eyebrow Badge Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={(siteText.hero.badgeTags || []).join(', ')}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      hero: {
                        ...siteText.hero,
                        badgeTags: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        badgeText: e.target.value.split(',')[0]?.trim() || siteText.hero.badgeText,
                      },
                    })}
                    placeholder="e.g. BRANDING & IDENTITY, 4K STREAMING, CREATOR MONETIZATION"
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Headline Outlined Top Text</label>
                  <input
                    type="text"
                    value={siteText.hero.headlineOutlined || siteText.hero.headlineLine1}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      hero: {
                        ...siteText.hero,
                        headlineOutlined: e.target.value,
                        headlineLine1: e.target.value,
                      },
                    })}
                    placeholder="e.g. STORIES THAT / DESIGN THAT"
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Headline Solid Neon Text</label>
                  <input
                    type="text"
                    value={siteText.hero.headlineSolid || siteText.hero.headlineLine2}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      hero: {
                        ...siteText.hero,
                        headlineSolid: e.target.value,
                        headlineLine2: e.target.value,
                      },
                    })}
                    placeholder="e.g. IGNITE MINDS / BUILDS BRANDS"
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Hero Subtitle</label>
                  <input
                    type="text"
                    value={siteText.hero.subtitle}
                    onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, subtitle: e.target.value } })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Primary CTA Button Label</label>
                  <input
                    type="text"
                    value={siteText.hero.ctaPrimary}
                    onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, ctaPrimary: e.target.value } })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Secondary CTA Button Label</label>
                  <input
                    type="text"
                    value={siteText.hero.ctaSecondary}
                    onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, ctaSecondary: e.target.value } })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Satisfied Clients / Viewers Banner</label>
                  <input
                    type="text"
                    value={siteText.hero.satisfiedClientsCount || '100+ Satisfied Clients'}
                    onChange={(e) => setSiteText({ ...siteText, hero: { ...siteText.hero, satisfiedClientsCount: e.target.value } })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Partner Logos (comma-separated)</label>
                  <input
                    type="text"
                    value={(siteText.hero.clientLogos || []).join(', ')}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      hero: {
                        ...siteText.hero,
                        clientLogos: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                      },
                    })}
                    placeholder="e.g. Catalyx, Propulse, Nova Studios, Vortex Media"
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: ABOUT US / WHO WE ARE SECTION COPY */}
            <div className={`p-6 rounded-3xl border space-y-6 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-2 border-b pb-3 ${
                isLight ? 'border-slate-200 text-slate-900' : 'border-purple-500/20 text-white'
              }`}>
                <FileText className="w-4 h-4 text-purple-500" />
                <span>About Us Section Texts ("Who We Are")</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Badge Pill Text</label>
                  <input
                    type="text"
                    value={siteText.about?.badge || 'ABOUT OUR PLATFORM'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      about: { ...(siteText.about || DEFAULT_SITE_CONTENT.about), badge: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Section Title</label>
                  <input
                    type="text"
                    value={siteText.about?.title || 'WHO WE ARE'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      about: { ...(siteText.about || DEFAULT_SITE_CONTENT.about), title: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>About Us Description Paragraph</label>
                  <textarea
                    rows={3}
                    value={siteText.about?.description || DEFAULT_SITE_CONTENT.about.description}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      about: { ...(siteText.about || DEFAULT_SITE_CONTENT.about), description: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: CREATOR & ADVERTISER CARDS COPY */}
            <div className={`p-6 rounded-3xl border space-y-6 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-2 border-b pb-3 ${
                isLight ? 'border-slate-200 text-slate-900' : 'border-purple-500/20 text-white'
              }`}>
                <Users className="w-4 h-4 text-purple-500" />
                <span>Join as Creator & Advertiser Cards Copy</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                {/* Creator Card */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#160B37] border-purple-500/30'
                }`}>
                  <h4 className={`font-bold ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>Creator Signup Card</h4>
                  <div>
                    <label className={`block mb-1 ${isLight ? 'text-slate-600 font-medium' : 'text-purple-200/80'}`}>Title</label>
                    <input
                      type="text"
                      value={siteText.creatorCard.title}
                      onChange={(e) => setSiteText({ ...siteText, creatorCard: { ...siteText.creatorCard, title: e.target.value } })}
                      className={`w-full border rounded-lg p-2 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1E0F45] border-purple-500/30 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block mb-1 ${isLight ? 'text-slate-600 font-medium' : 'text-purple-200/80'}`}>Description</label>
                    <textarea
                      value={siteText.creatorCard.subtitle}
                      onChange={(e) => setSiteText({ ...siteText, creatorCard: { ...siteText.creatorCard, subtitle: e.target.value } })}
                      rows={3}
                      className={`w-full border rounded-lg p-2 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1E0F45] border-purple-500/30 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block mb-1 ${isLight ? 'text-slate-600 font-medium' : 'text-purple-200/80'}`}>Button CTA Text</label>
                    <input
                      type="text"
                      value={siteText.creatorCard.ctaText}
                      onChange={(e) => setSiteText({ ...siteText, creatorCard: { ...siteText.creatorCard, ctaText: e.target.value } })}
                      className={`w-full border rounded-lg p-2 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1E0F45] border-purple-500/30 text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Advertiser Card */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#160B37] border-purple-500/30'
                }`}>
                  <h4 className={`font-bold ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>Advertiser Signup Card</h4>
                  <div>
                    <label className={`block mb-1 ${isLight ? 'text-slate-600 font-medium' : 'text-purple-200/80'}`}>Title</label>
                    <input
                      type="text"
                      value={siteText.advertiserCard.title}
                      onChange={(e) => setSiteText({ ...siteText, advertiserCard: { ...siteText.advertiserCard, title: e.target.value } })}
                      className={`w-full border rounded-lg p-2 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1E0F45] border-purple-500/30 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block mb-1 ${isLight ? 'text-slate-600 font-medium' : 'text-purple-200/80'}`}>Description</label>
                    <textarea
                      value={siteText.advertiserCard.subtitle}
                      onChange={(e) => setSiteText({ ...siteText, advertiserCard: { ...siteText.advertiserCard, subtitle: e.target.value } })}
                      rows={3}
                      className={`w-full border rounded-lg p-2 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1E0F45] border-purple-500/30 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block mb-1 ${isLight ? 'text-slate-600 font-medium' : 'text-purple-200/80'}`}>Button CTA Text</label>
                    <input
                      type="text"
                      value={siteText.advertiserCard.ctaText}
                      onChange={(e) => setSiteText({ ...siteText, advertiserCard: { ...siteText.advertiserCard, ctaText: e.target.value } })}
                      className={`w-full border rounded-lg p-2 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1E0F45] border-purple-500/30 text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: WHY CHOOSE US COPY */}
            <div className={`p-6 rounded-3xl border space-y-6 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-2 border-b pb-3 ${
                isLight ? 'border-slate-200 text-slate-900' : 'border-purple-500/20 text-white'
              }`}>
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <span>Why Choose Us Section Texts</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Section Title</label>
                  <input
                    type="text"
                    value={siteText.whyChooseUs?.title || 'WHY CHOOSE US'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      whyChooseUs: { ...(siteText.whyChooseUs || DEFAULT_SITE_CONTENT.whyChooseUs), title: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Section Subtitle</label>
                  <input
                    type="text"
                    value={siteText.whyChooseUs?.subtitle || DEFAULT_SITE_CONTENT.whyChooseUs.subtitle}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      whyChooseUs: { ...(siteText.whyChooseUs || DEFAULT_SITE_CONTENT.whyChooseUs), subtitle: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Feature 1 Title</label>
                  <input
                    type="text"
                    value={siteText.whyChooseUs?.feature1Title || 'Strategy-Driven Content'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      whyChooseUs: { ...(siteText.whyChooseUs || DEFAULT_SITE_CONTENT.whyChooseUs), feature1Title: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Feature 2 Title</label>
                  <input
                    type="text"
                    value={siteText.whyChooseUs?.feature2Title || 'Clean, Modern Aesthetics'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      whyChooseUs: { ...(siteText.whyChooseUs || DEFAULT_SITE_CONTENT.whyChooseUs), feature2Title: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Feature 3 Title</label>
                  <input
                    type="text"
                    value={siteText.whyChooseUs?.feature3Title || 'Client-Focused Approach'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      whyChooseUs: { ...(siteText.whyChooseUs || DEFAULT_SITE_CONTENT.whyChooseUs), feature3Title: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Feature 4 Title</label>
                  <input
                    type="text"
                    value={siteText.whyChooseUs?.feature4Title || 'Fast Turnaround Time'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      whyChooseUs: { ...(siteText.whyChooseUs || DEFAULT_SITE_CONTENT.whyChooseUs), feature4Title: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Feature 5 Title</label>
                  <input
                    type="text"
                    value={siteText.whyChooseUs?.feature5Title || 'Transparent Communication'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      whyChooseUs: { ...(siteText.whyChooseUs || DEFAULT_SITE_CONTENT.whyChooseUs), feature5Title: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Feature 6 Title</label>
                  <input
                    type="text"
                    value={siteText.whyChooseUs?.feature6Title || 'Scalable Design Solutions'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      whyChooseUs: { ...(siteText.whyChooseUs || DEFAULT_SITE_CONTENT.whyChooseUs), feature6Title: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: FOOTER COPY & BRANDING */}
            <div className={`p-6 rounded-3xl border space-y-6 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-2 border-b pb-3 ${
                isLight ? 'border-slate-200 text-slate-900' : 'border-purple-500/20 text-white'
              }`}>
                <Zap className="w-4 h-4 text-purple-500" />
                <span>Footer & Legal Texts</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Brand Tagline</label>
                  <input
                    type="text"
                    value={siteText.footer?.brandTagline || ''}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      footer: { ...(siteText.footer || DEFAULT_SITE_CONTENT.footer), brandTagline: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Contact Email</label>
                  <input
                    type="email"
                    value={siteText.footer?.contactEmail || ''}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      footer: { ...(siteText.footer || DEFAULT_SITE_CONTENT.footer), contactEmail: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Footer Mission / Bio Paragraph</label>
                  <textarea
                    rows={2}
                    value={siteText.footer?.mission || ''}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      footer: { ...(siteText.footer || DEFAULT_SITE_CONTENT.footer), mission: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Copyright Notice</label>
                  <input
                    type="text"
                    value={siteText.footer?.copyright || ''}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      footer: { ...(siteText.footer || DEFAULT_SITE_CONTENT.footer), copyright: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Legal Notice / Disclaimer</label>
                  <input
                    type="text"
                    value={siteText.footer?.legalNotice || ''}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      footer: { ...(siteText.footer || DEFAULT_SITE_CONTENT.footer), legalNotice: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 6: AUTH & ONBOARDING COPY */}
            <div className={`p-6 rounded-3xl border space-y-6 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-2 border-b pb-3 ${
                isLight ? 'border-slate-200 text-slate-900' : 'border-purple-500/20 text-white'
              }`}>
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>Auth & Onboarding Pages Copy (Login & Register)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Login Page Title</label>
                  <input
                    type="text"
                    value={siteText.auth?.loginTitle || 'Welcome back'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      auth: { ...(siteText.auth || DEFAULT_SITE_CONTENT.auth!), loginTitle: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Login Page Subtitle</label>
                  <input
                    type="text"
                    value={siteText.auth?.loginSubtitle || 'Login to your Light House Reels account'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      auth: { ...(siteText.auth || DEFAULT_SITE_CONTENT.auth!), loginSubtitle: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Register Page Title</label>
                  <input
                    type="text"
                    value={siteText.auth?.registerTitle || 'Create your account'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      auth: { ...(siteText.auth || DEFAULT_SITE_CONTENT.auth!), registerTitle: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Register Page Subtitle</label>
                  <input
                    type="text"
                    value={siteText.auth?.registerSubtitle || 'Join Light House Reels and start streaming today'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      auth: { ...(siteText.auth || DEFAULT_SITE_CONTENT.auth!), registerSubtitle: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 7: NAVIGATION & MOBILE NAV COPY */}
            <div className={`p-6 rounded-3xl border space-y-6 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-2 border-b pb-3 ${
                isLight ? 'border-slate-200 text-slate-900' : 'border-purple-500/20 text-white'
              }`}>
                <Layers className="w-4 h-4 text-purple-500" />
                <span>Navigation & Mobile Navbar Labels</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Home Label</label>
                  <input
                    type="text"
                    value={siteText.nav?.home || 'Home'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      nav: { ...(siteText.nav || DEFAULT_SITE_CONTENT.nav!), home: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Recommendations Label</label>
                  <input
                    type="text"
                    value={siteText.nav?.recommendations || 'Recommendations'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      nav: { ...(siteText.nav || DEFAULT_SITE_CONTENT.nav!), recommendations: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Blogs Label</label>
                  <input
                    type="text"
                    value={siteText.nav?.blogs || 'Blogs'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      nav: { ...(siteText.nav || DEFAULT_SITE_CONTENT.nav!), blogs: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Profile Label</label>
                  <input
                    type="text"
                    value={siteText.nav?.profile || 'Profile'}
                    onChange={(e) => setSiteText({
                      ...siteText,
                      nav: { ...(siteText.nav || DEFAULT_SITE_CONTENT.nav!), profile: e.target.value },
                    })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                        : 'bg-[#180E38] border-purple-500/30 text-white focus:border-purple-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 8: UNIVERSAL CUSTOM KEY OVERRIDES */}
            <div className={`p-6 rounded-3xl border space-y-6 shadow-sm transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
            }`}>
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className={`text-base font-bold flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  <Sliders className="w-4 h-4 text-purple-500" />
                  <span>Universal Custom Key Overrides (Any Text on Any Page)</span>
                </h3>
                <span className="text-[11px] text-[#8E9CA8]">
                  {Object.keys(siteText.customOverrides || {}).length} custom overrides active
                </span>
              </div>

              <p className="text-xs text-[#8E9CA8]">
                Allows the admin to define or edit custom text overrides across any page (e.g. headers, alerts, badges, buttons, disclaimers).
              </p>

              {/* Add New Key Form */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#160B37] border-purple-500/30'
              }`}>
                <h4 className={`text-xs font-bold ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>Add or Update Custom Text Key</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold text-[#8E9CA8]">Key Identifier</label>
                    <input
                      type="text"
                      placeholder="e.g. about.pillar1.title"
                      value={customKeyName}
                      onChange={(e) => setCustomKeyName(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1A0E3D] border-purple-500/30 text-white'
                      }`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1 font-semibold text-[#8E9CA8]">Target Display Text</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter the customized text to show on that page"
                        value={customKeyValue}
                        onChange={(e) => setCustomKeyValue(e.target.value)}
                        className={`flex-1 border rounded-xl px-3 py-2 text-xs ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1A0E3D] border-purple-500/30 text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customKeyName.trim() && customKeyValue.trim()) {
                            setSiteText({
                              ...siteText,
                              customOverrides: {
                                ...(siteText.customOverrides || {}),
                                [customKeyName.trim()]: customKeyValue.trim(),
                              },
                            });
                            setCustomKeyName('');
                            setCustomKeyValue('');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow cursor-pointer whitespace-nowrap"
                      >
                        Add / Set
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* List of Custom Overrides */}
              {Object.keys(siteText.customOverrides || {}).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#8E9CA8]">Active Custom Overrides</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {Object.entries(siteText.customOverrides || {}).map(([key, val]) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                          isLight ? 'bg-white border-slate-200' : 'bg-[#150B33] border-purple-500/20'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <span className="font-mono text-purple-400 font-bold block truncate">{key}</span>
                          <span className="text-[#8E9CA8] truncate block">{val}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = { ...(siteText.customOverrides || {}) };
                            delete copy[key];
                            setSiteText({ ...siteText, customOverrides: copy });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Save Bar */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleResetSiteText}
                className={`px-5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-purple-950/60 hover:bg-purple-900 border-purple-500/30 text-purple-200'
                }`}
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
