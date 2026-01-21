/**
 * Core type definitions for CodeGen application
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the application for QR code generation, barcode generation, and scanning.
 */

/** QR Code error correction levels - higher = more redundancy */
export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/** Supported barcode formats */
export type BarcodeFormat =
  | 'CODE128'
  | 'CODE39'
  | 'CODE93'
  | 'EAN13'
  | 'EAN8'
  | 'UPC'
  | 'UPCE'
  | 'ITF14'
  | 'MSI'
  | 'pharmacode'
  | 'codabar';

/** Export format options */
export type ExportFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'pdf';

/** Size preset configuration */
export interface SizePreset {
  label: string;
  width: number;
  height: number;
}

/** QR Code styling options */
export interface QRStyleOptions {
  /** Foreground/data color */
  fgColor: string;
  /** Background color */
  bgColor: string;
  /** Corner radius (0-1, percentage) */
  cornerRadius: number;
  /** Module/dot style */
  dotStyle: 'square' | 'rounded' | 'dots';
}

/** Barcode styling options */
export interface BarcodeStyleOptions {
  /** Line color */
  lineColor: string;
  /** Background color */
  bgColor: string;
  /** Show text below barcode */
  displayValue: boolean;
  /** Font for text */
  font: string;
  /** Font size */
  fontSize: number;
  /** Text alignment */
  textAlign: 'left' | 'center' | 'right';
  /** Text margin from barcode */
  textMargin: number;
}

/** QR Code generation configuration */
export interface QRConfig {
  /** Data to encode */
  data: string;
  /** Error correction level */
  errorCorrection: QRErrorCorrectionLevel;
  /** Size in pixels */
  size: number;
  /** Margin/quiet zone modules */
  margin: number;
  /** Styling options */
  style: QRStyleOptions;
}

/** Barcode generation configuration */
export interface BarcodeConfig {
  /** Data to encode */
  data: string;
  /** Barcode format */
  format: BarcodeFormat;
  /** Width of bars */
  width: number;
  /** Height in pixels */
  height: number;
  /** Margin in pixels */
  margin: number;
  /** Styling options */
  style: BarcodeStyleOptions;
}

/** Export configuration */
export interface ExportConfig {
  /** Export format */
  format: ExportFormat;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Quality (0-1, for jpg) */
  quality: number;
}

/** Scan result from QR/barcode reader */
export interface ScanResult {
  /** Decoded data */
  data: string;
  /** Type of code detected */
  type: 'qr' | 'barcode';
  /** Timestamp of scan */
  timestamp: number;
}

/** Application tab/mode */
export type AppMode = 'qr' | 'barcode' | 'scan';
