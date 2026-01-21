/**
 * Export Panel Component
 *
 * Provides export options for generated codes including:
 * - Format selection (PNG, JPG, SVG)
 * - Size presets and custom dimensions
 * - Download trigger
 */

import { useState, useCallback } from 'react';
import { exportCanvas, exportSvg } from '../utils/export';
import { SIZE_PRESETS, BARCODE_SIZE_PRESETS, DEFAULT_JPG_QUALITY } from '../constants';
import type { ExportFormat } from '../types';

interface ExportPanelProps {
  elementRef?: React.RefObject<HTMLDivElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  filename?: string;
  type?: 'qr' | 'barcode';
}

const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'svg', label: 'SVG' },
];

export function ExportPanel({
  canvasRef,
  svgRef,
  filename = 'code',
  type = 'qr',
}: ExportPanelProps) {
  const presets = type === 'barcode' ? BARCODE_SIZE_PRESETS : SIZE_PRESETS;

  const [format, setFormat] = useState<ExportFormat>('png');
  const [selectedPreset, setSelectedPreset] = useState<number>(1); // Medium
  const [customSize, setCustomSize] = useState({ width: 256, height: 256 });
  const [useCustom, setUseCustom] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentSize = useCustom ? customSize : presets[selectedPreset];

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const options = {
        format,
        width: currentSize.width,
        height: currentSize.height,
        quality: DEFAULT_JPG_QUALITY,
        filename,
      };

      // For canvas (QR codes)
      if (canvasRef?.current) {
        exportCanvas(canvasRef.current, options);
      }
      // For SVG (barcodes)
      else if (svgRef?.current) {
        await exportSvg(svgRef.current, options);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [format, currentSize, filename, canvasRef, svgRef]);

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    setUseCustom(false);
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-[var(--color-bg-secondary)]">
      {/* Format Selection */}
      <div className="flex gap-2">
        {EXPORT_FORMATS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFormat(f.value)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
              format === f.value
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Size Presets */}
      <div className="flex gap-2 flex-wrap">
        {presets.map((preset, index) => (
          <button
            key={preset.label}
            onClick={() => handlePresetSelect(index)}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${
              !useCustom && selectedPreset === index
                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-accent)]'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setUseCustom(true)}
          className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${
            useCustom
              ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-accent)]'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom Size Input */}
      {useCustom && (
        <div className="flex gap-3 items-center">
          <input
            type="number"
            value={customSize.width}
            onChange={(e) =>
              setCustomSize((s) => ({ ...s, width: Math.max(32, Number(e.target.value)) }))
            }
            className="w-24 px-3 py-2 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
            min={32}
            max={4096}
          />
          <span className="text-[var(--color-text-muted)]">×</span>
          <input
            type="number"
            value={customSize.height}
            onChange={(e) =>
              setCustomSize((s) => ({ ...s, height: Math.max(32, Number(e.target.value)) }))
            }
            className="w-24 px-3 py-2 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
            min={32}
            max={4096}
          />
          <span className="text-xs text-[var(--color-text-muted)]">px</span>
        </div>
      )}

      {/* Current Size Display */}
      <div className="text-xs text-[var(--color-text-muted)]">
        {currentSize.width} × {currentSize.height} px
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? 'Exporting...' : 'Download'}
      </button>
    </div>
  );
}

export default ExportPanel;
