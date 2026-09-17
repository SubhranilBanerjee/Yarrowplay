'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { uploadMedia } from '@/lib/upload';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Megaphone,
  Plus,
  Upload,
  CheckCircle,
  AlertCircle,
  MousePointerClick,
  Eye,
  TrendingUp,
  X,
  ExternalLink,
} from 'lucide-react';

interface CampaignItem {
  id: string;
  title: string;
  headline: string;
  description: string;
  media_type: 'image' | 'video';
  media_url: string;
  target_url: string;
  cta_label: string;
  status: 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function AdvertiserStudioPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('https://');
  const [ctaLabel, setCtaLabel] = useState('Learn More');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPublicId, setMediaPublicId] = useState('');
  const [mediaUploading, setMediaUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCampaigns = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('advertiser_campaigns')
        .select('*')
        .eq('advertiser_id', user.id)
        .order('created_at', { ascending: false });

      setCampaigns((data as CampaignItem[]) || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaUploading(true);
    try {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setMediaType(type);
      const res = await uploadMedia(file, type, 'yarrowplay/advertiser');
      setMediaUrl(res.secure_url);
      setMediaPublicId(res.public_id);
    } catch (err: any) {
      setFormMsg({ type: 'error', text: 'Creative upload failed: ' + err.message });
    } finally {
      setMediaUploading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !headline.trim() || !mediaUrl || !targetUrl.trim()) {
      setFormMsg({ type: 'error', text: 'Please fill in all required campaign fields.' });
      return;
    }

    setIsSubmitting(true);
    setFormMsg(null);

    try {
      const now = new Date();
      const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { error } = await supabase.from('advertiser_campaigns').insert({
        advertiser_id: user.id,
        title: title.trim(),
        headline: headline.trim(),
        description: description.trim() || null,
        media_type: mediaType,
        media_url: mediaUrl,
        media_public_id: mediaPublicId || null,
        target_url: targetUrl.trim(),
        cta_label: ctaLabel.trim() || 'Learn More',
        status: 'active',
        start_date: now.toISOString(),
        end_date: inThirtyDays.toISOString(),
      });

      if (error) throw error;

      setFormMsg({ type: 'success', text: 'Campaign launched successfully! It is now active on feeds.' });
      setTitle('');
      setHeadline('');
      setDescription('');
      setMediaUrl('');
      setMediaPublicId('');
      setShowCreateModal(false);
      await fetchCampaigns();
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to create campaign.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aggregated campaign stats
  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-[var(--color-pink-light)]" />
            Advertiser Studio
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Launch verified sponsored campaigns that display honestly across Yarrowplay feeds.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm transition-all shadow-md self-start sm:self-auto cursor-pointer"
          style={{
            background: 'var(--gradient-neon)',
            boxShadow: 'var(--glow-purple)',
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Campaign Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          className="rounded-2xl p-5 border backdrop-blur-md"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Total Impressions</span>
            <Eye className="w-4 h-4 text-[var(--color-pink-light)]" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalImpressions.toLocaleString()}</p>
          <span className="text-xs text-emerald-400 mt-1 block">Live Feed Placements</span>
        </div>

        <div
          className="rounded-2xl p-5 border backdrop-blur-md"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Verified Clicks</span>
            <MousePointerClick className="w-4 h-4 text-[var(--color-pink-light)]" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalClicks.toLocaleString()}</p>
          <span className="text-xs text-emerald-400 mt-1 block">Outbound Traffic</span>
        </div>

        <div
          className="rounded-2xl p-5 border backdrop-blur-md"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Average CTR</span>
            <TrendingUp className="w-4 h-4 text-[var(--color-pink-light)]" />
          </div>
          <p className="text-3xl font-extrabold text-white">{avgCtr}%</p>
          <span className="text-xs text-[var(--text-muted)] mt-1 block">Click-through conversion</span>
        </div>
      </div>

      {/* Campaigns Table or Empty State */}
      <div
        className="rounded-2xl p-6 border backdrop-blur-xl"
        style={{
          background: 'var(--glass-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <h2 className="text-base font-bold text-white mb-4">Active & Past Campaigns</h2>

        {campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaigns active"
            description="Create your first sponsored campaign to reach thousands of viewers on Yarrowplay."
            actionLabel="Create Campaign"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-secondary)]">
              <thead
                className="border-b text-[var(--text-muted)] uppercase"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                <tr>
                  <th className="py-3 px-4">Creative</th>
                  <th className="py-3 px-4">Title & Headline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Impressions</th>
                  <th className="py-3 px-4">Clicks</th>
                  <th className="py-3 px-4">CTR</th>
                  <th className="py-3 px-4 text-right">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                {campaigns.map((c) => {
                  const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00';
                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div
                          className="relative w-14 h-14 rounded-lg overflow-hidden border"
                          style={{
                            background: 'var(--glass-surface-heavy)',
                            borderColor: 'var(--glass-border)',
                          }}
                        >
                          <Image src={c.media_url} alt={c.title} fill className="object-cover" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-white truncate">{c.title}</p>
                        <p className="text-[var(--text-muted)] text-[11px] truncate">{c.headline}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium">{c.impressions}</td>
                      <td className="py-3.5 px-4 text-white font-medium">{c.clicks}</td>
                      <td className="py-3.5 px-4 font-semibold text-[var(--color-pink-light)]">{ctr}%</td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={c.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--color-pink-light)] hover:underline"
                        >
                          <span>Visit</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border backdrop-blur-xl"
            style={{
              background: 'var(--glass-surface-heavy)',
              borderColor: 'var(--glass-border-light)',
            }}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-white rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[var(--color-pink-light)]" />
                Create Advertiser Campaign
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Your campaign will appear honestly marked as <span className="text-[var(--color-pink-light)] font-semibold">Sponsored</span> in the feed.
              </p>
            </div>

            {formMsg && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/15 border-red-500/30 text-red-400'
                }`}
              >
                {formMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{formMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Headphone Launch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-white text-xs rounded-xl px-4 py-3 border focus:outline-none transition-colors"
                  style={{
                    background: 'var(--glass-surface)',
                    borderColor: 'var(--glass-border)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1">
                  Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Experience Pure Lossless Sound"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full text-white text-xs rounded-xl px-4 py-3 border focus:outline-none transition-colors"
                  style={{
                    background: 'var(--glass-surface)',
                    borderColor: 'var(--glass-border)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief promotional copy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-white text-xs rounded-xl p-3 border focus:outline-none transition-colors resize-none"
                  style={{
                    background: 'var(--glass-surface)',
                    borderColor: 'var(--glass-border)',
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1">
                    Target URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourbrand.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full text-white text-xs rounded-xl px-4 py-3 border focus:outline-none transition-colors"
                    style={{
                      background: 'var(--glass-surface)',
                      borderColor: 'var(--glass-border)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1">
                    Button CTA *
                  </label>
                  <select
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    className="w-full text-white text-xs rounded-xl px-4 py-3 border focus:outline-none transition-colors cursor-pointer"
                    style={{
                      background: 'var(--glass-surface)',
                      borderColor: 'var(--glass-border)',
                    }}
                  >
                    <option value="Learn More" className="bg-[#100020] text-white">Learn More</option>
                    <option value="Shop Now" className="bg-[#100020] text-white">Shop Now</option>
                    <option value="Visit Website" className="bg-[#100020] text-white">Visit Website</option>
                    <option value="Get Started" className="bg-[#100020] text-white">Get Started</option>
                    <option value="Download" className="bg-[#100020] text-white">Download</option>
                  </select>
                </div>
              </div>

              {/* Creative Upload */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-1">
                  Creative Image / Poster *
                </label>
                {mediaUrl ? (
                  <div
                    className="relative h-28 rounded-xl overflow-hidden border"
                    style={{ borderColor: 'var(--glass-border)' }}
                  >
                    <Image src={mediaUrl} alt="Creative preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setMediaUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    className="block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors"
                    style={{
                      background: 'var(--glass-surface)',
                      borderColor: 'var(--neon-purple-border)',
                    }}
                  >
                    <Upload className="w-5 h-5 text-[var(--color-pink-light)] mx-auto mb-1" />
                    <span className="text-xs text-white block font-medium">
                      {mediaUploading ? 'Uploading Creative...' : 'Select Creative File'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      disabled={mediaUploading}
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-4 rounded-xl text-white text-sm font-semibold tracking-wide transition-all shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                style={{
                  background: 'var(--gradient-neon)',
                  boxShadow: 'var(--glow-purple)',
                }}
              >
                {isSubmitting ? 'Launching Campaign...' : 'Launch Sponsored Campaign'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
