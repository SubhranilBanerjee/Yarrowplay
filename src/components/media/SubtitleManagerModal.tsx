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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative bg-white dark:bg-[#101820] border border-slate-200 dark:border-[#27313A]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:text-[#7F8993] dark:hover:text-[#F5F1E8] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100 border border-violet-300 dark:bg-violet-500/15 dark:border-violet-500/30">
            <Subtitles className="w-5 h-5 text-violet-700 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F1E8] tracking-tight">
              Manage Subtitles
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#7F8993] truncate max-w-xs sm:max-w-sm">
              {videoTitle}
            </p>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-[#7F8993]">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600 dark:text-violet-400" />
              <span>Loading subtitle tracks...</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-[#7F8993] border border-dashed border-slate-200 dark:border-[#27313A] bg-slate-50/50 dark:bg-transparent rounded-xl">
              No subtitle tracks configured yet. Add your first subtitle track below.
            </div>
          ) : (
            tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-[#141D26] border-slate-200 dark:border-[#27313A] text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Globe className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-[#F5F1E8]">{track.label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-[#7F8993] uppercase">({track.language})</span>
                      {track.default_track && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-800 border border-violet-300 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/30">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-[#7F8993] block truncate max-w-[180px]">
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
                      className="px-2 py-1 rounded text-[10px] text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 dark:text-[#7F8993] dark:hover:text-[#F5F1E8] dark:border-[#27313A] dark:hover:bg-[#151F28] cursor-pointer transition-colors"
                    >
                      Set Default
                    </button>
                  )}

                  {/* Enable / Disable */}
                  <button
                    onClick={() => handleToggleEnabled(track)}
                    title={track.enabled ? 'Disable Track' : 'Enable Track'}
                    className="p-1 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    {track.enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600 dark:text-[#68B88A]" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400 dark:text-[#59636D]" />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(track.id)}
                    title="Delete Track"
                    className="p-1 text-slate-400 hover:text-red-600 dark:text-[#7F8993] dark:hover:text-[#D96868] transition-colors cursor-pointer"
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
          <form onSubmit={handleAddTrack} className="p-4 rounded-xl border border-slate-200 dark:border-[#27313A] bg-slate-50 dark:bg-[#141D26] space-y-3 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-[#27313A]">
              <span className="font-bold text-slate-900 dark:text-[#F5F1E8] uppercase tracking-wider text-[11px]">Add Subtitle Track</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:text-[#7F8993] dark:hover:text-[#F5F1E8] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-[#7F8993] uppercase mb-1">Language</label>
                <select
                  value={newLangCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setNewLangCode(code);
                    const matched = COMMON_LANGUAGES.find((l) => l.code === code);
                    if (matched) setNewLabel(matched.label);
                  }}
                  className="w-full bg-white dark:bg-[#111A22] text-slate-900 dark:text-[#F5F1E8] text-xs rounded-xl p-2 border border-slate-200 dark:border-[#27313A] focus:outline-none focus:border-violet-500 dark:focus:border-violet-400"
                >
                  {COMMON_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-white dark:bg-[#101820] text-slate-900 dark:text-[#F5F1E8]">
                      {lang.label} ({lang.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-[#7F8993] uppercase mb-1">Track Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. English, Español"
                  className="w-full bg-white dark:bg-[#111A22] text-slate-900 dark:text-[#F5F1E8] text-xs rounded-xl p-2 border border-slate-200 dark:border-[#27313A] focus:outline-none focus:border-violet-500 dark:focus:border-violet-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 dark:text-[#7F8993] uppercase mb-1">
                Upload WebVTT / SRT File or Paste URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://.../subtitles.vtt"
                  className="flex-1 bg-white dark:bg-[#111A22] text-slate-900 dark:text-[#F5F1E8] text-xs rounded-xl p-2 border border-slate-200 dark:border-[#27313A] focus:outline-none focus:border-violet-500 dark:focus:border-violet-400"
                />
                <label className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#151F28] dark:hover:bg-[#111A22] border border-slate-200 dark:border-[#27313A] text-slate-800 dark:text-[#F5F1E8] font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                  {isUploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600 dark:text-violet-400" /> : <Upload className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />}
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
                className="rounded accent-violet-500 dark:accent-violet-400 cursor-pointer"
              />
              <label htmlFor="default_track_cb" className="text-xs text-slate-800 dark:text-[#F5F1E8] cursor-pointer">
                Set as default track for viewers
              </label>
            </div>

            {errorMsg && <p className="text-xs text-red-600 dark:text-[#D96868] font-medium">{errorMsg}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:text-[#7F8993] dark:hover:text-[#F5F1E8] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newSourceUrl.trim()}
                className="btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Add Track'}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-[#27313A] hover:border-violet-500 dark:hover:border-violet-400 text-slate-700 dark:text-[#F5F1E8] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-[#141D26] transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Add Subtitle Track</span>
          </button>
        )}
      </div>
    </div>
  );
}
