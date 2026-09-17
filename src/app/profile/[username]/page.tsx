'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { uploadMedia } from '@/lib/upload';
import { MediaCard, UnifiedMediaItem } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Profile, Video, AudioTrack, Blog } from '@/types/database';
import {
  User,
  Film,
  Music,
  Bookmark,
  Heart,
  BarChart3,
  Calendar,
  Camera,
  Edit3,
  Check,
  X,
  BookOpen,
  Trash2,
  Loader2,
} from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const usernameParam = params?.username as string;
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<'uploads' | 'favorites' | 'watchlist'>('uploads');
  const [favSubTab, setFavSubTab] = useState<'video' | 'audio' | 'blog'>('video');

  const [myVideos, setMyVideos] = useState<Video[]>([]);
  const [myAudios, setMyAudios] = useState<AudioTrack[]>([]);
  const [myBlogs, setMyBlogs] = useState<Blog[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<UnifiedMediaItem[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<Video[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const isOwnProfile = user && profile && (user.id === profile.id || authProfile?.username === usernameParam);
  const isAdmin = !!user?.email && (
    user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user.email === 'admin@dramabox.stream'
  );
  const canManageContent = isOwnProfile || isAdmin;

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: 'video' | 'audio' | 'blog';
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile by username or id
        let { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', usernameParam)
          .maybeSingle();

        if (!prof) {
          const { data: profById } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', usernameParam)
            .maybeSingle();
          prof = profById;
        }

        if (prof) {
          setProfile(prof as Profile);
          setEditName(prof.display_name || '');
          setEditBio(prof.bio || '');

          // Parallelize primary queries: uploads, favorites, and watchlist
          const [
            { data: vids },
            { data: auds },
            { data: blgs },
            { data: favs },
            { data: wList },
          ] = await Promise.all([
            supabase
              .from('videos')
              .select('*')
              .eq('creator_id', prof.id)
              .order('created_at', { ascending: false }),

            supabase
              .from('audios')
              .select('*')
              .eq('creator_id', prof.id)
              .order('created_at', { ascending: false }),

            supabase
              .from('blogs')
              .select('*')
              .eq('author_id', prof.id)
              .order('created_at', { ascending: false }),

            supabase
              .from('favorites')
              .select('*')
              .eq('user_id', prof.id),

            supabase
              .from('watchlists')
              .select('video:videos(*, creator:profiles(*))')
              .eq('user_id', prof.id),
          ]);

          setMyVideos((vids as Video[]) || []);
          setMyAudios((auds as AudioTrack[]) || []);
          setMyBlogs((blgs as Blog[]) || []);

          const wVideos = (wList || []).map((w: any) => w.video).filter(Boolean);
          setWatchlistItems(wVideos);

          // Resolve favorites in parallel if any exist
          if (favs && favs.length > 0) {
            const vidIds = favs.filter((f: any) => f.content_type === 'video').map((f: any) => f.content_id);
            const audIds = favs.filter((f: any) => f.content_type === 'audio').map((f: any) => f.content_id);
            const blgIds = favs.filter((f: any) => f.content_type === 'blog').map((f: any) => f.content_id);

            const [fVidsRes, fAudsRes, fBlgsRes] = await Promise.all([
              vidIds.length > 0
                ? supabase.from('videos').select('*, creator:profiles(*)').in('id', vidIds)
                : Promise.resolve({ data: [] }),
              audIds.length > 0
                ? supabase.from('audios').select('*, creator:profiles(*)').in('id', audIds)
                : Promise.resolve({ data: [] }),
              blgIds.length > 0
                ? supabase.from('blogs').select('*, author:profiles(*)').in('id', blgIds)
                : Promise.resolve({ data: [] }),
            ]);

            const favList: UnifiedMediaItem[] = [];
            (fVidsRes.data || []).forEach((v: any) => favList.push({ ...v, type: 'video' }));
            (fAudsRes.data || []).forEach((a: any) => favList.push({ ...a, type: 'audio' }));
            (fBlgsRes.data || []).forEach((b: any) => favList.push({ ...b, type: 'blog' }));
            setFavoriteItems(favList);
          } else {
            setFavoriteItems([]);
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [usernameParam, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const res = await uploadMedia(file, 'image', 'yarrowplay/avatars');
      await supabase.from('profiles').update({ avatar_url: res.secure_url }).eq('id', user.id);
      setProfile((prev) => (prev ? { ...prev, avatar_url: res.secure_url } : null));
      await refreshProfile();
    } catch {
      // ignore
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editName.trim(),
          bio: editBio.trim(),
        })
        .eq('id', user.id);

      if (!error) {
        setProfile((prev) => (prev ? { ...prev, display_name: editName.trim(), bio: editBio.trim() } : null));
        setIsEditing(false);
        refreshProfile();
      }
    } catch {
      // ignore
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const endpoint =
        deleteTarget.type === 'video'
          ? '/api/videos'
          : deleteTarget.type === 'audio'
          ? '/api/audios'
          : '/api/blogs';
      const res = await fetch(`${endpoint}?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to delete ${deleteTarget.type}`);
      }

      if (deleteTarget.type === 'video') {
        setMyVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'audio') {
        setMyAudios((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'blog') {
        setMyBlogs((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete content');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-40 rounded-3xl" style={{ background: 'var(--glass-surface)' }} />
        <div className="h-10 rounded-xl w-1/3" style={{ background: 'var(--glass-surface)' }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className="max-w-md mx-auto px-6 py-16 text-center my-12 rounded-2xl border"
        style={{
          background: 'var(--glass-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <User className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">User Not Found</h2>
        <Link
          href="/home"
          className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold inline-block transition-all shadow-md"
          style={{
            background: 'var(--gradient-neon)',
            boxShadow: 'var(--glow-purple)',
          }}
        >
          Return Home
        </Link>
      </div>
    );
  }

  const filteredFavorites = favoriteItems.filter((f) => f.type === favSubTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Banner & Header */}
      <div
        className="rounded-3xl p-6 sm:p-8 mb-8 relative border backdrop-blur-xl"
        style={{
          background: 'var(--glass-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar with upload trigger */}
            <div
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 shrink-0"
              style={{
                background: 'var(--glass-surface-heavy)',
                borderColor: 'var(--neon-purple-border)',
                boxShadow: 'var(--glow-purple)',
              }}
            >
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profile Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[var(--color-pink-light)]">
                  {profile.display_name?.[0] || 'U'}
                </div>
              )}

              {isOwnProfile && (
                <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    disabled={avatarUploading}
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Profile Info */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {profile.display_name || profile.username}
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border"
                  style={{
                    background: 'var(--neon-purple-glow)',
                    borderColor: 'var(--neon-purple-border)',
                    color: 'var(--color-pink-light)',
                  }}
                >
                  {profile.role}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">@{profile.username}</p>

              {profile.bio && <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-md">{profile.bio}</p>}

              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Creator / Edit Actions */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer"
                  style={{
                    background: 'var(--glass-surface-heavy)',
                    borderColor: 'var(--glass-border)',
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>

                {profile.role === 'creator' && (
                  <>
                    <Link
                      href="/creator/studio"
                      className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                      style={{
                        background: 'var(--gradient-neon)',
                        boxShadow: 'var(--glow-purple)',
                      }}
                    >
                      <Film className="w-3.5 h-3.5" />
                      Creator Studio
                    </Link>
                    <Link
                      href="/creator/analytics"
                      className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-all border"
                      style={{
                        background: 'var(--glass-surface-heavy)',
                        borderColor: 'var(--glass-border)',
                      }}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Analytics
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Inline Profile Editor */}
        {isEditing && (
          <div
            className="mt-6 pt-6 border-t grid grid-cols-1 sm:grid-cols-2 gap-4"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[var(--text-muted)] mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full text-white text-xs rounded-xl px-3 py-2 border focus:outline-none transition-colors"
                style={{
                  background: 'var(--glass-surface-heavy)',
                  borderColor: 'var(--glass-border)',
                }}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[var(--text-muted)] mb-1">
                Bio
              </label>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full text-white text-xs rounded-xl px-3 py-2 border focus:outline-none transition-colors"
                style={{
                  background: 'var(--glass-surface-heavy)',
                  borderColor: 'var(--glass-border)',
                }}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-white text-xs border cursor-pointer"
                style={{
                  background: 'var(--glass-surface)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                style={{
                  background: 'var(--gradient-neon)',
                  boxShadow: 'var(--glow-purple)',
                }}
              >
                <Check className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-3 border-b pb-3 mb-6"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <button
          onClick={() => setActiveTab('uploads')}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative ${
            activeTab === 'uploads' ? 'text-white' : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Film className="w-4 h-4 text-[var(--color-pink-light)]" />
          <span>Uploads ({myVideos.length + myAudios.length + myBlogs.length})</span>
          {activeTab === 'uploads' && (
            <div
              className="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full"
              style={{ background: 'var(--gradient-neon)', boxShadow: 'var(--glow-pink)' }}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative ${
            activeTab === 'favorites' ? 'text-white' : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4 text-[var(--color-pink-light)]" />
          <span>Favorites ({favoriteItems.length})</span>
          {activeTab === 'favorites' && (
            <div
              className="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full"
              style={{ background: 'var(--gradient-neon)', boxShadow: 'var(--glow-pink)' }}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative ${
            activeTab === 'watchlist' ? 'text-white' : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4 text-[var(--color-pink-light)]" />
          <span>Watchlist ({watchlistItems.length})</span>
          {activeTab === 'watchlist' && (
            <div
              className="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full"
              style={{ background: 'var(--gradient-neon)', boxShadow: 'var(--glow-pink)' }}
            />
          )}
        </button>
      </div>

      {/* Uploads Tab Content */}
      {activeTab === 'uploads' && (
        <div className="space-y-6">
          {myVideos.length === 0 && myAudios.length === 0 && myBlogs.length === 0 ? (
            <EmptyState
              icon={Film}
              title="No uploads yet"
              description="This user hasn't published any videos, audio tracks, or blogs yet."
              actionLabel={isOwnProfile && profile.role === 'creator' ? 'Open Creator Studio' : undefined}
              actionHref="/creator/studio"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {myVideos.map((v) => (
                <MediaCard
                  key={v.id}
                  item={{ ...v, type: 'video' }}
                  onDelete={canManageContent ? () => setDeleteTarget({ id: v.id, type: 'video', title: v.title }) : undefined}
                />
              ))}
              {myAudios.map((a) => (
                <MediaCard
                  key={a.id}
                  item={{ ...a, type: 'audio' }}
                  allAudioTracks={myAudios}
                  onDelete={canManageContent ? () => setDeleteTarget({ id: a.id, type: 'audio', title: a.title }) : undefined}
                />
              ))}
              {myBlogs.map((b) => (
                <MediaCard
                  key={b.id}
                  item={{ ...b, type: 'blog' }}
                  onDelete={canManageContent ? () => setDeleteTarget({ id: b.id, type: 'blog', title: b.title }) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorites Tab Content (Tabbed: Videos | Audios | Blogs) */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFavSubTab('video')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
              style={
                favSubTab === 'video'
                  ? {
                      background: 'var(--gradient-neon)',
                      color: '#ffffff',
                      borderColor: 'var(--color-pink)',
                      boxShadow: 'var(--glow-purple)',
                    }
                  : {
                      background: 'var(--glass-surface)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--glass-border)',
                    }
              }
            >
              Videos
            </button>
            <button
              onClick={() => setFavSubTab('audio')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
              style={
                favSubTab === 'audio'
                  ? {
                      background: 'var(--gradient-neon)',
                      color: '#ffffff',
                      borderColor: 'var(--color-pink)',
                      boxShadow: 'var(--glow-purple)',
                    }
                  : {
                      background: 'var(--glass-surface)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--glass-border)',
                    }
              }
            >
              Audios
            </button>
            <button
              onClick={() => setFavSubTab('blog')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
              style={
                favSubTab === 'blog'
                  ? {
                      background: 'var(--gradient-neon)',
                      color: '#ffffff',
                      borderColor: 'var(--color-pink)',
                      boxShadow: 'var(--glow-purple)',
                    }
                  : {
                      background: 'var(--glass-surface)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--glass-border)',
                    }
              }
            >
              Blogs
            </button>
          </div>

          {filteredFavorites.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No favorites in this category"
              description="Explore the feed and tap the heart icon on videos, songs, or blogs you enjoy."
              actionLabel="Explore Feed"
              actionHref="/home"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredFavorites.map((item) => (
                <MediaCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Watchlist Tab Content */}
      {activeTab === 'watchlist' && (
        <div>
          {watchlistItems.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="Watchlist is empty"
              description="Save videos to your watchlist to continue watching later."
              actionLabel="Discover Videos"
              actionHref="/home"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {watchlistItems.map((v) => (
                <MediaCard key={v.id} item={{ ...v, type: 'video' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border backdrop-blur-xl"
            style={{
              background: 'var(--glass-surface-heavy)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white capitalize">
                  Delete {deleteTarget.type}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">"{deleteTarget.title}"</strong>? All associated comments,
              reactions, and media references will be permanently removed.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
