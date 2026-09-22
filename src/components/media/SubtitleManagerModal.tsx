'use client';

import React, { useState, useEffect } from 'react';
import { SubtitleTrack } from '@/types/database';
import { uploadMedia } from '@/lib/upload';
import {
  Subtitles,
  Plus,
  Trash2,
  Check,
  X,
  Upload,
  Loader2,
  Globe,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface SubtitleManagerModalProps {
  videoId: string;
  videoTitle: string;
  onClose: () => void;
}

const COMMON_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
];

export function SubtitleManagerModal({
  videoId,
  videoTitle,
  onClose,
}: SubtitleManagerModalProps) {
  const [tracks, setTracks] = useState<SubtitleTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New track form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLangCode, setNewLangCode] = useState('en');
  const [newLabel, setNewLabel] = useState('English');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTracks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/subtitles?video_id=${videoId}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [videoId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setErrorMsg(null);
    try {
      const res = await uploadMedia(file, 'raw', 'yarrowplay/subtitles');
      setNewSourceUrl(res.secure_url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Subtitle file upload failed');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceUrl.trim()) {
      setErrorMsg('Please upload a subtitle file or provide a source URL');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          language: newLangCode,
          label: newLabel.trim() || newLangCode.toUpperCase(),
          source_url: newSourceUrl.trim(),
          format: newSourceUrl.endsWith('.srt') ? 'srt' : 'vtt',
          default_track: newIsDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add subtitle track');

      await fetchTracks();
      setShowAddForm(false);
      setNewSourceUrl('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save subtitle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEnabled = async (track: SubtitleTrack) => {
    try {
      const res = await fetch('/api/subtitles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: track.id, enabled: !track.enabled }),
      });
      if (res.ok) {
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, enabled: !t.enabled } : t))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleSetDefault = async (trackId: string) => {
    try {
      const res = await fetch('/api/subtitles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trackId, default_track: true }),
      });
      if (res.ok) {
        setTracks((prev) =>
          prev.map((t) => ({ ...t, default_track: t.id === trackId }))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (trackId: string) => {
    try {
      const res = await fetch(`/api/subtitles?id=${trackId}`, { method: 'DELETE' });
      if (res.ok) {
        setTracks((prev) => prev.filter((t) => t.id !== trackId));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative backdrop-blur-xl border"
        style={{
          background: 'var(--glass-surface-heavy)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{
              background: 'var(--neon-purple-glow)',
              borderColor: 'var(--neon-purple-border)',
            }}
          >
            <Subtitles className="w-5 h-5 text-[var(--color-pink-light)]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Manage Subtitles
            </h2>
            <p className="text-xs text-[var(--text-muted)] truncate max-w-xs sm:max-w-sm">
              {videoTitle}
            </p>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-pink-light)]" />
              <span>Loading subtitle tracks...</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-white/10 rounded-2xl">
              No subtitle tracks configured yet. Add your first subtitle track below.
            </div>
          ) : (
            tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-white/5 border-white/10 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Globe className="w-4 h-4 text-[var(--color-pink-light)] shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white">{track.label}</span>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase">({track.language})</span>
                      {track.default_track && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#8B5CF6]/30 text-[var(--color-pink-light)] border border-[#8B5CF6]/50">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] block truncate max-w-[180px]">
                      {track.source_url}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Default toggle */}
                  {!track.default_track && (
                    <button
                      onClick={() => handleSetDefault(track.id)}
                      title="Set as Default Track"
                      className="px-2 py-1 rounded text-[10px] text-[var(--text-muted)] hover:text-white border border-white/10 hover:bg-white/5"
                    >
                      Set Default
                    </button>
                  )}

                  {/* Enable / Disable */}
                  <button
                    onClick={() => handleToggleEnabled(track)}
                    title={track.enabled ? 'Disable Track' : 'Enable Track'}
                    className="p-1 hover:text-white transition-colors"
                  >
                    {track.enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-500" />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(track.id)}
                    title="Delete Track"
                    className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Track Section */}
        {showAddForm ? (
          <form onSubmit={handleAddTrack} className="p-4 rounded-2xl border border-white/15 bg-black/40 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Add Subtitle Track</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-[var(--text-muted)] hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Language</label>
                <select
                  value={newLangCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setNewLangCode(code);
                    const matched = COMMON_LANGUAGES.find((l) => l.code === code);
                    if (matched) setNewLabel(matched.label);
                  }}
                  className="w-full bg-[var(--glass-surface)] text-white text-xs rounded-xl p-2 border border-white/10 focus:outline-none"
                >
                  {COMMON_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} ({lang.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Track Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. English, Español"
                  className="w-full bg-[var(--glass-surface)] text-white text-xs rounded-xl p-2 border border-white/10 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">
                Upload WebVTT / SRT File or Paste URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://.../subtitles.vtt"
                  className="flex-1 bg-[var(--glass-surface)] text-white text-xs rounded-xl p-2 border border-white/10 focus:outline-none"
                />
                <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1.5 cursor-pointer shrink-0">
                  {isUploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploadingFile ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept=".vtt,.srt,text/vtt"
                    disabled={isUploadingFile}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="default_track_cb"
                checked={newIsDefault}
                onChange={(e) => setNewIsDefault(e.target.checked)}
                className="rounded accent-[var(--color-pink-light)]"
              />
              <label htmlFor="default_track_cb" className="text-xs text-white">
                Set as default track for viewers
              </label>
            </div>

            {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-muted)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newSourceUrl.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md disabled:opacity-50"
                style={{
                  background: 'var(--gradient-neon)',
                  boxShadow: 'var(--glow-purple)',
                }}
              >
                {isSubmitting ? 'Saving...' : 'Add Track'}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 rounded-2xl border border-dashed border-white/20 hover:border-[var(--color-pink)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[var(--color-pink)]" />
            <span>Add Subtitle Track</span>
          </button>
        )}
      </div>
    </div>
  );
}
