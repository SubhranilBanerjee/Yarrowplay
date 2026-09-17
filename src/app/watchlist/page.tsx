'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MediaCard } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Video, AudioTrack } from '@/types/database';
import { Bookmark, Film, Music } from 'lucide-react';

export default function WatchlistPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [audioList, setAudioList] = useState<AudioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchWatchlist = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/watchlist');
        if (res.ok) {
          const data = await res.json();
          setVideoList(data.videos || []);
          setAudioList(data.audios || []);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlist();
  }, [user]);

  const currentItemsCount = activeTab === 'video' ? videoList.length : audioList.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Bookmark className="w-7 h-7 text-[var(--color-pink-light)]" />
          My Watchlist
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Continue watching and listening to your saved videos and audio tracks.
        </p>
      </div>

      {/* Format Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('video')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border"
          style={
            activeTab === 'video'
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
          <Film className="w-4 h-4" />
          <span>Videos ({videoList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border"
          style={
            activeTab === 'audio'
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
          <Music className="w-4 h-4" />
          <span>Audios ({audioList.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl h-64 animate-pulse"
              style={{ background: 'var(--glass-surface)' }}
            />
          ))}
        </div>
      ) : currentItemsCount === 0 ? (
        <EmptyState
          icon={activeTab === 'video' ? Film : Music}
          title={activeTab === 'video' ? 'No videos in watchlist' : 'No audio tracks in watchlist'}
          description={
            activeTab === 'video'
              ? 'Save videos to your watchlist while watching or browsing.'
              : 'Save songs or podcasts to your watchlist while listening.'
          }
          actionLabel={activeTab === 'video' ? 'Browse Videos' : 'Discover Music'}
          actionHref="/home"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {activeTab === 'video'
            ? videoList.map((v) => <MediaCard key={v.id} item={{ ...v, type: 'video' }} />)
            : audioList.map((a) => (
                <MediaCard key={a.id} item={{ ...a, type: 'audio' }} allAudioTracks={audioList} />
              ))}
        </div>
      )}
    </div>
  );
}

