/**
 * Scanner utilities for reading QR codes and barcodes from images
 */

import jsQR from 'jsqr';
import Quagga from '@ericblade/quagga2';
import type { ScanResult } from '../types';

/**
 * Scans an image file for QR codes or barcodes
 */
export async function scanImageFile(file: File): Promise<ScanResult | null> {
  const imageData = await fileToImageData(file);

  // Try QR code first
  const qrResult = scanQRCode(imageData);
  if (qrResult) return qrResult;

  // Then try barcode
  const barcodeResult = await scanBarcode(file);
  if (barcodeResult) return barcodeResult;

  return null;
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
