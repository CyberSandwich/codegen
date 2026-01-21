/**
 * Toast notification component with optional copy action and multi-link support
 */

import { useEffect, useState, useCallback } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
  copyData?: string;
  links?: string[];
}

export function Toast({ message, type = 'info', duration = 6000, onClose, copyData, links }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  // Auto-expand links panel if there are multiple links (initialize based on props)
  const hasLinks = links && links.length > 0;

  useEffect(() => {
    // Longer duration when links are present
    const effectiveDuration = hasLinks ? 15000 : duration;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 150);
    }, effectiveDuration);

    return () => clearTimeout(timer);
  }, [duration, onClose, hasLinks]);

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
    if (links) {
      navigator.clipboard.writeText(links.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [links]);

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
      } ${hasLinks ? 'sm:w-[400px]' : ''}`}
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

        {/* Copy All button (with links) */}
        {hasLinks && (
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

      {/* Links list */}
      {hasLinks && (
        <div className="px-4 pb-3 max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-bg-tertiary)]"
              >
                <span className="flex-1 text-xs font-mono text-[var(--color-text-secondary)] truncate">
                  {link}
                </span>
                <button
                  onClick={() => handleCopyLink(link, index)}
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
