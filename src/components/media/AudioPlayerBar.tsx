'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
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
} from 'lucide-react';

export function AudioPlayerBar() {
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
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[#333336]/95 backdrop-blur-md border-t border-[#454549] px-4 py-2.5 transition-all">
        {/* Seek Progress Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            seek(clickPos * duration);
          }}
          className="absolute -top-1 left-0 right-0 h-1.5 bg-[#454549] cursor-pointer group"
        >
          <div
            className="h-full bg-[#FF0080] group-hover:h-2 transition-all relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Track Info */}
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 cursor-pointer min-w-0 max-w-[40%]"
          >
            <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#3A3A3E] shrink-0 border border-[#454549]">
              {currentTrack.cover_url ? (
                <Image
                  src={currentTrack.cover_url}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#85858B]">
                  ♪
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate hover:underline">
                {currentTrack.title}
              </p>
              <p className="text-xs text-[#B8B8BD] truncate">
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
                className="text-[#B8B8BD] hover:text-white transition-colors"
              >
                <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FF0080] hover:bg-[#E00071] text-white flex items-center justify-center transition-transform active:scale-95 shadow-md"
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
                className="text-[#B8B8BD] hover:text-white transition-colors"
              >
                <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#85858B]">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Actions & Volume */}
          <div className="flex items-center gap-3">
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
        <div className="fixed inset-0 z-50 bg-[#2B2B2D] flex flex-col p-4 md:p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-[#454549]">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#85858B]">
                Playing From {currentTrack.genre || 'Audio'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('art')}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'art' ? 'bg-[#FF0080] text-white' : 'text-[#B8B8BD] hover:bg-[#333336]'
                }`}
              >
                Artwork
              </button>
              {currentTrack.lyrics && (
                <button
                  onClick={() => setActiveTab('lyrics')}
                  className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'lyrics' ? 'bg-[#FF0080] text-white' : 'text-[#B8B8BD] hover:bg-[#333336]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Lyrics
                </button>
              )}
              <button
                onClick={() => setActiveTab('queue')}
                className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'queue' ? 'bg-[#FF0080] text-white' : 'text-[#B8B8BD] hover:bg-[#333336]'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                Queue ({queue.length})
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full hover:bg-[#333336] text-[#B8B8BD] hover:text-white transition-colors"
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
                </div>
              </div>
            )}

            {activeTab === 'lyrics' && (
              <div className="w-full h-96 overflow-y-auto bg-[#333336] border border-[#454549] rounded-2xl p-6 text-center whitespace-pre-line text-lg text-white font-medium leading-relaxed">
                {currentTrack.lyrics || 'No lyrics available for this track.'}
              </div>
            )}

            {activeTab === 'queue' && (
              <div className="w-full h-96 overflow-y-auto bg-[#333336] border border-[#454549] rounded-2xl p-4 space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-[#85858B] px-3 py-1 font-semibold">
                  Upcoming Tracks
                </h3>
                {queue.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      track.id === currentTrack.id ? 'bg-[#FF0080]/20 text-[#FF0080]' : 'hover:bg-[#3A3A3E] text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#85858B] w-5 text-right">{idx + 1}</span>
                      <div>
                        <p className="text-sm font-semibold truncate">{track.title}</p>
                        <p className="text-xs text-[#B8B8BD]">{track.artist_name}</p>
                      </div>
                    </div>
                    {track.id === currentTrack.id && isPlaying && (
                      <span className="text-xs text-[#FF0080] font-medium">Playing</span>
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
                className="w-full h-2 bg-[#454549] rounded-full cursor-pointer group relative"
              >
                <div
                  className="h-full bg-[#FF0080] rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow" />
                </div>
              </div>

              <div className="flex justify-between text-xs text-[#85858B]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Full Controls */}
              <div className="flex items-center justify-center gap-6 pt-4">
                <button
                  onClick={playPrevious}
                  className="p-3 rounded-full hover:bg-[#333336] text-[#B8B8BD] hover:text-white transition-colors"
                >
                  <SkipBack className="w-7 h-7" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-[#FF0080] hover:bg-[#E00071] text-white flex items-center justify-center transition-transform active:scale-95 shadow-xl"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-white" />
                  ) : (
                    <Play className="w-8 h-8 fill-white ml-1" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  className="p-3 rounded-full hover:bg-[#333336] text-[#B8B8BD] hover:text-white transition-colors"
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
