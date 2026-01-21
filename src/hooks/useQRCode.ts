/**
 * QR Code generation hook with custom dot styles
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import QRCode from 'qrcode';
import type { QRConfig } from '../types';
import {
  DEFAULT_QR_SIZE,
  DEFAULT_MARGIN,
  DEFAULT_QR_STYLE,
} from '../constants';

interface UseQRCodeOptions {
  data: string;
  size?: number;
  margin?: number;
  errorCorrection?: QRConfig['errorCorrection'];
  style?: Partial<QRConfig['style']>;
  logo?: string | null;
  transparentBg?: boolean;
}

interface UseQRCodeReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isValid: boolean;
  error: string | null;
  regenerate: () => void;
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

export function useQRCode(options: UseQRCodeOptions): UseQRCodeReturn {
  const {
    data,
    size = DEFAULT_QR_SIZE,
    margin = DEFAULT_MARGIN,
    errorCorrection = 'M',
    style = {},
    logo = null,
    transparentBg = false,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  const fgColor = style.fgColor ?? DEFAULT_QR_STYLE.fgColor;
  const bgColor = style.bgColor ?? DEFAULT_QR_STYLE.bgColor;
  const dotStyle = style.dotStyle ?? DEFAULT_QR_STYLE.dotStyle;

  const isValid = data.trim().length > 0;

  // Generate QR code when dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isValid) return;

    let cancelled = false;

    const generate = async () => {
      try {
        if (cancelled) return;

        // Always use custom rendering to support logo and transparent bg
        const segments = QRCode.create(data, { errorCorrectionLevel: errorCorrection });

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        // Disable smoothing for crisp, sharp pixels
        ctx.imageSmoothingEnabled = false;

        const modules = segments.modules;
        const moduleCount = modules.size;

        // Calculate dimensions with integer module size to avoid sub-pixel gaps
        const availableSize = size - margin * 2;
        const moduleSize = Math.floor(availableSize / moduleCount);
        // Center the QR within available space after rounding
        const actualQRSize = moduleSize * moduleCount;
        const offset = Math.floor((size - actualQRSize) / 2);

        // Set canvas size
        canvas.width = size;
        canvas.height = size;

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
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            if (cancelled) return;

            // Calculate logo position to match the skipped module zone exactly
            // This ensures the white background aligns with where modules were skipped
            const logoPixelSize = logoZoneModules * moduleSize;
            const logoX = offset + logoZoneStart * moduleSize;
            const logoY = offset + logoZoneStart * moduleSize;

            // Draw rounded background for logo (for better visibility)
            if (!transparentBg) {
              ctx.fillStyle = bgColor;
              const padding = 2;
              const bgSize = logoPixelSize + padding * 2;
              const cornerRadius = bgSize * 0.1; // Slight rounding
              roundRect(ctx, logoX - padding, logoY - padding, bgSize, bgSize, cornerRadius);
            }

            // Draw logo centered within the zone with small padding
            const logoPadding = logoPixelSize * 0.08;
            ctx.drawImage(img, logoX + logoPadding, logoY + logoPadding, logoPixelSize - logoPadding * 2, logoPixelSize - logoPadding * 2);
          };
          img.src = logo;
        }

        if (!cancelled) {
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [data, size, margin, errorCorrection, fgColor, bgColor, dotStyle, isValid, renderKey, logo, transparentBg]);

  const regenerate = useCallback(() => {
    setRenderKey((k) => k + 1);
  }, []);

  return {
    canvasRef,
    isValid,
    error,
    regenerate,
  };
}

export default useQRCode;
