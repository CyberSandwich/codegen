/**
 * Scanner utilities for reading QR codes and barcodes from images
 * Supports scanning multiple codes from a single image
 */

import jsQR from 'jsqr';
import Quagga from '@ericblade/quagga2';
import type { ScanResult } from '../types';

/**
 * Scans an image file for QR codes or barcodes (single result - legacy)
 */
export async function scanImageFile(file: File): Promise<ScanResult | null> {
  const results = await scanImageFileMultiple(file);
  return results.length > 0 ? results[0] : null;
}

/**
 * Scans an image file for ALL QR codes and barcodes
 * Returns an array of all found codes, deduplicated
 */
export async function scanImageFileMultiple(file: File): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  const seenData = new Set<string>();

  try {
    const imageData = await fileToImageData(file);

    // Scan for multiple QR codes using grid-based approach
    const qrResults = scanMultipleQRCodes(imageData);
    for (const qr of qrResults) {
      if (!seenData.has(qr.data)) {
        seenData.add(qr.data);
        results.push(qr);
      }
    }

    // Scan for multiple barcodes
    const barcodeResults = await scanMultipleBarcodes(file);
    for (const barcode of barcodeResults) {
      if (!seenData.has(barcode.data)) {
        seenData.add(barcode.data);
        results.push(barcode);
      }
    }
  } catch (error) {
    console.error('Error scanning image:', error);
  }

  return results;
}

/**
 * Scans for multiple QR codes by analyzing the full image and grid sections
 */
function scanMultipleQRCodes(imageData: ImageData): ScanResult[] {
  const results: ScanResult[] = [];
  const seenData = new Set<string>();

  // First try the full image
  const fullResult = jsQR(imageData.data, imageData.width, imageData.height);
  if (fullResult && !seenData.has(fullResult.data)) {
    seenData.add(fullResult.data);
    results.push({
      data: fullResult.data,
      type: 'qr',
      timestamp: Date.now(),
    });
  }

  // Then try a grid of overlapping sections for multiple QR codes
  const gridSizes = [2, 3]; // 2x2 and 3x3 grids
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return results;

  for (const gridSize of gridSizes) {
    const sectionWidth = Math.floor(imageData.width / gridSize);
    const sectionHeight = Math.floor(imageData.height / gridSize);

    // Use overlapping sections (50% overlap)
    const stepX = Math.floor(sectionWidth / 2);
    const stepY = Math.floor(sectionHeight / 2);

    for (let y = 0; y <= imageData.height - sectionHeight; y += stepY) {
      for (let x = 0; x <= imageData.width - sectionWidth; x += stepX) {
        // Extract section
        canvas.width = sectionWidth;
        canvas.height = sectionHeight;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) continue;

        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, x, y, sectionWidth, sectionHeight, 0, 0, sectionWidth, sectionHeight);

        const sectionData = ctx.getImageData(0, 0, sectionWidth, sectionHeight);
        const sectionResult = jsQR(sectionData.data, sectionData.width, sectionData.height);

        if (sectionResult && !seenData.has(sectionResult.data)) {
          seenData.add(sectionResult.data);
          results.push({
            data: sectionResult.data,
            type: 'qr',
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  return results;
}

/**
 * Scans for multiple barcodes using Quagga's multiple mode
 */
async function scanMultipleBarcodes(file: File): Promise<ScanResult[]> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  }).catch(() => null);

  if (!dataUrl) return [];

  const readers = [
    'code_128_reader',
    'ean_reader',
    'ean_8_reader',
    'code_39_reader',
    'code_93_reader',
    'upc_reader',
    'upc_e_reader',
    'codabar_reader',
    'i2of5_reader',
    '2of5_reader',
  ];

  const results: ScanResult[] = [];
  const seenData = new Set<string>();

  // Try with multiple: true first
  const multiResults = await tryQuaggaDecodeMultiple(dataUrl, readers);
  for (const result of multiResults) {
    if (!seenData.has(result.data)) {
      seenData.add(result.data);
      results.push(result);
    }
  }

  // If no results, try different configurations with single mode
  if (results.length === 0) {
    const configs = [
      { patchSize: 'x-large', halfSample: false },
      { patchSize: 'large', halfSample: false },
      { patchSize: 'large', halfSample: true },
      { patchSize: 'medium', halfSample: false },
      { patchSize: 'medium', halfSample: true },
      { patchSize: 'small', halfSample: false },
    ];

    for (const config of configs) {
      const result = await tryQuaggaDecode(dataUrl, readers, config);
      if (result && !seenData.has(result.data)) {
        seenData.add(result.data);
        results.push(result);
        break; // Found one, stop trying configs
      }
    }
  }

  return results;
}

/**
 * Attempts to decode multiple barcodes with Quagga
 */
function tryQuaggaDecodeMultiple(
  dataUrl: string,
  readers: string[]
): Promise<ScanResult[]> {
  return new Promise((resolve) => {
    Quagga.decodeSingle({
      src: dataUrl,
      numOfWorkers: 0,
      locate: true,
      locator: {
        halfSample: false,
        patchSize: 'large',
      },
      decoder: {
        readers: readers as unknown as import('@ericblade/quagga2').QuaggaJSCodeReader[],
        multiple: true,
      },
    }, (result) => {
      const results: ScanResult[] = [];

      // Handle multiple results
      if (result && Array.isArray(result)) {
        for (const r of result) {
          if (r.codeResult && r.codeResult.code) {
            const errors = r.codeResult.decodedCodes
              ?.filter((c: { error?: number }) => c.error !== undefined)
              ?.map((c: { error?: number }) => c.error || 0) || [];

            if (errors.length > 0) {
              const avgError = errors.reduce((a: number, b: number) => a + b, 0) / errors.length;
              if (avgError > 0.25) continue; // Skip low confidence
            }

            results.push({
              data: r.codeResult.code,
              type: 'barcode',
              timestamp: Date.now(),
            });
          }
        }
      } else if (result && result.codeResult && result.codeResult.code) {
        // Single result
        const errors = result.codeResult.decodedCodes
          ?.filter((c: { error?: number }) => c.error !== undefined)
          ?.map((c: { error?: number }) => c.error || 0) || [];

        if (errors.length === 0 || errors.reduce((a: number, b: number) => a + b, 0) / errors.length <= 0.25) {
          results.push({
            data: result.codeResult.code,
            type: 'barcode',
            timestamp: Date.now(),
          });
        }
      }

      resolve(results);
    });
  });
}

/**
 * Scans image data for QR codes (alias for scanImageData)
 */
export function scanImageData(imageData: ImageData): ScanResult | null {
  return scanQRCode(imageData);
}

/**
 * Scans image data for QR codes
 */
export function scanQRCode(imageData: ImageData): ScanResult | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height);

  if (result) {
    return {
      data: result.data,
      type: 'qr',
      timestamp: Date.now(),
    };
  }

  return null;
}

/**
 * Scans an image file for barcodes using Quagga
 * Tries multiple configurations for better detection
 */
export async function scanBarcode(file: File): Promise<ScanResult | null> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  }).catch(() => null);

  if (!dataUrl) return null;

  const readers = [
    'code_128_reader',
    'ean_reader',
    'ean_8_reader',
    'code_39_reader',
    'code_93_reader',
    'upc_reader',
    'upc_e_reader',
    'codabar_reader',
    'i2of5_reader',
    '2of5_reader',
  ];

  // Try different configurations for better detection
  const configs = [
    { patchSize: 'x-large', halfSample: false },
    { patchSize: 'large', halfSample: false },
    { patchSize: 'large', halfSample: true },
    { patchSize: 'medium', halfSample: false },
    { patchSize: 'medium', halfSample: true },
    { patchSize: 'small', halfSample: false },
  ];

  for (const config of configs) {
    const result = await tryQuaggaDecode(dataUrl, readers, config);
    if (result) return result;
  }

  return null;
}

/**
 * Attempts to decode with specific Quagga configuration
 */
function tryQuaggaDecode(
  dataUrl: string,
  readers: string[],
  config: { patchSize: string; halfSample: boolean }
): Promise<ScanResult | null> {
  return new Promise((resolve) => {
    Quagga.decodeSingle({
      src: dataUrl,
      numOfWorkers: 0,
      locate: true,
      locator: {
        halfSample: config.halfSample,
        patchSize: config.patchSize,
      },
      decoder: {
        readers: readers as unknown as import('@ericblade/quagga2').QuaggaJSCodeReader[],
        multiple: false,
      },
    }, (result) => {
      if (result && result.codeResult && result.codeResult.code) {
        // Check confidence - Quagga provides error rates for each character
        // Lower error = higher confidence
        const errors = result.codeResult.decodedCodes
          ?.filter((c: { error?: number }) => c.error !== undefined)
          ?.map((c: { error?: number }) => c.error || 0) || [];

        if (errors.length > 0) {
          const avgError = errors.reduce((a: number, b: number) => a + b, 0) / errors.length;
          // Reject results with high average error (low confidence)
          if (avgError > 0.25) {
            resolve(null);
            return;
          }
        }

        resolve({
          data: result.codeResult.code,
          type: 'barcode',
          timestamp: Date.now(),
        });
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Converts a File to ImageData for processing
 */
export async function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a data URL to ImageData
 */
export async function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Checks if a file is a supported image type
 */
export function isImageFile(file: File): boolean {
  const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  return supportedTypes.includes(file.type);
}

/**
 * Gets image from clipboard
 */
export function getImageFromClipboard(clipboardData: DataTransfer): File | null {
  const items = clipboardData.items;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      const file = items[i].getAsFile();
      if (file) return file;
    }
  }

  return null;
}
