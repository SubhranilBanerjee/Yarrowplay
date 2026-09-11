'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AudioTrack } from '@/types/database';

interface AudioPlayerContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isExpanded: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: AudioTrack[];
  playbackRate: number;
  playTrack: (track: AudioTrack, queueList?: AudioTrack[]) => void;
  togglePlay: () => void;
  pauseTrack: () => void;
  seek: (time: number) => void;
  setVolumeLevel: (volume: number) => void;
  setSpeed: (speed: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setIsExpanded: (expanded: boolean) => void;
  addToQueue: (track: AudioTrack) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [queue, setQueue] = useState<AudioTrack[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration || 0);
    });

    audio.addEventListener('ended', () => {
      handleNextTrack();
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const playTrack = (track: AudioTrack, queueList?: AudioTrack[]) => {
    if (!audioRef.current) return;
    setCurrentTrack(track);
    if (queueList && queueList.length > 0) {
      setQueue(queueList);
    } else if (!queue.some(t => t.id === track.id)) {
      setQueue(prev => [...prev, track]);
    }

    audioRef.current.src = track.audio_url;
    audioRef.current.volume = volume;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      // Track analytics view
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'audio',
          content_id: track.id,
          creator_id: track.creator_id,
          event_type: 'view',
        }),
      }).catch(() => {});
    }).catch((err) => {
      console.warn('Playback error:', err);
    });
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolumeLevel = (vol: number) => {
    const safeVol = Math.max(0, Math.min(1, vol));
    setVolume(safeVol);
    if (audioRef.current) {
      audioRef.current.volume = safeVol;
    }
  };

  const setSpeed = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleNextTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    } else {
      setIsPlaying(false);
    }
  };

  const playNext = () => {
    handleNextTrack();
  };

  const playPrevious = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const addToQueue = (track: AudioTrack) => {
    setQueue(prev => [...prev, track]);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isExpanded,
        currentTime,
        duration,
        volume,
        playbackRate,
        queue,
        playTrack,
        togglePlay,
        pauseTrack,
        seek,
        setVolumeLevel,
        setSpeed,
        playNext,
        playPrevious,
        setIsExpanded,
        addToQueue,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
