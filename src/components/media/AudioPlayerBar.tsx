'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { useAuth } from '@/context/AuthContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ListMusic,
  FileText,
  X,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Bookmark,
} from 'lucide-react';

export function AudioPlayerBar() {
  const { user } = useAuth();
  const {
    currentTrack,
    isPlaying,
    isExpanded,
    currentTime,
    duration,
    volume,
    queue,
    playbackRate,
    togglePlay,
    seek,
    setVolumeLevel,
    setSpeed,
    playNext,
    playPrevious,
    setIsExpanded,
    playTrack,
  } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<'art' | 'lyrics' | 'queue'>('art');
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  useEffect(() => {
    if (!currentTrack) return;
    setLikesCount(currentTrack.likes_count || 0);

    if (!user) {
      setUserReaction(null);
      setIsFavorite(false);
      setIsWatchlisted(false);
      return;
    }

    Promise.all([
      fetch(`/api/reactions?content_type=audio&content_id=${currentTrack.id}`)
        .then((r) => r.json())
        .catch(() => ({ userReaction: null })),
      fetch(`/api/watchlist?content_type=audio&content_id=${currentTrack.id}`)
        .then((r) => r.json())
        .catch(() => ({ isWatchlisted: false })),
      fetch(`/api/favorites?content_type=audio&content_id=${currentTrack.id}`)
        .then((r) => r.json())
        .catch(() => ({ isFavorite: false })),
    ]).then(([rData, wData, fData]) => {
      if (rData?.userReaction !== undefined) setUserReaction(rData.userReaction);
      if (wData?.isWatchlisted !== undefined) setIsWatchlisted(wData.isWatchlisted);
      if (fData?.isFavorite !== undefined) setIsFavorite(fData.isFavorite);
    });
  }, [currentTrack?.id, user]);

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!currentTrack) return;
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'audio',
          content_id: currentTrack.id,
          reaction_type: type,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserReaction(data.userReaction);
        setLikesCount(data.likesCount);
      }
    } catch {}
  };

  const handleToggleFavorite = async () => {
    if (!currentTrack) return;
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'audio',
          content_id: currentTrack.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      }
    } catch {}
  };

  const handleToggleWatchlist = async () => {
    if (!currentTrack) return;
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'audio',
          content_id: currentTrack.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsWatchlisted(data.isWatchlisted);
      }
    } catch {}
  };

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Mini Player Bar (Always docked) */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-t border-[var(--glass-border)] px-4 py-2.5 transition-all">
        {/* Seek Progress Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            seek(clickPos * duration);
          }}
          className="absolute -top-1 left-0 right-0 h-1.5 bg-[var(--glass-surface-subtle)] cursor-pointer group"
        >
          <div
            className="h-full bg-gradient-to-r from-[var(--color-purple-bright)] to-[var(--color-pink)] group-hover:h-2 transition-all relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(255,32,217,0.8)]" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Track Info */}
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 cursor-pointer min-w-0 max-w-[40%]"
          >
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--glass-border)]">
              {currentTrack.cover_url ? (
                <Image
                  src={currentTrack.cover_url}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-pink)]">
                  ♪
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate hover:text-[var(--color-pink)] transition-colors">
                {currentTrack.title}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {currentTrack.artist_name}
              </p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={playPrevious}
                aria-label="Previous Track"
                className="text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full theme-neon-button text-white flex items-center justify-center transition-transform active:scale-95 shadow-md"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 md:w-5 md:h-5 fill-white" />
                ) : (
                  <Play className="w-4 h-4 md:w-5 md:h-5 fill-white ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                aria-label="Next Track"
                className="text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Actions & Volume */}
          <div className="flex items-center gap-3">
            {/* Reactions & Watchlist in Docked Bar */}
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="flex items-center bg-[#3A3A3E] rounded-lg border border-[#454549] overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleReaction('like')}
                  title="Like Audio"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition-colors ${
                    userReaction === 'like' ? 'text-[#FF0080] bg-[#FF0080]/15' : 'text-[#B8B8BD] hover:text-white'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                  <span className="text-[11px]">{likesCount}</span>
                </button>
                <div className="w-px h-3.5 bg-[#454549]" />
                <button
                  type="button"
                  onClick={() => handleReaction('dislike')}
                  title="Dislike Audio"
                  className={`px-2 py-1 text-xs font-semibold transition-colors ${
                    userReaction === 'dislike' ? 'text-[#EF4444] bg-[#EF4444]/15' : 'text-[#B8B8BD] hover:text-white'
                  }`}
                >
                  <ThumbsDown className={`w-3.5 h-3.5 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleToggleFavorite}
                title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isFavorite
                    ? 'bg-[#FF0080] text-white border-[#FF0080]'
                    : 'bg-[#3A3A3E] border-[#454549] text-[#B8B8BD] hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleToggleWatchlist}
                title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isWatchlisted
                    ? 'bg-[#FF0080] text-white border-[#FF0080]'
                    : 'bg-[#3A3A3E] border-[#454549] text-[#B8B8BD] hover:text-white'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Speed toggle */}
            <button
              onClick={() => {
                const nextSpeed = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
                setSpeed(nextSpeed);
              }}
              className="hidden md:block text-xs font-semibold px-2 py-0.5 rounded bg-[#3A3A3E] text-[#B8B8BD] hover:text-white"
            >
              {playbackRate}x
            </button>

            {/* Volume */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setVolumeLevel(volume > 0 ? 0 : 0.8)}
                className="text-[#B8B8BD] hover:text-white"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                className="w-20 h-1 bg-[#454549] rounded-lg cursor-pointer"
              />
            </div>

            {/* Expand button */}
            <button
              onClick={() => setIsExpanded(true)}
              aria-label="Expand Player"
              className="text-[#B8B8BD] hover:text-white transition-colors p-1"
            >
              <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Expandable Player (Spotify-Style) */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-2xl flex flex-col p-4 md:p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-[var(--glass-border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                Playing From {currentTrack.genre || 'Audio'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('art')}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                  activeTab === 'art' ? 'theme-active-pill' : 'theme-inactive-pill'
                }`}
              >
                Artwork
              </button>
              {currentTrack.lyrics && (
                <button
                  onClick={() => setActiveTab('lyrics')}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                    activeTab === 'lyrics' ? 'theme-active-pill' : 'theme-inactive-pill'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Lyrics
                </button>
              )}
              <button
                onClick={() => setActiveTab('queue')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                  activeTab === 'queue' ? 'theme-active-pill' : 'theme-inactive-pill'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                Queue ({queue.length})
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full hover:bg-[var(--glass-surface-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl w-full mx-auto my-6">
            {activeTab === 'art' && (
              <div className="flex flex-col items-center w-full">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border border-[#454549] mb-6">
                  {currentTrack.cover_url ? (
                    <Image
                      src={currentTrack.cover_url}
                      alt={currentTrack.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#333336] flex items-center justify-center text-5xl text-[#85858B]">
                      ♪
                    </div>
                  )}
                </div>

                <div className="w-full text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1 truncate">
                    {currentTrack.title}
                  </h2>
                  <p className="text-base text-[#B8B8BD] truncate">
                    {currentTrack.artist_name}
                  </p>
                  {currentTrack.genre && (
                    <span className="inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full bg-[#3A3A3E] text-[#85858B]">
                      {currentTrack.genre}
                    </span>
                  )}

                  {/* Actions in Fullscreen Player */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <div className="flex items-center bg-[var(--glass-surface)] rounded-xl border border-[var(--glass-border)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleReaction('like')}
                        title="Like Audio"
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                          userReaction === 'like' ? 'text-[var(--color-pink)] bg-[var(--color-purple-bright)]/20' : 'text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                        <span>{likesCount}</span>
                      </button>
                      <div className="w-px h-4 bg-[var(--glass-border)]" />
                      <button
                        type="button"
                        onClick={() => handleReaction('dislike')}
                        title="Dislike Audio"
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                          userReaction === 'dislike' ? 'text-[var(--status-error)] bg-[var(--status-error)]/20' : 'text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        <ThumbsDown className={`w-4 h-4 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                      className={`p-2 rounded-xl border transition-colors ${
                        isFavorite ? 'theme-active-pill border-[var(--color-magenta)]' : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleWatchlist}
                      title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                      className={`p-2 rounded-xl border transition-colors ${
                        isWatchlisted ? 'theme-active-pill border-[var(--color-magenta)]' : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lyrics' && (
              <div className="w-full h-96 overflow-y-auto theme-glass-card-static rounded-3xl p-6 text-center whitespace-pre-line text-lg text-white font-medium leading-relaxed border border-[var(--glass-border)]">
                {currentTrack.lyrics || 'No lyrics available for this track.'}
              </div>
            )}

            {activeTab === 'queue' && (
              <div className="w-full h-96 overflow-y-auto theme-glass-card-static rounded-3xl p-4 space-y-2 border border-[var(--glass-border)]">
                <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] px-3 py-1 font-semibold">
                  Upcoming Tracks
                </h3>
                {queue.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      track.id === currentTrack.id ? 'bg-[var(--color-purple-bright)]/20 text-[var(--color-pink)] border border-[var(--glass-border)]' : 'hover:bg-[var(--glass-surface-elevated)] text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-muted)] w-5 text-right">{idx + 1}</span>
                      <div>
                        <p className="text-sm font-semibold truncate">{track.title}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{track.artist_name}</p>
                      </div>
                    </div>
                    {track.id === currentTrack.id && isPlaying && (
                      <span className="text-xs text-[var(--color-pink)] font-bold">Playing</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Expanded Progress Bar & Controls */}
            <div className="w-full space-y-2 mt-4">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPos = (e.clientX - rect.left) / rect.width;
                  seek(clickPos * duration);
                }}
                className="w-full h-2 bg-[var(--glass-surface-subtle)] rounded-full cursor-pointer group relative border border-[var(--glass-border-subtle)]"
              >
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-purple-bright)] to-[var(--color-pink)] rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,32,217,0.8)]" />
                </div>
              </div>

              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Full Controls */}
              <div className="flex items-center justify-center gap-6 pt-4">
                <button
                  onClick={playPrevious}
                  className="p-3 rounded-full hover:bg-[var(--glass-surface-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  <SkipBack className="w-7 h-7" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full theme-neon-button text-white flex items-center justify-center transition-transform active:scale-95 shadow-xl"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-white" />
                  ) : (
                    <Play className="w-8 h-8 fill-white ml-1" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  className="p-3 rounded-full hover:bg-[var(--glass-surface-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  <SkipForward className="w-7 h-7" />
                </button>
              </div>

              {/* Volume Slider in Full Player */}
              <div className="flex items-center justify-center gap-3 pt-6 max-w-xs mx-auto">
                <button
                  onClick={() => setVolumeLevel(volume > 0 ? 0 : 0.8)}
                  className="text-[#B8B8BD] hover:text-white"
                >
                  {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#454549] rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
