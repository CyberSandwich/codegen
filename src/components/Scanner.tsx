/**
 * Scanner Component - Read QR codes from images
 */

import { useRef, useCallback, useEffect } from 'react';
import { useScanner } from '../hooks/useScanner';
import type { ScanResult } from '../types';

interface ScannerProps {
  externalResult?: ScanResult | null;
  onResultClear?: () => void;
}

export function Scanner({ externalResult, onResultClear }: ScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    result: internalResult,
    isScanning,
    error,
    isDragOver,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearResult: clearInternalResult,
  } = useScanner();

  // Use external result if provided, otherwise internal
  const result = externalResult ?? internalResult;

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCopy = useCallback(() => {
    if (result?.data) {
      navigator.clipboard.writeText(result.data);
    }
  }, [result]);

  const clearResult = useCallback(() => {
    clearInternalResult();
    onResultClear?.();
  }, [clearInternalResult, onResultClear]);

  // Clear external result when component unmounts
  useEffect(() => {
    return () => onResultClear?.();
  }, [onResultClear]);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full aspect-square max-w-sm rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
          isDragOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 scale-[1.02]'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)] bg-[var(--color-bg-secondary)]'
        }`}
      >
        {isScanning ? (
          <div className="w-10 h-10 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <svg
              className="w-14 h-14 text-[var(--color-text-muted)] opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <span className="text-sm text-[var(--color-text-muted)]">
              Drop, click, or paste
            </span>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Result */}
      {(result || error) && (
        <div className="w-full">
          {error ? (
            <div className="p-4 rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-center">
              <span className="text-sm text-[var(--color-error)]">{error}</span>
            </div>
          ) : result ? (
            <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <div className="flex items-start gap-3">
                <p className="flex-1 text-sm text-[var(--color-text-primary)] break-all font-mono leading-relaxed">
                  {result.data}
                </p>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={clearResult}
                    className="p-2.5 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {result.data.match(/^https?:\/\//i) && (
                <a
                  href={result.data}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open
                </a>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default Scanner;
