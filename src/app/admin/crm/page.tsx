'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Crown,
  UserCheck,
  UserX,
  AlertTriangle,
  Calendar,
  Coins,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminCrmPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [vipFilter, setVipFilter] = useState('all');

  // Selected user for details drawer
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Status action states
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const isAdmin =
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user?.email === 'admin@dramabox.stream' ||
    profile?.role === 'admin';

  const showBanner = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (vipFilter !== 'all') params.set('vip', vipFilter);

      const res = await fetch(`/api/admin/crm?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
      }
    } catch (err) {
      console.error('Failed to load CRM users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [user, searchQuery, roleFilter, vipFilter]);

  // Handle Suspend or Restore User
  const handleToggleSuspend = async (targetUser: any) => {
    const nextStatus = !targetUser.is_suspended;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUser.id,
          is_suspended: nextStatus,
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, is_suspended: nextStatus } : u))
        );
        if (selectedUser?.id === targetUser.id) {
          setSelectedUser({ ...selectedUser, is_suspended: nextStatus });
        }
        showBanner(
          nextStatus
            ? `User ${targetUser.username || targetUser.display_name} has been suspended.`
            : `User ${targetUser.username || targetUser.display_name} account restored.`
        );
      }
    } catch (err) {
      console.error('Failed to update suspension:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] flex items-center justify-center p-4">
        <div className="text-center max-w-md p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)]">
          <AlertTriangle className="w-12 h-12 text-[#ECC979] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">Restricted Access</h2>
          <p className="text-xs text-[var(--lr-text-muted)] mb-4">
            Only administrators are authorized to access the User CRM system.
          </p>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 bg-[#ECC979] text-[#101418] font-bold text-xs px-4 py-2 rounded-xl"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Header & Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-10 h-10 rounded-full bg-[var(--lr-card-bg)] border border-[var(--lr-border)] flex items-center justify-center hover:border-[#ECC979] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--lr-text-muted)] hover:text-[#ECC979]" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Admin CRM & User Directory</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  User Management
                </span>
              </div>
              <p className="text-xs text-[var(--lr-text-muted)] mt-0.5">
                Audit registered users, creators, subscription tiers, and control account standing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[var(--lr-card-bg)] border border-[var(--lr-border)] px-4 py-2 rounded-xl text-xs font-semibold">
              <span className="text-[var(--lr-text-muted)]">Users Listed: </span>
              <span className="font-bold text-[#ECC979] font-mono">{users.length}</span>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--lr-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or display name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--lr-bg)] border border-[var(--lr-border)] text-xs text-[var(--lr-text-primary)] placeholder-[var(--lr-text-muted)] focus:outline-none focus:border-[#ECC979]"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--lr-text-muted)] shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#ECC979]" />
              <span>Role:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[var(--lr-bg)] border border-[var(--lr-border)] text-xs text-[var(--lr-text-primary)] py-2 px-3 rounded-xl focus:outline-none focus:border-[#ECC979]"
            >
              <option value="all">All Roles</option>
              <option value="creator">Creators</option>
              <option value="viewer">Viewers</option>
              <option value="admin">Admins</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-[var(--lr-text-muted)] shrink-0 ml-1">
              <Crown className="w-3.5 h-3.5 text-[#F4C95D]" />
              <span>VIP:</span>
            </div>
            <select
              value={vipFilter}
              onChange={(e) => setVipFilter(e.target.value)}
              className="bg-[var(--lr-bg)] border border-[var(--lr-border)] text-xs text-[var(--lr-text-primary)] py-2 px-3 rounded-xl focus:outline-none focus:border-[#ECC979]"
            >
              <option value="all">All Tiers</option>
              <option value="vip">Any VIP</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--lr-bg)] border-b border-[var(--lr-border)] text-[var(--lr-text-muted)] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Coins</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--lr-border)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--lr-text-muted)]">
                      Loading users directory...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--lr-text-muted)]">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--lr-bg)]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--lr-bg)] border border-[var(--lr-border)] overflow-hidden shrink-0 flex items-center justify-center font-bold text-[#ECC979]">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.display_name || 'U'} className="w-full h-full object-cover" />
                            ) : (
                              (u.display_name || u.username || 'U')[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-[var(--lr-text-primary)] truncate">
                              {u.display_name || u.username || 'Unnamed User'}
                            </p>
                            <p className="text-[10px] text-[var(--lr-text-muted)] truncate">
                              {u.username ? `@${u.username}` : u.id.slice(0, 10)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            u.role === 'admin'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : u.role === 'creator'
                              ? 'bg-[#ECC979]/15 text-[#ECC979] border border-[#ECC979]/30'
                              : 'bg-[var(--lr-bg)] text-[var(--lr-text-muted)] border border-[var(--lr-border)]'
                          }`}
                        >
                          {u.role || 'viewer'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.vip_tier && u.vip_tier !== 'free' ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#F4C95D]">
                            <Crown className="w-3 h-3" />
                            <span className="capitalize">{u.vip_tier}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--lr-text-muted)]">Free Tier</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[var(--lr-text-primary)]">
                        🪙 {u.coin_balance || 0}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--lr-text-muted)] font-mono">
                        {new Date(u.created_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.is_suspended ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                            <XCircle className="w-3 h-3" />
                            <span>Suspended</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded-lg bg-[var(--lr-bg)] border border-[var(--lr-border)] hover:border-[#ECC979] text-[var(--lr-text-muted)] hover:text-[#ECC979] transition-colors"
                            title="Inspect Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggleSuspend(u)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              u.is_suspended
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                            }`}
                            title={u.is_suspended ? 'Restore Account' : 'Suspend Account'}
                          >
                            {u.is_suspended ? (
                              <UserCheck className="w-3.5 h-3.5" />
                            ) : (
                              <UserX className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details Modal / Drawer */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-[var(--lr-card-bg)] border border-[var(--lr-border)] rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--lr-border)]">
                <h3 className="font-bold text-base">User Profile Record</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-7 h-7 rounded-full bg-[var(--lr-bg)] border border-[var(--lr-border)] flex items-center justify-center hover:text-red-400"
                >
                  ×
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[var(--lr-bg)] border border-[var(--lr-border)] overflow-hidden shrink-0 flex items-center justify-center text-xl font-bold text-[#ECC979]">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (selectedUser.display_name || 'U')[0].toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold">{selectedUser.display_name || 'User'}</h4>
                  <p className="text-xs text-[var(--lr-text-muted)] font-mono">{selectedUser.id}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#ECC979]/15 text-[#ECC979]">
                      Role: {selectedUser.role}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedUser.is_suspended
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                    >
                      {selectedUser.is_suspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[var(--lr-bg)] border border-[var(--lr-border)] text-xs">
                <div>
                  <span className="text-[var(--lr-text-muted)]">VIP Tier:</span>
                  <p className="font-bold text-[var(--lr-text-primary)] capitalize mt-0.5">
                    {selectedUser.vip_tier || 'Free'}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--lr-text-muted)]">Coin Balance:</span>
                  <p className="font-bold text-[#F4C95D] font-mono mt-0.5">
                    🪙 {selectedUser.coin_balance || 0}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--lr-text-muted)]">Registered:</span>
                  <p className="font-bold text-[var(--lr-text-primary)] mt-0.5">
                    {new Date(selectedUser.created_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--lr-text-muted)]">Last Activity:</span>
                  <p className="font-bold text-[var(--lr-text-primary)] mt-0.5">
                    {selectedUser.last_active_at
                      ? new Date(selectedUser.last_active_at).toLocaleDateString()
                      : 'Recent'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--lr-bg)] border border-[var(--lr-border)]"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleToggleSuspend(selectedUser)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    selectedUser.is_suspended
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {selectedUser.is_suspended ? 'Restore Account' : 'Suspend Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
