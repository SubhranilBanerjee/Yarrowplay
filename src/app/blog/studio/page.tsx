'use client';

import React, { useState, useEffect } from 'react';
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
  Eye,
  Trash2,
  Loader2,
  PenTool,
  ExternalLink,
} from 'lucide-react';
import { BottomToast } from '@/components/ui/BottomToast';

export default function BlogStudioPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<'write' | 'articles'>('write');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [tags, setTags] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPublicId, setCoverPublicId] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');

  const [coverUploading, setCoverUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Articles list & deletion state
  const [articles, setArticles] = useState<Blog[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAdmin = !!user?.email && (
    user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user.email === 'admin@dramabox.stream'
  );

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

      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') +
        '-' +
        Date.now().toString().slice(-4);

      const { data, error } = await supabase.from('blogs').insert({
        author_id: user.id,
        title: title.trim(),
        slug,
        category,
        tags: tagsArray,
        cover_url: coverUrl || null,
        cover_public_id: coverPublicId || null,
        body: body.trim(),
        status: targetStatus,
        published_at: targetStatus === 'published' ? new Date().toISOString() : null,
      }).select().single();

      if (error) throw error;

      setStatusMsg({
        type: 'success',
        text: targetStatus === 'published' ? 'Blog published successfully!' : 'Draft saved successfully!',
      });

      setTimeout(() => {
        router.push(targetStatus === 'published' ? `/blogs/${data.id}` : '/blogs');
      }, 1200);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[var(--color-pink-light)]" />
            Blog Studio
          </h1>
          <p className="text-sm text-[#85858B] mt-1">
            Write, manage, and publish editorial articles, track notes, and creative commentaries.
          </p>
        </div>
      </div>

      {/* Primary Top Tabs: [ Write Article ] [ My Articles ] */}
      <div className="grid grid-cols-2 gap-3 mb-6 bg-[#333336] p-1.5 rounded-2xl border border-[#454549]">
        <button
          onClick={() => setActiveTab('write')}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer border"
          style={
            activeTab === 'write'
              ? {
                  background: 'var(--gradient-neon)',
                  color: '#ffffff',
                  borderColor: 'var(--color-pink)',
                  boxShadow: 'var(--glow-purple)',
                }
              : {
                  background: 'var(--glass-surface)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--glass-border)',
                }
          }
        >
          <PenTool className="w-4 h-4" />
          <span>Write Article</span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer border"
          style={
            activeTab === 'articles'
              ? {
                  background: 'var(--gradient-neon)',
                  color: '#ffffff',
                  borderColor: 'var(--color-pink)',
                  boxShadow: 'var(--glow-purple)',
                }
              : {
                  background: 'var(--glass-surface)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--glass-border)',
                }
          }
        >
          <BookOpen className="w-4 h-4" />
          <span>{isAdmin ? 'All Articles' : 'My Articles'}</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 text-sm ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
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
      {/* WRITE ARTICLE VIEW                                   */}
      {/* ==================================================== */}
      {activeTab === 'write' && (
        <div className="theme-form-card p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
            Blog Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Behind the Scenes: The Making of Neon Horizon"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-white placeholder-[var(--text-muted)] text-base font-semibold rounded-xl px-4 py-3 border focus:outline-none transition-all"
            style={{
              background: 'var(--glass-surface-heavy)',
              borderColor: 'var(--glass-border)',
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-white text-sm rounded-xl px-4 py-3 border focus:outline-none transition-all cursor-pointer"
              style={{
                background: 'var(--glass-surface-heavy)',
                borderColor: 'var(--glass-border)',
              }}
            >
              <option value="Entertainment" className="bg-[#100020] text-white">Entertainment</option>
              <option value="Music" className="bg-[#100020] text-white">Music</option>
              <option value="Technology" className="bg-[#100020] text-white">Technology</option>
              <option value="Culture" className="bg-[#100020] text-white">Culture</option>
              <option value="Film Review" className="bg-[#100020] text-white">Film Review</option>
              <option value="Tutorial" className="bg-[#100020] text-white">Tutorial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Production, Audio, Directing"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full text-white placeholder-[var(--text-muted)] text-sm rounded-xl px-4 py-3 border focus:outline-none transition-all"
              style={{
                background: 'var(--glass-surface-heavy)',
                borderColor: 'var(--glass-border)',
              }}
            />
          </div>
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
            Cover Image (JPG, PNG max 5MB)
          </label>
          {coverUrl ? (
            <div
              className="relative h-44 w-full rounded-2xl overflow-hidden border"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <Image src={coverUrl} alt="Cover preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setCoverUrl('')}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              className="block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all"
              style={{
                background: 'var(--glass-surface-heavy)',
                borderColor: 'var(--neon-purple-border)',
              }}
            >
              <Upload className="w-6 h-6 text-[var(--color-pink-light)] mx-auto mb-2" />
              <span className="text-xs text-white font-medium block">
                {coverUploading ? 'Uploading cover...' : 'Upload Cover Image'}
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
          <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1.5">
            Blog Content (Markdown supported) *
          </label>
          <textarea
            rows={12}
            required
            placeholder="Write your story here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full text-white placeholder-[var(--text-muted)] text-sm rounded-xl p-4 border focus:outline-none font-sans leading-relaxed transition-all"
            style={{
              background: 'var(--glass-surface-heavy)',
              borderColor: 'var(--glass-border)',
            }}
          />
        </div>

        {/* Publish / Draft Action Buttons */}
        <div
          className="flex items-center justify-end gap-3 pt-4 border-t"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveBlog('draft')}
            className="px-5 py-3 rounded-xl text-white text-xs font-semibold transition-all disabled:opacity-50 border cursor-pointer"
            style={{
              background: 'var(--glass-surface)',
              borderColor: 'var(--glass-border)',
            }}
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveBlog('published')}
            className="px-6 py-3 rounded-xl text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            style={{
              background: 'var(--gradient-neon)',
              boxShadow: 'var(--glow-purple)',
            }}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Blog'}
          </button>
        </div>
      </div>
    )}

      {/* ==================================================== */}
      {/* MANAGE ARTICLES VIEW                                 */}
      {/* ==================================================== */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
              {isAdmin ? 'All Articles Across Platform' : 'Your Published & Draft Articles'} ({articles.length})
            </h3>
            {isAdmin && (
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-bold border"
                style={{
                  background: 'var(--neon-purple-glow)',
                  borderColor: 'var(--neon-purple-border)',
                  color: 'var(--color-pink-light)',
                }}
              >
                Admin Mode
              </span>
            )}
          </div>

          {loadingArticles ? (
            <div className="p-12 text-center text-[var(--text-muted)] flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-pink-light)]" />
              <p className="text-xs">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center text-[var(--text-muted)] space-y-3 border backdrop-blur-md"
              style={{
                background: 'var(--glass-surface)',
                borderColor: 'var(--glass-border)',
              }}
            >
              <BookOpen className="w-10 h-10 mx-auto opacity-50" />
              <p className="text-sm font-semibold text-white">No articles found</p>
              <p className="text-xs max-w-sm mx-auto text-[var(--text-secondary)]">
                You haven't published any articles yet. Switch to the Write Article tab to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-4 rounded-2xl flex items-center justify-between gap-4 border transition-all backdrop-blur-md"
                  style={{
                    background: 'var(--glass-surface)',
                    borderColor: 'var(--glass-border)',
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border"
                      style={{
                        background: 'var(--glass-surface-heavy)',
                        borderColor: 'var(--glass-border)',
                      }}
                    >
                      {art.cover_url ? (
                        <Image src={art.cover_url} alt={art.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-[var(--text-muted)]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{art.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-0.5">
                        <span className="capitalize">{art.status || 'published'}</span>
                        <span>•</span>
                        <span>{new Date(art.created_at).toLocaleDateString()}</span>
                        {isAdmin && art.author && (
                          <>
                            <span>•</span>
                            <span className="text-[var(--color-pink-light)] truncate">
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
                      className="p-2 rounded-xl border text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
                      title="Read article"
                      style={{
                        background: 'var(--glass-surface-heavy)',
                        borderColor: 'var(--glass-border)',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border backdrop-blur-xl"
            style={{
              background: 'var(--glass-surface-heavy)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Article</h3>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
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
                className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
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
