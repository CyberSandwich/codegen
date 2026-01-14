/**
 * CodeGen - QR Code & Barcode Generation Suite
 *
 * Main application component that orchestrates the UI layout
 * and tab-based navigation between generator and scanner modes.
 */

import { useState, type ReactNode } from 'react';
import { QRGenerator } from './components/QRGenerator';
import { BarcodeGenerator } from './components/BarcodeGenerator';
import { Scanner } from './components/Scanner';
import type { AppMode } from './types';

/** Tab configuration with icons */
const TABS: { id: AppMode; icon: ReactNode }[] = [
  {
    id: 'qr',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm11-2h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h4v2h-4v-2zm0 4h2v2h-2v-2zm4 0h2v2h-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'barcode',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm2 0h2v16H8V4zm3 0h2v16h-2V4zm3 0h1v16h-1V4zm2 0h3v16h-3V4zm4 0h2v16h-2V4z" />
      </svg>
    ),
  },
  {
    id: 'scan',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 12h10" />
      </svg>
    ),
  },
];

function App() {
  // Default to QR code generation as per requirements
  const [activeTab, setActiveTab] = useState<AppMode>('qr');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
          CodeGen
        </h1>

        {/* Tab Navigation */}
        <nav className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-secondary)]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
              title={tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}
            >
              {tab.icon}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {activeTab === 'qr' && <QRGenerator />}
        {activeTab === 'barcode' && <BarcodeGenerator />}
        {activeTab === 'scan' && <Scanner />}
      </main>

      {/* Footer - minimal */}
      <footer className="px-4 py-2 text-center text-xs text-[var(--color-text-muted)]">
        <span className="opacity-50">Local-only. No data leaves your device.</span>
      </footer>
    </div>
  );
}

export default App;
