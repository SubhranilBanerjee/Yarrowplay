'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { uploadMedia } from '@/lib/upload';
import { Blog } from '@/types/database';
import {
  BookOpen,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  Loader2,
  PenTool,
  ExternalLink,
  Search,
  Globe,
  Sparkles,
  Check,
  AlertTriangle,
  Clock,
  FileText,
  Tag,
  Hash,
} from 'lucide-react';
import { BottomToast } from '@/components/ui/BottomToast';
import { generateBlogSlug, cleanExcerpt, estimateReadingTime, SITE_CONFIG } from '@/lib/seo';

export default function BlogStudioPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<'write' | 'articles'>('write');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [tags, setTags] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPublicId, setCoverPublicId] = useState('');
  const [body, setBody] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [customMetaDescription, setCustomMetaDescription] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [isDescManual, setIsDescManual] = useState(false);

  const [coverUploading, setCoverUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Articles list & deletion state
  const [articles, setArticles] = useState<Blog[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAdmin =
    !!user?.email &&
    (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      user.email === 'admin@dramabox.stream');

  // Automatically derive slug and meta description unless manually overridden
  useEffect(() => {
    if (!isSlugManual && title) {
      setCustomSlug(generateBlogSlug(title));
    }
  }, [title, isSlugManual]);

  useEffect(() => {
    if (!isDescManual && body) {
      setCustomMetaDescription(cleanExcerpt(body, 160));
    }
  }, [body, isDescManual]);

  // Real-time SEO metrics
  const wordCount = useMemo(() => {
    if (!body.trim()) return 0;
    return body.trim().split(/\s+/).length;
  }, [body]);

  const readingTime = useMemo(() => estimateReadingTime(body), [body]);

  const seoChecklist = useMemo(() => {
    const titleLen = title.trim().length;
    const titleGood = titleLen >= 30 && titleLen <= 65;

    const descLen = customMetaDescription.trim().length;
    const descGood = descLen >= 100 && descLen <= 160;

    const hasCover = !!coverUrl;
    const contentGood = wordCount >= 100;
    const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const hasTags = tagsArray.length >= 2;

    const passedCount = [titleGood, descGood, hasCover, contentGood, hasTags].filter(Boolean).length;
    const score = Math.round((passedCount / 5) * 100);

    return {
      titleGood,
      titleLen,
      descGood,
      descLen,
      hasCover,
      contentGood,
      hasTags,
      tagsCount: tagsArray.length,
      passedCount,
      score,
    };
  }, [title, customMetaDescription, coverUrl, wordCount, tags]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const res = await uploadMedia(file, 'image', 'yarrowplay/blogs');
      setCoverUrl(res.secure_url);
      setCoverPublicId(res.public_id);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Cover upload failed: ' + err.message });
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSaveBlog = async (targetStatus: 'draft' | 'published') => {
    if (!user) return;
    if (!title.trim() || !body.trim()) {
      setStatusMsg({ type: 'error', text: 'Please provide both Title and Body content.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const finalSlug = (customSlug.trim() || generateBlogSlug(title)).slice(0, 80);

      const { data, error } = await supabase
        .from('blogs')
        .insert({
          author_id: user.id,
          title: title.trim(),
          slug: finalSlug,
          category,
          tags: tagsArray,
          cover_url: coverUrl || null,
          cover_public_id: coverPublicId || null,
          body: body.trim(),
          status: targetStatus,
          published_at: targetStatus === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      setStatusMsg({
        type: 'success',
        text:
          targetStatus === 'published'
            ? '✨ Blog published! Auto-indexed into sitemap.xml, feed.xml, and Schema.org rich snippets.'
            : 'Draft saved successfully.',
      });

      setTimeout(() => {
        router.push(targetStatus === 'published' ? `/blogs/${data.id}` : '/blogs');
      }, 1600);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save blog.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchMyArticles = async () => {
    if (!user) return;
    setLoadingArticles(true);
    try {
      let query = supabase
        .from('blogs')
        .select('*, author:profiles(*)')
        .order('created_at', { ascending: false });
      if (!isAdmin) {
        query = query.eq('author_id', user.id);
      }
      const { data } = await query;
      setArticles((data as Blog[]) || []);
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'articles') {
      fetchMyArticles();
    }
  }, [activeTab, user]);

  const handleConfirmDeleteBlog = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/blogs?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete article');
      }
      setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete article');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1E8] flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-[#F4C95D]" />
            Blog & SEO Studio
          </h1>
          <p className="text-sm text-[#8E9AA7] mt-1">
            Write, optimize for search engines, and publish stories indexed across Google, sitemaps, and RSS feeds.
          </p>
        </div>
      </div>

      {/* Primary Top Tabs: [ Write Article ] [ My Articles ] */}
      <div className="grid grid-cols-2 gap-2 mb-8 bg-[#0D141C] p-1.5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
        <button
          onClick={() => setActiveTab('write')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer border ${
            activeTab === 'write'
              ? 'bg-[#141D26] text-[#F5F1E8] border-[#F4C95D]/40 shadow-[0_2px_12px_rgba(244,201,93,0.15)]'
              : 'bg-transparent text-[#8E9AA7] border-transparent hover:text-[#F5F1E8]'
          }`}
        >
          <PenTool className="w-4 h-4 text-[#F4C95D]" />
          <span>Write & Optimize</span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer border ${
            activeTab === 'articles'
              ? 'bg-[#141D26] text-[#F5F1E8] border-[#F4C95D]/40 shadow-[0_2px_12px_rgba(244,201,93,0.15)]'
              : 'bg-transparent text-[#8E9AA7] border-transparent hover:text-[#F5F1E8]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#F4C95D]" />
          <span>{isAdmin ? 'All Articles' : 'My Articles'}</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 text-sm ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* WRITE ARTICLE VIEW                                   */}
      {/* ==================================================== */}
      {activeTab === 'write' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Writing Area (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div
              className="p-6 sm:p-7 rounded-2xl border space-y-6 backdrop-blur-md"
              style={{
                background: '#111A22',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#8E9AA7]">
                    Article Title *
                  </label>
                  <span
                    className={`text-[11px] font-medium ${
                      seoChecklist.titleGood
                        ? 'text-emerald-400'
                        : seoChecklist.titleLen > 65
                        ? 'text-amber-400'
                        : 'text-[#8E9AA7]'
                    }`}
                  >
                    {title.length}/65 chars
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Behind the Scenes: The Making of Neon Horizon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-[#F5F1E8] placeholder-[#5A6672] text-base font-semibold rounded-xl px-4 py-3 border focus:outline-none focus:border-[#F4C95D]/50 transition-all"
                  style={{
                    background: '#0D141C',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                />
              </div>

              {/* Category & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8E9AA7] mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-[#F5F1E8] text-sm rounded-xl px-4 py-3 border focus:outline-none focus:border-[#F4C95D]/50 transition-all cursor-pointer"
                    style={{
                      background: '#0D141C',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <option value="Entertainment" className="bg-[#111A22] text-[#F5F1E8]">Entertainment</option>
                    <option value="Music" className="bg-[#111A22] text-[#F5F1E8]">Music</option>
                    <option value="Technology" className="bg-[#111A22] text-[#F5F1E8]">Technology</option>
                    <option value="Culture" className="bg-[#111A22] text-[#F5F1E8]">Culture</option>
                    <option value="Film Review" className="bg-[#111A22] text-[#F5F1E8]">Film Review</option>
                    <option value="Tutorial" className="bg-[#111A22] text-[#F5F1E8]">Tutorial</option>
                    <option value="Directing" className="bg-[#111A22] text-[#F5F1E8]">Directing</option>
                    <option value="Screenplay" className="bg-[#111A22] text-[#F5F1E8]">Screenplay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8E9AA7] mb-1.5">
                    SEO Keywords / Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. cinema, cinematography, sound design"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full text-[#F5F1E8] placeholder-[#5A6672] text-sm rounded-xl px-4 py-3 border focus:outline-none focus:border-[#F4C95D]/50 transition-all"
                    style={{
                      background: '#0D141C',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                  />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8E9AA7] mb-1.5">
                  Featured Cover Image (JPG, PNG, WebP)
                </label>
                {coverUrl ? (
                  <div
                    className="relative h-48 w-full rounded-2xl overflow-hidden border"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
                  >
                    <Image src={coverUrl} alt="Cover preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverUrl('')}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/75 text-white hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    className="block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-[#F4C95D]/50"
                    style={{
                      background: '#0D141C',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Upload className="w-6 h-6 text-[#F4C95D] mx-auto mb-2" />
                    <span className="text-xs text-[#F5F1E8] font-medium block">
                      {coverUploading ? 'Uploading cover...' : 'Upload Featured Cover Image'}
                    </span>
                    <span className="text-[11px] text-[#8E9AA7] block mt-1">
                      Required for Google Discover & rich cards
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={coverUploading}
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Blog Article Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#8E9AA7]">
                    Article Content (Markdown supported) *
                  </label>
                  <span className="text-[11px] text-[#8E9AA7]">
                    {wordCount} words • {readingTime.label}
                  </span>
                </div>
                <textarea
                  rows={14}
                  required
                  placeholder="Write your story here... Markdown, headers (#, ##), quotes, and lists are supported."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full text-[#F5F1E8] placeholder-[#5A6672] text-sm rounded-xl p-4 border focus:outline-none focus:border-[#F4C95D]/50 font-sans leading-relaxed transition-all resize-y"
                  style={{
                    background: '#0D141C',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                />
              </div>

              {/* Publish / Draft Action Buttons */}
              <div
                className="flex items-center justify-end gap-3 pt-4 border-t"
                style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
              >
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveBlog('draft')}
                  className="px-5 py-3 rounded-xl text-[#F5F1E8] text-xs font-semibold transition-all disabled:opacity-50 border cursor-pointer hover:bg-white/5"
                  style={{
                    background: '#0D141C',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveBlog('published')}
                  className="px-6 py-3 rounded-xl text-[#070B0F] text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer hover:brightness-110 flex items-center gap-2"
                  style={{
                    background: '#F4C95D',
                    boxShadow: '0 4px 14px rgba(244, 201, 93, 0.25)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Indexing & Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Publish & Index for SEO</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SEO Optimization Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Live Google Search Preview */}
            <div
              className="p-5 rounded-2xl border backdrop-blur-md"
              style={{
                background: '#111A22',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#F4C95D]" />
                  <h3 className="text-xs uppercase font-bold tracking-wider text-[#F5F1E8]">
                    Google SERP Preview
                  </h3>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Live
                </span>
              </div>

              {/* SERP Card simulating Google Search snippet */}
              <div className="p-3.5 rounded-xl bg-[#202124] border border-[#3c4043] space-y-1.5 text-left font-sans">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-[11px] text-[#bdc1c6] truncate">
                  <div className="w-4 h-4 rounded-full bg-[#303134] flex items-center justify-center shrink-0 text-[9px] font-bold text-[#F4C95D]">
                    L
                  </div>
                  <span className="truncate">
                    lighthousereels.stream › blogs › {customSlug || 'article-slug'}
                  </span>
                </div>

                {/* SERP Title */}
                <h4 className="text-[15px] font-medium text-[#8ab4f8] hover:underline cursor-pointer leading-snug line-clamp-2">
                  {title || 'Article Title - Lighthouse Reels'}
                </h4>

                {/* SERP Snippet */}
                <p className="text-[12px] text-[#bdc1c6] leading-relaxed line-clamp-3">
                  {customMetaDescription ||
                    'Write your article content to preview the automated meta description snippet indexed by Google and web crawlers...'}
                </p>
              </div>
            </div>

            {/* SEO Quality Checklist & Score */}
            <div
              className="p-5 rounded-2xl border backdrop-blur-md space-y-4"
              style={{
                background: '#111A22',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#F4C95D]" />
                  <h3 className="text-xs uppercase font-bold tracking-wider text-[#F5F1E8]">
                    SEO Quality Score
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <span
                    className={
                      seoChecklist.score >= 80
                        ? 'text-emerald-400'
                        : seoChecklist.score >= 60
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }
                  >
                    {seoChecklist.score}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    seoChecklist.score >= 80
                      ? 'bg-emerald-400'
                      : seoChecklist.score >= 60
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                  style={{ width: `${seoChecklist.score}%` }}
                />
              </div>

              {/* Checklist items */}
              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#C2C9D1]">
                    {seoChecklist.titleGood ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    Title length (30-65 chars)
                  </span>
                  <span className="text-[11px] text-[#8E9AA7]">{seoChecklist.titleLen} chars</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#C2C9D1]">
                    {seoChecklist.descGood ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    Meta description (100-160 chars)
                  </span>
                  <span className="text-[11px] text-[#8E9AA7]">{seoChecklist.descLen} chars</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#C2C9D1]">
                    {seoChecklist.hasCover ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    Featured cover image
                  </span>
                  <span className="text-[11px] text-[#8E9AA7]">
                    {seoChecklist.hasCover ? 'Present' : 'Missing'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#C2C9D1]">
                    {seoChecklist.contentGood ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    Content length (&gt;100 words)
                  </span>
                  <span className="text-[11px] text-[#8E9AA7]">{wordCount} words</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#C2C9D1]">
                    {seoChecklist.hasTags ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    SEO keywords (≥2 tags)
                  </span>
                  <span className="text-[11px] text-[#8E9AA7]">{seoChecklist.tagsCount} tags</span>
                </div>
              </div>
            </div>

            {/* Custom Canonical Slug & Meta Description Override */}
            <div
              className="p-5 rounded-2xl border backdrop-blur-md space-y-4"
              style={{
                background: '#111A22',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <h3 className="text-xs uppercase font-bold tracking-wider text-[#F5F1E8]">
                Advanced SEO Meta
              </h3>

              {/* Custom Slug */}
              <div>
                <label className="block text-[11px] text-[#8E9AA7] font-medium mb-1">
                  URL Slug (Canonical)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => {
                      setIsSlugManual(true);
                      setCustomSlug(generateBlogSlug(e.target.value));
                    }}
                    placeholder="custom-article-slug"
                    className="w-full text-xs text-[#F5F1E8] rounded-xl px-3 py-2 border focus:outline-none focus:border-[#F4C95D]/50"
                    style={{
                      background: '#0D141C',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                  />
                </div>
              </div>

              {/* Custom Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-[#8E9AA7] font-medium">
                    Meta Description
                  </label>
                  <span className="text-[10px] text-[#8E9AA7]">
                    {customMetaDescription.length}/160
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={customMetaDescription}
                  onChange={(e) => {
                    setIsDescManual(true);
                    setCustomMetaDescription(e.target.value);
                  }}
                  placeholder="Summary indexed by search engines and displayed in previews"
                  className="w-full text-xs text-[#F5F1E8] rounded-xl p-2.5 border focus:outline-none focus:border-[#F4C95D]/50 resize-none leading-relaxed"
                  style={{
                    background: '#0D141C',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                />
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-[11px] text-[#8E9AA7] leading-relaxed">
                🚀 Uploaded blogs are automatically synced with{' '}
                <strong className="text-[#F5F1E8]">/sitemap.xml</strong> and{' '}
                <strong className="text-[#F5F1E8]">/feed.xml</strong>, generating Schema.org{' '}
                <code className="text-[#F4C95D]">BlogPosting</code> structured data for immediate indexing.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MANAGE ARTICLES VIEW                                 */}
      {/* ==================================================== */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#8E9AA7]">
              {isAdmin ? 'All Articles Across Platform' : 'Your Published & Draft Articles'} ({articles.length})
            </h3>
            {isAdmin && (
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-bold border"
                style={{
                  background: 'rgba(244, 201, 93, 0.1)',
                  borderColor: 'rgba(244, 201, 93, 0.3)',
                  color: '#F4C95D',
                }}
              >
                Admin Mode
              </span>
            )}
          </div>

          {loadingArticles ? (
            <div className="p-12 text-center text-[#8E9AA7] flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#F4C95D]" />
              <p className="text-xs">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center text-[#8E9AA7] space-y-3 border backdrop-blur-md"
              style={{
                background: '#111A22',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <BookOpen className="w-10 h-10 mx-auto opacity-50 text-[#8E9AA7]" />
              <p className="text-sm font-semibold text-[#F5F1E8]">No articles found</p>
              <p className="text-xs max-w-sm mx-auto text-[#8E9AA7]">
                You haven't published any articles yet. Switch to the Write & Optimize tab to publish your first SEO-optimized piece.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-4 rounded-2xl flex items-center justify-between gap-4 border transition-all backdrop-blur-md"
                  style={{
                    background: '#111A22',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border"
                      style={{
                        background: '#0D141C',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {art.cover_url ? (
                        <Image src={art.cover_url} alt={art.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-[#8E9AA7]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-[#F5F1E8] truncate">{art.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-[#8E9AA7] mt-0.5">
                        <span className="capitalize">{art.status || 'published'}</span>
                        <span>•</span>
                        <span>{new Date(art.created_at).toLocaleDateString()}</span>
                        {isAdmin && art.author && (
                          <>
                            <span>•</span>
                            <span className="text-[#F4C95D] truncate">
                              By {art.author.display_name || art.author.username}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/blogs/${art.id}`}
                      className="p-2 rounded-xl border text-[#8E9AA7] hover:text-[#F5F1E8] transition-colors cursor-pointer"
                      title="Read article"
                      style={{
                        background: '#0D141C',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(art)}
                      title="Delete article"
                      className="p-2 rounded-xl text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 transition-colors cursor-pointer"
                      style={{ background: 'rgba(239, 68, 68, 0.12)' }}
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
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border backdrop-blur-xl"
            style={{
              background: '#111A22',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F5F1E8]">Delete Article</h3>
                <p className="text-xs text-[#8E9AA7]">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-[#C2C9D1] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">"{deleteTarget.title}"</strong>? All associated comments
              and reactions will be permanently deleted.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#8E9AA7] hover:text-[#F5F1E8] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteBlog}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {isDeleting ? (
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

      {/* Bottom Floating Error & Status Banner */}
      <BottomToast message={statusMsg} onClose={() => setStatusMsg(null)} />
    </div>
  );
}
