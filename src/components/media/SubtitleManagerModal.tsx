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
      <div className="rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative bg-[#101820] border border-[#27313A]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#7F8993] hover:text-[#F5F1E8] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F4C95D]/15 border border-[#F4C95D]/30">
            <Subtitles className="w-5 h-5 text-[#F4C95D]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[#F5F1E8] tracking-tight">
              Manage Subtitles
            </h2>
            <p className="text-xs text-[#7F8993] truncate max-w-xs sm:max-w-sm">
              {videoTitle}
            </p>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-[#7F8993]">
              <Loader2 className="w-4 h-4 animate-spin text-[#F4C95D]" />
              <span>Loading subtitle tracks...</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7F8993] border border-dashed border-[#27313A] rounded-xl">
              No subtitle tracks configured yet. Add your first subtitle track below.
            </div>
          ) : (
            tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-[#141D26] border-[#27313A] text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Globe className="w-4 h-4 text-[#F4C95D] shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#F5F1E8]">{track.label}</span>
                      <span className="text-[10px] text-[#7F8993] uppercase">({track.language})</span>
                      {track.default_track && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F4C95D]/15 text-[#F4C95D] border border-[#F4C95D]/30">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#7F8993] block truncate max-w-[180px]">
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
                      className="px-2 py-1 rounded text-[10px] text-[#7F8993] hover:text-[#F5F1E8] border border-[#27313A] hover:bg-[#151F28] cursor-pointer"
                    >
                      Set Default
                    </button>
                  )}

                  {/* Enable / Disable */}
                  <button
                    onClick={() => handleToggleEnabled(track)}
                    title={track.enabled ? 'Disable Track' : 'Enable Track'}
                    className="p-1 hover:text-[#F5F1E8] transition-colors cursor-pointer"
                  >
                    {track.enabled ? (
                      <ToggleRight className="w-6 h-6 text-[#68B88A]" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-[#59636D]" />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(track.id)}
                    title="Delete Track"
                    className="p-1 text-[#7F8993] hover:text-[#D96868] transition-colors cursor-pointer"
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
          <form onSubmit={handleAddTrack} className="p-4 rounded-xl border border-[#27313A] bg-[#141D26] space-y-3 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-[#27313A]">
              <span className="font-bold text-[#F5F1E8] uppercase tracking-wider text-[11px]">Add Subtitle Track</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-[#7F8993] hover:text-[#F5F1E8] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#7F8993] uppercase mb-1">Language</label>
                <select
                  value={newLangCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setNewLangCode(code);
                    const matched = COMMON_LANGUAGES.find((l) => l.code === code);
                    if (matched) setNewLabel(matched.label);
                  }}
                  className="w-full bg-[#111A22] text-[#F5F1E8] text-xs rounded-xl p-2 border border-[#27313A] focus:outline-none focus:border-[#F4C95D]"
                >
                  {COMMON_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#101820] text-[#F5F1E8]">
                      {lang.label} ({lang.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#7F8993] uppercase mb-1">Track Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. English, Español"
                  className="w-full bg-[#111A22] text-[#F5F1E8] text-xs rounded-xl p-2 border border-[#27313A] focus:outline-none focus:border-[#F4C95D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#7F8993] uppercase mb-1">
                Upload WebVTT / SRT File or Paste URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://.../subtitles.vtt"
                  className="flex-1 bg-[#111A22] text-[#F5F1E8] text-xs rounded-xl p-2 border border-[#27313A] focus:outline-none focus:border-[#F4C95D]"
                />
                <label className="px-3 py-2 rounded-xl bg-[#151F28] hover:bg-[#111A22] border border-[#27313A] text-[#F5F1E8] font-semibold flex items-center gap-1.5 cursor-pointer shrink-0">
                  {isUploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4C95D]" /> : <Upload className="w-3.5 h-3.5 text-[#F4C95D]" />}
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
                className="rounded accent-[#F4C95D] cursor-pointer"
              />
              <label htmlFor="default_track_cb" className="text-xs text-[#F5F1E8] cursor-pointer">
                Set as default track for viewers
              </label>
            </div>

            {errorMsg && <p className="text-xs text-[#D96868]">{errorMsg}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#7F8993] hover:text-[#F5F1E8] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newSourceUrl.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#F4C95D] hover:bg-[#FFD978] active:bg-[#DDB347] text-[#0B0F13] transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Add Track'}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-[#27313A] hover:border-[#F4C95D] text-[#F5F1E8] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#141D26] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F4C95D]" />
            <span>Add Subtitle Track</span>
          </button>
        )}
      </div>
    </div>
  );
}
