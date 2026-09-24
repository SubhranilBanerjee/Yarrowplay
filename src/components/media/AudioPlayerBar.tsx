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
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[#0B1117]/95 backdrop-blur-xl border-t border-[#27313A] px-4 py-2.5 transition-all">
        {/* Seek Progress Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            seek(clickPos * duration);
          }}
          className="absolute -top-1 left-0 right-0 h-1.5 bg-[#1C252D] cursor-pointer group"
        >
          <div
            className="h-full bg-[#F4C95D] group-hover:h-2 transition-all relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#F5F1E8] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(244,201,93,0.8)]" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Track Info */}
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 cursor-pointer min-w-0 max-w-[40%]"
          >
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#111A22] shrink-0 border border-[#27313A]">
              {currentTrack.cover_url ? (
                <Image
                  src={currentTrack.cover_url}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#F4C95D]">
                  ♪
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F5F1E8] truncate hover:text-[#F4C95D] transition-colors">
                {currentTrack.title}
              </p>
              <p className="text-xs text-[#B7BEC6] truncate">
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
                className="text-[#B7BEC6] hover:text-[#F5F1E8] transition-colors"
              >
                <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0F13] flex items-center justify-center transition-transform active:scale-95 shadow-md font-semibold"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 md:w-5 md:h-5 fill-[#0B0F13]" />
                ) : (
                  <Play className="w-4 h-4 md:w-5 md:h-5 fill-[#0B0F13] ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                aria-label="Next Track"
                className="text-[#B7BEC6] hover:text-[#F5F1E8] transition-colors"
              >
                <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#7F8993]">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Actions & Volume */}
          <div className="flex items-center gap-3">
            {/* Reactions & Watchlist in Docked Bar */}
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="flex items-center rounded-lg border border-[#27313A] bg-[#141D26] overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleReaction('like')}
                  title="Like Audio"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition-all ${
                    userReaction === 'like' ? 'text-[#F4C95D] bg-[#F4C95D]/15' : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                  <span className="text-[11px]">{likesCount}</span>
                </button>
                <div className="w-px h-3.5 bg-[#27313A]" />
                <button
                  type="button"
                  onClick={() => handleReaction('dislike')}
                  title="Dislike Audio"
                  className={`px-2 py-1 text-xs font-semibold transition-all ${
                    userReaction === 'dislike' ? 'text-[#D96868] bg-[#D96868]/15' : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
                  }`}
                >
                  <ThumbsDown className={`w-3.5 h-3.5 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleToggleFavorite}
                title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isFavorite
                    ? 'bg-[#F4C95D]/15 border-[#F4C95D] text-[#F4C95D]'
                    : 'bg-[#141D26] border-[#27313A] text-[#B7BEC6] hover:text-[#F5F1E8]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleToggleWatchlist}
                title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isWatchlisted
                    ? 'bg-[#F4C95D]/15 border-[#F4C95D] text-[#F4C95D]'
                    : 'bg-[#141D26] border-[#27313A] text-[#B7BEC6] hover:text-[#F5F1E8]'
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
              className="hidden md:block text-xs font-semibold px-2 py-0.5 rounded-md bg-[#151F28] border border-[#27313A] text-[#B7BEC6] hover:text-[#F5F1E8]"
            >
              {playbackRate}x
            </button>

            {/* Volume */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setVolumeLevel(volume > 0 ? 0 : 0.8)}
                className="text-[#B7BEC6] hover:text-[#F5F1E8]"
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
                className="w-20 h-1 bg-[#1C252D] rounded-lg cursor-pointer accent-[#F4C95D]"
              />
            </div>

            {/* Expand button */}
            <button
              onClick={() => setIsExpanded(true)}
              aria-label="Expand Player"
              className="text-[#B7BEC6] hover:text-[#F5F1E8] transition-colors p-1"
            >
              <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Expandable Player (Cinematic Style) */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[#070B0F]/98 backdrop-blur-2xl flex flex-col p-4 md:p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-[#27313A]">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#7F8993]">
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
                className="p-2 rounded-full hover:bg-[#151F28] text-[#B7BEC6] hover:text-[#F5F1E8] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl w-full mx-auto my-6">
            {activeTab === 'art' && (
              <div className="flex flex-col items-center w-full">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border border-[#27313A] mb-6">
                  {currentTrack.cover_url ? (
                    <Image
                      src={currentTrack.cover_url}
                      alt={currentTrack.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#111A22] flex items-center justify-center text-5xl text-[#7F8993]">
                      ♪
                    </div>
                  )}
                </div>

                <div className="w-full text-center mb-6">
                  <h2 className="text-2xl font-bold text-[#F5F1E8] mb-1 truncate">
                    {currentTrack.title}
                  </h2>
                  <p className="text-base text-[#B7BEC6] truncate">
                    {currentTrack.artist_name}
                  </p>
                  {currentTrack.genre && (
                    <span className="inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full bg-[#151F28] border border-[#27313A] text-[#7E9BB5]">
                      {currentTrack.genre}
                    </span>
                  )}

                  {/* Actions in Fullscreen Player */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <div className="flex items-center bg-[#111A22] rounded-xl border border-[#27313A] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleReaction('like')}
                        title="Like Audio"
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                          userReaction === 'like' ? 'text-[#F4C95D] bg-[#F4C95D]/15' : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                        <span>{likesCount}</span>
                      </button>
                      <div className="w-px h-4 bg-[#27313A]" />
                      <button
                        type="button"
                        onClick={() => handleReaction('dislike')}
                        title="Dislike Audio"
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                          userReaction === 'dislike' ? 'text-[#D96868] bg-[#D96868]/15' : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
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
                        isFavorite ? 'bg-[#F4C95D]/15 border-[#F4C95D] text-[#F4C95D]' : 'bg-[#111A22] border-[#27313A] text-[#B7BEC6] hover:text-[#F5F1E8]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleWatchlist}
                      title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                      className={`p-2 rounded-xl border transition-colors ${
                        isWatchlisted ? 'bg-[#F4C95D]/15 border-[#F4C95D] text-[#F4C95D]' : 'bg-[#111A22] border-[#27313A] text-[#B7BEC6] hover:text-[#F5F1E8]'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lyrics' && (
              <div className="w-full h-96 overflow-y-auto bg-[#111A22] rounded-2xl p-6 text-center whitespace-pre-line text-lg text-[#F5F1E8] font-medium leading-relaxed border border-[#27313A]">
                {currentTrack.lyrics || 'No lyrics available for this track.'}
              </div>
            )}

            {activeTab === 'queue' && (
              <div className="w-full h-96 overflow-y-auto bg-[#111A22] rounded-2xl p-4 space-y-2 border border-[#27313A]">
                <h3 className="text-xs uppercase tracking-wider text-[#7F8993] px-3 py-1 font-semibold">
                  Upcoming Tracks
                </h3>
                {queue.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      track.id === currentTrack.id ? 'bg-[#F4C95D]/10 text-[#F4C95D] border border-[#F4C95D]/30' : 'hover:bg-[#151F28] text-[#F5F1E8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#7F8993] w-5 text-right">{idx + 1}</span>
                      <div>
                        <p className="text-sm font-semibold truncate">{track.title}</p>
                        <p className="text-xs text-[#B7BEC6]">{track.artist_name}</p>
                      </div>
                    </div>
                    {track.id === currentTrack.id && isPlaying && (
                      <span className="text-xs text-[#F4C95D] font-bold">Playing</span>
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
                className="w-full h-2 bg-[#1C252D] rounded-full cursor-pointer group relative border border-[#27313A]"
              >
                <div
                  className="h-full bg-[#F4C95D] rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#F5F1E8] rounded-full shadow-[0_0_10px_rgba(244,201,93,0.6)]" />
                </div>
              </div>

              <div className="flex justify-between text-xs text-[#7F8993]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Full Controls */}
              <div className="flex items-center justify-center gap-6 pt-4">
                <button
                  onClick={playPrevious}
                  className="p-3 rounded-full hover:bg-[#151F28] text-[#B7BEC6] hover:text-[#F5F1E8] transition-colors"
                >
                  <SkipBack className="w-7 h-7" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0F13] flex items-center justify-center transition-transform active:scale-95 shadow-xl font-bold"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-[#0B0F13]" />
                  ) : (
                    <Play className="w-8 h-8 fill-[#0B0F13] ml-1" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  className="p-3 rounded-full hover:bg-[#151F28] text-[#B7BEC6] hover:text-[#F5F1E8] transition-colors"
                >
                  <SkipForward className="w-7 h-7" />
                </button>
              </div>

              {/* Volume Slider in Full Player */}
              <div className="flex items-center justify-center gap-3 pt-6 max-w-xs mx-auto">
                <button
                  onClick={() => setVolumeLevel(volume > 0 ? 0 : 0.8)}
                  className="text-[#B7BEC6] hover:text-[#F5F1E8]"
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
                  className="w-full h-1.5 bg-[#1C252D] rounded-lg cursor-pointer accent-[#F4C95D]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
