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
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl theme-glass-card-static max-w-lg mx-auto my-8 border border-[var(--lr-border-primary)] bg-[var(--lr-bg-surface)] shadow-md">
      <div className="w-16 h-16 rounded-2xl bg-[var(--lr-gold)]/15 border border-[var(--lr-gold)]/30 flex items-center justify-center text-[var(--lr-gold)] mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-[var(--lr-text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--lr-text-secondary)] max-w-sm mb-6 leading-relaxed font-normal">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="px-6 py-2.5 rounded-full btn-primary text-sm font-semibold transition-all shadow-md cursor-pointer"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-full btn-primary text-sm font-semibold transition-all shadow-md cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
