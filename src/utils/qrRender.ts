/**
 * QR Code rendering utility for generating QR codes at any resolution
 */

import QRCode from 'qrcode';
import type { QRConfig } from '../types';
import { DEFAULT_QR_STYLE, DEFAULT_MARGIN } from '../constants';

interface RenderQROptions {
  data: string;
  size: number;
  margin?: number;
  errorCorrection?: QRConfig['errorCorrection'];
  style?: Partial<QRConfig['style']>;
  logo?: string | null;
  transparentBg?: boolean;
}

/**
 * Draws a rounded rectangle
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Renders a QR code to a canvas at native resolution
 * Returns a Promise that resolves to the canvas element
 */
export async function renderQRToCanvas(options: RenderQROptions): Promise<HTMLCanvasElement> {
  const {
    data,
    size,
    margin = DEFAULT_MARGIN,
    errorCorrection = 'M',
    style = {},
    logo = null,
    transparentBg = false,
  } = options;

  const fgColor = style.fgColor ?? DEFAULT_QR_STYLE.fgColor;
  const bgColor = style.bgColor ?? DEFAULT_QR_STYLE.bgColor;
  const dotStyle = style.dotStyle ?? DEFAULT_QR_STYLE.dotStyle;

  // Create QR code data
  const segments = QRCode.create(data, { errorCorrectionLevel: errorCorrection });
  const modules = segments.modules;
  const moduleCount = modules.size;

  // Scale margin proportionally to size (16px margin at 320px = 5% of size)
  const scaledMargin = Math.round((margin / 320) * size);
  const availableSize = size - scaledMargin * 2;
  // Use integer module size to avoid sub-pixel gaps
  const moduleSize = Math.floor(availableSize / moduleCount);
  // Center the QR within available space after rounding
  const actualQRSize = moduleSize * moduleCount;
  const offset = Math.floor((size - actualQRSize) / 2);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Disable smoothing for crisp, sharp pixels
  ctx.imageSmoothingEnabled = false;

  // Fill background (or clear for transparent)
  if (transparentBg) {
    ctx.clearRect(0, 0, size, size);
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
  }

  // Calculate logo zone (center ~25% of modules, snapped to module boundaries)
  const logoZoneModules = logo ? Math.floor(moduleCount * 0.25) : 0;
  const logoZoneStart = Math.floor((moduleCount - logoZoneModules) / 2);
  const logoZoneEnd = logoZoneStart + logoZoneModules;

  // Draw modules
  ctx.fillStyle = fgColor;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip modules in logo zone
      if (logo && row >= logoZoneStart && row < logoZoneEnd && col >= logoZoneStart && col < logoZoneEnd) {
        continue;
      }

      if (modules.get(row, col)) {
        const x = offset + col * moduleSize;
        const y = offset + row * moduleSize;

        if (dotStyle === 'dots') {
          const centerX = x + moduleSize / 2;
          const centerY = y + moduleSize / 2;
          const radius = moduleSize * 0.4;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (dotStyle === 'rounded') {
          const cornerRadius = moduleSize * 0.3;
          roundRect(ctx, x + moduleSize * 0.05, y + moduleSize * 0.05, moduleSize * 0.9, moduleSize * 0.9, cornerRadius);
        } else {
          // Square (default) - integer coords prevent sub-pixel gaps
          ctx.fillRect(x, y, moduleSize, moduleSize);
        }
      }
    }
  }

  // Draw logo if provided
  if (logo) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Calculate logo position to match the skipped module zone exactly
        const logoPixelSize = logoZoneModules * moduleSize;
        const logoX = offset + logoZoneStart * moduleSize;
        const logoY = offset + logoZoneStart * moduleSize;

        // Draw rounded background for logo (for better visibility)
        if (!transparentBg) {
          ctx.fillStyle = bgColor;
          const padding = (2 / 320) * size; // Scale padding proportionally
          const bgSize = logoPixelSize + padding * 2;
          const cornerRadius = bgSize * 0.1; // Slight rounding
          roundRect(ctx, logoX - padding, logoY - padding, bgSize, bgSize, cornerRadius);
        }

        // Draw logo centered within the zone with small padding
        const logoPadding = logoPixelSize * 0.08;
        ctx.drawImage(img, logoX + logoPadding, logoY + logoPadding, logoPixelSize - logoPadding * 2, logoPixelSize - logoPadding * 2);
        resolve();
      };
      img.onerror = () => resolve(); // Continue without logo on error
      img.src = logo;
    });
  }

  return canvas;
}
