'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  RotateCw,
  Sparkles,
  Subtitles,
  Check,
  ChevronRight,
  Sliders,
  Type,
  Gauge,
} from 'lucide-react';
import { SubtitleTrack } from '@/types/database';

interface VideoPlayerProps {
  videoId: string;
  creatorId: string;
  videoUrl: string;
  title: string;
  posterUrl?: string | null;
  initialProgress?: number;
  locked?: boolean;
  priceInr?: number;
  subtitles?: SubtitleTrack[];
  onEnded?: () => void;
  onUnlockRequest?: () => void;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
}

type SubtitleSize = 'small' | 'medium' | 'large';
type SubtitleStyle = 'solid' | 'translucent' | 'glow';
type VideoQuality = 'Auto' | '1080p' | '720p' | '480p' | '360p';

export function VideoPlayer({
  videoId,
  creatorId,
  videoUrl,
  title,
  posterUrl,
  initialProgress = 0,
  locked = false,
  priceInr = 0,
  subtitles: initialSubtitles,
  onEnded,
  onUnlockRequest,
  onProgressUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('Auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Menus
  const [activeMenu, setActiveMenu] = useState<'none' | 'settings' | 'speed' | 'subtitles' | 'quality' | 'subtitle-style'>('none');

  // Subtitle state
  const [subtitlesList, setSubtitlesList] = useState<SubtitleTrack[]>(initialSubtitles || []);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | 'off'>('off');
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');
  const [subtitleSize, setSubtitleSize] = useState<SubtitleSize>('medium');
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('translucent');

  // Seeking & Hover preview
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  // Mobile double-tap feedback
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<{ side: 'left' | 'right'; show: boolean } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  // Fetch subtitles if not passed in props
  useEffect(() => {
    if (initialSubtitles && initialSubtitles.length > 0) {
      setSubtitlesList(initialSubtitles);
      const defaultTrack = initialSubtitles.find((t) => t.default_track && t.enabled);
      if (defaultTrack) {
        setSelectedSubtitleId(defaultTrack.id);
      }
      return;
    }

    if (!videoId) return;
    let isMounted = true;
    fetch(`/api/subtitles?video_id=${videoId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const tracks: SubtitleTrack[] = data.tracks || [];
        setSubtitlesList(tracks);
        const def = tracks.find((t) => t.default_track && t.enabled);
        if (def) setSelectedSubtitleId(def.id);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [videoId, initialSubtitles]);

  // Resume initial progress if any
  useEffect(() => {
    if (videoRef.current && initialProgress > 0) {
      videoRef.current.currentTime = initialProgress;
      setCurrentTime(initialProgress);
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
            await (window.screen.orientation as any).lock?.('landscape');
          } else {
            await (window.screen.orientation as any).unlock?.();
          }
        } catch {
          // ignore orientation lock unsupported
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Save watch progress helper
  const saveProgress = useCallback(
    (curr: number, dur: number, forceCompleted = false) => {
      if (!videoId || dur <= 0) return;
      const isCompleted = forceCompleted || curr >= dur * 0.9;

      fetch('/api/watch-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          progress_seconds: Math.round(curr),
          total_duration: Math.round(dur),
          completed: isCompleted,
        }),
      }).catch(() => {});

      lastSavedTimeRef.current = curr;
    },
    [videoId]
  );

  // Periodic heartbeat watch progress and analytics tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && videoRef.current) {
        const curr = videoRef.current.currentTime;
        const dur = videoRef.current.duration || 0;

        // Send watch_time analytics event every 10s
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

        // Save progress if moved significantly (> 5s)
        if (Math.abs(curr - lastSavedTimeRef.current) >= 5) {
          saveProgress(curr, dur);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, videoId, creatorId, saveProgress]);

  // Subtitle cue listener via TextTrack
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCueChange = () => {
      const activeTrack = Array.from(video.textTracks).find((t) => t.mode === 'showing');
      if (activeTrack && activeTrack.activeCues && activeTrack.activeCues.length > 0) {
        const cue = activeTrack.activeCues[0] as VTTCue;
        setCurrentSubtitleText(cue.text || '');
      } else {
        setCurrentSubtitleText('');
      }
    };

    const textTracks = Array.from(video.textTracks);
    textTracks.forEach((t) => {
      t.addEventListener('cuechange', handleCueChange);
    });

    return () => {
      textTracks.forEach((t) => {
        t.removeEventListener('cuechange', handleCueChange);
      });
    };
  }, [selectedSubtitleId, subtitlesList]);

  // Synchronize text tracks mode with selectedSubtitleId
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    Array.from(video.textTracks).forEach((track) => {
      const trackId = (track as any).id;
      if (selectedSubtitleId !== 'off' && trackId === selectedSubtitleId) {
        track.mode = 'showing';
      } else {
        track.mode = 'hidden';
      }
    });

    if (selectedSubtitleId === 'off') {
      setCurrentSubtitleText('');
    }
  }, [selectedSubtitleId]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs or textareas
      const activeEl = document.activeElement?.tagName.toLowerCase();
      if (activeEl === 'input' || activeEl === 'textarea') return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekDelta(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekDelta(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyC':
          e.preventDefault();
          toggleCaptionsQuick();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      saveProgress(videoRef.current.currentTime, videoRef.current.duration || 0);
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          // Track view event on initial play
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
        })
        .catch(() => {});
    }
  };

  const seekDelta = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.min(Math.max(0, videoRef.current.currentTime + deltaSeconds), duration || 99999);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    saveProgress(newTime, duration);
  };

  const adjustVolume = (delta: number) => {
    if (!videoRef.current) return;
    const nextVol = Math.min(1, Math.max(0, volume + delta));
    setVolume(nextVol);
    videoRef.current.volume = nextVol;
    if (nextVol === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const toggleCaptionsQuick = () => {
    if (selectedSubtitleId === 'off') {
      const firstTrack = subtitlesList[0];
      if (firstTrack) setSelectedSubtitleId(firstTrack.id);
    } else {
      setSelectedSubtitleId('off');
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      onProgressUpdate?.(cur, duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      setDuration(dur);
      if (initialProgress > 0 && initialProgress < dur) {
        videoRef.current.currentTime = initialProgress;
        setCurrentTime(initialProgress);
      }
    }
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    saveProgress(newTime, duration);
  };

  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverTime(percent * duration);
    setHoverPosition(percent * 100);
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
    setActiveMenu('none');
  };

  const changeQuality = (q: VideoQuality) => {
    setSelectedQuality(q);
    setActiveMenu('none');
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
      if (isPlaying && activeMenu === 'none') setShowControls(false);
    }, 3500);
  };

  // Mobile double-tap detector
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const touch = e.changedTouches[0];
    if (!touch || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const tapX = touch.clientX - rect.left;
    const width = rect.width;
    const timeSinceLast = now - lastTapRef.current.time;

    if (timeSinceLast < 300) {
      // Double tap detected
      if (tapX < width * 0.35) {
        seekDelta(-10);
        setDoubleTapFeedback({ side: 'left', show: true });
        setTimeout(() => setDoubleTapFeedback(null), 650);
      } else if (tapX > width * 0.65) {
        seekDelta(10);
        setDoubleTapFeedback({ side: 'right', show: true });
        setTimeout(() => setDoubleTapFeedback(null), 650);
      }
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: tapX };
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Subtitle typography classes
  const subtitleSizeClasses = {
    small: 'text-xs sm:text-sm py-0.5 px-2',
    medium: 'text-sm sm:text-base py-1 px-3',
    large: 'text-base sm:text-xl py-1.5 px-4',
  }[subtitleSize];

  const subtitleStyleClasses = {
    solid: 'bg-black text-white shadow-xl',
    translucent: 'bg-black/75 backdrop-blur-sm text-white shadow-lg border border-white/10',
    glow: 'bg-black/60 text-[#F9FAFB] [text-shadow:0_0_12px_rgba(236,72,153,0.9)] border border-[#EC4899]/30',
  }[subtitleStyle];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={() => isPlaying && activeMenu === 'none' && setShowControls(false)}
      className="relative w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden group select-none shadow-2xl transition-all duration-200"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          saveProgress(duration, duration, true);
          onEnded?.();
        }}
        onClick={() => {
          if (activeMenu !== 'none') {
            setActiveMenu('none');
          } else {
            togglePlay();
          }
        }}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      >
        {/* Render subtitle tracks */}
        {subtitlesList.map((track) => (
          <track
            key={track.id}
            id={track.id}
            kind="subtitles"
            src={track.source_url}
            srcLang={track.language}
            label={track.label}
            default={track.default_track}
          />
        ))}
      </video>

      {/* Custom Subtitle Overlay */}
      {selectedSubtitleId !== 'off' && currentSubtitleText && (
        <div className="absolute bottom-16 sm:bottom-20 left-4 right-4 flex justify-center pointer-events-none z-10 transition-all">
          <div
            className={`max-w-[90%] text-center rounded-xl font-medium tracking-wide leading-snug whitespace-pre-wrap transition-all ${subtitleSizeClasses} ${subtitleStyleClasses}`}
          >
            {currentSubtitleText}
          </div>
        </div>
      )}

      {/* Double Tap Seek Feedback (Left / Right Ripple) */}
      {doubleTapFeedback && (
        <div
          className={`absolute top-0 bottom-0 flex items-center justify-center pointer-events-none z-20 ${
            doubleTapFeedback.side === 'left' ? 'left-0 w-1/3 bg-white/10' : 'right-0 w-1/3 bg-white/10'
          } animate-pulse rounded-2xl`}
        >
          <div className="flex flex-col items-center justify-center gap-1 text-white">
            {doubleTapFeedback.side === 'left' ? (
              <>
                <RotateCcw className="w-8 h-8 text-[var(--color-pink-light)] animate-spin" />
                <span className="text-xs font-bold">-10s</span>
              </>
            ) : (
              <>
                <RotateCw className="w-8 h-8 text-[var(--color-pink-light)] animate-spin" />
                <span className="text-xs font-bold">+10s</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Big Play Overlay when paused */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/45 cursor-pointer transition-opacity backdrop-blur-[2px]"
        >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 text-white shadow-2xl"
            style={{
              background: 'var(--gradient-neon)',
              boxShadow: 'var(--glow-purple-strong)',
            }}
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Top Overlay Controls (Title & Subtitle Status) */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 flex items-center justify-between pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="text-xs sm:text-sm font-semibold text-white/90 truncate max-w-[70%]">
          {title}
        </span>
        {selectedSubtitleId !== 'off' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B5CF6]/40 border border-[#8B5CF6] text-white font-bold uppercase tracking-wider">
            CC · {subtitlesList.find((t) => t.id === selectedSubtitleId)?.label || 'On'}
          </span>
        )}
      </div>

      {/* Settings & Subtitle Menus Modal */}
      {activeMenu !== 'none' && (
        <div
          className="absolute bottom-16 right-3 p-3 rounded-2xl shadow-2xl z-40 text-xs backdrop-blur-xl border border-white/10 w-56 text-white animate-in fade-in zoom-in-95 duration-150"
          style={{ background: 'rgba(15, 14, 23, 0.95)' }}
        >
          {/* Main Settings Menu */}
          {activeMenu === 'settings' && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 pb-1.5 border-b border-white/10">
                Playback Settings
              </div>
              <button
                onClick={() => setActiveMenu('subtitles')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Subtitles className="w-4 h-4 text-[var(--color-pink-light)]" />
                  <span>Subtitles / CC</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--text-muted)]">
                  <span className="truncate max-w-[70px]">
                    {selectedSubtitleId === 'off'
                      ? 'Off'
                      : subtitlesList.find((t) => t.id === selectedSubtitleId)?.label || 'On'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>

              <button
                onClick={() => setActiveMenu('speed')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[var(--color-pink-light)]" />
                  <span>Speed</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--text-muted)]">
                  <span>{playbackSpeed}x</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>

              <button
                onClick={() => setActiveMenu('quality')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[var(--color-pink-light)]" />
                  <span>Quality</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--text-muted)]">
                  <span>{selectedQuality}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}

          {/* Subtitles Track Selection */}
          {activeMenu === 'subtitles' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-1.5 border-b border-white/10">
                <button
                  onClick={() => setActiveMenu('settings')}
                  className="text-[11px] text-[var(--color-pink-light)] hover:underline font-bold"
                >
                  ← Back
                </button>
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Subtitles</span>
                <button
                  onClick={() => setActiveMenu('subtitle-style')}
                  title="Subtitle Style"
                  className="text-[11px] text-[var(--color-pink-light)] hover:underline"
                >
                  Style
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedSubtitleId('off');
                  setActiveMenu('none');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-colors text-left ${
                  selectedSubtitleId === 'off' ? 'bg-[#8B5CF6]/25 text-[var(--color-pink-light)] font-bold' : 'hover:bg-white/10'
                }`}
              >
                <span>Off</span>
                {selectedSubtitleId === 'off' && <Check className="w-3.5 h-3.5" />}
              </button>

              {subtitlesList.length === 0 ? (
                <div className="px-2.5 py-3 text-center text-[11px] text-[var(--text-muted)]">
                  No subtitle tracks available for this video.
                </div>
              ) : (
                subtitlesList.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setSelectedSubtitleId(track.id);
                      setActiveMenu('none');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-colors text-left ${
                      selectedSubtitleId === track.id ? 'bg-[#8B5CF6]/25 text-[var(--color-pink-light)] font-bold' : 'hover:bg-white/10'
                    }`}
                  >
                    <span>{track.label}</span>
                    {selectedSubtitleId === track.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Subtitle Appearance / Style */}
          {activeMenu === 'subtitle-style' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 pb-1.5 border-b border-white/10">
                <button
                  onClick={() => setActiveMenu('subtitles')}
                  className="text-[11px] text-[var(--color-pink-light)] hover:underline font-bold"
                >
                  ← Back
                </button>
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Style</span>
              </div>

              <div>
                <span className="block text-[10px] text-[var(--text-muted)] uppercase px-2 mb-1">Font Size</span>
                <div className="grid grid-cols-3 gap-1 px-1">
                  {(['small', 'medium', 'large'] as SubtitleSize[]).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSubtitleSize(sz)}
                      className={`py-1 rounded-lg text-center capitalize text-xs border ${
                        subtitleSize === sz
                          ? 'border-[var(--color-pink)] bg-[var(--color-pink)]/20 text-white font-bold'
                          : 'border-white/10 hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-[var(--text-muted)] uppercase px-2 mb-1">Background Style</span>
                <div className="grid grid-cols-3 gap-1 px-1">
                  {(['translucent', 'solid', 'glow'] as SubtitleStyle[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => setSubtitleStyle(st)}
                      className={`py-1 rounded-lg text-center capitalize text-xs border ${
                        subtitleStyle === st
                          ? 'border-[var(--color-pink)] bg-[var(--color-pink)]/20 text-white font-bold'
                          : 'border-white/10 hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Speed Selector Menu */}
          {activeMenu === 'speed' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-1.5 border-b border-white/10">
                <button
                  onClick={() => setActiveMenu('settings')}
                  className="text-[11px] text-[var(--color-pink-light)] hover:underline font-bold"
                >
                  ← Back
                </button>
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Speed</span>
              </div>
              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => changeSpeed(spd)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors text-left ${
                    playbackSpeed === spd ? 'bg-[#8B5CF6]/25 text-[var(--color-pink-light)] font-bold' : 'hover:bg-white/10'
                  }`}
                >
                  <span>{spd}x {spd === 1 && '(Normal)'}</span>
                  {playbackSpeed === spd && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {/* Quality Selector Menu */}
          {activeMenu === 'quality' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-1.5 border-b border-white/10">
                <button
                  onClick={() => setActiveMenu('settings')}
                  className="text-[11px] text-[var(--color-pink-light)] hover:underline font-bold"
                >
                  ← Back
                </button>
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Quality</span>
              </div>
              {(['Auto', '1080p', '720p', '480p', '360p'] as VideoQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => changeQuality(q)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors text-left ${
                    selectedQuality === q ? 'bg-[#8B5CF6]/25 text-[var(--color-pink-light)] font-bold' : 'hover:bg-white/10'
                  }`}
                >
                  <span>{q} {q === 'Auto' && '(Optimal)'}</span>
                  {selectedQuality === q && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${
          showControls || activeMenu !== 'none' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Interactive Scrub Progress Bar with Time Hover Preview */}
        <div
          ref={progressBarRef}
          onClick={handleSeekClick}
          onMouseMove={handleSeekMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          className="relative w-full h-1.5 hover:h-3 bg-white/20 rounded-full cursor-pointer mb-3 transition-all group/seek"
        >
          {/* Hover preview tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute bottom-full mb-2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 text-[11px] text-white font-mono pointer-events-none border border-white/20 shadow-xl"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Filled progress */}
          <div
            className="h-full rounded-full relative"
            style={{
              width: `${progressPercent}%`,
              background: 'var(--gradient-neon)',
              boxShadow: 'var(--glow-pink)',
            }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* Controls Rows */}
        <div className="flex items-center justify-between gap-2 text-white">
          {/* Left Controls: Play, Seek -10s, Seek +10s, Volume, Timestamp */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              className="p-1.5 hover:text-[var(--color-pink-light)] hover:scale-110 transition-all active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Seek Back 10s */}
            <button
              onClick={() => seekDelta(-10)}
              aria-label="Seek back 10 seconds (Left Arrow)"
              title="Seek back 10s"
              className="p-1 hover:text-[var(--color-pink-light)] transition-colors hidden xs:block"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Seek Forward 10s */}
            <button
              onClick={() => seekDelta(10)}
              aria-label="Seek forward 10 seconds (Right Arrow)"
              title="Seek forward 10s"
              className="p-1 hover:text-[var(--color-pink-light)] transition-colors hidden xs:block"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                className="p-1 hover:text-[var(--color-pink-light)] transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-12 sm:w-16 h-1 bg-white/30 rounded cursor-pointer accent-[var(--color-pink-light)]"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-[11px] text-[var(--text-secondary)] font-mono pl-1">
              <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Subtitles Toggle, Settings Menu, PiP, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Quick Subtitle Toggle Button */}
            <button
              onClick={() => {
                if (subtitlesList.length > 0) {
                  setActiveMenu(activeMenu === 'subtitles' ? 'none' : 'subtitles');
                } else {
                  toggleCaptionsQuick();
                }
              }}
              title="Subtitles / Closed Captions (C)"
              className={`p-1.5 rounded-lg transition-colors ${
                selectedSubtitleId !== 'off'
                  ? 'text-[var(--color-pink-light)] bg-white/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Subtitles className="w-4 h-4" />
            </button>

            {/* Settings Menu Button */}
            <button
              onClick={() => setActiveMenu(activeMenu === 'settings' ? 'none' : 'settings')}
              title="Settings (Speed, Quality, Subtitles)"
              className={`p-1.5 rounded-lg hover:text-[var(--color-pink-light)] transition-colors ${
                activeMenu !== 'none' ? 'text-[var(--color-pink-light)] bg-white/10' : ''
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              aria-label="Picture in Picture"
              title="Picture-in-Picture"
              className="p-1.5 hover:text-[var(--color-pink-light)] transition-colors hidden sm:block"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              aria-label="Toggle Fullscreen (F)"
              title="Fullscreen (F)"
              className="p-1.5 hover:text-[var(--color-pink-light)] transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Locked Paywall Overlay */}
      {locked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-2xl">
          <div className="text-center px-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border"
              style={{
                background: 'var(--neon-purple-glow)',
                borderColor: 'var(--neon-purple-border)',
              }}
            >
              <svg className="w-8 h-8 text-[var(--color-pink-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Premium Episode</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-2">This episode requires a one-time unlock.</p>
            {priceInr > 0 && (
              <p
                className="font-extrabold text-3xl mb-5"
                style={{
                  background: 'var(--gradient-text)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ₹{priceInr.toFixed(2)}
              </p>
            )}
            <button
              onClick={onUnlockRequest}
              className="px-8 py-3 rounded-xl font-semibold text-sm text-white transition-all shadow-xl active:scale-95 cursor-pointer"
              style={{
                background: 'var(--gradient-neon)',
                boxShadow: 'var(--glow-purple)',
              }}
            >
              Unlock Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
