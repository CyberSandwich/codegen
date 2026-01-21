# CodeGen - AI Development Guide

This document provides context for AI assistants working on this codebase.

## Project Overview

CodeGen is a privacy-focused web application for generating and scanning QR codes and barcodes. All processing happens client-side - no data is ever sent to any server.

## Core Principles

1. **Privacy First** - No analytics, no tracking, no server calls. Everything runs locally in the browser.

2. **Simplicity** - Minimal UI with as few words as possible. Users should understand functionality through visual design rather than text labels.

3. **Performance** - No heavy visual effects (gradients, animations, shadows). Keep bundle size small. Use efficient rendering (canvas for QR, SVG for barcodes).

4. **Accessibility** - All interactive elements keyboard accessible. Proper focus states. Sufficient color contrast.

5. **Responsiveness** - Works equally well on mobile and desktop. Touch-friendly interaction areas.

## Architecture Summary

```
src/
├── components/     # React UI components
│   ├── QRGenerator.tsx      # QR code generation with logo/icon support
│   ├── BarcodeGenerator.tsx # Barcode generation with format selection
│   ├── Toast.tsx            # Notifications with multi-item support
│   └── ColorPicker.tsx      # Color selection component
├── hooks/          # Custom React hooks
│   ├── useQRCode.ts         # QR code generation with canvas rendering
│   ├── useBarcode.ts        # Barcode generation and validation
│   └── useDebounce.ts       # Input debouncing
├── utils/          # Utility functions
│   ├── scanner.ts           # Multi-code scanning from images
│   ├── export.ts            # Export to PNG/JPG/WebP/SVG
│   └── qrRender.ts          # High-res QR rendering for export
├── types/          # TypeScript type definitions
├── constants/      # Configuration and default values
├── App.tsx         # Main app with tab navigation, paste/drop handlers
└── index.css       # Global styles + Tailwind theme
```

## Key Features

### Code Generation
- **QR Codes**: Customizable colors, corner radius, dot styles, logo/icon overlay
- **Barcodes**: Multiple formats (CODE128, EAN13, UPC, etc.) with real-time validation
- **Export**: PNG, JPG, WebP, SVG at customizable sizes

### Scanning (Paste/Drop)
- **Multi-code detection**: Can find multiple QR codes and barcodes in a single image
- **Link extraction**: Extracts URLs from pasted text
- **Grid-based scanning**: Uses overlapping image sections to find multiple QR codes
- **Unified results**: Toast shows all found items (QR, barcode, link) with copy buttons

## Tech Stack

- **Vite** - Build tool with code splitting
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling (using @tailwindcss/vite plugin)
- **qrcode** - QR code generation
- **jsbarcode** - Barcode generation
- **jsqr** - QR code scanning from images
- **@ericblade/quagga2** - Barcode scanning from images
- **html-to-image** - Export functionality

## Bundle Optimization

The build is split into optimized chunks via `vite.config.ts`:
- `react` - React core (~11KB gzip)
- `generators` - qrcode + jsbarcode (~24KB gzip)
- `scanners` - jsqr + quagga2 (~92KB gzip)
- `index` - Main app code (~73KB gzip)

## Design System

Colors are defined as CSS custom properties in `index.css`:
- `--color-bg-primary` through `--color-bg-hover` for backgrounds
- `--color-text-primary` through `--color-text-muted` for text
- `--color-accent` and `--color-accent-hover` for interactive elements
- `--color-border` and `--color-border-focus` for borders

Use these via Tailwind: `bg-[var(--color-bg-secondary)]`

## Development Guidelines

### Adding Features

1. Keep UI minimal - prefer icons over text labels
2. Add new constants to `src/constants/index.ts`
3. Add new types to `src/types/index.ts`
4. Follow existing component patterns
5. Maintain dark mode aesthetic

### Code Style

- Use functional components with hooks
- Prefer `useCallback` for callbacks and `useMemo` for derived values
- Extract individual style values rather than using object literals in dependencies
- Handle errors gracefully with user feedback via Toast
- Include JSDoc comments on exported functions

### Clipboard Handling (Important)

When copying images to clipboard, use the Promise-based pattern for Safari compatibility:

```typescript
// Safari requires Promise passed directly to ClipboardItem
const blobPromise = new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error('Failed to create blob'));
  }, 'image/png', 1.0);
});
await navigator.clipboard.write([
  new ClipboardItem({ 'image/png': blobPromise }),
]);
```

Do NOT await the blob first - this breaks the user gesture context in Safari.

### Barcode Validation

Each barcode format has specific validation requirements in `useBarcode.ts`:
- EAN13: 12-13 digits
- EAN8: 7-8 digits
- UPC: 11-12 digits
- CODE128: Any characters
- ITF14: Exactly 14 digits
- Pharmacode: Number 3-131070

Demo data is auto-populated when switching formats via `BARCODE_FORMATS` in constants.

### Testing Changes

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Check for issues
npm run preview  # Preview production build
```

## Common Tasks

### Add new barcode format

1. Add to `BARCODE_FORMATS` in `constants/index.ts` with appropriate placeholder
2. Add validation pattern in `useBarcode.ts` `validateBarcodeData()` function
3. JsBarcode handles rendering automatically

### Add new export format

1. Add to `ExportFormat` type in `types/index.ts`
2. Implement conversion in `utils/export.ts`
3. Add UI option in generator components

### Modify color scheme

1. Update CSS variables in `index.css` under `@theme`
2. Keep dark mode aesthetic
3. Ensure sufficient contrast

### Add new icon to QR logo library

1. Add to `ICON_LIBRARY` array in `QRGenerator.tsx`
2. Use simple SVG with `currentColor` fill for color adaptation
3. Keep viewBox as `0 0 24 24` for consistency

## Don'ts

- Don't add analytics or tracking
- Don't make network requests
- Don't add gradients or heavy visual effects
- Don't add unnecessary text/labels
- Don't over-engineer - keep solutions simple
- Don't add accounts/authentication
- Don't call setState synchronously in effects (lint error)
- Don't await blobs before passing to ClipboardItem (Safari breaks)
