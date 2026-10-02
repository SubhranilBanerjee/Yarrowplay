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
  PenTool,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  Loader2,
  Eye,
  FileText,
  Tag,
  Clock,
  ArrowLeft,
  Calendar,
  User,
  Sparkles,
  Check,
} from 'lucide-react';
import { BottomToast } from '@/components/ui/BottomToast';
import { generateBlogSlug, cleanExcerpt, estimateReadingTime } from '@/lib/seo';

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
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Preview Mode
  const [showPreview, setShowPreview] = useState(false);

  const [coverUploading, setCoverUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Articles list & deletion state
  const [articles, setArticles] = useState<Blog[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin =
    !!user?.email &&
    (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      user.email === 'admin@dramabox.stream' ||
      profile?.role === 'admin');

  // Reading time and word count for the writer
  const wordCount = useMemo(() => {
    if (!body.trim()) return 0;
    return body.trim().split(/\s+/).length;
  }, [body]);

  const readingTime = useMemo(() => estimateReadingTime(body), [body]);

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
      setStatusMsg({ type: 'error', text: 'Please provide both Title and Story content.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // Automated internal slug and summary generation without cluttering UI
      const finalSlug = generateBlogSlug(title);
      const finalMetaDesc = cleanExcerpt(body, 160);

      const payload: any = {
        author_id: user.id,
        title: title.trim(),
        slug: finalSlug,
        body: body.trim(),
        meta_description: finalMetaDesc,
        category,
        tags: tagsArray,
        cover_url: coverUrl || null,
        cover_public_id: coverPublicId || null,
        status: targetStatus,
        reading_time_minutes: readingTime.minutes,
        canonical_url: null,
      };

      if (targetStatus === 'published') {
        payload.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase.from('blogs').insert(payload).select().single();

      if (error) {
        if (error.code === '23505') {
          payload.slug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
          const retry = await supabase.from('blogs').insert(payload).select().single();
          if (retry.error) throw retry.error;
        } else {
          throw error;
        }
      }

      setStatusMsg({
        type: 'success',
        text: targetStatus === 'published' ? 'Story published successfully!' : 'Draft saved successfully.',
      });

      // Reset form
      setTitle('');
      setBody('');
      setTags('');
      setCoverUrl('');
      setCoverPublicId('');

      setTimeout(() => {
        if (targetStatus === 'published') {
          router.push(`/blogs/${finalSlug}`);
        } else {
          setActiveTab('articles');
        }
      }, 1000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save story.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchArticles = async () => {
    if (!user) return;
    setLoadingArticles(true);
    try {
      let query = supabase.from('blogs').select('*').order('created_at', { ascending: false });
      if (!isAdmin) {
        query = query.eq('author_id', user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setArticles((data as Blog[]) || []);
    } catch (err: any) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'articles') {
      fetchArticles();
    }
  }, [activeTab, user]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/blogs?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete story');
      setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      setStatusMsg({ type: 'success', text: 'Story removed successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error removing story.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] py-8 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--lr-border)]">
          <div className="flex items-center gap-3">
            <Link
              href="/blogs"
              className="w-10 h-10 rounded-full bg-[var(--lr-card-bg)] border border-[var(--lr-border)] flex items-center justify-center hover:border-[#ECC979] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--lr-text-muted)] hover:text-[#ECC979]" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Editorial Studio</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#ECC979]/15 text-[#ECC979] border border-[#ECC979]/30 px-2 py-0.5 rounded-full">
                  Writing Desk
                </span>
              </div>
              <p className="text-xs text-[var(--lr-text-muted)] mt-0.5">
                Clean distraction-free workspace for crafting articles, reviews, and creator stories
              </p>
            </div>
          </div>

          {/* Tab Switcher & Preview Button */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center p-1 rounded-xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'write' ? 'bg-[#ECC979] text-[#101418]' : 'text-[var(--lr-text-muted)] hover:text-[var(--lr-text-primary)]'
                }`}
              >
                Write Story
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('articles')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'articles' ? 'bg-[#ECC979] text-[#101418]' : 'text-[var(--lr-text-muted)] hover:text-[var(--lr-text-primary)]'
                }`}
              >
                My Stories
              </button>
            </div>

            {activeTab === 'write' && (
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                  showPreview
                    ? 'bg-[#ECC979]/15 border-[#ECC979] text-[#ECC979]'
                    : 'bg-[var(--lr-card-bg)] border-[var(--lr-border)] hover:border-[#ECC979]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showPreview ? 'Edit Mode' : 'Preview'}</span>
              </button>
            )}
          </div>
        </div>

        {activeTab === 'write' ? (
          showPreview ? (
            /* Story Live Preview */
            <div className="p-8 rounded-3xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm max-w-3xl mx-auto space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--lr-border)] text-xs text-[var(--lr-text-muted)]">
                <span className="font-semibold text-[#ECC979] uppercase tracking-wider">{category}</span>
                <span>{readingTime.label}</span>
              </div>

              {coverUrl && (
                <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden relative border border-[var(--lr-border)]">
                  <Image src={coverUrl} alt="Cover preview" fill className="object-cover" />
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--lr-text-primary)] leading-tight">
                {title || 'Untitled Story'}
              </h1>

              <div className="flex items-center gap-3 py-2 border-y border-[var(--lr-border)] text-xs text-[var(--lr-text-muted)]">
                <div className="w-7 h-7 rounded-full bg-[#182330] flex items-center justify-center font-bold text-[#ECC979]">
                  {(profile?.display_name || user?.email || 'A')[0].toUpperCase()}
                </div>
                <span>By {profile?.display_name || user?.email}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>

              <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {body || 'Story body will appear here...'}
              </div>
            </div>
          ) : (
            /* Clean Writing Desk Layout */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Writing Canvas (2 Columns) */}
              <div className="lg:col-span-2 space-y-5">
                <div className="p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm space-y-5">
                  {/* Story Title */}
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Title of your story..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xl sm:text-2xl font-bold bg-transparent border-b border-[var(--lr-border)] pb-3 text-[var(--lr-text-primary)] placeholder-[var(--lr-text-muted)] focus:outline-none focus:border-[#ECC979] transition-colors"
                    />
                  </div>

                  {/* Featured Cover Image */}
                  <div>
                    <span className="block text-xs font-semibold text-[var(--lr-text-muted)] mb-2">
                      Cover Image
                    </span>

                    {coverUrl ? (
                      <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden border border-[var(--lr-border)] group">
                        <Image src={coverUrl} alt="Story cover" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setCoverUrl('')}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 text-white hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-[var(--lr-border)] hover:border-[#ECC979]/50 rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center transition-all bg-[var(--lr-bg)]">
                        <Upload className="w-6 h-6 text-[#ECC979] mb-1.5" />
                        <span className="text-xs font-semibold text-[var(--lr-text-primary)]">
                          {coverUploading ? 'Uploading cover...' : 'Add a Cover Image'}
                        </span>
                        <span className="text-[10px] text-[var(--lr-text-muted)] mt-0.5">JPG, PNG, or WebP</span>
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

                  {/* Main Story Content */}
                  <div>
                    <div className="flex items-center justify-between mb-2 text-xs text-[var(--lr-text-muted)]">
                      <span className="font-semibold">Story Body</span>
                      <span>
                        {wordCount} words • {readingTime.label}
                      </span>
                    </div>

                    <textarea
                      rows={16}
                      required
                      placeholder="Write your story, review, or thoughts here... Markdown formatting is fully supported."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full text-sm leading-relaxed rounded-xl p-4 bg-[var(--lr-bg)] border border-[var(--lr-border)] text-[var(--lr-text-primary)] placeholder-[var(--lr-text-muted)] focus:outline-none focus:border-[#ECC979] transition-colors resize-y font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Editorial Inspector & Publishing Sidebar (1 Column) */}
              <div className="space-y-5">
                {/* Publishing Actions Card */}
                <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-[var(--lr-text-primary)]">Publishing</h3>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSaveBlog('published')}
                      className="btn-primary w-full flex items-center justify-center gap-2 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 stroke-[3]" />
                      )}
                      <span>Publish Now</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSaveBlog('draft')}
                      className="w-full flex items-center justify-center gap-2 bg-[var(--lr-bg)] border border-[var(--lr-border)] hover:border-[#ECC979] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Save as Draft</span>
                    </button>
                  </div>
                </div>

                {/* Categorization & Metadata */}
                <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-[var(--lr-text-primary)]">Story Details</h3>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--lr-text-muted)] mb-1.5">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs rounded-xl px-3 py-2 bg-[var(--lr-bg)] border border-[var(--lr-border)] text-[var(--lr-text-primary)] focus:outline-none focus:border-[#ECC979]"
                    >
                      <option value="Entertainment">Entertainment</option>
                      <option value="Film Review">Film Review</option>
                      <option value="Directing">Directing</option>
                      <option value="Screenplay">Screenplay</option>
                      <option value="Culture">Culture</option>
                      <option value="Tutorial">Tutorial</option>
                      <option value="Music">Music</option>
                      <option value="Technology">Technology</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--lr-text-muted)] mb-1.5">
                      Topics & Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. cinema, acting, drama"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full text-xs rounded-xl px-3 py-2 bg-[var(--lr-bg)] border border-[var(--lr-border)] text-[var(--lr-text-primary)] placeholder-[var(--lr-text-muted)] focus:outline-none focus:border-[#ECC979]"
                    />
                  </div>
                </div>

                {/* Author Card */}
                <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--lr-bg)] border border-[var(--lr-border)] flex items-center justify-center font-bold text-[#ECC979]">
                    {(profile?.display_name || user?.email || 'A')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{profile?.display_name || user?.email}</p>
                    <p className="text-[10px] text-[var(--lr-text-muted)] capitalize">{profile?.role || 'Creator'}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          /* Articles List Tab */
          <div className="p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[var(--lr-text-primary)]">Your Stories</h2>

            {loadingArticles ? (
              <div className="py-12 text-center text-xs text-[var(--lr-text-muted)]">Loading your stories...</div>
            ) : articles.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--lr-text-muted)] space-y-2">
                <FileText className="w-8 h-8 mx-auto text-[var(--lr-text-muted)]" />
                <p>No stories created yet.</p>
                <button
                  onClick={() => setActiveTab('write')}
                  className="text-xs font-bold text-[#ECC979] hover:underline"
                >
                  Write your first story
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--lr-border)]">
                {articles.map((art) => (
                  <div key={art.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[var(--lr-text-primary)] truncate">{art.title}</h4>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            art.status === 'published'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {art.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--lr-text-muted)] mt-0.5">
                        {art.category} • {new Date(art.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {art.status === 'published' && (
                        <Link
                          href={`/blogs/${art.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-[var(--lr-bg)] border border-[var(--lr-border)] hover:text-[#ECC979] text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(art)}
                        className="p-1.5 rounded-lg bg-[var(--lr-bg)] border border-red-500/30 text-red-400 hover:bg-red-500/15 text-xs transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-2xl space-y-4">
            <h3 className="font-bold text-sm">Delete Story?</h3>
            <p className="text-xs text-[var(--lr-text-muted)] leading-relaxed">
              Are you sure you want to permanently delete "{deleteTarget.title}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--lr-bg)] border border-[var(--lr-border)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusMsg && <BottomToast message={statusMsg} onClose={() => setStatusMsg(null)} />}
    </div>
  );
}
