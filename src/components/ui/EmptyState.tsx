import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl theme-glass-card-static max-w-lg mx-auto my-8 border border-[var(--glass-border)]">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-purple-bright)]/15 border border-[var(--color-purple-bright)]/30 flex items-center justify-center text-[var(--color-pink)] mb-4 shadow-[0_0_20px_rgba(224,0,255,0.25)]">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed font-normal">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="px-6 py-2.5 rounded-full theme-neon-button text-sm font-semibold transition-all shadow-md"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-full theme-neon-button text-sm font-semibold transition-all shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
