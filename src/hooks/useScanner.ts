/**
 * Scanner hook for reading QR codes from images
 *
 * Provides drag-drop, file picker, and clipboard paste functionality
 * for scanning QR codes from user-provided images.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ScanResult } from '../types';
import {
  scanImageFile,
  isImageFile,
  getImageFromClipboard,
  dataUrlToImageData,
  scanImageData,
} from '../utils/scanner';

interface UseScannerReturn {
  /** Current scan result */
  result: ScanResult | null;
  /** Whether currently scanning */
  isScanning: boolean;
  /** Error message if scan failed */
  error: string | null;
  /** Whether drag is currently over drop zone */
  isDragOver: boolean;
  /** Handle file input change */
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handle drag over event */
  handleDragOver: (e: React.DragEvent) => void;
  /** Handle drag leave event */
  handleDragLeave: (e: React.DragEvent) => void;
  /** Handle drop event */
  handleDrop: (e: React.DragEvent) => void;
  /** Clear current result */
  clearResult: () => void;
  /** Ref for the drop zone element */
  dropZoneRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for scanning QR codes from images
 *
 * Supports:
 * - Drag and drop image files
 * - File picker selection
 * - Clipboard paste (Ctrl/Cmd+V)
 *
 * @example
 * const { result, handleDrop, isDragOver } = useScanner();
 */
export function useScanner(): UseScannerReturn {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Process a file and scan for QR codes
  const processFile = useCallback(async (file: File) => {
    if (!isImageFile(file)) {
      setError('Please provide an image file (PNG, JPG, GIF, WebP)');
      return;
    }

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      const scanResult = await scanImageFile(file);

      if (scanResult) {
        setResult(scanResult);
      } else {
        setError('No QR code found in image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan image');
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [processFile]
  );

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  // Handle paste from clipboard
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Check for image in clipboard
      const imageFile = getImageFromClipboard(clipboardData);
      if (imageFile) {
        e.preventDefault();
        processFile(imageFile);
        return;
      }

      // Check for image data URL in clipboard
      const items = clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 'text/plain') {
          const text = clipboardData.getData('text/plain');
          if (text.startsWith('data:image/')) {
            e.preventDefault();
            setIsScanning(true);
            setError(null);
            try {
              const imageData = await dataUrlToImageData(text);
              const scanResult = scanImageData(imageData);
              if (scanResult) {
                setResult(scanResult);
              } else {
                setError('No QR code found in image');
              }
            } catch {
              setError('Failed to process pasted image');
            } finally {
              setIsScanning(false);
            }
            return;
          }
        }
      }
    },
    [processFile]
  );

  // Set up paste listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  // Clear result
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isScanning,
    error,
    isDragOver,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearResult,
    dropZoneRef,
  };
}

export default useScanner;
