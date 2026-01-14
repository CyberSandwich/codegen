/**
 * Barcode Generator Component
 *
 * Provides a complete barcode generation interface with:
 * - Format selection (CODE128, EAN-13, UPC, etc.)
 * - Data input with format validation
 * - Color customization
 * - Display options (show/hide text)
 * - Real-time preview
 */

import { useState, useCallback, useRef } from 'react';
import { useBarcode } from '../hooks/useBarcode';
import { ExportPanel } from './ExportPanel';
import { ColorPicker } from './ColorPicker';
import {
  BARCODE_FORMATS,
  DEFAULT_BARCODE_WIDTH,
  DEFAULT_BARCODE_HEIGHT,
  COLOR_PRESETS,
} from '../constants';
import type { BarcodeFormat, BarcodeStyleOptions } from '../types';

export function BarcodeGenerator() {
  const [data, setData] = useState('');
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [width, setWidth] = useState(DEFAULT_BARCODE_WIDTH);
  const [height, setHeight] = useState(DEFAULT_BARCODE_HEIGHT);
  const [style, setStyle] = useState<BarcodeStyleOptions>({
    lineColor: '#ffffff',
    bgColor: '#0a0a0b',
    displayValue: true,
    font: 'monospace',
    fontSize: 14,
    textAlign: 'center',
    textMargin: 4,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const { svgRef, isValid, error } = useBarcode({
    data,
    format,
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

  const selectedFormat = BARCODE_FORMATS.find((f) => f.value === format);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl mx-auto">
      {/* Controls Panel */}
      <div className="flex-1 space-y-4">
        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
            Format
          </label>
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value as BarcodeFormat);
              setData(''); // Clear data on format change
            }}
            className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors cursor-pointer"
          >
            {BARCODE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Data Input */}
        <div>
          <input
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder={selectedFormat?.placeholder || 'Enter data...'}
            className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none transition-colors font-mono"
          />
          {data && !isValid && (
            <p className="mt-1 text-xs text-[var(--color-error)]">
              Invalid format for {selectedFormat?.label}
            </p>
          )}
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            label="Lines"
            value={style.lineColor}
            onChange={(color) => handleStyleChange('lineColor', color)}
            presets={COLOR_PRESETS}
          />
          <ColorPicker
            label="Background"
            value={style.bgColor}
            onChange={(color) => handleStyleChange('bgColor', color)}
            presets={COLOR_PRESETS}
          />
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              Bar Width: {width}
            </label>
            <input
              type="range"
              min={1}
              max={4}
              step={0.5}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              Height: {height}px
            </label>
            <input
              type="range"
              min={40}
              max={200}
              step={10}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Display Options */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleStyleChange('displayValue', !style.displayValue)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              style.displayValue
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-focus)]'
            }`}
          >
            Show Text
          </button>
        </div>

        {/* Export Panel */}
        {isValid && data.trim() && (
          <ExportPanel
            elementRef={containerRef}
            svgRef={svgRef}
            filename="barcode"
            type="barcode"
          />
        )}
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex items-center justify-center">
        <div
          ref={containerRef}
          className="relative p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] overflow-hidden"
          style={{ backgroundColor: style.bgColor }}
        >
          {!data.trim() ? (
            <div className="w-64 h-32 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
              Enter data to generate
            </div>
          ) : error ? (
            <div className="w-64 h-32 flex items-center justify-center text-[var(--color-error)] text-sm text-center px-4">
              {error}
            </div>
          ) : (
            <svg ref={svgRef} className="block max-w-full" />
          )}
        </div>
      </div>
    </div>
  );
}

export default BarcodeGenerator;
