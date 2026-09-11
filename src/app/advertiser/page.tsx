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
            <Megaphone className="w-7 h-7 text-[#FF0080]" />
            Advertiser Studio
          </h1>
          <p className="text-sm text-[#85858B] mt-1">
            Launch verified sponsored campaigns that display honestly across Yarrowplay feeds.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-semibold text-sm transition-all shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Campaign Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#333336] border border-[#454549] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#85858B] mb-2">
            <span className="text-xs uppercase font-semibold">Total Impressions</span>
            <Eye className="w-4 h-4 text-[#FF0080]" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalImpressions.toLocaleString()}</p>
          <span className="text-xs text-[#22C55E] mt-1 block">Live Feed Placements</span>
        </div>

        <div className="bg-[#333336] border border-[#454549] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#85858B] mb-2">
            <span className="text-xs uppercase font-semibold">Verified Clicks</span>
            <MousePointerClick className="w-4 h-4 text-[#FF0080]" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalClicks.toLocaleString()}</p>
          <span className="text-xs text-[#22C55E] mt-1 block">Outbound Traffic</span>
        </div>

        <div className="bg-[#333336] border border-[#454549] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#85858B] mb-2">
            <span className="text-xs uppercase font-semibold">Average CTR</span>
            <TrendingUp className="w-4 h-4 text-[#FF0080]" />
          </div>
          <p className="text-3xl font-extrabold text-white">{avgCtr}%</p>
          <span className="text-xs text-[#85858B] mt-1 block">Click-through conversion</span>
        </div>
      </div>

      {/* Campaigns Table or Empty State */}
      <div className="bg-[#333336] border border-[#454549] rounded-2xl p-6">
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
            <table className="w-full text-left text-xs text-[#B8B8BD]">
              <thead className="border-b border-[#454549] text-[#85858B] uppercase">
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
              <tbody className="divide-y divide-[#454549]">
                {campaigns.map((c) => {
                  const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00';
                  return (
                    <tr key={c.id} className="hover:bg-[#3A3A3E]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#454549] bg-[#2B2B2D]">
                          <Image src={c.media_url} alt={c.title} fill className="object-cover" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-white truncate">{c.title}</p>
                        <p className="text-[#85858B] text-[11px] truncate">{c.headline}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium">{c.impressions}</td>
                      <td className="py-3.5 px-4 text-white font-medium">{c.clicks}</td>
                      <td className="py-3.5 px-4 text-[#FF0080] font-semibold">{ctr}%</td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={c.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#FF0080] hover:underline"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#2B2B2D] border border-[#454549] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-[#85858B] hover:text-white rounded-full hover:bg-[#333336]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#FF0080]" />
                Create Advertiser Campaign
              </h2>
              <p className="text-xs text-[#85858B] mt-1">
                Your campaign will appear honestly marked as <span className="text-[#FF0080] font-semibold">Sponsored</span> in the feed.
              </p>
            </div>

            {formMsg && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  formMsg.type === 'success'
                    ? 'bg-[#22C55E]/15 border-[#22C55E]/30 text-[#22C55E]'
                    : 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]'
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
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Headphone Launch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#333336] text-white text-xs rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1">
                  Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Experience Pure Lossless Sound"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-[#333336] text-white text-xs rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief promotional copy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#333336] text-white text-xs rounded-xl p-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1">
                    Target URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourbrand.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full bg-[#333336] text-white text-xs rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1">
                    Button CTA *
                  </label>
                  <select
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    className="w-full bg-[#333336] text-white text-xs rounded-xl px-4 py-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                  >
                    <option value="Learn More">Learn More</option>
                    <option value="Shop Now">Shop Now</option>
                    <option value="Visit Website">Visit Website</option>
                    <option value="Get Started">Get Started</option>
                    <option value="Download">Download</option>
                  </select>
                </div>
              </div>

              {/* Creative Upload */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#B8B8BD] mb-1">
                  Creative Image / Poster *
                </label>
                {mediaUrl ? (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-[#454549]">
                    <Image src={mediaUrl} alt="Creative preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setMediaUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:text-[#EF4444]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-[#454549] hover:border-[#FF0080] rounded-xl p-5 text-center cursor-pointer bg-[#333336]/40 transition-colors">
                    <Upload className="w-5 h-5 text-[#FF0080] mx-auto mb-1" />
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
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white text-sm font-semibold tracking-wide transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
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
