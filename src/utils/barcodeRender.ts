/**
 * Barcode rendering utility for generating barcodes at any resolution
 */

import JsBarcode from 'jsbarcode';
import type { BarcodeFormat, BarcodeStyleOptions } from '../types';
import { DEFAULT_BARCODE_STYLE, DEFAULT_BARCODE_WIDTH, DEFAULT_BARCODE_HEIGHT, DEFAULT_MARGIN } from '../constants';

interface RenderBarcodeOptions {
  data: string;
  format: BarcodeFormat;
  targetWidth: number;
  /** Preview bar width used to calculate scaling ratio */
  previewBarWidth?: number;
  /** Preview bar height used to calculate scaling ratio */
  previewBarHeight?: number;
  margin?: number;
  style?: Partial<BarcodeStyleOptions>;
}

/**
 * Renders a barcode to a canvas at specified target width
 * Scales all dimensions proportionally from preview settings
 */
export async function renderBarcodeToCanvas(options: RenderBarcodeOptions): Promise<HTMLCanvasElement> {
  const {
    data,
    format,
    targetWidth,
    previewBarWidth = DEFAULT_BARCODE_WIDTH,
    previewBarHeight = DEFAULT_BARCODE_HEIGHT,
    margin = DEFAULT_MARGIN,
    style = {},
  } = options;

  const lineColor = style.lineColor ?? DEFAULT_BARCODE_STYLE.lineColor;
  const bgColor = style.bgColor ?? DEFAULT_BARCODE_STYLE.bgColor;
  const displayValue = style.displayValue ?? DEFAULT_BARCODE_STYLE.displayValue;
  const font = style.font ?? DEFAULT_BARCODE_STYLE.font;
  const previewFontSize = style.fontSize ?? DEFAULT_BARCODE_STYLE.fontSize;
  const textAlign = style.textAlign ?? DEFAULT_BARCODE_STYLE.textAlign;
  const previewTextMargin = style.textMargin ?? DEFAULT_BARCODE_STYLE.textMargin;

  // Create a temporary SVG at preview dimensions to measure natural width
  const measureSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  document.body.appendChild(measureSvg);

  try {
    JsBarcode(measureSvg, data, {
      format,
      width: previewBarWidth,
      height: previewBarHeight,
      margin,
      displayValue,
      font,
      fontSize: previewFontSize,
      textAlign,
      textMargin: previewTextMargin,
      lineColor,
      background: bgColor,
    });

    // Get natural dimensions
    const previewWidth = measureSvg.getBoundingClientRect().width || measureSvg.width.baseVal.value;
    const previewHeight = measureSvg.getBoundingClientRect().height || measureSvg.height.baseVal.value;

    // Calculate scale ratio
    const scale = targetWidth / previewWidth;
    const targetHeight = Math.round(previewHeight * scale);

    // Create export SVG with scaled dimensions
    const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(exportSvg);

    // Scale all dimensions proportionally
    const scaledBarWidth = previewBarWidth * scale;
    const scaledBarHeight = previewBarHeight * scale;
    const scaledMargin = margin * scale;
    const scaledFontSize = Math.round(previewFontSize * scale);
    const scaledTextMargin = Math.round(previewTextMargin * scale);

    JsBarcode(exportSvg, data, {
      format,
      width: scaledBarWidth,
      height: scaledBarHeight,
      margin: scaledMargin,
      displayValue,
      font,
      fontSize: scaledFontSize,
      textAlign,
      textMargin: scaledTextMargin,
      lineColor,
      background: bgColor,
    });

    // Convert SVG to canvas
    const canvas = await svgToCanvas(exportSvg, targetWidth, targetHeight);

    document.body.removeChild(exportSvg);
    return canvas;
  } finally {
    document.body.removeChild(measureSvg);
  }
}

/**
 * Converts SVG element to canvas at exact dimensions
 */
function svgToCanvas(
  svg: SVGSVGElement,
  targetWidth: number,
  targetHeight: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Enable smoothing for crisp text rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
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
