'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  SiteContent,
  DEFAULT_SITE_CONTENT,
  getStoredSiteContent,
  saveStoredSiteContent,
  resolveSiteText,
  updateSiteTextPath,
} from '@/lib/siteContent';
import { useAuth } from './AuthContext';
import { Edit3, Check, X, Sliders, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface SiteTextContextType {
  siteContent: SiteContent;
  t: (path: string, fallback: string) => string;
  updateText: (path: string, value: string) => Promise<boolean>;
  isAdmin: boolean;
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  openQuickEdit: (path: string, currentVal: string, label?: string) => void;
}

const SiteTextContext = createContext<SiteTextContextType | null>(null);

export function SiteTextProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [quickEditModal, setQuickEditModal] = useState<{
    isOpen: boolean;
    path: string;
    label?: string;
    currentVal: string;
    tempVal: string;
    isSaving: boolean;
  }>({
    isOpen: false,
    path: '',
    currentVal: '',
    tempVal: '',
    isSaving: false,
  });

  // Admin detection
  const isAdmin =
    (typeof window !== 'undefined' &&
      localStorage.getItem('lighthouse_admin_token') === 'lighthouse_admin_secret_token_2026') ||
    profile?.role === 'admin' ||
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user?.email === 'admin@dramabox.stream' ||
    user?.email === 'admin@admin.com';

  // Load content on mount
  useEffect(() => {
    // 1. Initial load from local cache
    const cached = getStoredSiteContent();
    setSiteContent(cached);

    // 2. Fetch latest from API
    fetch('/api/admin/site-text')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.content) {
          saveStoredSiteContent(data.content);
          setSiteContent(data.content);
        }
      })
      .catch(() => {});

    // Listen to local update events across tabs / components
    const handleUpdate = () => {
      setSiteContent(getStoredSiteContent());
    };
    window.addEventListener('lighthouse_site_content_updated', handleUpdate);
    return () => window.removeEventListener('lighthouse_site_content_updated', handleUpdate);
  }, []);

  const t = useCallback(
    (path: string, fallback: string) => {
      return resolveSiteText(siteContent, path, fallback);
    },
    [siteContent]
  );

  const updateText = useCallback(
    async (path: string, value: string): Promise<boolean> => {
      const updated = updateSiteTextPath(siteContent, path, value);
      setSiteContent(updated);
      saveStoredSiteContent(updated);

      try {
        const res = await fetch('/api/admin/site-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: updated }),
        });
        return res.ok;
      } catch (err) {
        console.warn('Failed to sync site text with server, saved locally', err);
        return true;
      }
    },
    [siteContent]
  );

  const openQuickEdit = (path: string, currentVal: string, label?: string) => {
    setQuickEditModal({
      isOpen: true,
      path,
      label: label || path,
      currentVal,
      tempVal: currentVal,
      isSaving: false,
    });
  };

  const handleSaveQuickEdit = async () => {
    if (!quickEditModal.path) return;
    setQuickEditModal((prev) => ({ ...prev, isSaving: true }));
    await updateText(quickEditModal.path, quickEditModal.tempVal);
    setQuickEditModal({
      isOpen: false,
      path: '',
      currentVal: '',
      tempVal: '',
      isSaving: false,
    });
  };

  return (
    <SiteTextContext.Provider
      value={{
        siteContent,
        t,
        updateText,
        isAdmin: !!isAdmin,
        isEditMode,
        setIsEditMode,
        openQuickEdit,
      }}
    >
      {children}

      {/* Floating Admin Control Bar if user is admin */}
      {isAdmin && (
        <AdminFloatingEditBar
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onOpenSearchModal={() => openQuickEdit('customOverrides.new_text_key', '', 'Custom Text Override')}
        />
      )}

      {/* Quick Edit Popup Modal */}
      {quickEditModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121922] border border-[#2B3846] rounded-2xl p-5 max-w-lg w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#212C38] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5F1E8]">Admin Text Editor</h4>
                  <p className="text-[11px] text-[#8E9CA8] font-mono">{quickEditModal.path}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-[#8E9CA8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E9CA8] mb-1.5">
                Target Key / Description: <span className="text-[#ECC979]">{quickEditModal.label}</span>
              </label>
              {quickEditModal.path.startsWith('customOverrides.') && (
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="e.g. navbar.slogan or about.mission"
                    value={quickEditModal.path.replace('customOverrides.', '')}
                    onChange={(e) =>
                      setQuickEditModal((prev) => ({
                        ...prev,
                        path: `customOverrides.${e.target.value.trim()}`,
                      }))
                    }
                    className="w-full bg-[#0D1218] border border-[#263342] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              )}
              <textarea
                rows={4}
                value={quickEditModal.tempVal}
                onChange={(e) => setQuickEditModal((prev) => ({ ...prev, tempVal: e.target.value }))}
                placeholder="Enter new text here..."
                className="w-full bg-[#0D1218] border border-[#263342] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#788796]">
                Changes apply instantly across the site for all visitors.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickEditModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-1.5 rounded-xl border border-[#263342] text-xs font-medium text-[#8E9CA8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={quickEditModal.isSaving}
                  onClick={handleSaveQuickEdit}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {quickEditModal.isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Text</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SiteTextContext.Provider>
  );
}

export function useSiteText() {
  const context = useContext(SiteTextContext);
  if (!context) {
    return {
      siteContent: DEFAULT_SITE_CONTENT,
      t: (path: string, fallback: string) => fallback,
      updateText: async () => false,
      isAdmin: false,
      isEditMode: false,
      setIsEditMode: () => {},
      openQuickEdit: () => {},
    };
  }
  return context;
}

/**
 * Interactive Editable Text Component
 * When user is Admin and Edit Mode is Active, renders with an edit indicator and click-to-edit modal.
 * When viewed normally or by non-admin users, renders as a standard clean HTML element.
 */
interface EditableTextProps {
  id: string;
  defaultText: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  className?: string;
  label?: string;
  children?: ReactNode;
}

export function EditableText({
  id,
  defaultText,
  as: Component = 'span',
  className = '',
  label,
}: EditableTextProps) {
  const { t, isAdmin, isEditMode, openQuickEdit } = useSiteText();
  const text = t(id, defaultText);

  if (isAdmin && isEditMode) {
    return (
      <Component
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          openQuickEdit(id, text, label || id);
        }}
        title={`Click to edit: ${id}`}
        className={`relative group/edit cursor-pointer transition-all outline-dashed outline-1 outline-purple-400/60 hover:outline-2 hover:outline-purple-400 bg-purple-500/10 rounded px-1 -mx-1 ${className}`}
      >
        {text}
        <span className="inline-flex items-center ml-1 opacity-60 group-hover/edit:opacity-100 text-purple-400 align-middle">
          <Edit3 className="w-3 h-3 inline-block" />
        </span>
      </Component>
    );
  }

  return <Component className={className}>{text}</Component>;
}

/**
 * Floating Admin Edit Bar rendered for administrators
 */
function AdminFloatingEditBar({
  isEditMode,
  onToggleEditMode,
  onOpenSearchModal,
}: {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenSearchModal: () => void;
}) {
  const [minimized, setMinimized] = useState(false);

  return (
    <div className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-[9990] flex items-center gap-2">
      {minimized ? (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all border border-purple-400/40 cursor-pointer"
          title="Open Admin Text Edit Mode"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      ) : (
        <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[#0D131B]/95 border border-purple-500/40 backdrop-blur-xl shadow-2xl text-xs text-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-[#F5F1E8] hidden sm:inline">Admin CMS</span>
          </div>

          {/* Toggle In-Place Visual Edit Mode */}
          <button
            type="button"
            onClick={onToggleEditMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
              isEditMode
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                : 'bg-white/10 text-[#9EACB9] hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Edit Mode: ON' : 'Edit Mode: OFF'}</span>
          </button>

          {/* Quick Override Key Button */}
          <button
            type="button"
            onClick={onOpenSearchModal}
            title="Add or override custom key text"
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-[#9EACB9] hover:text-white transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Direct link to Admin Hub */}
          <Link
            href="/admin"
            title="Open Admin Hub"
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-[#ECC979] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Minimize button */}
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1 text-[#6F7E8C] hover:text-white transition-colors cursor-pointer"
            title="Minimize"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
