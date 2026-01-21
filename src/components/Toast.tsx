/**
 * Toast notification component with optional copy action and multi-item support
 * Supports displaying QR codes, barcodes, and links with individual copy buttons
 */

import { useEffect, useState, useCallback, useMemo } from 'react';

/** Found item from scanning or link extraction */
interface FoundItem {
  data: string;
  type: 'qr' | 'barcode' | 'link';
  label: string;
}

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
  copyData?: string;
  /** Legacy prop for backward compatibility */
  links?: string[];
  /** New unified items prop */
  items?: FoundItem[];
}

export function Toast({ message, type = 'info', duration = 6000, onClose, copyData, links, items }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Convert legacy links to items format for unified handling
  const displayItems = useMemo<FoundItem[]>(() => {
    return items ?? (links?.map(link => ({
      data: link,
      type: 'link' as const,
      label: 'Link',
    })) ?? []);
  }, [items, links]);

  const hasItems = displayItems.length > 0;

  useEffect(() => {
    // Longer duration when items are present
    const effectiveDuration = hasItems ? 15000 : duration;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 150);
    }, effectiveDuration);

    return () => clearTimeout(timer);
  }, [duration, onClose, hasItems]);

  const handleCopy = useCallback(() => {
    if (copyData) {
      navigator.clipboard.writeText(copyData);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [copyData]);

  const handleCopyLink = useCallback((link: string, index: number) => {
    navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  const handleCopyAll = useCallback(() => {
    if (displayItems.length > 0) {
      navigator.clipboard.writeText(displayItems.map(item => item.data).join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [displayItems]);

  const bgColor = {
    success: 'bg-[var(--color-bg-secondary)] border border-[var(--color-success)]/30',
    error: 'bg-[var(--color-bg-secondary)] border border-[var(--color-error)]/30',
    info: 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)]',
  }[type];

  const iconColor = {
    success: 'text-[var(--color-success)]',
    error: 'text-[var(--color-error)]',
    info: 'text-[var(--color-text-muted)]',
  }[type];

  return (
    <div
      className={`fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col rounded-2xl ${bgColor} shadow-xl backdrop-blur-lg ${
        isExiting ? 'toast-exit' : 'toast-enter'
      } ${hasItems ? 'sm:w-[400px]' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div className={iconColor}>
          {type === 'success' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : type === 'error' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Message */}
        <span className="flex-1 text-sm text-[var(--color-text-primary)] font-mono truncate">
          {message}
        </span>

        {/* Single copy button (no links) */}
        {copyData && !links && (
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              copied
                ? 'bg-[var(--color-success)] text-white'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}

        {/* Copy All button (with items) */}
        {hasItems && (
          <button
            onClick={handleCopyAll}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              copied
                ? 'bg-[var(--color-success)] text-white'
                : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'
            }`}
          >
            {copied ? 'Copied!' : 'Copy All'}
          </button>
        )}

        {/* Close */}
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onClose, 150);
          }}
          className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Items list (QR codes, barcodes, links) */}
      {hasItems && (
        <div className="px-4 pb-3 max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {displayItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-bg-tertiary)]"
              >
                {/* Type badge */}
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded shrink-0 ${
                  item.type === 'qr'
                    ? 'bg-purple-500/20 text-purple-400'
                    : item.type === 'barcode'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {item.label}
                </span>
                <span className="flex-1 text-xs font-mono text-[var(--color-text-secondary)] truncate">
                  {item.data}
                </span>
                <button
                  onClick={() => handleCopyLink(item.data, index)}
                  className={`px-2 py-1 rounded-lg text-xs transition-all shrink-0 ${
                    copiedIndex === index
                      ? 'bg-[var(--color-success)] text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {copiedIndex === index ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Toast;
