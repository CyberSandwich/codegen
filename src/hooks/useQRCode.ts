/**
 * QR Code generation hook
 *
 * Provides reactive QR code generation using the qrcode library.
 * Handles canvas rendering with customizable styling options.
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
}

interface UseQRCodeReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isValid: boolean;
  error: string | null;
  regenerate: () => void;
}

/**
 * Hook for generating QR codes on a canvas element
 *
 * @param options - QR code configuration options
 * @returns Canvas ref and generation status
 *
 * @example
 * const { canvasRef, isValid } = useQRCode({
 *   data: 'https://example.com',
 *   size: 256,
 *   errorCorrection: 'M',
 * });
 */
export function useQRCode(options: UseQRCodeOptions): UseQRCodeReturn {
  const {
    data,
    size = DEFAULT_QR_SIZE,
    margin = DEFAULT_MARGIN,
    errorCorrection = 'M',
    style = {},
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  const fgColor = style.fgColor ?? DEFAULT_QR_STYLE.fgColor;
  const bgColor = style.bgColor ?? DEFAULT_QR_STYLE.bgColor;

  const isValid = data.trim().length > 0;

  // Generate QR code when dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isValid) return;

    let cancelled = false;

    const generate = async () => {
      try {
        if (cancelled) return;

        const qrOptions: QRCode.QRCodeRenderersOptions = {
          width: size,
          margin,
          errorCorrectionLevel: errorCorrection,
          color: {
            dark: fgColor,
            light: bgColor,
          },
        };

        await QRCode.toCanvas(canvas, data, qrOptions);

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
  }, [data, size, margin, errorCorrection, fgColor, bgColor, isValid, renderKey]);

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
