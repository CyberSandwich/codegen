/**
 * Barcode Generator Component - Side panel layout
 */

import { useState, useCallback } from 'react';
import { useBarcode } from '../hooks/useBarcode';
import { useDebounce } from '../hooks/useDebounce';
import { ColorPicker } from './ColorPicker';
import {
  BARCODE_FORMATS,
  BARCODE_SIZE_PRESETS,
  DEFAULT_BARCODE_WIDTH,
  DEFAULT_BARCODE_HEIGHT,
} from '../constants';
import type { BarcodeFormat, BarcodeStyleOptions, ExportFormat } from '../types';
import { exportSvg } from '../utils/export';

const TEXT_FONTS = [
  { value: 'monospace', label: 'Mono' },
  { value: 'sans-serif', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
];

const EXPORT_FORMATS: ExportFormat[] = ['png', 'webp', 'jpg', 'svg'];

interface BarcodeGeneratorProps {
  data: string;
  onDataChange: (data: string) => void;
}

export function BarcodeGenerator({ data, onDataChange }: BarcodeGeneratorProps) {
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [width, setWidth] = useState(DEFAULT_BARCODE_WIDTH);
  const [height, setHeight] = useState(DEFAULT_BARCODE_HEIGHT);
  const [style, setStyle] = useState<BarcodeStyleOptions>({
    lineColor: '#000000',
    bgColor: '#ffffff',
    displayValue: true,
    font: 'monospace',
    fontSize: 14,
    textAlign: 'center',
    textMargin: 4,
  });
  const [selectedPreset, setSelectedPreset] = useState(3); // XL default
  const [customExportWidth, setCustomExportWidth] = useState('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [showOptions, setShowOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // Default barcode data
  const DEFAULT_BARCODE_DATA = 'Duke';
  const debouncedData = useDebounce(data, 300);
  const debouncedFormat = useDebounce(format, 300);
  const displayData = debouncedData.trim() || DEFAULT_BARCODE_DATA;

  const { svgRef, isValid, error } = useBarcode({
    data: displayData,
    format: debouncedFormat,
    width,
    height,
    style,
  });

  const handleStyleChange = useCallback(
    <K extends keyof BarcodeStyleOptions>(key: K, value: BarcodeStyleOptions[K]) => {
      setStyle((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Get export dimensions (custom or preset)
  const getExportDimensions = useCallback(() => {
    if (customExportWidth) {
      const w = parseInt(customExportWidth) || BARCODE_SIZE_PRESETS[selectedPreset].width;
      // Maintain aspect ratio from preset
      const preset = BARCODE_SIZE_PRESETS[selectedPreset];
      const h = Math.round(w * (preset.height / preset.width));
      return { width: w, height: h };
    }
    return BARCODE_SIZE_PRESETS[selectedPreset];
  }, [customExportWidth, selectedPreset]);

  const handleExport = useCallback(async () => {
    if (!svgRef.current || !isValid) return;
    const { width: exportWidth, height: exportHeight } = getExportDimensions();
    await exportSvg(svgRef.current, {
      format: exportFormat,
      width: exportWidth,
      height: exportHeight,
      quality: 0.92,
      filename: 'barcode',
    });
  }, [svgRef, isValid, getExportDimensions, exportFormat]);

  const handleCopy = useCallback(async () => {
    if (!svgRef.current || !isValid) return;

    // Check for secure context early - clipboard API requires HTTPS
    const canUseClipboard = navigator.clipboard &&
      typeof ClipboardItem !== 'undefined' &&
      window.isSecureContext;

    if (!canUseClipboard) {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 4000);
      return;
    }

    try {
      // Convert SVG to PNG blob
      const svg = svgRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = async () => {
        // Use export dimensions for high quality copy
        const { width: exportWidth, height: exportHeight } = getExportDimensions();
        const canvas = document.createElement('canvas');
        canvas.width = exportWidth;
        canvas.height = exportHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = style.bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Disable smoothing for crisp, sharp lines
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          try {
            const blob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob(resolve, 'image/png', 1.0);
            });
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              setCopySuccess(true);
              setTimeout(() => setCopySuccess(false), 4000);
              URL.revokeObjectURL(url);
              return;
            }
          } catch (clipboardErr) {
            console.warn('Clipboard write failed:', clipboardErr);
            setCopyError(true);
            setTimeout(() => setCopyError(false), 4000);
          }
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setCopyError(true);
        setTimeout(() => setCopyError(false), 4000);
      };
      img.src = url;
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 4000);
    }
  }, [svgRef, isValid, style.bgColor, getExportDimensions]);

  const handleReset = useCallback(() => {
    setWidth(DEFAULT_BARCODE_WIDTH);
    setHeight(DEFAULT_BARCODE_HEIGHT);
    setStyle({
      lineColor: '#000000',
      bgColor: '#ffffff',
      displayValue: true,
      font: 'monospace',
      fontSize: 14,
      textAlign: 'center',
      textMargin: 4,
    });
    setSelectedPreset(3);
    setCustomExportWidth('');
    setExportFormat('png');
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center overflow-visible relative">
      {/* Options Panel - Bottom on mobile, left side on desktop */}
      <div
        className={`fixed lg:absolute z-20 transition-all duration-200 ease-out
          bottom-0 left-0 right-0 lg:bottom-auto lg:left-4 lg:right-auto lg:top-1/2
          ${showOptions
            ? 'opacity-100 translate-y-0 lg:-translate-y-1/2 lg:translate-x-0'
            : 'opacity-0 translate-y-full lg:-translate-y-1/2 lg:-translate-x-8 pointer-events-none'
          }`}
      >
          <div className="w-full lg:w-[280px] space-y-5 p-5 rounded-t-2xl lg:rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] max-h-[60vh] lg:max-h-none overflow-y-auto">
            {/* Mobile Header */}
            <div className="flex justify-between items-center lg:hidden -mt-1 -mb-2">
              <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Options</span>
              <button
                onClick={() => setShowOptions(false)}
                className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Colors */}
            <div className="space-y-3">
              <span className="text-xs text-[var(--color-text-muted)]">Color</span>
              <div className="flex gap-2">
                <div className="flex-1">
                  <ColorPicker
                    value={style.lineColor}
                    onChange={(color) => handleStyleChange('lineColor', color)}
                  />
                </div>
                <div className="flex-1">
                  <ColorPicker
                    value={style.bgColor}
                    onChange={(color) => handleStyleChange('bgColor', color)}
                  />
                </div>
              </div>
            </div>

            {/* Bar Dimensions */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">Bar Width</span>
                <span className="text-xs text-[var(--color-text-muted)]">{width.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={4}
                step={0.5}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">Height</span>
                <span className="text-xs text-[var(--color-text-muted)]">{height}px</span>
              </div>
              <input
                type="range"
                min={40}
                max={200}
                step={10}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Text Font (greyed out when text not displayed) */}
            <div className={`space-y-3 transition-opacity ${!style.displayValue ? 'opacity-30 pointer-events-none' : ''}`}>
              <span className="text-xs text-[var(--color-text-muted)]">Font</span>
              <div className="flex gap-1">
                {TEXT_FONTS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleStyleChange('font', font.value)}
                    className={`flex-1 py-2 text-xs rounded-lg transition-all ${
                      style.font === font.value
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`space-y-3 transition-opacity ${!style.displayValue ? 'opacity-30 pointer-events-none' : ''}`}>
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">Font Size</span>
                <span className="text-xs text-[var(--color-text-muted)]">{style.fontSize}px</span>
              </div>
              <input
                type="range"
                min={10}
                max={24}
                step={1}
                value={style.fontSize}
                onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Export Size */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">Export</span>
                <span className="text-xs text-[var(--color-text-muted)]">{customExportWidth || BARCODE_SIZE_PRESETS[selectedPreset].width}px</span>
              </div>
              <div className="flex gap-1">
                {BARCODE_SIZE_PRESETS.map((preset, index) => (
                  <button
                    key={preset.label}
                    onClick={() => { setSelectedPreset(index); setCustomExportWidth(''); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                      selectedPreset === index && !customExportWidth
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <input
                  type="text"
                  value={customExportWidth}
                  onChange={(e) => setCustomExportWidth(e.target.value.replace(/\D/g, ''))}
                  placeholder="Custom"
                  className={`w-16 py-2 px-2 text-xs text-center rounded-lg transition-all ${
                    customExportWidth
                      ? 'bg-[var(--color-accent)] text-white placeholder:text-white/60'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)]'
                  }`}
                />
              </div>
            </div>

            {/* Format */}
            <div className="space-y-3">
              <span className="text-xs text-[var(--color-text-muted)]">Format</span>
              <div className="flex gap-1">
                {EXPORT_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all uppercase ${
                      exportFormat === fmt
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            <div className="pt-2 border-t border-[var(--color-border)]">
              <button
                onClick={handleReset}
                className="w-full py-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Reset to defaults
              </button>
            </div>
          </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex flex-col items-center gap-6">
          {/* Preview */}
          <div
            className="w-[280px] sm:w-[360px] lg:w-[420px] h-[160px] lg:h-[200px] rounded-2xl flex items-center justify-center p-6 transition-colors shadow-xl overflow-hidden"
            style={{ backgroundColor: style.bgColor }}
          >
            {error ? (
              <div className="text-[var(--color-error)] text-sm text-center px-4">{error}</div>
            ) : (
              <div className="flex items-start justify-center" style={{ height: height + 30 }}>
                <svg ref={svgRef} className="block max-w-full shrink-0" />
              </div>
            )}
          </div>

          {/* Format Select + Text Toggle */}
          <div className="flex gap-3 w-full max-w-[320px]">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as BarcodeFormat)}
              className="flex-1 px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none cursor-pointer text-base"
            >
              {BARCODE_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleStyleChange('displayValue', !style.displayValue)}
              className={`px-4 py-3 rounded-2xl transition-all ${
                style.displayValue
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
              title={style.displayValue ? 'Hide text' : 'Show text'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>

          {/* Input */}
          <input
            type="text"
            value={data}
            onChange={(e) => onDataChange(e.target.value)}
            className="w-full max-w-[320px] px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none font-mono text-base"
          />

          {/* Actions */}
          <div className="flex gap-3 w-full max-w-[320px]">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`px-4 py-3 rounded-2xl transition-all ${
                showOptions
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleExport}
              disabled={!isValid || !debouncedData.trim()}
              className="px-4 py-3 rounded-2xl bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={handleCopy}
              disabled={!isValid || !debouncedData.trim()}
              className="flex-1 py-3 rounded-2xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
      </div>

      {/* Copy Toast */}
      {copySuccess && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-[var(--color-accent)] text-white text-sm rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          Copied to clipboard
        </div>
      )}
      {copyError && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-[var(--color-error)] text-white text-sm rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          Copy failed - use HTTPS or download instead
        </div>
      )}
    </div>
  );
}

export default BarcodeGenerator;
