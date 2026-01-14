/**
 * Application constants
 *
 * Centralized configuration values for the CodeGen application.
 * Modify these values to adjust default behavior and available options.
 */

import type {
  QRErrorCorrectionLevel,
  BarcodeFormat,
  SizePreset,
  QRStyleOptions,
  BarcodeStyleOptions,
} from '../types';

/** QR Code error correction levels with descriptions */
export const ERROR_CORRECTION_LEVELS: {
  value: QRErrorCorrectionLevel;
  label: string;
  recovery: string;
}[] = [
  { value: 'L', label: 'Low', recovery: '~7%' },
  { value: 'M', label: 'Medium', recovery: '~15%' },
  { value: 'Q', label: 'Quartile', recovery: '~25%' },
  { value: 'H', label: 'High', recovery: '~30%' },
];

/** Supported barcode formats with validation patterns */
export const BARCODE_FORMATS: {
  value: BarcodeFormat;
  label: string;
  placeholder: string;
  pattern?: RegExp;
}[] = [
  { value: 'CODE128', label: 'Code 128', placeholder: 'ABC-123' },
  { value: 'CODE39', label: 'Code 39', placeholder: 'ABC123', pattern: /^[A-Z0-9\-. $/+%]*$/ },
  { value: 'EAN13', label: 'EAN-13', placeholder: '5901234123457', pattern: /^\d{12,13}$/ },
  { value: 'EAN8', label: 'EAN-8', placeholder: '96385074', pattern: /^\d{7,8}$/ },
  { value: 'UPC', label: 'UPC-A', placeholder: '012345678905', pattern: /^\d{11,12}$/ },
  { value: 'ITF14', label: 'ITF-14', placeholder: '10012345678902', pattern: /^\d{14}$/ },
  { value: 'MSI', label: 'MSI', placeholder: '1234', pattern: /^\d+$/ },
  { value: 'pharmacode', label: 'Pharmacode', placeholder: '1234', pattern: /^\d+$/ },
  { value: 'codabar', label: 'Codabar', placeholder: 'A12345B', pattern: /^[A-D][0-9\-$:/.+]+[A-D]$/i },
];

/** Size presets for export */
export const SIZE_PRESETS: SizePreset[] = [
  { label: 'Small', width: 128, height: 128 },
  { label: 'Medium', width: 256, height: 256 },
  { label: 'Large', width: 512, height: 512 },
  { label: 'XL', width: 1024, height: 1024 },
];

/** Barcode-specific size presets (different aspect ratio) */
export const BARCODE_SIZE_PRESETS: SizePreset[] = [
  { label: 'Small', width: 200, height: 80 },
  { label: 'Medium', width: 300, height: 100 },
  { label: 'Large', width: 400, height: 150 },
  { label: 'XL', width: 600, height: 200 },
];

/** Default QR code styling */
export const DEFAULT_QR_STYLE: QRStyleOptions = {
  fgColor: '#ffffff',
  bgColor: '#0a0a0b',
  cornerRadius: 0,
  dotStyle: 'square',
};

/** Default barcode styling */
export const DEFAULT_BARCODE_STYLE: BarcodeStyleOptions = {
  lineColor: '#ffffff',
  bgColor: '#0a0a0b',
  displayValue: true,
  font: 'monospace',
  fontSize: 14,
  textAlign: 'center',
  textMargin: 4,
};

/** Default QR code size */
export const DEFAULT_QR_SIZE = 256;

/** Default barcode dimensions */
export const DEFAULT_BARCODE_WIDTH = 2;
export const DEFAULT_BARCODE_HEIGHT = 100;

/** Default margin */
export const DEFAULT_MARGIN = 4;

/** Export quality for JPG */
export const DEFAULT_JPG_QUALITY = 0.92;

/** Color presets for quick selection */
export const COLOR_PRESETS = [
  '#ffffff',
  '#000000',
  '#6366f1',
  '#22c55e',
  '#ef4444',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
];
