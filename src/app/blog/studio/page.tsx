'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { uploadMedia } from '@/lib/upload';
import { BookOpen, Upload, CheckCircle, AlertCircle, X, Eye } from 'lucide-react';

export default function BlogStudioPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#FF0080]" />
            Blog Studio
          </h1>
          <p className="text-sm text-[#85858B] mt-1">
            Write and publish editorial articles, track notes, and creative commentaries.
          </p>
        </div>
      </div>

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

      <div className="bg-[#333336] border border-[#454549] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
            Blog Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Behind the Scenes: The Making of Neon Horizon"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-base font-semibold rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#2B2B2D] text-white text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
            >
              <option value="Entertainment">Entertainment</option>
              <option value="Music">Music</option>
              <option value="Technology">Technology</option>
              <option value="Culture">Culture</option>
              <option value="Film Review">Film Review</option>
              <option value="Tutorial">Tutorial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Production, Audio, Directing"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
            />
          </div>
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
            Cover Image (JPG, PNG max 5MB)
          </label>
          {coverUrl ? (
            <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-[#454549]">
              <Image src={coverUrl} alt="Cover preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setCoverUrl('')}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:text-[#EF4444]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-[#454549] hover:border-[#FF0080] rounded-2xl p-6 text-center cursor-pointer bg-[#2B2B2D]/50 transition-colors">
              <Upload className="w-6 h-6 text-[#FF0080] mx-auto mb-2" />
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
          <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1.5">
            Blog Content (Markdown supported) *
          </label>
          <textarea
            rows={12}
            required
            placeholder="Write your story here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-[#2B2B2D] text-white placeholder-[#85858B] text-sm rounded-xl p-4 border border-[#454549] focus:outline-none focus:border-[#FF0080] font-sans leading-relaxed"
          />
        </div>

        {/* Publish / Draft Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#454549]">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveBlog('draft')}
            className="px-5 py-3 rounded-xl bg-[#3A3A3E] hover:bg-[#404045] text-white text-xs font-semibold transition-all disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveBlog('published')}
            className="px-6 py-3 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Blog'}
          </button>
        </div>
      </div>
    </div>
  );
}
