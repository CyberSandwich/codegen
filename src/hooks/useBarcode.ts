/**
 * Barcode generation hook
 *
 * Provides reactive barcode generation using JsBarcode library.
 * Supports multiple barcode formats with customizable styling.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import JsBarcode from 'jsbarcode';
import type { BarcodeConfig, BarcodeFormat } from '../types';
import {
  DEFAULT_BARCODE_WIDTH,
  DEFAULT_BARCODE_HEIGHT,
  DEFAULT_MARGIN,
  DEFAULT_BARCODE_STYLE,
} from '../constants';

interface UseBarcodeOptions {
  data: string;
  format?: BarcodeFormat;
  width?: number;
  height?: number;
  margin?: number;
  style?: Partial<BarcodeConfig['style']>;
}

interface UseBarcodeReturn {
  svgRef: React.RefObject<SVGSVGElement | null>;
  isValid: boolean;
  error: string | null;
  regenerate: () => void;
}

/**
 * Hook for generating barcodes on an SVG element
 *
 * @param options - Barcode configuration options
 * @returns SVG ref and generation status
 *
 * @example
 * const { svgRef, isValid } = useBarcode({
 *   data: '123456789012',
 *   format: 'EAN13',
 * });
 */
export function useBarcode(options: UseBarcodeOptions): UseBarcodeReturn {
  const {
    data,
    format = 'CODE128',
    width = DEFAULT_BARCODE_WIDTH,
    height = DEFAULT_BARCODE_HEIGHT,
    margin = DEFAULT_MARGIN,
    style = {},
  } = options;

  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  // Extract style values with defaults
  const lineColor = style.lineColor ?? DEFAULT_BARCODE_STYLE.lineColor;
  const bgColor = style.bgColor ?? DEFAULT_BARCODE_STYLE.bgColor;
  const displayValue = style.displayValue ?? DEFAULT_BARCODE_STYLE.displayValue;
  const font = style.font ?? DEFAULT_BARCODE_STYLE.font;
  const fontSize = style.fontSize ?? DEFAULT_BARCODE_STYLE.fontSize;
  const textAlign = style.textAlign ?? DEFAULT_BARCODE_STYLE.textAlign;
  const textMargin = style.textMargin ?? DEFAULT_BARCODE_STYLE.textMargin;

  // Validate data against format pattern
  const isValid = validateBarcodeData(data, format);

  // Generate barcode when dependencies change
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !data.trim()) {
      return;
    }

    let cancelled = false;

    // Using setTimeout to move state updates out of synchronous effect execution
    const generate = () => {
      try {
        // Clear previous content
        svg.innerHTML = '';

        JsBarcode(svg, data, {
          format,
          width,
          height,
          margin,
          displayValue,
          font,
          fontSize,
          textAlign,
          textMargin,
          lineColor,
          background: bgColor,
        });

        if (!cancelled) {
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Invalid barcode data for format');
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [
    data,
    format,
    width,
    height,
    margin,
    lineColor,
    bgColor,
    displayValue,
    font,
    fontSize,
    textAlign,
    textMargin,
    renderKey,
  ]);

  const regenerate = useCallback(() => {
    setRenderKey((k) => k + 1);
  }, []);

  return {
    svgRef,
    isValid,
    error,
    regenerate,
  };
}

/**
 * Validates barcode data against format requirements
 * Relaxed validation - let JsBarcode handle specific format validation
 */
export function validateBarcodeData(
  data: string,
  format: BarcodeFormat
): boolean {
  if (!data.trim()) return false;

  // Basic format validation - be lenient and let JsBarcode do detailed validation
  switch (format) {
    case 'EAN13':
      return /^\d{12,13}$/.test(data);
    case 'EAN8':
      return /^\d{7,8}$/.test(data);
    case 'UPC':
      return /^\d{11,12}$/.test(data);
    case 'UPCE':
      return /^\d{6,8}$/.test(data);
    case 'ITF14':
      // ITF14 needs even number of digits, typically 14
      return /^\d{14}$/.test(data);
    case 'pharmacode': {
      const num = parseInt(data, 10);
      return !isNaN(num) && num >= 3 && num <= 131070;
    }
    case 'codabar':
      // Codabar needs start/stop chars A-D
      return /^[A-Da-d][0-9\-$:/.+]+[A-Da-d]$/.test(data);
    case 'MSI':
      return /^\d+$/.test(data);
    case 'CODE39':
      return /^[A-Z0-9\-. $/+%*]+$/i.test(data);
    case 'CODE93':
      return /^[A-Z0-9\-. $/+%]+$/i.test(data);
    default:
      // CODE128 accepts most characters
      return data.length > 0;
  }
}

export default useBarcode;
