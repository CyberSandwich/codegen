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
├── hooks/          # Custom React hooks (generation/scanning logic)
├── utils/          # Utility functions (export, scanning)
├── types/          # TypeScript type definitions
├── constants/      # Configuration and default values
├── App.tsx         # Main app with tab navigation
└── index.css       # Global styles + Tailwind theme
```

## Key Files

- `src/App.tsx` - Main application entry, tab navigation
- `src/hooks/useQRCode.ts` - QR code generation logic
- `src/hooks/useBarcode.ts` - Barcode generation logic
- `src/hooks/useScanner.ts` - Image scanning with drag-drop/paste
- `src/components/ExportPanel.tsx` - Export format/size selection
- `src/constants/index.ts` - All configuration values

## Tech Stack

- **Vite** - Build tool
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling (using @tailwindcss/vite plugin)
- **qrcode** - QR code generation
- **jsbarcode** - Barcode generation
- **jsqr** - QR code scanning from images
- **html-to-image** - Export functionality

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
- Prefer `useCallback` and extract individual style values rather than useMemo for objects (to satisfy React Compiler lint rules)
- Handle errors gracefully with user feedback
- Include JSDoc comments on exported functions

### Testing Changes

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Check for issues
npm run preview  # Preview production build
```

## Common Tasks

### Add new barcode format

1. Add to `BARCODE_FORMATS` in `constants/index.ts`
2. Add validation pattern if needed
3. JsBarcode handles rendering automatically

### Add new export format

1. Add to `ExportFormat` type in `types/index.ts`
2. Implement conversion in `utils/export.ts`
3. Add UI option in `ExportPanel.tsx`

### Modify color scheme

1. Update CSS variables in `index.css` under `@theme`
2. Keep dark mode aesthetic
3. Ensure sufficient contrast

## Don'ts

- Don't add analytics or tracking
- Don't make network requests
- Don't add gradients or heavy visual effects
- Don't add unnecessary text/labels
- Don't over-engineer - keep solutions simple
- Don't add accounts/authentication
