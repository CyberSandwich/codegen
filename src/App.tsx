/**
 * CodeGen - QR Code & Barcode Generator
 */

import { useState, useEffect, useCallback } from 'react';
import { QRGenerator } from './components/QRGenerator';
import { BarcodeGenerator } from './components/BarcodeGenerator';
import { Toast } from './components/Toast';
import { scanImageFile, isImageFile, getImageFromClipboard } from './utils/scanner';

type Mode = 'qr' | 'barcode';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  copyData?: string;
  links?: string[];
}

/**
 * Extract URLs from text
 */
function extractLinks(text: string): string[] {
  // Match URLs with common patterns
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const matches = text.match(urlPattern) || [];
  // Remove duplicates and clean up trailing punctuation
  return [...new Set(matches.map(url => url.replace(/[.,;:!?)]+$/, '')))];
}

function App() {
  const [mode, setMode] = useState<Mode>('qr');
  const [sharedData, setSharedData] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  // Process clipboard content (image or text with links)
  const processClipboardContent = useCallback(async () => {
    try {
      // Try to read clipboard
      const items = await navigator.clipboard.read();

      for (const item of items) {
        // Check for image
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType(item.types.find(t => t.startsWith('image/')) || 'image/png');
          const file = new File([blob], 'clipboard.png', { type: blob.type });

          try {
            const result = await scanImageFile(file);
            if (result) {
              const displayText = result.data.length > 50
                ? result.data.substring(0, 50) + '...'
                : result.data;
              setToast({
                message: displayText,
                type: 'success',
                copyData: result.data,
              });
            } else {
              setToast({ message: 'No code found in image', type: 'error' });
            }
          } catch {
            setToast({ message: 'Failed to scan image', type: 'error' });
          }
          return;
        }

        // Check for text
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const text = await blob.text();

          // Extract links from text
          const links = extractLinks(text);

          if (links.length > 1) {
            // Multiple links found - show in toast with copy all option
            setToast({
              message: `${links.length} links found`,
              type: 'success',
              links: links,
            });
          } else if (links.length === 1) {
            // Single link - show with copy option
            setToast({
              message: links[0].length > 50 ? links[0].substring(0, 47) + '...' : links[0],
              type: 'success',
              copyData: links[0],
            });
          } else {
            // No links but has text - use the text directly
            if (text.trim()) {
              setSharedData(text.trim());
              setToast({ message: 'Text pasted', type: 'success' });
            } else {
              setToast({ message: 'Clipboard empty', type: 'info' });
            }
          }
          return;
        }
      }

      setToast({ message: 'Nothing to paste', type: 'info' });
    } catch {
      // Fallback for browsers that don't support clipboard.read()
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          const links = extractLinks(text);

          if (links.length > 1) {
            setToast({
              message: `${links.length} links found`,
              type: 'success',
              links: links,
            });
          } else if (links.length === 1) {
            setToast({
              message: links[0].length > 50 ? links[0].substring(0, 47) + '...' : links[0],
              type: 'success',
              copyData: links[0],
            });
          } else {
            setSharedData(text.trim());
            setToast({ message: 'Text pasted', type: 'success' });
          }
        } else {
          setToast({ message: 'Clipboard empty', type: 'info' });
        }
      } catch {
        setToast({ message: 'Clipboard access denied', type: 'error' });
      }
    }
  }, []);

  // Global paste handler
  const handleGlobalPaste = useCallback(async (e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const imageFile = getImageFromClipboard(clipboardData);
    if (imageFile && isImageFile(imageFile)) {
      e.preventDefault();
      try {
        const result = await scanImageFile(imageFile);
        if (result) {
          const displayText = result.data.length > 50
            ? result.data.substring(0, 50) + '...'
            : result.data;
          setToast({
            message: displayText,
            type: 'success',
            copyData: result.data,
          });
        } else {
          setToast({ message: 'No code found', type: 'error' });
        }
      } catch {
        setToast({ message: 'Scan failed', type: 'error' });
      }
      return;
    }

    // Check for text with links
    const text = clipboardData.getData('text/plain');
    if (text) {
      const links = extractLinks(text);
      if (links.length > 0) {
        e.preventDefault();
        if (links.length > 1) {
          setToast({
            message: `${links.length} links found`,
            type: 'success',
            links: links,
          });
        } else {
          setToast({
            message: links[0].length > 50 ? links[0].substring(0, 47) + '...' : links[0],
            type: 'success',
            copyData: links[0],
          });
        }
      }
    }
  }, []);

  // Global drag-and-drop handler
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dataTransfer = e.dataTransfer;
    if (!dataTransfer) return;

    // Check for dropped files
    if (dataTransfer.files && dataTransfer.files.length > 0) {
      const file = dataTransfer.files[0];
      if (isImageFile(file)) {
        // Scan image for QR/barcode
        try {
          const result = await scanImageFile(file);
          if (result) {
            const displayText = result.data.length > 50
              ? result.data.substring(0, 50) + '...'
              : result.data;
            setToast({
              message: displayText,
              type: 'success',
              copyData: result.data,
            });
          } else {
            setToast({ message: 'No code found in image', type: 'error' });
          }
        } catch {
          setToast({ message: 'Failed to scan image', type: 'error' });
        }
        return;
      } else {
        // Invalid file type
        const fileName = file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name;
        setToast({ message: `${fileName} is not a valid image`, type: 'error' });
        return;
      }
    }

    // Check for dropped text
    const text = dataTransfer.getData('text/plain');
    if (text) {
      setSharedData(text);
      setToast({ message: 'Text added', type: 'success' });
    }
  }, []);

  useEffect(() => {
    document.addEventListener('paste', handleGlobalPaste);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleGlobalPaste, handleDragOver, handleDrop]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Paste Button - Top Right for touchscreens */}
      <button
        onClick={processClipboardContent}
        className="fixed top-4 right-4 z-40 p-3 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-all shadow-lg"
        title="Paste image or text"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </button>

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8">
        {/* Mode Toggle */}
        <div className="flex justify-center pb-4 sm:pb-6">
          <div className="inline-flex p-1 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <button
              onClick={() => setMode('qr')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                mode === 'qr'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              QR
            </button>
            <button
              onClick={() => setMode('barcode')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                mode === 'barcode'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              Barcode
            </button>
          </div>
        </div>

        {/* Generator */}
        <div className="flex-1 flex flex-col">
          {mode === 'qr' ? (
            <QRGenerator data={sharedData} onDataChange={setSharedData} />
          ) : (
            <BarcodeGenerator data={sharedData} onDataChange={setSharedData} />
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          copyData={toast.copyData}
          links={toast.links}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
