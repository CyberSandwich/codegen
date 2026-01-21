/**
 * QR Code Generator Component - Side panel layout
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQRCode } from '../hooks/useQRCode';
import { useDebounce } from '../hooks/useDebounce';
import { ColorPicker } from './ColorPicker';
import { ERROR_CORRECTION_LEVELS, DEFAULT_MARGIN } from '../constants';
import type { QRErrorCorrectionLevel, QRStyleOptions, ExportFormat } from '../types';
import { renderQRToCanvas } from '../utils/qrRender';

const EXPORT_FORMATS: ExportFormat[] = ['png', 'webp', 'jpg', 'svg'];

const SIZE_OPTIONS = [
  { label: 'S', value: 128 },
  { label: 'M', value: 256 },
  { label: 'L', value: 512 },
  { label: 'XL', value: 1024 },
];

const ICON_LIBRARY = [
  { id: 'none', label: 'None', svg: null },
  { id: 'wifi', label: 'WiFi', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4.9-2.3l1.4 1.4C9.4 18 10.6 18.5 12 18.5s2.6-.5 3.5-1.4l1.4-1.4C15.6 14.6 13.9 14 12 14s-3.6.6-4.9 1.7zM2.9 8.9l1.4 1.4C6.6 8.1 9.2 7 12 7s5.4 1.1 7.7 3.3l1.4-1.4C18.3 6.2 15.3 5 12 5s-6.3 1.2-9.1 3.9z"/></svg>' },
  { id: 'link', label: 'Link', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.7 1.4-3.1 3.1-3.1h4V7H7c-2.8 0-5 2.2-5 5s2.2 5 5 5h4v-1.9H7c-1.7 0-3.1-1.4-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.7 0 3.1 1.4 3.1 3.1s-1.4 3.1-3.1 3.1h-4V17h4c2.8 0 5-2.2 5-5s-2.2-5-5-5z"/></svg>' },
  { id: 'email', label: 'Email', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>' },
  { id: 'phone', label: 'Phone', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.2 2.2z"/></svg>' },
  { id: 'location', label: 'Location', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"/></svg>' },
  { id: 'instagram', label: 'Instagram', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.058-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>' },
  { id: 'twitter', label: 'X', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
  { id: 'facebook', label: 'Facebook', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' },
  { id: 'youtube', label: 'YouTube', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>' },
  { id: 'tiktok', label: 'TikTok', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>' },
  { id: 'linkedin', label: 'LinkedIn', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' },
  { id: 'whatsapp', label: 'WhatsApp', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' },
  { id: 'spotify', label: 'Spotify', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>' },
  { id: 'apple', label: 'Apple', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>' },
  { id: 'store', label: 'Store', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 4l1.6 4H4l1.6-4h12.8M20 2H4L1 10v2h1v8h18v-8h1v-2l-3-8zM3 12h5v6H3v-6zm7 6v-6h4v6h-4zm11 0h-5v-6h5v6z"/></svg>' },
];

interface QRGeneratorProps {
  data: string;
  onDataChange: (data: string) => void;
}

export function QRGenerator({ data, onDataChange }: QRGeneratorProps) {
  const [errorCorrection, setErrorCorrection] = useState<QRErrorCorrectionLevel>('H');
  const [style, setStyle] = useState<QRStyleOptions>({
    fgColor: '#000000',
    bgColor: '#ffffff',
    cornerRadius: 0,
    dotStyle: 'square',
  });
  const [exportSize, setExportSize] = useState(1024);
  const [customSize, setCustomSize] = useState('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [showOptions, setShowOptions] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState('none');
  const [transparentBg, setTransparentBg] = useState(false);
  const [margin, setMargin] = useState(DEFAULT_MARGIN);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_QR_DATA = 'https://saputra.co.uk';
  const debouncedData = useDebounce(data, 300);
  // Use default URL when no data is entered
  const displayData = debouncedData.trim() || DEFAULT_QR_DATA;

  const { canvasRef } = useQRCode({
    data: displayData,
    size: 320,
    margin,
    errorCorrection,
    style,
    logo: logoSrc,
    transparentBg,
  });

  const handleStyleChange = useCallback(
    <K extends keyof QRStyleOptions>(key: K, value: QRStyleOptions[K]) => {
      setStyle((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleExport = useCallback(async () => {
    // Use raw data value or default for immediate response
    const currentData = data.trim() || DEFAULT_QR_DATA;

    const size = customSize ? parseInt(customSize) || exportSize : exportSize;

    // Render QR code at native resolution
    const exportCanvas = await renderQRToCanvas({
      data: currentData,
      size,
      margin,
      errorCorrection,
      style,
      logo: logoSrc,
      transparentBg,
    });

    let dataUrl: string;
    let extension = exportFormat;

    switch (exportFormat) {
      case 'png':
        dataUrl = exportCanvas.toDataURL('image/png');
        break;
      case 'webp':
        dataUrl = exportCanvas.toDataURL('image/webp', 0.92);
        break;
      case 'jpg':
        dataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);
        break;
      case 'svg':
        // Canvas doesn't support SVG export directly, fall back to PNG
        dataUrl = exportCanvas.toDataURL('image/png');
        extension = 'png';
        break;
      default:
        dataUrl = exportCanvas.toDataURL('image/png');
    }

    const link = document.createElement('a');
    link.download = `qrcode.${extension}`;
    link.href = dataUrl;
    link.click();
  }, [data, exportSize, customSize, exportFormat, margin, errorCorrection, style, logoSrc, transparentBg]);

  const handleCopy = useCallback(async () => {
    // Use the preview canvas for immediate copy (maintains user gesture context)
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Try modern Clipboard API - requires secure context (HTTPS)
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined' && window.isSecureContext) {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png', 1.0);
        });

        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 4000);
          return;
        }
      }

      // Show error if clipboard not available
      setCopyError(true);
      setTimeout(() => setCopyError(false), 4000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 4000);
    }
  }, [canvasRef]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoSrc(ev.target?.result as string);
        setSelectedIcon('custom');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, []);

  const handleIconSelect = useCallback((iconId: string, svg: string | null) => {
    setSelectedIcon(iconId);
    if (iconId === 'none') {
      setLogoSrc(null);
    } else if (svg) {
      const coloredSvg = svg.replace('currentColor', style.fgColor);
      const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" ${coloredSvg.slice(5)}`], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      setLogoSrc(url);
    }
  }, [style.fgColor]);

  // Update icon color when foreground color changes
  useEffect(() => {
    if (selectedIcon !== 'none' && selectedIcon !== 'custom') {
      const icon = ICON_LIBRARY.find(i => i.id === selectedIcon);
      if (icon?.svg) {
        const coloredSvg = icon.svg.replace('currentColor', style.fgColor);
        const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" ${coloredSvg.slice(5)}`], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        setLogoSrc(url);
      }
    }
  }, [style.fgColor, selectedIcon]);

  const handleReset = useCallback(() => {
    setErrorCorrection('H');
    setStyle({
      fgColor: '#000000',
      bgColor: '#ffffff',
      cornerRadius: 0,
      dotStyle: 'square',
    });
    setExportSize(1024);
    setCustomSize('');
    setExportFormat('png');
    setLogoSrc(null);
    setSelectedIcon('none');
    setTransparentBg(false);
    setMargin(DEFAULT_MARGIN);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center overflow-visible relative">
      {/* Options Panel - Bottom sheet on mobile, left side on desktop */}
      <div
        className={`fixed lg:absolute z-20 transition-all duration-200 ease-out
          bottom-0 left-0 right-0 lg:bottom-auto lg:left-4 lg:right-auto lg:top-1/2
          ${showOptions
            ? 'opacity-100 translate-y-0 lg:-translate-y-1/2 lg:translate-x-0'
            : 'opacity-0 translate-y-full lg:-translate-y-1/2 lg:-translate-x-8 pointer-events-none'
          }`}
      >
          <div className="w-full lg:w-[300px] p-4 rounded-t-2xl lg:rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] max-h-[60vh] lg:max-h-none overflow-y-auto overflow-visible">
            {/* Mobile Header */}
            <div className="flex justify-between items-center mb-4 lg:hidden">
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
            {/* Size Section */}
            <div className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">Size</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{customSize || exportSize}px</span>
              </div>
              <div className="flex gap-1">
                {SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => { setExportSize(opt.value); setCustomSize(''); }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      exportSize === opt.value && !customSize
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-primary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <input
                  type="text"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value.replace(/\D/g, ''))}
                  placeholder="Custom"
                  className={`w-16 py-1.5 px-2 text-xs text-center rounded-lg transition-all ${
                    customSize
                      ? 'bg-[var(--color-accent)] text-white placeholder:text-white/60'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)]'
                  }`}
                />
              </div>
            </div>

            {/* Format Section */}
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5 font-medium">Format</div>
              <div className="flex gap-1">
                {EXPORT_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all uppercase ${
                      exportFormat === fmt
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-primary)]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--color-border)] my-4" />

            {/* Colors Section */}
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 font-medium">Colors</div>
              <div className="flex gap-2 items-center overflow-visible">
                <div className="flex-1 overflow-visible">
                  <ColorPicker value={style.fgColor} onChange={(color) => handleStyleChange('fgColor', color)} />
                </div>
                {!transparentBg && (
                  <div className="flex-1 overflow-visible">
                    <ColorPicker value={style.bgColor} onChange={(color) => handleStyleChange('bgColor', color)} />
                  </div>
                )}
                <button
                  onClick={() => setTransparentBg(!transparentBg)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    transparentBg
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                  }`}
                  title="Transparent background"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h4v4H4zM12 4h4v4h-4zM4 12h4v4H4zM12 12h4v4h-4z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--color-border)] my-4" />

            {/* Margin Section */}
            <div className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">Margin</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{margin}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                step={4}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-[var(--color-bg-tertiary)] cursor-pointer"
              />
            </div>

            {/* Redundancy Section */}
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5 font-medium">Redundancy</div>
              <div className="flex gap-1">
                {ERROR_CORRECTION_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setErrorCorrection(level.value)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      errorCorrection === level.value
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-primary)]'
                    }`}
                  >
                    {level.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--color-border)] my-4" />

            {/* Logo Section */}
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 font-medium">Logo</div>
              <div className="flex gap-1.5 flex-wrap">
                {/* None button */}
                <button
                  onClick={() => handleIconSelect('none', null)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-xs ${
                    selectedIcon === 'none'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-primary)]'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Custom upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    selectedIcon === 'custom'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-primary)]'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                {/* Icon options */}
                {ICON_LIBRARY.filter(i => i.id !== 'none').map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => handleIconSelect(icon.id, icon.svg)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      selectedIcon === icon.id
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-primary)]'
                    }`}
                    title={icon.label}
                  >
                    <div className="w-3.5 h-3.5" dangerouslySetInnerHTML={{ __html: icon.svg || '' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--color-border)] my-4" />

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full py-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Reset to defaults
            </button>
          </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex flex-col items-center gap-6">
          {/* Preview */}
          <div
            className="w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] lg:w-[320px] lg:h-[320px] rounded-2xl flex items-center justify-center p-4 transition-colors shadow-xl"
            style={{ backgroundColor: transparentBg ? '#e5e5e5' : style.bgColor }}
          >
            <canvas ref={canvasRef} className="block w-full h-full" />
          </div>

          {/* Input */}
          <textarea
            value={data}
            onChange={(e) => onDataChange(e.target.value)}
            rows={2}
            className="w-full max-w-[320px] px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-primary)] resize-none focus:border-[var(--color-accent)] focus:outline-none text-base text-center"
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
              className="px-4 py-3 rounded-2xl bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 py-3 rounded-2xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors flex items-center justify-center"
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

export default QRGenerator;
