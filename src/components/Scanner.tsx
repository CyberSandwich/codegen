/**
 * Scanner Component
 *
 * Provides QR code/barcode scanning from images with:
 * - Drag and drop support
 * - Click to open file picker
 * - Clipboard paste (Ctrl/Cmd+V)
 * - Result display with copy functionality
 */

import { useRef, useCallback } from 'react';
import { useScanner } from '../hooks/useScanner';

export function Scanner() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    result,
    isScanning,
    error,
    isDragOver,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearResult,
  } = useScanner();

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCopy = useCallback(() => {
    if (result?.data) {
      navigator.clipboard.writeText(result.data);
    }
  }, [result]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full aspect-square max-w-sm rounded-xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 ${
          isDragOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)] bg-[var(--color-bg-secondary)]'
        }`}
      >
        {isScanning ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[var(--color-text-muted)]">Scanning...</span>
          </div>
        ) : (
          <>
            {/* Upload Icon */}
            <svg
              className="w-12 h-12 text-[var(--color-text-muted)]"
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

            <div className="text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Drop image or click
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Ctrl+V to paste
              </p>
            </div>
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

      {/* Result Display */}
      {(result || error) && (
        <div className="w-full">
          {error ? (
            <div className="p-4 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
              <p className="text-sm text-[var(--color-error)] text-center">{error}</p>
            </div>
          ) : result ? (
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                    {result.type === 'qr' ? 'QR Code' : 'Barcode'}
                  </p>
                  <p className="text-sm text-[var(--color-text-primary)] break-all font-mono">
                    {result.data}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    title="Copy"
                  >
                    <svg
                      className="w-4 h-4 text-[var(--color-text-secondary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>

                  {/* Clear Button */}
                  <button
                    onClick={clearResult}
                    className="p-2 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    title="Clear"
                  >
                    <svg
                      className="w-4 h-4 text-[var(--color-text-secondary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* If it's a URL, show open button */}
              {result.data.match(/^https?:\/\//i) && (
                <a
                  href={result.data}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
                >
                  Open Link
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
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
