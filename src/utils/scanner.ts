/**
 * Scanner utilities for reading QR codes and barcodes from images
 *
 * Uses jsQR for QR code detection and provides image processing utilities.
 */

import jsQR from 'jsqr';
import type { ScanResult } from '../types';

/**
 * Scans an image file for QR codes
 *
 * @param file - Image file to scan
 * @returns Promise with scan result or null if no code found
 */
export async function scanImageFile(file: File): Promise<ScanResult | null> {
  const imageData = await fileToImageData(file);
  return scanImageData(imageData);
}

/**
 * Scans image data for QR codes
 *
 * @param imageData - ImageData from canvas
 * @returns Scan result or null
 */
export function scanImageData(imageData: ImageData): ScanResult | null {
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
 * Converts a File to ImageData for processing
 *
 * @param file - Image file
 * @returns Promise with ImageData
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
 * Converts a data URL (from clipboard) to ImageData
 *
 * @param dataUrl - Data URL string
 * @returns Promise with ImageData
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
 *
 * @param file - File to check
 * @returns true if supported image type
 */
export function isImageFile(file: File): boolean {
  const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  return supportedTypes.includes(file.type);
}

/**
 * Gets image from clipboard
 *
 * @param clipboardData - Clipboard event data
 * @returns File if image found, null otherwise
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
