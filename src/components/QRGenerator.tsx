/**
 * QR Code Generator Component
 *
 * Provides a complete QR code generation interface with:
 * - Text/URL input
 * - Error correction level selection
 * - Color customization (foreground/background)
 * - Size adjustment
 * - Real-time preview
 */

import { useState, useCallback, useRef } from 'react';
import { useQRCode } from '../hooks/useQRCode';
import { ExportPanel } from './ExportPanel';
import { ColorPicker } from './ColorPicker';
import { ERROR_CORRECTION_LEVELS, DEFAULT_QR_SIZE, COLOR_PRESETS } from '../constants';
import type { QRErrorCorrectionLevel, QRStyleOptions } from '../types';

export function QRGenerator() {
  const [data, setData] = useState('');
  const [errorCorrection, setErrorCorrection] = useState<QRErrorCorrectionLevel>('M');
  const [size, setSize] = useState(DEFAULT_QR_SIZE);
  const [style, setStyle] = useState<QRStyleOptions>({
    fgColor: '#ffffff',
    bgColor: '#0a0a0b',
    cornerRadius: 0,
    dotStyle: 'square',
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const { canvasRef, isValid, error } = useQRCode({
    data,
    size,
    errorCorrection,
    style,
  });

  const handleStyleChange = useCallback(
    <K extends keyof QRStyleOptions>(key: K, value: QRStyleOptions[K]) => {
      setStyle((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl mx-auto">
      {/* Controls Panel */}
      <div className="flex-1 space-y-4">
        {/* Data Input */}
        <div>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Enter text or URL..."
            className="w-full h-24 px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:border-[var(--color-accent)] focus:outline-none transition-colors"
          />
        </div>

        {/* Error Correction */}
        <div className="space-y-2">
          <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
            Redundancy
          </label>
          <div className="flex gap-2">
            {ERROR_CORRECTION_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setErrorCorrection(level.value)}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  errorCorrection === level.value
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-focus)]'
                }`}
                title={`${level.recovery} recovery`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            label="Foreground"
            value={style.fgColor}
            onChange={(color) => handleStyleChange('fgColor', color)}
            presets={COLOR_PRESETS}
          />
          <ColorPicker
            label="Background"
            value={style.bgColor}
            onChange={(color) => handleStyleChange('bgColor', color)}
            presets={COLOR_PRESETS}
          />
        </div>

        {/* Size */}
        <div className="space-y-2">
          <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
            Size: {size}px
          </label>
          <input
            type="range"
            min={64}
            max={512}
            step={8}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>

        {/* Export Panel */}
        {isValid && (
          <ExportPanel
            elementRef={containerRef}
            canvasRef={canvasRef}
            filename="qrcode"
            type="qr"
          />
        )}
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex items-center justify-center">
        <div
          ref={containerRef}
          className="relative p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
          style={{ backgroundColor: style.bgColor }}
        >
          {!isValid ? (
            <div className="w-64 h-64 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
              Enter data to generate
            </div>
          ) : error ? (
            <div className="w-64 h-64 flex items-center justify-center text-[var(--color-error)] text-sm text-center px-4">
              {error}
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="block"
              style={{ borderRadius: style.cornerRadius > 0 ? '8px' : '0' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default QRGenerator;
