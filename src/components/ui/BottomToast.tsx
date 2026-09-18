'use client';

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  type: 'error' | 'success' | 'info';
  text: string;
}

interface BottomToastProps {
  message: ToastMessage | null;
  onClose: () => void;
  autoCloseDurationMs?: number; // 0 or undefined to disable auto-close
}

export function BottomToast({
  message,
  onClose,
  autoCloseDurationMs = 6000,
}: BottomToastProps) {
  useEffect(() => {
    if (!message || autoCloseDurationMs <= 0) return;

    // For errors, let user see it longer (10s) or manually dismiss
    const duration = message.type === 'error' ? Math.max(autoCloseDurationMs, 8000) : autoCloseDurationMs;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, onClose, autoCloseDurationMs]);

  if (!message) return null;

  const isError = message.type === 'error';
  const isSuccess = message.type === 'success';

  return (
    <div
      className="fixed bottom-6 inset-x-0 mx-auto max-w-xl z-50 px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-200"
      role="alert"
    >
      <div
        className={`pointer-events-auto rounded-2xl p-4 flex items-center justify-between gap-3.5 backdrop-blur-xl shadow-2xl transition-all ${
          isError
            ? 'bg-[#1a0510]/95 border border-[#EF4444] text-[#FCA5A5] shadow-[0_0_30px_rgba(239,68,68,0.45)]'
            : isSuccess
            ? 'bg-[#051a10]/95 border border-[#10B981] text-[#6EE7B7] shadow-[0_0_30px_rgba(16,185,129,0.45)]'
            : 'bg-[#140526]/95 border border-[var(--color-magenta)] text-white shadow-[0_0_30px_rgba(224,0,255,0.45)]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              isError
                ? 'bg-[#EF4444]/20 text-[#EF4444]'
                : isSuccess
                ? 'bg-[#10B981]/20 text-[#10B981]'
                : 'bg-[var(--color-magenta)]/20 text-[var(--color-pink)]'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-5 h-5" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">
              {isError ? 'Error Notification' : isSuccess ? 'Success' : 'Notification'}
            </p>
            <p className="text-sm font-medium text-white break-words mt-0.5 leading-snug">
              {message.text}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
