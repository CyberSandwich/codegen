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
}

function App() {
  const [mode, setMode] = useState<Mode>('qr');
  const [sharedData, setSharedData] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  // Global paste handler
  const handleGlobalPaste = useCallback(async (e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const imageFile = getImageFromClipboard(clipboardData);
    if (!imageFile || !isImageFile(imageFile)) return;

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
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
