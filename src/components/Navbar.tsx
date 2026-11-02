import React from 'react';
import { PrinterDevice, PlatformViewMode } from '../types';
import {
  Printer,
  Wifi,
  Usb,
  Sun,
  Moon,
  Download,
  Laptop,
  Smartphone,
  Link,
  Layers,
  Package,
} from 'lucide-react';

interface NavbarProps {
  activePrinter: PrinterDevice;
  onOpenPrinterModal: () => void;
  onOpenAndroidProject: () => void;
  onOpenWindowsProject: () => void;
  onOpenPairingModal: () => void;
  onOpenUpdates?: () => void;
  platformMode: PlatformViewMode;
  onTogglePlatformMode: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePrinter,
  onOpenPrinterModal,
  onOpenAndroidProject,
  onOpenWindowsProject,
  onOpenPairingModal,
  onOpenUpdates,
  platformMode,
  onTogglePlatformMode,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#101114] border-b border-[#292A30] transition-colors">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#222329] border border-[#292A30] text-[#F5F5F7] flex items-center justify-center font-bold text-xs tracking-wider">
            SX
          </div>
          <div>
            <h1 className="font-bold text-base text-[#F5F5F7] leading-tight">
              Sowji Xerox
            </h1>
          </div>
        </div>

        {/* Minimal Right Actions */}
        <div className="flex items-center gap-2">
          {/* Active printer quick status indicator */}
          <button
            onClick={onOpenPrinterModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#191A1F] border border-[#292A30] text-xs text-[#F5F5F7] hover:border-[#393A42] transition-colors"
            title="Manage Connected Printers"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-[#A5A5AD] truncate max-w-[120px]">
              {activePrinter.model === 'HP_M1005' ? 'HP M1005' : 'Canon G3010'}
            </span>
          </button>

          {/* In-App Update shortcut */}
          {onOpenUpdates && (
            <button
              onClick={onOpenUpdates}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#191A1F] border border-[#292A30] text-xs text-[#A5A5AD] hover:text-[#F5F5F7] hover:border-indigo-500/50 transition-colors"
              title="Check Sowji Xerox Updates"
            >
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-semibold hidden sm:inline">v2.4.0</span>
            </button>
          )}

          {/* Platform toggle (Windows/Android preview) */}
          <button
            onClick={onTogglePlatformMode}
            className="p-1.5 rounded-full bg-[#191A1F] border border-[#292A30] text-[#A5A5AD] hover:text-[#F5F5F7] hover:border-[#393A42] transition-colors"
            title={platformMode === 'WINDOWS' ? 'Switch to Android View' : 'Switch to Windows Desktop View'}
          >
            {platformMode === 'WINDOWS' ? (
              <Laptop className="w-4 h-4 text-indigo-400" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
