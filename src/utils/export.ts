/**
 * Export utilities for generating downloadable images
 *
 * Handles conversion of canvas/SVG elements to various image formats
 * and triggers file downloads.
 */

import { toPng, toJpeg, toSvg } from 'html-to-image';
import type { ExportFormat } from '../types';
import { DEFAULT_JPG_QUALITY } from '../constants';

interface ExportOptions {
  format: ExportFormat;
  width: number;
  height: number;
  quality?: number;
  filename?: string;
}

/**
 * Exports a DOM element as an image file
 *
 * @param element - The DOM element to export (usually a container with canvas/svg)
 * @param options - Export configuration
 * @returns Promise that resolves when download starts
 */
export async function exportElement(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { format, width, height, quality = DEFAULT_JPG_QUALITY, filename = 'code' } = options;

  const exportConfig = {
    width,
    height,
    pixelRatio: 1,
    backgroundColor: undefined as string | undefined,
  };

  let dataUrl: string;

  switch (format) {
    case 'png':
      dataUrl = await toPng(element, exportConfig);
      break;
    case 'jpg':
      // JPG needs explicit background color (no transparency)
      dataUrl = await toJpeg(element, { ...exportConfig, quality });
      break;
    case 'webp':
      // WebP provides better compression than PNG/JPG
      dataUrl = await toPng(element, exportConfig);
      // Convert to webp via canvas
      dataUrl = await convertToWebP(dataUrl, quality);
      break;
    case 'svg':
      dataUrl = await toSvg(element, exportConfig);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  downloadDataUrl(dataUrl, `${filename}.${format}`);
}

/**
 * Exports a canvas element directly
 * Scales to the specified dimensions for high-quality output
 *
 * @param canvas - The canvas element to export
 * @param options - Export configuration
 */
export function exportCanvas(
  canvas: HTMLCanvasElement,
  options: ExportOptions
): void {
  const { format, width, height, quality = DEFAULT_JPG_QUALITY, filename = 'code' } = options;

  // Create a new canvas at the target size
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  const ctx = exportCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Disable smoothing for crisp, sharp pixels (important for QR codes)
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, width, height);

  let dataUrl: string;
  let extension = format;

  switch (format) {
    case 'png':
      dataUrl = exportCanvas.toDataURL('image/png');
      break;
    case 'jpg':
      dataUrl = exportCanvas.toDataURL('image/jpeg', quality);
      break;
    case 'webp':
      dataUrl = exportCanvas.toDataURL('image/webp', quality);
      break;
    case 'svg':
      // Canvas doesn't support SVG export directly
      // Fall back to PNG for canvas sources
      dataUrl = exportCanvas.toDataURL('image/png');
      extension = 'png';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  downloadDataUrl(dataUrl, `${filename}.${extension}`);
}

/**
 * Exports an SVG element
 *
 * @param svg - The SVG element to export
 * @param options - Export configuration
 */
export async function exportSvg(
  svg: SVGSVGElement,
  options: ExportOptions
): Promise<void> {
  const { format, width, height, quality = DEFAULT_JPG_QUALITY, filename = 'code' } = options;

  if (format === 'svg') {
    // Direct SVG export
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `${filename}.svg`);
    URL.revokeObjectURL(url);
    return;
  }

  // For PNG/JPG, convert SVG to canvas first
  const canvas = await svgToCanvas(svg, width, height);

  if (format === 'png') {
    const dataUrl = canvas.toDataURL('image/png');
    downloadDataUrl(dataUrl, `${filename}.png`);
  } else if (format === 'webp') {
    const dataUrl = canvas.toDataURL('image/webp', quality);
    downloadDataUrl(dataUrl, `${filename}.webp`);
  } else {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    downloadDataUrl(dataUrl, `${filename}.jpg`);
  }
}

/**
 * Converts SVG element to canvas preserving aspect ratio
 * Scales to target width while maintaining proportions
 */
async function svgToCanvas(
  svg: SVGSVGElement,
  targetWidth: number,
  _targetHeight: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      // Get natural SVG dimensions
      const svgWidth = svg.width.baseVal.value || img.naturalWidth || targetWidth;
      const svgHeight = svg.height.baseVal.value || img.naturalHeight || targetWidth;
      const svgRatio = svgWidth / svgHeight;

      // Scale to target width, calculate height from aspect ratio
      const finalWidth = targetWidth;
      const finalHeight = targetWidth / svgRatio;

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(finalWidth);
      canvas.height = Math.round(finalHeight);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Disable smoothing for crisp, sharp rendering
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    img.src = url;
  });
}

/**
 * Triggers download of a data URL
 */
function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Converts a PNG data URL to WebP format for better compression
 */
async function convertToWebP(pngDataUrl: string, quality: number): Promise<string> {
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
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image for WebP conversion'));
    img.src = pngDataUrl;
  });
}
