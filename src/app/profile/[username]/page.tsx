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
      await supabase
        .from('profiles')
        .update({
          display_name: editName.trim(),
          bio: editBio.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              display_name: editName.trim(),
              bio: editBio.trim(),
            }
          : null
      );
      setIsEditing(false);
      await refreshProfile();
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-40 bg-[#333336] rounded-3xl" />
        <div className="h-10 bg-[#333336] rounded-xl w-1/3" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <User className="w-12 h-12 text-[#85858B] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">User Not Found</h2>
        <Link href="/home" className="px-5 py-2.5 rounded-xl bg-[#FF0080] text-white text-xs font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  const filteredFavorites = favoriteItems.filter((f) => f.type === favSubTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Banner & Header */}
      <div className="bg-[#333336] border border-[#454549] rounded-3xl p-6 sm:p-8 mb-8 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar with upload trigger */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#3A3A3E] border-2 border-[#454549] shrink-0">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profile Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#FF0080]">
                  {profile.display_name?.[0] || 'U'}
                </div>
              )}

              {isOwnProfile && (
                <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FF0080]/15 text-[#FF0080] border border-[#FF0080]/30">
                  {profile.role}
                </span>
              </div>
              <p className="text-xs text-[#85858B] mt-0.5">@{profile.username}</p>

              {profile.bio && <p className="text-xs text-[#B8B8BD] mt-2 max-w-md">{profile.bio}</p>}

              <div className="flex items-center gap-2 text-[11px] text-[#85858B] mt-2">
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
                  className="px-4 py-2 rounded-xl bg-[#3A3A3E] hover:bg-[#404045] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>

                {profile.role === 'creator' && (
                  <>
                    <Link
                      href="/creator/studio"
                      className="px-4 py-2 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      <Film className="w-3.5 h-3.5" />
                      Creator Studio
                    </Link>
                    <Link
                      href="/creator/analytics"
                      className="px-4 py-2 rounded-xl bg-[#3A3A3E] hover:bg-[#404045] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
          <div className="mt-6 pt-6 border-t border-[#454549] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#85858B] mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#2B2B2D] text-white text-xs rounded-xl px-3 py-2 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#85858B] mb-1">
                Bio
              </label>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full bg-[#2B2B2D] text-white text-xs rounded-xl px-3 py-2 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-[#3A3A3E] text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-1.5 rounded-lg bg-[#FF0080] hover:bg-[#E00071] text-white text-xs font-semibold flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[#454549] pb-3 mb-6">
        <button
          onClick={() => setActiveTab('uploads')}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative ${
            activeTab === 'uploads' ? 'text-white' : 'text-[#85858B] hover:text-[#B8B8BD]'
          }`}
        >
          <Film className="w-4 h-4 text-[#FF0080]" />
          <span>Uploads ({myVideos.length + myAudios.length + myBlogs.length})</span>
          {activeTab === 'uploads' && (
            <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#FF0080]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative ${
            activeTab === 'favorites' ? 'text-white' : 'text-[#85858B] hover:text-[#B8B8BD]'
          }`}
        >
          <Heart className="w-4 h-4 text-[#FF0080]" />
          <span>Favorites ({favoriteItems.length})</span>
          {activeTab === 'favorites' && (
            <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#FF0080]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative ${
            activeTab === 'watchlist' ? 'text-white' : 'text-[#85858B] hover:text-[#B8B8BD]'
          }`}
        >
          <Bookmark className="w-4 h-4 text-[#FF0080]" />
          <span>Watchlist ({watchlistItems.length})</span>
          {activeTab === 'watchlist' && (
            <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#FF0080]" />
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
                <MediaCard key={v.id} item={{ ...v, type: 'video' }} />
              ))}
              {myAudios.map((a) => (
                <MediaCard key={a.id} item={{ ...a, type: 'audio' }} />
              ))}
              {myBlogs.map((b) => (
                <MediaCard key={b.id} item={{ ...b, type: 'blog' }} />
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                favSubTab === 'video'
                  ? 'bg-[#FF0080] text-white'
                  : 'bg-[#333336] text-[#B8B8BD] hover:text-white'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setFavSubTab('audio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                favSubTab === 'audio'
                  ? 'bg-[#FF0080] text-white'
                  : 'bg-[#333336] text-[#B8B8BD] hover:text-white'
              }`}
            >
              Audios
            </button>
            <button
              onClick={() => setFavSubTab('blog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                favSubTab === 'blog'
                  ? 'bg-[#FF0080] text-white'
                  : 'bg-[#333336] text-[#B8B8BD] hover:text-white'
              }`}
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
    </div>
  );
}
