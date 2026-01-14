# CodeGen Architecture

Technical documentation for AI assistants and developers maintaining this codebase.

## Overview

CodeGen is a privacy-focused QR code and barcode generation/scanning web application.
All processing happens client-side. No data is sent to any server.

## Tech Stack

- **Build Tool**: Vite 7.x
- **Framework**: React 19.x with TypeScript
- **Styling**: Tailwind CSS 4.x (using the new `@tailwindcss/vite` plugin)
- **QR Generation**: `qrcode` library
- **Barcode Generation**: `jsbarcode` library
- **QR Scanning**: `jsqr` library
- **Image Export**: `html-to-image` library

## Directory Structure

```
src/
├── components/          # React UI components
│   ├── index.ts        # Component exports
│   ├── QRGenerator.tsx # QR code creation interface
│   ├── BarcodeGenerator.tsx # Barcode creation interface
│   ├── Scanner.tsx     # QR/barcode reading interface
│   ├── ExportPanel.tsx # Export format/size selection
│   └── ColorPicker.tsx # Color selection with presets
├── hooks/              # Custom React hooks
│   ├── index.ts        # Hook exports
│   ├── useQRCode.ts    # QR generation logic
│   ├── useBarcode.ts   # Barcode generation logic
│   └── useScanner.ts   # Image scanning logic
├── utils/              # Utility functions
│   ├── export.ts       # Image export utilities
│   └── scanner.ts      # QR scanning utilities
├── types/              # TypeScript definitions
│   └── index.ts        # All type definitions
├── constants/          # Configuration constants
│   └── index.ts        # Default values, presets, formats
├── App.tsx             # Main app component
├── main.tsx            # React entry point
└── index.css           # Global styles + Tailwind
```

## Key Patterns

### State Management

Simple React `useState` hooks. No external state management.
Each generator component manages its own configuration state.

### Code Generation Flow

1. User input → Component state update
2. State changes trigger hook re-render
3. Hook generates code via library (qrcode/jsbarcode)
4. Result rendered to canvas/SVG element
5. Export panel reads from canvas/SVG for download

### Scanner Flow

1. User provides image (drag-drop, paste, or file picker)
2. Image converted to ImageData via canvas
3. jsQR scans ImageData for QR codes
4. Result displayed with copy/open actions

## Component Responsibilities

### QRGenerator

- Text/URL input field
- Error correction level selector (L/M/Q/H)
- Foreground/background color pickers
- Size slider
- Renders preview canvas
- Triggers ExportPanel

### BarcodeGenerator

- Format selector (CODE128, EAN-13, etc.)
- Data input with format validation
- Color pickers for lines/background
- Bar width and height controls
- Show/hide text toggle
- Renders preview SVG
- Triggers ExportPanel

### Scanner

- Drop zone for drag-and-drop
- Hidden file input for click-to-open
- Global paste listener (Ctrl/Cmd+V)
- Result display with copy button
- URL detection with "Open Link" button

### ExportPanel

- Format selection (PNG, JPG, SVG)
- Size presets (Small, Medium, Large, XL)
- Custom size inputs
- Download trigger

### ColorPicker

- Current color preview
- Preset color swatches
- Native color input
- Hex value input

## Hooks

### useQRCode

**Input**: `{ data, size, margin, errorCorrection, style }`
**Output**: `{ canvasRef, isValid, error, regenerate }`

Generates QR code on canvas whenever inputs change.
Uses the qrcode library's `toCanvas` method.

### useBarcode

**Input**: `{ data, format, width, height, margin, style }`
**Output**: `{ svgRef, isValid, error, regenerate }`

Generates barcode on SVG whenever inputs change.
Validates data against format requirements before rendering.

### useScanner

**Input**: None
**Output**: `{ result, isScanning, error, isDragOver, handlers, clearResult }`

Manages all scanning interactions:
- File input change
- Drag over/leave/drop
- Global paste events

## Styling Architecture

Uses CSS custom properties defined in `index.css`:

```css
--color-bg-primary: #0a0a0b      /* Main background */
--color-bg-secondary: #141416    /* Card backgrounds */
--color-bg-tertiary: #1c1c1f     /* Elevated elements */
--color-bg-hover: #252528        /* Hover states */
--color-border: #2a2a2e          /* Default borders */
--color-border-focus: #3a3a3f    /* Focus borders */
--color-text-primary: #fafafa    /* Main text */
--color-text-secondary: #a1a1a6  /* Secondary text */
--color-text-muted: #6b6b70      /* Muted/placeholder */
--color-accent: #6366f1          /* Primary action color */
--color-accent-hover: #818cf8    /* Accent hover */
--color-success: #22c55e         /* Success states */
--color-error: #ef4444           /* Error states */
```

All components use these variables via Tailwind's arbitrary value syntax:
`bg-[var(--color-bg-secondary)]`

## Adding New Features

### New Barcode Format

1. Add to `BARCODE_FORMATS` in `constants/index.ts`
2. Add validation pattern if needed
3. jsbarcode handles rendering automatically

### New Export Format

1. Add format to `ExportFormat` type in `types/index.ts`
2. Add to `EXPORT_FORMATS` in `ExportPanel.tsx`
3. Implement conversion in `utils/export.ts`

### New QR Style Option

1. Add property to `QRStyleOptions` type
2. Add default in `DEFAULT_QR_STYLE` constant
3. Add UI control in `QRGenerator.tsx`
4. If complex, implement in `applyCustomStyle` function

## Performance Considerations

- No gradients or complex visual effects
- Canvas used for QR codes (fast rendering)
- SVG used for barcodes (scalable, lightweight)
- Lazy rendering (only generates when data is present)
- No external fonts (uses system font stack)
- Minimal dependencies

## Bundle Size

Target: Under 150KB gzipped for JS bundle.
Current libraries are chosen for their small footprints.

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Requires: Canvas API, Clipboard API, File API

## Testing

No test framework configured yet. Recommended:
- Vitest for unit tests
- Playwright for E2E tests

## Accessibility

- All interactive elements are keyboard accessible
- Focus states visible via `focus-visible` outline
- Color contrast meets WCAG AA
- SVG icons have title attributes
