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
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-[#333336] border border-[#454549] max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-[#3A3A3E] border border-[#454549] flex items-center justify-center text-[#FF0080] mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#85858B] max-w-sm mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="px-5 py-2.5 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white text-sm font-semibold transition-all shadow-md"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white text-sm font-semibold transition-all shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
