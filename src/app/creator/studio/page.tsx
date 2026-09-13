'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { uploadMedia } from '@/lib/upload';
import {
  Film,
  Music,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  FileVideo,
  X,
  ListPlus,
  ArrowUpRight,
  FolderOpen,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface EpisodeDraft {
  id: string;
  title: string;
  summary: string;
  videoUrl: string;
  videoPublicId: string;
  thumbnailUrl: string;
  thumbnailPublicId: string;
  videoUploading: boolean;
  videoProgress: number;
  thumbUploading: boolean;
}

interface AudioTrackDraft {
  id: string;
  title: string;
  audioUrl: string;
  audioPublicId: string;
  duration: number;
  uploading: boolean;
  progress: number;
}

export default function CreatorStudioPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Primary top tab: 'video' | 'audio' | 'manage'
  const [primaryTab, setPrimaryTab] = useState<'video' | 'audio' | 'manage'>('video');

  // Video secondary tab: 'series' | 'single'
  const [videoMode, setVideoMode] = useState<'series' | 'single'>('series');

  // Audio secondary tab: 'album' | 'single'
  const [audioMode, setAudioMode] = useState<'album' | 'single'>('album');

  // Manage content tab state
  const [manageSubTab, setManageSubTab] = useState<'videos' | 'audios'>('videos');
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);
  const [uploadedAudios, setUploadedAudios] = useState<any[]>([]);
  const [loadingManage, setLoadingManage] = useState(false);
  const [manageDeleteTarget, setManageDeleteTarget] = useState<{
    id: string;
    type: 'video' | 'audio';
    title: string;
  } | null>(null);
  const [isManageDeleting, setIsManageDeleting] = useState(false);
  const [manageDeleteError, setManageDeleteError] = useState<string | null>(null);

  const isAdmin = !!user?.email && (
    user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user.email === 'admin@dramabox.stream'
  );

  // --- SERIES STATE ---
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesDesc, setSeriesDesc] = useState('');
  const [seriesCategory, setSeriesCategory] = useState('Drama');
  const [seriesTags, setSeriesTags] = useState('');
  const [seriesCoverUrl, setSeriesCoverUrl] = useState('');
  const [seriesCoverPublicId, setSeriesCoverPublicId] = useState('');
  const [seriesCoverUploading, setSeriesCoverUploading] = useState(false);
  const [episodes, setEpisodes] = useState<EpisodeDraft[]>([
    {
      id: 'ep-1',
      title: 'Episode 1: The Beginning',
      summary: '',
      videoUrl: '',
      videoPublicId: '',
      thumbnailUrl: '',
      thumbnailPublicId: '',
      videoUploading: false,
      videoProgress: 0,
      thumbUploading: false,
    },
  ]);

  // --- SINGLE VIDEO STATE ---
  const [singleVideoTitle, setSingleVideoTitle] = useState('');
  const [singleVideoDesc, setSingleVideoDesc] = useState('');
  const [singleVideoCategory, setSingleVideoCategory] = useState('Entertainment');
  const [singleVideoTags, setSingleVideoTags] = useState('');
  const [singleVideoUrl, setSingleVideoUrl] = useState('');
  const [singleVideoPublicId, setSingleVideoPublicId] = useState('');
  const [singleVideoThumbUrl, setSingleVideoThumbUrl] = useState('');
  const [singleVideoThumbPublicId, setSingleVideoThumbPublicId] = useState('');
  const [singleVideoDuration, setSingleVideoDuration] = useState(0);
  const [singleVideoUploading, setSingleVideoUploading] = useState(false);
  const [singleVideoProgress, setSingleVideoProgress] = useState(0);
  const [singleThumbUploading, setSingleThumbUploading] = useState(false);

  // --- ALBUM STATE ---
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumArtist, setAlbumArtist] = useState(profile?.display_name || '');
  const [albumGenre, setAlbumGenre] = useState('Pop');
  const [albumDesc, setAlbumDesc] = useState('');
  const [albumCoverUrl, setAlbumCoverUrl] = useState('');
  const [albumCoverPublicId, setAlbumCoverPublicId] = useState('');
  const [albumCoverUploading, setAlbumCoverUploading] = useState(false);
  const [albumTracks, setAlbumTracks] = useState<AudioTrackDraft[]>([
    {
      id: 'trk-1',
      title: 'Track 1',
      audioUrl: '',
      audioPublicId: '',
      duration: 0,
      uploading: false,
      progress: 0,
    },
  ]);

  // --- SINGLE AUDIO STATE ---
  const [singleAudioTitle, setSingleAudioTitle] = useState('');
  const [singleAudioArtist, setSingleAudioArtist] = useState(profile?.display_name || '');
  const [singleAudioGenre, setSingleAudioGenre] = useState('Acoustic');
  const [singleAudioDesc, setSingleAudioDesc] = useState('');
  const [singleAudioUrl, setSingleAudioUrl] = useState('');
  const [singleAudioPublicId, setSingleAudioPublicId] = useState('');
  const [singleAudioCoverUrl, setSingleAudioCoverUrl] = useState('');
  const [singleAudioCoverPublicId, setSingleAudioCoverPublicId] = useState('');
  const [singleAudioLyrics, setSingleAudioLyrics] = useState('');
  const [singleAudioDuration, setSingleAudioDuration] = useState(0);
  const [singleAudioUploading, setSingleAudioUploading] = useState(false);
  const [singleAudioProgress, setSingleAudioProgress] = useState(0);
  const [singleAudioCoverUploading, setSingleAudioCoverUploading] = useState(false);

  // Status message
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- HANDLERS FOR SERIES ---
  const handleSeriesCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSeriesCoverUploading(true);
    try {
      const res = await uploadMedia(file, 'image', 'yarrowplay/series');
      setSeriesCoverUrl(res.secure_url);
      setSeriesCoverPublicId(res.public_id);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Cover upload failed: ' + err.message });
    } finally {
      setSeriesCoverUploading(false);
    }
  };

  const addEpisode = () => {
    const nextNum = episodes.length + 1;
    setEpisodes((prev) => [
      ...prev,
      {
        id: `ep-${Date.now()}`,
        title: `Episode ${nextNum}`,
        summary: '',
        videoUrl: '',
        videoPublicId: '',
        thumbnailUrl: '',
        thumbnailPublicId: '',
        videoUploading: false,
        videoProgress: 0,
        thumbUploading: false,
      },
    ]);
  };

  const removeEpisode = (id: string) => {
    if (episodes.length <= 1) return;
    setEpisodes((prev) => prev.filter((e) => e.id !== id));
  };

  const handleEpisodeVideoUpload = async (id: string, file: File) => {
    setEpisodes((prev) =>
      prev.map((e) => (e.id === id ? { ...e, videoUploading: true, videoProgress: 0 } : e))
    );
    try {
      const res = await uploadMedia(file, 'video', 'yarrowplay/episodes', (percent) => {
        setEpisodes((prev) =>
          prev.map((e) => (e.id === id ? { ...e, videoProgress: percent } : e))
        );
      });
      setEpisodes((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                videoUrl: res.secure_url,
                videoPublicId: res.public_id,
                videoUploading: false,
                videoProgress: 100,
              }
            : e
        )
      );
    } catch (err: any) {
      setEpisodes((prev) =>
        prev.map((e) => (e.id === id ? { ...e, videoUploading: false } : e))
      );
      setStatusMsg({ type: 'error', text: 'Episode video upload failed: ' + err.message });
    }
  };

  const handleEpisodeThumbUpload = async (id: string, file: File) => {
    setEpisodes((prev) =>
      prev.map((e) => (e.id === id ? { ...e, thumbUploading: true } : e))
    );
    try {
      const res = await uploadMedia(file, 'image', 'yarrowplay/thumbnails');
      setEpisodes((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                thumbnailUrl: res.secure_url,
                thumbnailPublicId: res.public_id,
                thumbUploading: false,
              }
            : e
        )
      );
    } catch (err: any) {
      setEpisodes((prev) =>
        prev.map((e) => (e.id === id ? { ...e, thumbUploading: false } : e))
      );
      setStatusMsg({ type: 'error', text: 'Thumbnail upload failed: ' + err.message });
    }
  };

  const handleSubmitSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!seriesTitle.trim() || !seriesDesc.trim()) {
      setStatusMsg({ type: 'error', text: 'Please provide Series Title and Description.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      // 1. Insert series row
      const tagsArray = seriesTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const { data: newSeries, error: seriesErr } = await supabase
        .from('content_series')
        .insert({
          creator_id: user.id,
          title: seriesTitle.trim(),
          description: seriesDesc.trim(),
          category: seriesCategory,
          tags: tagsArray,
          cover_url: seriesCoverUrl || null,
          cover_public_id: seriesCoverPublicId || null,
          total_episodes: episodes.length,
        })
        .select()
        .single();

      if (seriesErr) throw seriesErr;

      // 2. Insert all episodes
      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        if (ep.videoUrl) {
          await supabase.from('videos').insert({
            creator_id: user.id,
            series_id: newSeries.id,
            episode_number: i + 1,
            title: ep.title.trim() || `Episode ${i + 1}`,
            description: ep.summary.trim() || seriesDesc.trim(),
            summary: ep.summary.trim() || null,
            category: seriesCategory,
            video_url: ep.videoUrl,
            video_public_id: ep.videoPublicId || null,
            thumbnail_url: ep.thumbnailUrl || seriesCoverUrl || null,
            thumbnail_public_id: ep.thumbnailPublicId || null,
            visibility: 'public',
            status: 'published',
          });
        }
      }

      setStatusMsg({ type: 'success', text: 'Series and episodes uploaded successfully!' });
      setTimeout(() => {
        router.push('/home');
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to publish series.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER FOR SINGLE VIDEO ---
  const handleSubmitSingleVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!singleVideoTitle.trim() || !singleVideoDesc.trim() || !singleVideoUrl) {
      setStatusMsg({ type: 'error', text: 'Please fill in Title, Description, and upload Video.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const tagsArray = singleVideoTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const { error } = await supabase.from('videos').insert({
        creator_id: user.id,
        title: singleVideoTitle.trim(),
        description: singleVideoDesc.trim(),
        category: singleVideoCategory,
        tags: tagsArray,
        video_url: singleVideoUrl,
        video_public_id: singleVideoPublicId || null,
        thumbnail_url: singleVideoThumbUrl || null,
        thumbnail_public_id: singleVideoThumbPublicId || null,
        duration_seconds: singleVideoDuration,
        visibility: 'public',
        status: 'published',
      });

      if (error) throw error;

      setStatusMsg({ type: 'success', text: 'Video uploaded and published successfully!' });
      setTimeout(() => {
        router.push('/home');
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to upload video.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER FOR ALBUM ---
  const addTrack = () => {
    const nextNum = albumTracks.length + 1;
    setAlbumTracks((prev) => [
      ...prev,
      {
        id: `trk-${Date.now()}`,
        title: `Track ${nextNum}`,
        audioUrl: '',
        audioPublicId: '',
        duration: 0,
        uploading: false,
        progress: 0,
      },
    ]);
  };

  const removeTrack = (id: string) => {
    if (albumTracks.length <= 1) return;
    setAlbumTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTrackUpload = async (id: string, file: File) => {
    setAlbumTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, uploading: true, progress: 0 } : t))
    );
    try {
      const res = await uploadMedia(file, 'auto', 'yarrowplay/audio', (percent) => {
        setAlbumTracks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, progress: percent } : t))
        );
      });
      setAlbumTracks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                audioUrl: res.secure_url,
                audioPublicId: res.public_id,
                duration: res.duration || 0,
                uploading: false,
                progress: 100,
              }
            : t
        )
      );
    } catch (err: any) {
      setAlbumTracks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, uploading: false } : t))
      );
      setStatusMsg({ type: 'error', text: 'Track upload failed: ' + err.message });
    }
  };

  const handleSubmitAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!albumTitle.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter Album name.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      // 1. Insert album
      const { data: newAlbum, error: albumErr } = await supabase
        .from('audio_albums')
        .insert({
          creator_id: user.id,
          title: albumTitle.trim(),
          artist_name: albumArtist.trim() || profile?.display_name || 'Creator',
          genre: albumGenre,
          description: albumDesc.trim() || null,
          cover_url: albumCoverUrl || null,
          cover_public_id: albumCoverPublicId || null,
        })
        .select()
        .single();

      if (albumErr) throw albumErr;

      // 2. Insert tracks
      for (let i = 0; i < albumTracks.length; i++) {
        const trk = albumTracks[i];
        if (trk.audioUrl) {
          await supabase.from('audios').insert({
            creator_id: user.id,
            album_id: newAlbum.id,
            track_number: i + 1,
            title: trk.title.trim() || `Track ${i + 1}`,
            artist_name: albumArtist.trim() || profile?.display_name || 'Creator',
            genre: albumGenre,
            description: albumDesc.trim() || null,
            audio_url: trk.audioUrl,
            audio_public_id: trk.audioPublicId || null,
            cover_url: albumCoverUrl || null,
            cover_public_id: albumCoverPublicId || null,
            duration_seconds: trk.duration || 0,
            visibility: 'public',
            status: 'published',
          });
        }
      }

      setStatusMsg({ type: 'success', text: 'Album and tracks uploaded successfully!' });
      setTimeout(() => {
        router.push('/home');
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to upload album.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER FOR SINGLE AUDIO ---
  const handleSubmitSingleAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!singleAudioTitle.trim() || !singleAudioUrl) {
      setStatusMsg({ type: 'error', text: 'Please provide Track Title and upload Audio.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const { error } = await supabase.from('audios').insert({
        creator_id: user.id,
        title: singleAudioTitle.trim(),
        artist_name: singleAudioArtist.trim() || profile?.display_name || 'Creator',
        genre: singleAudioGenre,
        description: singleAudioDesc.trim() || null,
        audio_url: singleAudioUrl,
        audio_public_id: singleAudioPublicId || null,
        cover_url: singleAudioCoverUrl || null,
        cover_public_id: singleAudioCoverPublicId || null,
        lyrics: singleAudioLyrics.trim() || null,
        duration_seconds: singleAudioDuration,
        visibility: 'public',
        status: 'published',
      });

      if (error) throw error;

      setStatusMsg({ type: 'success', text: 'Audio uploaded successfully!' });
      setTimeout(() => {
        router.push('/home');
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to upload audio.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchManageContent = async () => {
    if (!user) return;
    setLoadingManage(true);
    try {
      let vQuery = supabase.from('videos').select('*, creator:profiles(*)').order('created_at', { ascending: false });
      let aQuery = supabase.from('audios').select('*, creator:profiles(*)').order('created_at', { ascending: false });

      if (!isAdmin) {
        vQuery = vQuery.eq('creator_id', user.id);
        aQuery = aQuery.eq('creator_id', user.id);
      }

      const [{ data: vData }, { data: aData }] = await Promise.all([vQuery, aQuery]);
      setUploadedVideos(vData || []);
      setUploadedAudios(aData || []);
    } catch (err) {
      console.error('Failed to load manage content:', err);
    } finally {
      setLoadingManage(false);
    }
  };

  useEffect(() => {
    if (primaryTab === 'manage') {
      fetchManageContent();
    }
  }, [primaryTab, user]);

  const handleConfirmManageDelete = async () => {
    if (!manageDeleteTarget) return;
    setIsManageDeleting(true);
    setManageDeleteError(null);
    try {
      const endpoint = manageDeleteTarget.type === 'video' ? '/api/videos' : '/api/audios';
      const res = await fetch(`${endpoint}?id=${manageDeleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to delete ${manageDeleteTarget.type}`);
      }

      if (manageDeleteTarget.type === 'video') {
        setUploadedVideos((prev) => prev.filter((v) => v.id !== manageDeleteTarget.id));
      } else {
        setUploadedAudios((prev) => prev.filter((a) => a.id !== manageDeleteTarget.id));
      }
      setManageDeleteTarget(null);
    } catch (err: any) {
      setManageDeleteError(err.message || 'Failed to delete');
    } finally {
      setIsManageDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Studio Header matching mockup */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Creator Studio
        </h1>
        <p className="text-sm text-[#85858B] mt-1">
          Create and upload your content. Bring your stories to life!
        </p>
      </div>

      {/* Primary Top Tabs: [ Video ] [ Audio ] [ Manage Content ] */}
      <div className="grid grid-cols-3 gap-3 mb-6 bg-[#333336] p-1.5 rounded-2xl border border-[#454549]">
        <button
          onClick={() => setPrimaryTab('video')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            primaryTab === 'video'
              ? 'bg-[#FF0080] text-white shadow-lg'
              : 'text-[#B8B8BD] hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Video</span>
        </button>

        <button
          onClick={() => setPrimaryTab('audio')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            primaryTab === 'audio'
              ? 'bg-[#FF0080] text-white shadow-lg'
              : 'text-[#B8B8BD] hover:text-white'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Audio</span>
        </button>

        <button
          onClick={() => setPrimaryTab('manage')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            primaryTab === 'manage'
              ? 'bg-[#FF0080] text-white shadow-lg'
              : 'text-[#B8B8BD] hover:text-white'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Manage</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {statusMsg && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 text-sm ${
            statusMsg.type === 'success'
              ? 'bg-[#22C55E]/15 border-[#22C55E]/30 text-[#22C55E]'
              : 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIDEO WORKFLOW                                       */}
      {/* ==================================================== */}
      {primaryTab === 'video' && (
        <div>
          {/* Secondary Sub-tabs: [ Series ] [ Single Video ] */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setVideoMode('series')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                videoMode === 'series'
                  ? 'bg-[#FF0080] text-white shadow-md'
                  : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
              }`}
            >
              Series
            </button>
            <button
              onClick={() => setVideoMode('single')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                videoMode === 'single'
                  ? 'bg-[#FF0080] text-white shadow-md'
                  : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
              }`}
            >
              Single Video
            </button>
          </div>

          {/* ----------------- SERIES FORM ----------------- */}
          {videoMode === 'series' && (
            <form onSubmit={handleSubmitSeries} className="space-y-6">
              {/* Create Series Card */}
              <div className="bg-[#333336] border border-[#454549] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-[#FF0080]/15 text-[#FF0080]">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Create Series</h2>
                    <p className="text-xs text-[#85858B]">
                      Upload multiple episodes to create a series.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                      Series Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. The Last Kingdom"
                      value={seriesTitle}
                      onChange={(e) => setSeriesTitle(e.target.value)}
                      className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                      Series Description *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us about your series..."
                      value={seriesDesc}
                      onChange={(e) => setSeriesDesc(e.target.value)}
                      className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl p-4 border border-[#454549] focus:outline-none focus:border-[#FF0080] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                        Category
                      </label>
                      <select
                        value={seriesCategory}
                        onChange={(e) => setSeriesCategory(e.target.value)}
                        className="w-full bg-[#2B2B2D] text-white text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080] transition-colors"
                      >
                        <option value="Drama">Drama</option>
                        <option value="Action">Action</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Documentary">Documentary</option>
                        <option value="Romance">Romance</option>
                        <option value="Horror">Horror</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Action, Drama, Thriller"
                        value={seriesTags}
                        onChange={(e) => setSeriesTags(e.target.value)}
                        className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Cover / Poster Upload */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                      Cover Thumbnail (JPG, PNG max 5MB)
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 border-2 border-dashed border-[#454549] hover:border-[#FF0080] rounded-2xl p-6 text-center cursor-pointer bg-[#2B2B2D]/50 transition-colors">
                        <Upload className="w-6 h-6 text-[#FF0080] mx-auto mb-2" />
                        <span className="text-xs text-white font-medium block">
                          {seriesCoverUploading ? 'Uploading cover...' : 'Upload Cover Image'}
                        </span>
                        <span className="text-[11px] text-[#85858B]">JPG, PNG (max 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSeriesCoverUpload}
                          className="hidden"
                        />
                      </label>

                      {seriesCoverUrl && (
                        <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#454549] shrink-0">
                          <Image
                            src={seriesCoverUrl}
                            alt="Cover preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setSeriesCoverUrl('')}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:text-[#EF4444]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Episodes Section matching mockup */}
              <div className="bg-[#333336] border border-[#454549] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#454549]">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Film className="w-4 h-4 text-[#FF0080]" />
                      Episodes
                    </h2>
                    <p className="text-xs text-[#85858B]">Add details for each episode</p>
                  </div>

                  <button
                    type="button"
                    onClick={addEpisode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#FF0080] text-[#FF0080] hover:bg-[#FF0080]/15 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Episode
                  </button>
                </div>

                {/* Episode Cards */}
                <div className="space-y-4">
                  {episodes.map((ep, idx) => (
                    <div
                      key={ep.id}
                      className="bg-[#2B2B2D] border border-[#454549] rounded-xl p-4 space-y-4 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#3A3A3E] text-xs font-bold text-white flex items-center justify-center border border-[#454549]">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-[#B8B8BD]">
                            Episode #{idx + 1}
                          </span>
                        </div>

                        {episodes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEpisode(ep.id)}
                            className="text-[#85858B] hover:text-[#EF4444] transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] uppercase font-semibold text-[#85858B] mb-1">
                            Episode Title *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Episode 1: The Beginning"
                            value={ep.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEpisodes((prev) =>
                                prev.map((item) => (item.id === ep.id ? { ...item, title: val } : item))
                              );
                            }}
                            className="w-full bg-[#333336] text-white text-xs rounded-xl px-3 py-2.5 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase font-semibold text-[#85858B] mb-1">
                            Summary *
                          </label>
                          <textarea
                            rows={1}
                            placeholder="Brief summary of this episode..."
                            value={ep.summary}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEpisodes((prev) =>
                                prev.map((item) => (item.id === ep.id ? { ...item, summary: val } : item))
                              );
                            }}
                            className="w-full bg-[#333336] text-white text-xs rounded-xl px-3 py-2 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                          />
                        </div>
                      </div>

                      {/* Episode Media Uploads */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#3A3A3E]">
                        {/* Video Upload Area */}
                        <div>
                          <label className="block text-[11px] uppercase font-semibold text-[#85858B] mb-1">
                            Upload Video (MP4, MOV max 1GB)
                          </label>
                          {ep.videoUrl ? (
                            <div className="p-3 bg-[#333336] rounded-xl border border-[#22C55E]/40 flex items-center justify-between">
                              <span className="text-xs text-[#22C55E] flex items-center gap-1.5 truncate">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                Video Ready
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEpisodes((prev) =>
                                    prev.map((item) =>
                                      item.id === ep.id ? { ...item, videoUrl: '', videoPublicId: '' } : item
                                    )
                                  )
                                }
                                className="text-xs text-[#85858B] hover:text-[#EF4444]"
                              >
                                Replace
                              </button>
                            </div>
                          ) : (
                            <label className="block border border-dashed border-[#454549] hover:border-[#FF0080] rounded-xl p-4 text-center cursor-pointer bg-[#333336]/40 transition-colors">
                              <Upload className="w-5 h-5 text-[#FF0080] mx-auto mb-1" />
                              <span className="text-xs text-white block font-medium">
                                {ep.videoUploading
                                  ? `Uploading (${ep.videoProgress}%)...`
                                  : 'Upload Video'}
                              </span>
                              <span className="text-[10px] text-[#85858B]">MP4, MOV (max 1GB)</span>
                              <input
                                type="file"
                                accept="video/*"
                                disabled={ep.videoUploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleEpisodeVideoUpload(ep.id, file);
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        {/* Thumbnail Upload Area */}
                        <div>
                          <label className="block text-[11px] uppercase font-semibold text-[#85858B] mb-1">
                            Thumbnail (JPG, PNG max 5MB)
                          </label>
                          {ep.thumbnailUrl ? (
                            <div className="relative h-20 w-full rounded-xl overflow-hidden border border-[#454549]">
                              <Image
                                src={ep.thumbnailUrl}
                                alt="Episode thumbnail"
                                fill
                                className="object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEpisodes((prev) =>
                                    prev.map((item) =>
                                      item.id === ep.id ? { ...item, thumbnailUrl: '' } : item
                                    )
                                  )
                                }
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:text-[#EF4444]"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="block border border-dashed border-[#454549] hover:border-[#FF0080] rounded-xl p-4 text-center cursor-pointer bg-[#333336]/40 transition-colors">
                              <Upload className="w-5 h-5 text-[#FF0080] mx-auto mb-1" />
                              <span className="text-xs text-white block font-medium">
                                {ep.thumbUploading ? 'Uploading...' : 'Upload Thumbnail'}
                              </span>
                              <span className="text-[10px] text-[#85858B]">JPG, PNG (max 5MB)</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={ep.thumbUploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleEpisodeThumbUpload(ep.id, file);
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary CTA button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-bold text-sm tracking-wide transition-all shadow-xl active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isSubmitting ? 'Publishing Series...' : 'Upload Series'}</span>
              </button>
            </form>
          )}

          {/* ----------------- SINGLE VIDEO FORM ----------------- */}
          {videoMode === 'single' && (
            <form onSubmit={handleSubmitSingleVideo} className="bg-[#333336] border border-[#454549] rounded-2xl p-6 space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass on Cinematography"
                  value={singleVideoTitle}
                  onChange={(e) => setSingleVideoTitle(e.target.value)}
                  className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed description of this video..."
                  value={singleVideoDesc}
                  onChange={(e) => setSingleVideoDesc(e.target.value)}
                  className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl p-4 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Category
                  </label>
                  <select
                    value={singleVideoCategory}
                    onChange={(e) => setSingleVideoCategory(e.target.value)}
                    className="w-full bg-[#2B2B2D] text-white text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Music">Music</option>
                    <option value="Education">Education</option>
                    <option value="Tech">Tech</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Film">Film & Animation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tutorial, Camera, 4K"
                    value={singleVideoTags}
                    onChange={(e) => setSingleVideoTags(e.target.value)}
                    className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                  />
                </div>
              </div>

              {/* Upload Video & Thumbnail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Video Upload * (MP4, MOV max 1GB)
                  </label>
                  {singleVideoUrl ? (
                    <div className="p-4 bg-[#2B2B2D] rounded-xl border border-[#22C55E]/40 flex items-center justify-between">
                      <span className="text-xs text-[#22C55E] flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Video Uploaded
                      </span>
                      <button
                        type="button"
                        onClick={() => setSingleVideoUrl('')}
                        className="text-xs text-[#85858B] hover:text-[#EF4444]"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-[#454549] hover:border-[#FF0080] rounded-2xl p-6 text-center cursor-pointer bg-[#2B2B2D]/50 transition-colors">
                      <Upload className="w-6 h-6 text-[#FF0080] mx-auto mb-2" />
                      <span className="text-xs text-white font-medium block">
                        {singleVideoUploading
                          ? `Uploading (${singleVideoProgress}%)...`
                          : 'Select Video File'}
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        disabled={singleVideoUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setSingleVideoUploading(true);
                          try {
                            const res = await uploadMedia(file, 'video', 'yarrowplay/videos', (p) =>
                              setSingleVideoProgress(p)
                            );
                            setSingleVideoUrl(res.secure_url);
                            setSingleVideoPublicId(res.public_id);
                            setSingleVideoDuration(res.duration || 0);
                          } catch (err: any) {
                            setStatusMsg({ type: 'error', text: 'Upload failed: ' + err.message });
                          } finally {
                            setSingleVideoUploading(false);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Thumbnail Upload (JPG, PNG max 5MB)
                  </label>
                  {singleVideoThumbUrl ? (
                    <div className="relative h-24 rounded-xl overflow-hidden border border-[#454549]">
                      <Image
                        src={singleVideoThumbUrl}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setSingleVideoThumbUrl('')}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:text-[#EF4444]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-[#454549] hover:border-[#FF0080] rounded-2xl p-6 text-center cursor-pointer bg-[#2B2B2D]/50 transition-colors">
                      <Upload className="w-6 h-6 text-[#FF0080] mx-auto mb-2" />
                      <span className="text-xs text-white font-medium block">
                        {singleThumbUploading ? 'Uploading...' : 'Select Thumbnail'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={singleThumbUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setSingleThumbUploading(true);
                          try {
                            const res = await uploadMedia(file, 'image', 'yarrowplay/thumbnails');
                            setSingleVideoThumbUrl(res.secure_url);
                            setSingleVideoThumbPublicId(res.public_id);
                          } catch (err: any) {
                            setStatusMsg({ type: 'error', text: 'Thumbnail upload failed: ' + err.message });
                          } finally {
                            setSingleThumbUploading(false);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-bold text-sm tracking-wide transition-all shadow-xl active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isSubmitting ? 'Uploading Video...' : 'Upload Video'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* AUDIO WORKFLOW                                       */}
      {/* ==================================================== */}
      {primaryTab === 'audio' && (
        <div>
          {/* Secondary Sub-tabs: [ Album ] [ Single ] */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setAudioMode('album')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                audioMode === 'album'
                  ? 'bg-[#FF0080] text-white shadow-md'
                  : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
              }`}
            >
              Album
            </button>
            <button
              onClick={() => setAudioMode('single')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                audioMode === 'single'
                  ? 'bg-[#FF0080] text-white shadow-md'
                  : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
              }`}
            >
              Single
            </button>
          </div>

          {/* ----------------- ALBUM FORM ----------------- */}
          {audioMode === 'album' && (
            <form onSubmit={handleSubmitAlbum} className="space-y-6">
              <div className="bg-[#333336] border border-[#454549] rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-white">Upload Album</h2>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Album / Playlist Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midnight Thoughts"
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                      Artist / Creator
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Vance"
                      value={albumArtist}
                      onChange={(e) => setAlbumArtist(e.target.value)}
                      className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                      Genre
                    </label>
                    <select
                      value={albumGenre}
                      onChange={(e) => setAlbumGenre(e.target.value)}
                      className="w-full bg-[#2B2B2D] text-white text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                    >
                      <option value="Pop">Pop</option>
                      <option value="Hip-Hop">Hip-Hop</option>
                      <option value="Rock">Rock</option>
                      <option value="Electronic">Electronic</option>
                      <option value="Acoustic">Acoustic</option>
                      <option value="Classical">Classical</option>
                      <option value="Podcast">Podcast</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Album description..."
                    value={albumDesc}
                    onChange={(e) => setAlbumDesc(e.target.value)}
                    className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl p-4 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                  />
                </div>

                {/* Album Cover Art */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Poster / Cover Art (JPG, PNG max 5MB)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 border-2 border-dashed border-[#454549] hover:border-[#FF0080] rounded-2xl p-6 text-center cursor-pointer bg-[#2B2B2D]/50 transition-colors">
                      <Upload className="w-6 h-6 text-[#FF0080] mx-auto mb-2" />
                      <span className="text-xs text-white font-medium block">
                        {albumCoverUploading ? 'Uploading cover...' : 'Upload Cover Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setAlbumCoverUploading(true);
                          try {
                            const res = await uploadMedia(file, 'image', 'yarrowplay/covers');
                            setAlbumCoverUrl(res.secure_url);
                            setAlbumCoverPublicId(res.public_id);
                          } catch (err: any) {
                            setStatusMsg({ type: 'error', text: 'Cover upload failed: ' + err.message });
                          } finally {
                            setAlbumCoverUploading(false);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {albumCoverUrl && (
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#454549] shrink-0">
                        <Image
                          src={albumCoverUrl}
                          alt="Album cover preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setAlbumCoverUrl('')}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:text-[#EF4444]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracks Section */}
              <div className="bg-[#333336] border border-[#454549] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#454549]">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Music className="w-4 h-4 text-[#FF0080]" />
                    Tracks
                  </h2>
                  <button
                    type="button"
                    onClick={addTrack}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#FF0080] text-[#FF0080] hover:bg-[#FF0080]/15 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Track
                  </button>
                </div>

                <div className="space-y-3">
                  {albumTracks.map((trk, idx) => (
                    <div
                      key={trk.id}
                      className="bg-[#2B2B2D] border border-[#454549] rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                        <span className="text-xs font-bold text-[#85858B] w-6">{idx + 1}</span>
                        <input
                          type="text"
                          required
                          placeholder="Track Title"
                          value={trk.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAlbumTracks((prev) =>
                              prev.map((item) => (item.id === trk.id ? { ...item, title: val } : item))
                            );
                          }}
                          className="flex-1 bg-[#333336] text-white text-xs rounded-lg px-3 py-2 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                        />
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        {trk.audioUrl ? (
                          <span className="text-xs text-[#22C55E] flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Ready
                          </span>
                        ) : (
                          <label className="px-3 py-1.5 rounded-lg bg-[#3A3A3E] hover:bg-[#404045] text-white text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-[#FF0080]" />
                            <span>{trk.uploading ? `Uploading (${trk.progress}%)...` : 'Upload Audio'}</span>
                            <input
                              type="file"
                              accept="audio/*"
                              disabled={trk.uploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleTrackUpload(trk.id, file);
                              }}
                              className="hidden"
                            />
                          </label>
                        )}

                        {albumTracks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTrack(trk.id)}
                            className="text-[#85858B] hover:text-[#EF4444] p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-bold text-sm tracking-wide transition-all shadow-xl active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isSubmitting ? 'Uploading Album...' : 'Upload Album'}</span>
              </button>
            </form>
          )}

          {/* ----------------- SINGLE AUDIO FORM ----------------- */}
          {audioMode === 'single' && (
            <form onSubmit={handleSubmitSingleAudio} className="bg-[#333336] border border-[#454549] rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                  Track Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neon Horizon"
                  value={singleAudioTitle}
                  onChange={(e) => setSingleAudioTitle(e.target.value)}
                  className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Artist / Creator
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Vance"
                    value={singleAudioArtist}
                    onChange={(e) => setSingleAudioArtist(e.target.value)}
                    className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Genre
                  </label>
                  <select
                    value={singleAudioGenre}
                    onChange={(e) => setSingleAudioGenre(e.target.value)}
                    className="w-full bg-[#2B2B2D] text-white text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                  >
                    <option value="Acoustic">Acoustic</option>
                    <option value="Pop">Pop</option>
                    <option value="Hip-Hop">Hip-Hop</option>
                    <option value="Rock">Rock</option>
                    <option value="Electronic">Electronic</option>
                    <option value="R&B">R&B</option>
                    <option value="Podcast">Podcast</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                  Lyrics (optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste lyrics here..."
                  value={singleAudioLyrics}
                  onChange={(e) => setSingleAudioLyrics(e.target.value)}
                  className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl p-4 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                />
              </div>

              {/* Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Audio File *
                  </label>
                  {singleAudioUrl ? (
                    <div className="p-4 bg-[#2B2B2D] rounded-xl border border-[#22C55E]/40 flex items-center justify-between">
                      <span className="text-xs text-[#22C55E] flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Audio Uploaded
                      </span>
                      <button
                        type="button"
                        onClick={() => setSingleAudioUrl('')}
                        className="text-xs text-[#85858B] hover:text-[#EF4444]"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-[#454549] hover:border-[#FF0080] rounded-2xl p-6 text-center cursor-pointer bg-[#2B2B2D]/50 transition-colors">
                      <Upload className="w-6 h-6 text-[#FF0080] mx-auto mb-2" />
                      <span className="text-xs text-white font-medium block">
                        {singleAudioUploading
                          ? `Uploading (${singleAudioProgress}%)...`
                          : 'Select Audio File'}
                      </span>
                      <input
                        type="file"
                        accept="audio/*"
                        disabled={singleAudioUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setSingleAudioUploading(true);
                          try {
                            const res = await uploadMedia(file, 'auto', 'yarrowplay/audio', (p) =>
                              setSingleAudioProgress(p)
                            );
                            setSingleAudioUrl(res.secure_url);
                            setSingleAudioPublicId(res.public_id);
                            setSingleAudioDuration(res.duration || 0);
                          } catch (err: any) {
                            setStatusMsg({ type: 'error', text: 'Upload failed: ' + err.message });
                          } finally {
                            setSingleAudioUploading(false);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
                    Cover / Poster Art (JPG, PNG max 5MB)
                  </label>
                  {singleAudioCoverUrl ? (
                    <div className="relative h-24 rounded-xl overflow-hidden border border-[#454549]">
                      <Image
                        src={singleAudioCoverUrl}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setSingleAudioCoverUrl('')}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:text-[#EF4444]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-[#454549] hover:border-[#FF0080] rounded-2xl p-6 text-center cursor-pointer bg-[#2B2B2D]/50 transition-colors">
                      <Upload className="w-6 h-6 text-[#FF0080] mx-auto mb-2" />
                      <span className="text-xs text-white font-medium block">
                        {singleAudioCoverUploading ? 'Uploading...' : 'Select Cover Art'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={singleAudioCoverUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setSingleAudioCoverUploading(true);
                          try {
                            const res = await uploadMedia(file, 'image', 'yarrowplay/covers');
                            setSingleAudioCoverUrl(res.secure_url);
                            setSingleAudioCoverPublicId(res.public_id);
                          } catch (err: any) {
                            setStatusMsg({ type: 'error', text: 'Cover upload failed: ' + err.message });
                          } finally {
                            setSingleAudioCoverUploading(false);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-bold text-sm tracking-wide transition-all shadow-xl active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isSubmitting ? 'Uploading Track...' : 'Upload Audio'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MANAGE CONTENT WORKFLOW                              */}
      {/* ==================================================== */}
      {primaryTab === 'manage' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setManageSubTab('videos')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  manageSubTab === 'videos'
                    ? 'bg-[#FF0080] text-white shadow-md'
                    : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
                }`}
              >
                Videos ({uploadedVideos.length})
              </button>
              <button
                onClick={() => setManageSubTab('audios')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  manageSubTab === 'audios'
                    ? 'bg-[#FF0080] text-white shadow-md'
                    : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
                }`}
              >
                Audios ({uploadedAudios.length})
              </button>
            </div>
            {isAdmin && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF0080]/15 text-[#FF0080] border border-[#FF0080]/30">
                Admin Mode: All Content
              </span>
            )}
          </div>

          {loadingManage ? (
            <div className="p-12 text-center text-[#85858B] flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF0080]" />
              <p className="text-xs">Loading uploaded content...</p>
            </div>
          ) : manageSubTab === 'videos' ? (
            uploadedVideos.length === 0 ? (
              <div className="bg-[#333336] border border-[#454549] rounded-2xl p-12 text-center text-[#85858B] space-y-3">
                <Film className="w-10 h-10 mx-auto text-[#85858B]/50" />
                <p className="text-sm font-semibold text-white">No videos found</p>
                <p className="text-xs max-w-sm mx-auto">
                  You haven't uploaded any videos yet. Switch to the Video tab to publish your first video.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedVideos.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 bg-[#333336] border border-[#454549] rounded-2xl flex items-center justify-between gap-4 hover:border-[#555559] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-[#2B2B2D] shrink-0 border border-[#454549]">
                        {v.thumbnail_url ? (
                          <Image src={v.thumbnail_url} alt={v.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-5 h-5 text-[#85858B]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">{v.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#85858B] mt-0.5">
                          <span>{new Date(v.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{v.views_count || 0} views</span>
                          {isAdmin && v.creator && (
                            <>
                              <span>•</span>
                              <span className="text-[#FF0080] truncate">
                                By {v.creator.display_name || v.creator.username}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/videos/${v.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-[#2B2B2D] hover:bg-[#3A3A3E] text-[#B8B8BD] hover:text-white transition-colors cursor-pointer"
                        title="View video"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() =>
                          setManageDeleteTarget({
                            id: v.id,
                            type: 'video',
                            title: v.title,
                          })
                        }
                        title="Delete video"
                        className="p-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : uploadedAudios.length === 0 ? (
            <div className="bg-[#333336] border border-[#454549] rounded-2xl p-12 text-center text-[#85858B] space-y-3">
              <Music className="w-10 h-10 mx-auto text-[#85858B]/50" />
              <p className="text-sm font-semibold text-white">No audio tracks found</p>
              <p className="text-xs max-w-sm mx-auto">
                You haven't uploaded any audio tracks yet. Switch to the Audio tab to upload your music or podcast.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedAudios.map((a) => (
                <div
                  key={a.id}
                  className="p-4 bg-[#333336] border border-[#454549] rounded-2xl flex items-center justify-between gap-4 hover:border-[#555559] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#2B2B2D] shrink-0 border border-[#454549]">
                      {a.cover_url ? (
                        <Image src={a.cover_url} alt={a.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-5 h-5 text-[#85858B]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{a.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-[#85858B] mt-0.5">
                        <span>{a.artist_name || 'Original Artist'}</span>
                        <span>•</span>
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                        {isAdmin && a.creator && (
                          <>
                            <span>•</span>
                            <span className="text-[#FF0080] truncate">
                              By {a.creator.display_name || a.creator.username}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setManageDeleteTarget({
                          id: a.id,
                          type: 'audio',
                          title: a.title,
                        })
                      }
                      title="Delete audio"
                      className="p-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {manageDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2B2B2D] border border-[#454549] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <div className="p-3 bg-[#EF4444]/10 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white capitalize">
                  Delete {manageDeleteTarget.type}
                </h3>
                <p className="text-xs text-[#85858B]">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-[#B8B8BD] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">"{manageDeleteTarget.title}"</strong>? All associated
              comments, reactions, and history will be permanently deleted.
            </p>

            {manageDeleteError && (
              <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs text-[#EF4444]">
                {manageDeleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isManageDeleting}
                onClick={() => {
                  setManageDeleteTarget(null);
                  setManageDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#85858B] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isManageDeleting}
                onClick={handleConfirmManageDelete}
                className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isManageDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
