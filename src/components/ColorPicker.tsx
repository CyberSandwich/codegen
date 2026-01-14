/**
 * Color Picker Component
 *
 * Minimal color picker with preset swatches and custom input.
 * Designed for quick color selection without heavy UI libraries.
 */

import { useState, useRef } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
}

export function ColorPicker({ label, value, onChange, presets = [] }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
        {label}
      </label>

      <div className="relative">
        {/* Color Preview Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-focus)] transition-colors flex items-center gap-2 px-2"
        >
          <div
            className="w-6 h-6 rounded border border-[var(--color-border)]"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm text-[var(--color-text-secondary)] font-mono">
            {value.toUpperCase()}
          </span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-12 left-0 right-0 z-20 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] shadow-lg">
              {/* Presets */}
              {presets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        onChange(preset);
                        setIsOpen(false);
                      }}
                      className={`w-7 h-7 rounded border-2 transition-colors ${
                        value === preset
                          ? 'border-[var(--color-accent)]'
                          : 'border-transparent hover:border-[var(--color-border-focus)]'
                      }`}
                      style={{ backgroundColor: preset }}
                      title={preset}
                    />
                  ))}
                </div>
              )}

              {/* Custom Input */}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-10 h-8 cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      onChange(val);
                    }
                  }}
                  className="flex-1 px-2 py-1 text-sm font-mono bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                  maxLength={7}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ColorPicker;
