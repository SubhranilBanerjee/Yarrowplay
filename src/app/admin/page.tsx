'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  X,
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
  Trophy,
  Palette,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getStoredSiteContent, saveStoredSiteContent, resetStoredSiteContent, SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/siteContent';

type AdminTab = 'analytics' | 'users' | 'moderation' | 'text' | 'competitions';

export default function AdminHubPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Local admin bypass / session token
  const [localAdminAuth, setLocalAdminAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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
  const [deleteAllMode, setDeleteAllMode] = useState<'current' | 'all'>('current');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isCleaningOrphans, setIsCleaningOrphans] = useState(false);

  // Site Text CMS state
  const [siteText, setSiteText] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [textSaveSuccess, setTextSaveSuccess] = useState(false);
  const [textSaving, setTextSaving] = useState(false);
  const [customKeyName, setCustomKeyName] = useState('');
  const [customKeyValue, setCustomKeyValue] = useState('');
  const [textSearchFilter, setTextSearchFilter] = useState('');

  // Competitions & Themes Admin State
  const [adminActiveComp, setAdminActiveComp] = useState<any>(null);
  const [adminThemesList, setAdminThemesList] = useState<any[]>([]);
  const [adminCompsList, setAdminCompsList] = useState<any[]>([]);
  const [compLoading, setCompLoading] = useState(false);
  const [compNotice, setCompNotice] = useState<string | null>(null);

  // Competition Vote Audit & Deletion State
  const [showVotesAuditModal, setShowVotesAuditModal] = useState(false);
  const [selectedCompForAudit, setSelectedCompForAudit] = useState<any | null>(null);
  const [auditVotesList, setAuditVotesList] = useState<any[]>([]);
  const [auditStats, setAuditStats] = useState<{ totalVotes: number; uniqueVoters: number }>({ totalVotes: 0, uniqueVoters: 0 });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [competitionToDelete, setCompetitionToDelete] = useState<any | null>(null);
  const [isDeletingCompetition, setIsDeletingCompetition] = useState(false);

  // Launch Form State
  const [compThemeId, setCompThemeId] = useState('');
  const [compTitle, setCompTitle] = useState('');
  const [compSeason, setCompSeason] = useState(2);
  const [compCash, setCompCash] = useState(50000);
  const [compCoins, setCompCoins] = useState(50000);
  const [compDays, setCompDays] = useState(14);
  const [compDesc, setCompDesc] = useState('');

  // Create Theme Form State
  const [admThemeName, setAdmThemeName] = useState('');
  const [admThemeCategory, setAdmThemeCategory] = useState('Sci-Fi');
  const [admThemeEmoji, setAdmThemeEmoji] = useState('🚀');
  const [admThemeTagline, setAdmThemeTagline] = useState('');
  const [admThemeDesc, setAdmThemeDesc] = useState('');
  const [admThemeRules, setAdmThemeRules] = useState('');
  const [admThemeGradient, setAdmThemeGradient] = useState('from-[#2A0845] via-[#1B053A] to-[#0A0216]');

  // Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Check auth
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lighthouse_admin_token') : null;
    if (token) {
      setLocalAdminAuth(true);
    }
  }, []);

  const isAdmin =
    profile?.role === 'admin' ||
    Boolean(user?.email && process.env.NEXT_PUBLIC_ADMIN_EMAIL && user.email.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase()) ||
    localAdminAuth;

  // Load Competitions & Themes for Admin
  const loadAdminCompetitions = async () => {
    try {
      const res = await fetch('/api/admin/competitions');
      if (res.ok) {
        const data = await res.json();
        if (data.activeCompetition) {
          setAdminActiveComp(data.activeCompetition);
          setCompSeason((data.activeCompetition.season_number || 1) + 1);
          setCompTitle(`${data.activeCompetition.theme_name || 'Creator'} Championship`);
          setCompDesc(data.activeCompetition.description || '');
        }
        if (Array.isArray(data.themes)) {
          setAdminThemesList(data.themes);
          if (data.themes[0] && !compThemeId) setCompThemeId(data.themes[0].id);
        }
        if (Array.isArray(data.competitions)) {
          setAdminCompsList(data.competitions);
        }
      }
    } catch (err) {
      console.warn('Failed to load admin competitions:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminCompetitions();
    }
  }, [isAdmin]);

  const handleAdminCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admThemeName.trim()) return;
    setCompLoading(true);
    try {
      const rules = admThemeRules.split('\n').map((r) => r.trim()).filter(Boolean);
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_theme',
          name: admThemeName,
          category: admThemeCategory,
          badgeEmoji: admThemeEmoji,
          tagline: admThemeTagline,
          description: admThemeDesc,
          bannerGradient: admThemeGradient,
          rules,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'Theme created successfully!');
        setAdmThemeName('');
        setAdmThemeTagline('');
        setAdmThemeDesc('');
        setAdmThemeRules('');
        await loadAdminCompetitions();
      } else {
        showNotification('error', data.error || 'Failed to create theme');
      }
    } catch {
      showNotification('error', 'Network error creating theme');
    } finally {
      setCompLoading(false);
    }
  };

  const handleAdminLaunchCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompLoading(true);
    try {
      const selectedT = adminThemesList.find((t) => t.id === compThemeId);
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'launch_competition',
          themeId: compThemeId,
          title: compTitle || `${selectedT?.name || 'Creator'} Championship`,
          seasonNumber: compSeason,
          prizeCashInr: compCash,
          prizeCoins: compCoins,
          durationDays: compDays,
          description: compDesc,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'Championship launched successfully!');
        await loadAdminCompetitions();
      } else {
        showNotification('error', data.error || 'Failed to launch competition');
      }
    } catch {
      showNotification('error', 'Network error launching competition');
    } finally {
      setCompLoading(false);
    }
  };

  // Open Vote Audit Modal for a competition
  const handleOpenVotesAudit = async (comp: any) => {
    setSelectedCompForAudit(comp);
    setShowVotesAuditModal(true);
    setAuditLoading(true);
    setAuditSearchQuery('');
    try {
      const res = await fetch(`/api/admin/competitions?action=votes&competitionId=${comp.id}`);
      if (res.ok) {
        const data = await res.json();
        setAuditVotesList(data.votes || []);
        setAuditStats(data.stats || { totalVotes: 0, uniqueVoters: 0 });
      } else {
        showNotification('error', 'Failed to load vote audit logs.');
      }
    } catch {
      showNotification('error', 'Network error loading vote logs.');
    } finally {
      setAuditLoading(false);
    }
  };

  // Delete Competition Season
  const handleDeleteCompetition = async (targetComp: any) => {
    setIsDeletingCompetition(true);
    try {
      const res = await fetch(`/api/admin/competitions?id=${targetComp.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || `Season ${targetComp.season_number} deleted successfully.`);
        setCompetitionToDelete(null);
        await loadAdminCompetitions();
      } else {
        showNotification('error', data.error || 'Failed to delete competition.');
      }
    } catch {
      showNotification('error', 'Network error deleting competition.');
    } finally {
      setIsDeletingCompetition(false);
    }
  };

  // Delete Theme
  const handleDeleteTheme = async (themeId: string, themeName: string) => {
    if (!confirm(`Are you sure you want to delete the theme "${themeName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/competitions?themeId=${themeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || `Theme "${themeName}" deleted.`);
        await loadAdminCompetitions();
      } else {
        showNotification('error', data.error || 'Failed to delete theme.');
      }
    } catch {
      showNotification('error', 'Network error deleting theme.');
    }
  };

  // Filtered audit votes
  const filteredAuditVotes = useMemo(() => {
    if (!auditSearchQuery.trim()) return auditVotesList;
    const q = auditSearchQuery.toLowerCase();
    return auditVotesList.filter((v) => {
      const voterName = (v.voter?.display_name || '').toLowerCase();
      const voterEmail = (v.voter?.email || '').toLowerCase();
      const voterUsername = (v.voter?.username || '').toLowerCase();
      const vidTitle = (v.video?.title || '').toLowerCase();
      const vidCreator = (v.video?.creator?.display_name || '').toLowerCase();
      return (
        voterName.includes(q) ||
        voterEmail.includes(q) ||
        voterUsername.includes(q) ||
        vidTitle.includes(q) ||
        vidCreator.includes(q)
      );
    });
  }, [auditVotesList, auditSearchQuery]);

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
      setLoginError('Authentication service unreachable or network error.');
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

  // Delete All (Videos, Series, or Everything) from Supabase
  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const params = new URLSearchParams();
      params.set('action', 'delete_all');
      params.set('targetType', deleteAllMode === 'all' ? 'all' : moderationContentType);
      if (deleteAllMode !== 'all' && moderationContentType === 'videos') {
        params.set('filter', moderationFilter);
      }
      const res = await fetch(`/api/admin/moderation?${params.toString()}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        if (deleteAllMode === 'all') {
          setModerationSeries([]);
          setModerationVideos([]);
          showNotification('success', 'All platform videos, series, thumbnails, and episodes deleted permanently from Supabase.');
        } else if (moderationContentType === 'series') {
          setModerationSeries([]);
          showNotification('success', 'All content series and episodes permanently deleted from Supabase.');
        } else {
          setModerationVideos([]);
          showNotification('success', `All ${moderationFilter === 'all' ? '' : moderationFilter + ' '}videos permanently deleted from Supabase (and orphaned series removed).`);
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

  // Clean up series that have 0 remaining episodes
  const handleCleanupOrphans = async () => {
    setIsCleaningOrphans(true);
    try {
      const res = await fetch('/api/admin/moderation?action=cleanup_orphans', {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'Cleaned up orphaned series successfully.');
        loadAnalytics();
        loadModeration();
      } else {
        showNotification('error', data.error || 'Failed to clean up orphaned series.');
      }
    } catch {
      showNotification('error', 'Network error during orphan cleanup.');
    } finally {
      setIsCleaningOrphans(false);
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
              <p className="font-semibold text-purple-600">Secure Database Authentication</p>
              <p>Platform management requires an authorized administrator account verified against Supabase.</p>
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
            <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.email || 'Super Admin'}</span>
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

          <button
            onClick={() => setActiveTab('competitions')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'competitions'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                : isLight
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>3e. Competitions</span>
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

                  {/* CLEANUP ORPHANED SERIES BUTTON */}
                  <button
                    onClick={handleCleanupOrphans}
                    disabled={isCleaningOrphans}
                    className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
                      isLight
                        ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-500/40 text-amber-200'
                    }`}
                    title="Remove series that have 0 episodes from database so ghost thumbnails are gone"
                  >
                    {isCleaningOrphans ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                    <span>Clean Empty Series (0 Ep)</span>
                  </button>

                  {/* DELETE ALL CURRENT CONTENT BUTTON */}
                  <button
                    onClick={() => {
                      setDeleteAllMode('current');
                      setShowDeleteAllModal(true);
                    }}
                    disabled={moderationContentType === 'videos' ? moderationVideos.length === 0 : moderationSeries.length === 0}
                    className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 border border-red-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    title={`Delete all ${moderationContentType === 'videos' ? 'videos in current filter' : 'series and episodes'} permanently`}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>
                      Delete All {moderationContentType === 'videos' ? `Videos (${moderationVideos.length})` : `Series (${moderationSeries.length})`}
                    </span>
                  </button>

                  {/* WIPE ALL CONTENT (VIDEOS + SERIES) */}
                  <button
                    onClick={() => {
                      setDeleteAllMode('all');
                      setShowDeleteAllModal(true);
                    }}
                    disabled={moderationVideos.length === 0 && moderationSeries.length === 0}
                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-red-800 to-rose-950 hover:from-red-700 hover:to-rose-900 border border-red-600 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    title="Permanently wipe ALL platform videos, content series, and thumbnails at once"
                  >
                    <Trash2 className="w-4 h-4 text-rose-300" />
                    <span>Purge All Content</span>
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
                      {deleteAllMode === 'all'
                        ? 'Permanently Delete ALL Platform Content (Videos + Series)?'
                        : `Delete All ${moderationContentType === 'videos' ? `${moderationFilter.toUpperCase()} Videos` : 'Content Series'}?`}
                    </h3>
                    <p className={`text-xs leading-relaxed max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-purple-200/90'}`}>
                      {deleteAllMode === 'all' ? (
                        <>
                          You are about to completely wipe <strong className="text-red-600 font-bold">{moderationVideos.length} videos and {moderationSeries.length} content series</strong> from Supabase.
                        </>
                      ) : (
                        <>
                          You are about to permanently delete{' '}
                          <strong className="text-red-600 font-bold">
                            {moderationContentType === 'videos' ? `${moderationVideos.length} videos` : `${moderationSeries.length} series and all their episodes`}
                          </strong>{' '}
                          from Supabase.
                        </>
                      )}
                    </p>

                    <div className={`p-4 rounded-2xl border text-xs text-left space-y-2 ${
                      isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-950/80 border-red-500/50 text-red-200'
                    }`}>
                      <p className="font-bold text-red-600 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> This action is immediate & permanent:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-[11px]">
                        {deleteAllMode === 'all' ? (
                          <>
                            <li>All {moderationVideos.length} videos in <code className="font-mono font-bold">public.videos</code> will be wiped.</li>
                            <li>All {moderationSeries.length} series in <code className="font-mono font-bold">public.content_series</code> will be wiped.</li>
                            <li>All ghost thumbnails and cover cards will be removed from all platform feeds.</li>
                          </>
                        ) : moderationContentType === 'videos' ? (
                          <>
                            <li>All {moderationVideos.length} records matching &ldquo;{moderationFilter}&rdquo; in <code className="font-mono font-bold">public.videos</code> will be wiped.</li>
                            <li>Empty series whose episodes were deleted will automatically be cleaned up.</li>
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
                          <span>{deleteAllMode === 'all' ? 'Yes, Wipe Everything' : 'Yes, Delete All'}</span>
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

        {/* ========================================================================= */}
        {/* TAB 5: COMPETITIONS & THEMES (Requirement: Create Themes & Launch)       */}
        {/* ========================================================================= */}
        {activeTab === 'competitions' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header info & Live Arena Link */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-xl border transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#11082B]/80 border-purple-500/25 text-white'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                    Competition Arena Management
                  </span>
                </div>
                <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Competitions & Themes Command Center</h2>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-purple-300/80'}`}>
                  Create new competition themes, launch new seasons with bounties, and manage creator contest parameters.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadAdminCompetitions}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isLight
                      ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                      : 'bg-purple-900/50 hover:bg-purple-800/60 border-purple-500/40 text-white'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${compLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <Link
                  href="/competition"
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>View Live Contest Arena</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Currently Active Competition Showcase */}
            {adminActiveComp ? (
              <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-purple-500/40 bg-gradient-to-br from-[#1C0A35] via-[#120624] to-[#0A0314] text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVE CHAMPIONSHIP
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30">
                        <span>{adminActiveComp.theme_badge_emoji || '🎬'}</span>
                        <span>{adminActiveComp.theme_category || 'Theme'}</span>
                      </span>
                      <span className="text-xs text-purple-300/70 font-mono">
                        Season #{adminActiveComp.season_number || 1}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-white">
                      {adminActiveComp.title || `${adminActiveComp.theme_name} Championship`}
                    </h3>
                    <p className="text-sm text-purple-200/80 leading-relaxed">
                      {adminActiveComp.description || adminActiveComp.theme_description}
                    </p>

                    {adminActiveComp.theme_rules && adminActiveComp.theme_rules.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300/60 block mb-1.5">
                          Theme Submission Criteria:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {adminActiveComp.theme_rules.map((rule: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-purple-400/20 text-purple-200 flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                              {rule}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bounty Box */}
                  <div className="shrink-0 p-5 rounded-2xl bg-gradient-to-br from-purple-900/60 to-pink-900/40 border border-purple-400/30 backdrop-blur-xl text-center space-y-3 min-w-[240px]">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 block">
                      Total Prize Bounty
                    </span>
                    <div className="text-3xl font-black text-amber-400">
                      ₹{(adminActiveComp.prize_cash_inr || 50000).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs font-bold text-purple-200 flex items-center justify-center gap-1">
                      <span>+ {(adminActiveComp.prize_coins || 50000).toLocaleString('en-IN')}</span>
                      <span>Coins</span>
                    </div>
                    <div className="pt-2 border-t border-purple-400/20 text-[11px] text-purple-300/80 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        Ends:{' '}
                        {adminActiveComp.end_date
                          ? new Date(adminActiveComp.end_date).toLocaleDateString()
                          : 'In 14 days'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`p-6 rounded-3xl border text-center space-y-2 ${
                  isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}
              >
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="font-bold">No Active Competition Running</h3>
                <p className="text-xs opacity-80">Use the form below to launch a new competition with your preferred theme.</p>
              </div>
            )}

            {/* Forms Grid: Launch Competition & Create Theme */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form 1: Launch New Competition */}
              <div
                className={`p-6 sm:p-7 rounded-3xl border backdrop-blur-xl shadow-lg space-y-5 transition-colors ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/30 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">Launch New Competition</h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                      Select an existing theme and activate a fresh competition season.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAdminLaunchCompetition} className="space-y-4">
                  {/* Select Theme */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                      Select Competition Theme *
                    </label>
                    <select
                      value={compThemeId}
                      onChange={(e) => {
                        const tid = e.target.value;
                        setCompThemeId(tid);
                        const found = adminThemesList.find((t) => t.id === tid);
                        if (found) {
                          setCompTitle(`${found.name} Championship`);
                          setCompDesc(found.description || '');
                        }
                      }}
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                          : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                      }`}
                      required
                    >
                      <option value="" disabled>
                        -- Choose a Theme --
                      </option>
                      {adminThemesList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.badgeEmoji || '🎬'} {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title & Season # */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                        Championship Title
                      </label>
                      <input
                        type="text"
                        value={compTitle}
                        onChange={(e) => setCompTitle(e.target.value)}
                        placeholder="e.g. Cyberpunk 2099 Championship"
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                            : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                        Season #
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={compSeason}
                        onChange={(e) => setCompSeason(parseInt(e.target.value) || 1)}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                            : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Prizes: Cash, Coins, Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                        Cash Prize (₹ INR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={compCash}
                        onChange={(e) => setCompCash(parseInt(e.target.value) || 0)}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                            : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                        Coin Prize
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={compCoins}
                        onChange={(e) => setCompCoins(parseInt(e.target.value) || 0)}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                            : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                        Duration (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={compDays}
                        onChange={(e) => setCompDays(parseInt(e.target.value) || 14)}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                            : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Description / Creative Brief */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                      Competition Brief / Description
                    </label>
                    <textarea
                      rows={3}
                      value={compDesc}
                      onChange={(e) => setCompDesc(e.target.value)}
                      placeholder="Explain the contest requirements, vision, and creator brief..."
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                          : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={compLoading || !compThemeId}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {compLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    )}
                    <span>Launch Competition Season</span>
                  </button>
                </form>
              </div>

              {/* Form 2: Create New Creative Theme */}
              <div
                className={`p-6 sm:p-7 rounded-3xl border backdrop-blur-xl shadow-lg space-y-5 transition-colors ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#11082B]/80 border-purple-500/30 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">Create New Creative Theme</h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                      Define visual atmospheres, genres, and creative criteria for future contests.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAdminCreateTheme} className="space-y-4">
                  {/* Theme Name, Emoji, Genre */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                        Theme Name *
                      </label>
                      <input
                        type="text"
                        value={admThemeName}
                        onChange={(e) => setAdmThemeName(e.target.value)}
                        placeholder="e.g. Monsoon Whispers"
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                            : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                        Emoji Icon
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={admThemeEmoji}
                        onChange={(e) => setAdmThemeEmoji(e.target.value)}
                        placeholder="🌧️"
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-center font-bold focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                            : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Genre Category & Tagline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                        Genre Category
                      </label>
                      <select
                        value={admThemeCategory}
                        onChange={(e) => setAdmThemeCategory(e.target.value)}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                            : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                        }`}
                      >
                        <option value="Sci-Fi">Sci-Fi & Cyberpunk</option>
                        <option value="Romance">Romance & Drama</option>
                        <option value="Thriller">Thriller & Micro-Suspense</option>
                        <option value="Comedy">Comedy & Satire</option>
                        <option value="Action">Action & Stunts</option>
                        <option value="Horror">Horror & Supernatural</option>
                        <option value="Fantasy">Mythology & Fantasy</option>
                        <option value="Documentary">Documentary & Real Life</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                        Tagline
                      </label>
                      <input
                        type="text"
                        value={admThemeTagline}
                        onChange={(e) => setAdmThemeTagline(e.target.value)}
                        placeholder="e.g. Love, rain, and unspoken truths"
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                            : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Atmosphere Gradient Preset */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                      Atmosphere Banner Theme
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: 'Cyber Violet', gradient: 'from-[#2A0845] via-[#1B053A] to-[#0A0216]' },
                        { label: 'Deep Abyss', gradient: 'from-[#031B4D] via-[#080E28] to-[#040614]' },
                        { label: 'Crimson Noir', gradient: 'from-[#4A0D1E] via-[#24060F] to-[#0B0205]' },
                        { label: 'Emerald Matrix', gradient: 'from-[#063826] via-[#031B13] to-[#010805]' },
                        { label: 'Sunset Amber', gradient: 'from-[#4D2305] via-[#2A1102] to-[#0E0601]' },
                        { label: 'Neon Rose', gradient: 'from-[#50083B] via-[#290520] to-[#0D020B]' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setAdmThemeGradient(item.gradient)}
                          className={`p-2 rounded-xl text-left border text-[11px] font-bold flex items-center gap-2 cursor-pointer transition-all ${
                            admThemeGradient === item.gradient
                              ? 'border-purple-500 bg-purple-500/20 text-white ring-1 ring-purple-500'
                              : isLight
                              ? 'border-slate-300 hover:border-slate-400 text-slate-700 bg-slate-50'
                              : 'border-purple-500/20 hover:border-purple-500/40 text-purple-200 bg-[#160B30]'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${item.gradient} shrink-0 border border-white/20`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Description */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                      Creative Brief / Concept
                    </label>
                    <textarea
                      rows={2}
                      value={admThemeDesc}
                      onChange={(e) => setAdmThemeDesc(e.target.value)}
                      placeholder="Describe the world, aesthetic, and creative mandate for creators..."
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                          : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                      }`}
                    />
                  </div>

                  {/* Rules (one per line) */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-purple-200'}`}>
                      Submission Criteria / Rules (one per line)
                    </label>
                    <textarea
                      rows={2}
                      value={admThemeRules}
                      onChange={(e) => setAdmThemeRules(e.target.value)}
                      placeholder={'e.g.\nVertical 9:16 format required\nOriginal music or platform audio library only\nDuration 30-90 seconds'}
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-purple-600'
                          : 'bg-[#180C34] border-purple-500/30 text-white focus:border-purple-400'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={compLoading || !admThemeName.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {compLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 text-purple-200" />
                    )}
                    <span>Save & Register New Theme</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Themes Library Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Theme Library ({adminThemesList.length})
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                    Available creative themes that can be selected when launching future competition seasons.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminThemesList.map((theme) => {
                  const isActive = adminActiveComp?.theme_id === theme.id;
                  return (
                    <div
                      key={theme.id}
                      className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/20 border-purple-400 shadow-lg shadow-purple-600/10'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-purple-300'
                          : 'bg-[#11082B]/60 border-purple-500/20 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl p-2 rounded-xl bg-purple-500/10 border border-purple-400/20">
                            {theme.badgeEmoji || '🎬'}
                          </span>
                          <div className="flex items-center gap-2">
                            {isActive && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Live Now
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {theme.category}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-base text-white">{theme.name}</h4>
                          {theme.tagline && (
                            <p className="text-xs text-purple-300/70 italic mt-0.5">{theme.tagline}</p>
                          )}
                        </div>

                        <p className={`text-xs line-clamp-3 leading-relaxed ${isLight ? 'text-slate-600' : 'text-purple-200/80'}`}>
                          {theme.description}
                        </p>

                        {theme.rules && theme.rules.length > 0 && (
                          <div className="pt-2 border-t border-purple-500/10">
                            <span className="text-[10px] font-bold text-purple-300/60 uppercase tracking-wider block mb-1">
                              Guidelines ({theme.rules.length}):
                            </span>
                            <ul className="text-[11px] text-purple-300/70 space-y-0.5 list-disc list-inside">
                              {theme.rules.slice(0, 3).map((r: string, idx: number) => (
                                <li key={idx} className="truncate">{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 mt-3 border-t border-purple-500/10 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCompThemeId(theme.id);
                            setCompTitle(`${theme.name} Championship`);
                            setCompDesc(theme.description || '');
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            compThemeId === theme.id
                              ? 'bg-purple-600 text-white border-purple-500'
                              : isLight
                              ? 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border-slate-300'
                              : 'bg-purple-900/30 hover:bg-purple-900/60 text-purple-200 border-purple-500/30'
                          }`}
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>{compThemeId === theme.id ? 'Theme Selected' : 'Use for Launch'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTheme(theme.id, theme.name)}
                          className="p-2 rounded-xl text-xs font-bold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition-all cursor-pointer"
                          title="Delete theme"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Competition History Table */}
            <div className="space-y-4">
              <div>
                <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Championship Seasons History ({adminCompsList.length})
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-purple-300/70'}`}>
                  Record of all current and past community competitions hosted on Lighthouse Reels.
                </p>
              </div>

              <div
                className={`rounded-2xl border overflow-hidden backdrop-blur-xl ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#11082B]/80 border-purple-500/20'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr
                        className={`border-b uppercase tracking-wider text-[10px] font-extrabold ${
                          isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#1A0E38] text-purple-300/80 border-purple-500/20'
                        }`}
                      >
                        <th className="px-4 py-3">Season</th>
                        <th className="px-4 py-3">Title & Theme</th>
                        <th className="px-4 py-3">Prizes</th>
                        <th className="px-4 py-3">Start Date</th>
                        <th className="px-4 py-3">End Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/10">
                      {adminCompsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-purple-300/60">
                            No competition records found. Launch your first competition above!
                          </td>
                        </tr>
                      ) : (
                        adminCompsList.map((comp) => {
                          const isActive = comp.status === 'active';
                          return (
                            <tr
                              key={comp.id}
                              className={`transition-colors ${
                                isLight ? 'hover:bg-slate-50' : 'hover:bg-purple-900/20'
                              }`}
                            >
                              <td className="px-4 py-3.5 font-bold font-mono text-purple-400">
                                S{comp.season_number || 1}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-extrabold text-white flex items-center gap-1.5">
                                  <span>{comp.theme_badge_emoji || '🎬'}</span>
                                  <span>{comp.title || comp.theme_name}</span>
                                </div>
                                <div className="text-[11px] text-purple-300/70">{comp.theme_name} • {comp.theme_category}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="font-bold text-amber-400">
                                  ₹{(comp.prize_cash_inr || 0).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[11px] text-purple-300/60 block">
                                  + {(comp.prize_coins || 0).toLocaleString('en-IN')} Coins
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-purple-300/80">
                                {comp.start_date ? new Date(comp.start_date).toLocaleDateString() : '—'}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-purple-300/80">
                                {comp.end_date ? new Date(comp.end_date).toLocaleDateString() : '—'}
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                    isActive
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                  }`}
                                >
                                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                  {comp.status}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenVotesAudit(comp)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 flex items-center gap-1 transition-all cursor-pointer"
                                    title="Audit votes and check who voted"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-purple-300" />
                                    <span className="hidden sm:inline">Inspect Votes</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setCompetitionToDelete(comp)}
                                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition-all cursor-pointer"
                                    title="Delete competition season"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DELETE COMPETITION SEASON MODAL                                           */}
      {/* ========================================================================= */}
      {competitionToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setCompetitionToDelete(null)}
        >
          <div
            className="relative w-full max-w-md bg-slate-950 border border-red-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Delete Competition Season?</h3>
                <p className="text-xs text-red-300/80">Season {competitionToDelete.season_number}: &quot;{competitionToDelete.title}&quot;</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this competition? All associated entries, leaderboard positions, and user vote records will be permanently removed from Supabase.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDeleteCompetition(competitionToDelete)}
                disabled={isDeletingCompetition}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeletingCompetition ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete Season</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCompetitionToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VOTE AUDIT & INSPECTION MODAL                                             */}
      {/* ========================================================================= */}
      {showVotesAuditModal && selectedCompForAudit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowVotesAuditModal(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#0f0720] border border-purple-500/40 rounded-3xl p-6 sm:p-8 text-white space-y-5 shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Eye className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg sm:text-xl">
                      Vote Audit &amp; Inspection
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Season {selectedCompForAudit.season_number || 1}
                    </span>
                  </div>
                  <p className="text-xs text-purple-300/80">
                    &quot;{selectedCompForAudit.title}&quot; • Real-time vote audit logs from Supabase
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVotesAuditModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Summary Bento */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase text-purple-300/70 block">Total Votes Cast</span>
                <span className="text-xl font-black text-amber-400">{auditStats.totalVotes}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase text-purple-300/70 block">Unique Verified Voters</span>
                <span className="text-xl font-black text-emerald-400">{auditStats.uniqueVoters}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-purple-300/70 block">Competition Status</span>
                <span className="text-xs font-bold uppercase text-purple-200">{selectedCompForAudit.status}</span>
              </div>
            </div>

            {/* Search Input Filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Search by voter name, email, or video title..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Vote Log List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {auditLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                  <p className="text-xs text-purple-300">Loading verified vote records from Supabase...</p>
                </div>
              ) : filteredAuditVotes.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  {auditVotesList.length === 0
                    ? 'No votes have been cast for this championship yet.'
                    : 'No vote records match your search criteria.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAuditVotes.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* Voter Information */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shrink-0 overflow-hidden">
                          {v.voter.avatar_url ? (
                            <img src={v.voter.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-4 h-4 text-purple-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white truncate">{v.voter.display_name}</span>
                            {v.voter.role === 'admin' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-purple-300/70 truncate block">{v.voter.email || (v.voter.username ? `@${v.voter.username}` : v.user_id)}</span>
                        </div>
                      </div>

                      {/* Arrow / Vote badge */}
                      <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-pink-400 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 shrink-0">
                        <span>Voted for</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>

                      {/* Target Video Information */}
                      <div className="flex items-center gap-2.5 min-w-0 max-w-xs">
                        {v.video.thumbnail_url ? (
                          <img src={v.video.thumbnail_url} alt="" className="w-9 h-12 object-cover rounded-lg shrink-0 border border-white/10" />
                        ) : (
                          <div className="w-9 h-12 bg-purple-900/40 rounded-lg shrink-0 flex items-center justify-center">
                            <Film className="w-4 h-4 text-purple-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-xs">{v.video.title}</p>
                          <p className="text-[10px] text-purple-300/70 truncate">
                            {v.video.creator?.display_name || 'Creator'} • {v.video.category}
                          </p>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-[10px] text-slate-400 shrink-0 sm:text-right font-mono">
                        <div>{new Date(v.created_at).toLocaleDateString()}</div>
                        <div className="text-slate-500">{new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Showing {filteredAuditVotes.length} of {auditVotesList.length} votes</span>
              <button
                onClick={() => setShowVotesAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
