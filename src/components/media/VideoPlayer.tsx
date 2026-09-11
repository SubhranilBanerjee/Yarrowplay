'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  creatorId: string;
  videoUrl: string;
  title: string;
  posterUrl?: string | null;
  initialProgress?: number;
  onEnded?: () => void;
}

export function VideoPlayer({
  videoId,
  creatorId,
  videoUrl,
  title,
  posterUrl,
  initialProgress = 0,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Resume initial progress if any
  useEffect(() => {
    if (videoRef.current && initialProgress > 0) {
      videoRef.current.currentTime = initialProgress;
    }
  }, [initialProgress]);

  // Mobile auto-rotate on fullscreen
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isCurrentFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentFullscreen);

      if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
        try {
          if (isCurrentFullscreen) {
            // Attempt orientation lock to landscape on mobile if supported
            await (window.screen.orientation as any).lock?.('landscape');
          } else {
            await (window.screen.orientation as any).unlock?.();
          }
        } catch {
          // Orientation lock might not be supported or allowed by user gesture
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Periodic watch progress and analytics tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && videoRef.current) {
        const curr = videoRef.current.currentTime;
        const dur = videoRef.current.duration || 0;

        // Send heartbeat watch event
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_type: 'video',
            content_id: videoId,
            creator_id: creatorId,
            event_type: 'watch_time',
            duration_seconds: 10,
          }),
        }).catch(() => {});

        // Save watch history progress
        fetch('/api/watch-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_id: videoId,
            progress_seconds: curr,
            total_duration: dur,
            completed: dur > 0 && curr >= dur * 0.9,
          }),
        }).catch(() => {});
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, videoId, creatorId]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        // Track initial view event
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_type: 'video',
            content_id: videoId,
            creator_id: creatorId,
            event_type: 'view',
          }),
        }).catch(() => {});
      }).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // ignore
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group select-none shadow-2xl"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onClick={togglePlay}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Big Play Overlay when paused */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-opacity"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF0080] hover:bg-[#E00071] flex items-center justify-center shadow-2xl transition-transform active:scale-95">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div
          onClick={handleSeek}
          className="relative w-full h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer mb-3 transition-all group/seek"
        >
          <div
            className="h-full bg-[#FF0080] rounded-full relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity shadow" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-white">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1.5 hover:text-[#FF0080] transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 hover:text-[#FF0080] transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-white/30 rounded cursor-pointer"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-xs text-[#B8B8BD]">
              <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Speed selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 text-xs font-semibold rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                {playbackSpeed}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 py-1 bg-[#333336] border border-[#454549] rounded-xl shadow-xl z-50 text-xs">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => changeSpeed(spd)}
                      className={`block w-full text-left px-4 py-1.5 hover:bg-[#3A3A3E] ${
                        playbackSpeed === spd ? 'text-[#FF0080] font-bold' : 'text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              aria-label="Picture in Picture"
              className="p-1.5 hover:text-[#FF0080] transition-colors hidden sm:block"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              aria-label="Toggle Fullscreen"
              className="p-1.5 hover:text-[#FF0080] transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
