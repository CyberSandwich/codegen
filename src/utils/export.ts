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
 *
 * @param canvas - The canvas element to export
 * @param options - Export configuration
 */
export function exportCanvas(
  canvas: HTMLCanvasElement,
  options: ExportOptions
): void {
  const { format, quality = DEFAULT_JPG_QUALITY, filename = 'code' } = options;

  let dataUrl: string;
  let extension = format;

  switch (format) {
    case 'png':
      dataUrl = canvas.toDataURL('image/png');
      break;
    case 'jpg':
      dataUrl = canvas.toDataURL('image/jpeg', quality);
      break;
    case 'svg':
      // Canvas doesn't support SVG export directly
      // Fall back to PNG for canvas sources
      dataUrl = canvas.toDataURL('image/png');
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
  } else {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    downloadDataUrl(dataUrl, `${filename}.jpg`);
  }
}

/**
 * Converts SVG element to canvas
 */
async function svgToCanvas(
  svg: SVGSVGElement,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
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
