import React, { useState } from 'react';
import {
  PrinterDevice,
  PrintJob,
  PlatformViewMode,
} from '../types';
import {
  Printer,
  FileText,
  ScanLine,
  ChevronRight,
  Usb,
  Wifi,
  Play,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  LayoutGrid,
  Grid,
  Sparkles,
  Laptop,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { NavTab } from './BottomNav';

interface HomeScreenProps {
  activePrinter: PrinterDevice | null;
  onSwitchPrinter: (model: 'CANON_G3010' | 'HP_M1005') => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenPassportStudio: () => void;
  onOpenPhotoPrint: () => void;
  onOpenSheetGenerator: () => void;
  onOpenDocuments: () => void;
  onOpenFourSection: () => void;
  onOpenOneByOne: () => void;
  onOpenAndroidProject: () => void;
  onOpenWindowsProject: () => void;
  onOpenPairingModal: () => void;
  onOpenPrintersManagement?: () => void;
  onOpenScanScreen?: () => void;
  onOpenTestPrint?: (printer: PrinterDevice) => void;
  onOpenHistory?: () => void;
  platformMode: PlatformViewMode;
  recentJobs: PrintJob[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activePrinter,
  onSwitchPrinter,
  onNavigateTab,
  onOpenPassportStudio,
  onOpenPhotoPrint,
  onOpenSheetGenerator,
  onOpenDocuments,
  onOpenFourSection,
  onOpenOneByOne,
  onOpenAndroidProject,
  onOpenWindowsProject,
  onOpenPairingModal,
  onOpenPrintersManagement,
  onOpenScanScreen,
  onOpenTestPrint,
  onOpenHistory,
  platformMode,
  recentJobs,
}) => {
  const [showTools, setShowTools] = useState<boolean>(true);
  const isHp = activePrinter?.model === 'HP_M1005';
  const isVerified = !!activePrinter && activePrinter.verifiedCommunication && activePrinter.status === 'READY';
  const isUnverified = !!activePrinter && (!activePrinter.verifiedCommunication || activePrinter.status === 'UNVERIFIED');

  return (
    <div className="space-y-6 pb-28 max-w-xl mx-auto px-1 sm:px-0">
      {/* 1. Header: Display Sowji Xerox at the top - Large bold white title */}
      <header className="pt-2 px-1">
        <h1 className="text-[28px] sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight leading-none">
          Sowji Xerox
        </h1>
        <p className="text-xs text-[#A5A5AD] font-medium mt-1">
          Your Smart Printing Studio
        </p>
      </header>

      {/* 2. Printer Connection Card (Matches Reference Card) */}
      <section className="bg-[#191A1F] border border-[#292A30] rounded-[22px] p-5 shadow-lg transition-all">
        {!activePrinter ? (
          // Disconnected State
          <div className="flex flex-col items-center text-center py-3">
            <div className="w-14 h-14 rounded-full bg-[#222329] border border-[#292A30] flex items-center justify-center text-[#A5A5AD] mb-3">
              <Usb className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h2 className="text-base font-semibold text-[#F5F5F7]">
              No printer configured
            </h2>
            <p className="text-xs text-[#A5A5AD] mt-1 max-w-xs leading-relaxed">
              Connect Canon PIXMA G3010 or HP LaserJet M1005 using USB OTG or Wi-Fi.
            </p>
            <button
              onClick={() => onOpenPrintersManagement ? onOpenPrintersManagement() : onNavigateTab('PRINT')}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#222329] hover:bg-[#2c2d35] text-[#F5F5F7] text-xs font-semibold border border-[#292A30] transition-colors"
            >
              Find a printer
            </button>
          </div>
        ) : (
          // Selected Printer (Verified or Unverified)
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#222329] border border-[#292A30] flex items-center justify-center text-[#F5F5F7] shrink-0">
                  <Printer className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isVerified
                          ? 'bg-emerald-500 animate-pulse'
                          : isUnverified
                          ? 'bg-amber-400'
                          : 'bg-red-500'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider ${
                        isVerified
                          ? 'text-emerald-400'
                          : isUnverified
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {isVerified
                        ? 'Ready to Print · Verified'
                        : isUnverified
                        ? 'Unverified Connection'
                        : `Offline (${activePrinter.status})`}
                    </span>
                    <span className="text-[#A5A5AD] text-xs">·</span>
                    <span className="text-xs text-[#A5A5AD] font-mono">
                      {isHp ? 'USB OTG' : 'Wi-Fi 802.11n'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#F5F5F7] leading-snug mt-0.5">
                    {activePrinter?.name}
                  </h2>
                  <p className="text-xs text-[#A5A5AD]">
                    {isHp ? 'Host-Based ZjStream · 600 DPI Mono' : 'MegaTank CISS · 4800×1200 DPI Colour'}
                  </p>
                </div>
              </div>

              {onOpenPrintersManagement && (
                <button
                  onClick={onOpenPrintersManagement}
                  className="px-3 py-1.5 rounded-full bg-[#222329] hover:bg-[#2c2d35] border border-[#292A30] text-xs font-semibold text-[#F5F5F7] transition-colors"
                >
                  {isVerified ? 'Manage' : 'Verify'}
                </button>
              )}
            </div>

            {/* Quick Actions & Consumables Gauge */}
            <div className="pt-3 border-t border-[#292A30] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                {onOpenTestPrint && (
                  <button
                    onClick={() => onOpenTestPrint(activePrinter)}
                    className="px-4 py-2 rounded-xl bg-[#222329] hover:bg-[#2d2e37] text-[#F5F5F7] text-xs font-semibold border border-[#292A30] flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test Print</span>
                  </button>
                )}

                <button
                  onClick={() => onSwitchPrinter(isHp ? 'CANON_G3010' : 'HP_M1005')}
                  className="px-3 py-2 rounded-xl text-xs text-[#A5A5AD] hover:text-[#F5F5F7] bg-transparent hover:bg-[#222329] transition-colors flex items-center gap-1 font-medium"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Switch to {isHp ? 'Canon' : 'HP'}</span>
                </button>
              </div>

              <button
                onClick={() => onOpenPrintersManagement ? onOpenPrintersManagement() : onNavigateTab('PRINT')}
                className="text-xs text-[#A5A5AD] hover:text-[#F5F5F7] font-medium flex items-center gap-1 transition-colors"
              >
                <span>Hardware Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. START Section (Matches 3 Large Horizontal Navigation Cards) */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold tracking-wider text-[#A5A5AD] uppercase px-1">
          START
        </h2>

        {/* Card 1: Print a Document */}
        <div
          onClick={() => {
            onOpenDocuments();
            onNavigateTab('PRINT');
          }}
          className="group cursor-pointer bg-[#191A1F] hover:bg-[#1e1f26] border border-[#292A30] hover:border-[#393A42] rounded-[20px] p-4 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#222329] border border-[#292A30] flex items-center justify-center text-[#F5F5F7] shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#F5F5F7] group-hover:text-white transition-colors">
                Print a document
              </h3>
              <p className="text-xs text-[#A5A5AD] mt-0.5">
                PDF, images and documents
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#A5A5AD] group-hover:text-[#F5F5F7] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 2: Scan a Page */}
        <div
          onClick={() => {
            if (onOpenScanScreen) {
              onOpenScanScreen();
            } else {
              onNavigateTab('SCAN');
            }
          }}
          className="group cursor-pointer bg-[#191A1F] hover:bg-[#1e1f26] border border-[#292A30] hover:border-[#393A42] rounded-[20px] p-4 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#222329] border border-[#292A30] flex items-center justify-center text-[#F5F5F7] shrink-0 group-hover:scale-105 transition-transform">
              <ScanLine className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#F5F5F7] group-hover:text-white transition-colors">
                Scan a page
              </h3>
              <p className="text-xs text-[#A5A5AD] mt-0.5">
                From scanner glass or your camera
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#A5A5AD] group-hover:text-[#F5F5F7] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 3: Manage Printers */}
        <div
          onClick={() => {
            if (onOpenPrintersManagement) {
              onOpenPrintersManagement();
            } else {
              onNavigateTab('PRINT');
            }
          }}
          className="group cursor-pointer bg-[#191A1F] hover:bg-[#1e1f26] border border-[#292A30] hover:border-[#393A42] rounded-[20px] p-4 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#222329] border border-[#292A30] flex items-center justify-center text-[#F5F5F7] shrink-0 group-hover:scale-105 transition-transform">
              <Printer className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#F5F5F7] group-hover:text-white transition-colors">
                Manage printers
              </h3>
              <p className="text-xs text-[#A5A5AD] mt-0.5">
                Connections, drivers and defaults
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#A5A5AD] group-hover:text-[#F5F5F7] group-hover:translate-x-0.5 transition-all" />
        </div>
      </section>

      {/* 4. SOWJI XEROX SPECIALIZED PHOTO & STUDIO TOOLS (Requirement 7) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold tracking-wider text-[#A5A5AD] uppercase">
            STUDIO TOOLS
          </h2>
          <button
            onClick={() => setShowTools(!showTools)}
            className="text-[11px] font-semibold text-[#A5A5AD] hover:text-[#F5F5F7]"
          >
            {showTools ? 'Hide' : 'Show All'}
          </button>
        </div>

        {showTools && (
          <div className="grid grid-cols-2 gap-2.5">
            {/* AI Passport Photo Studio */}
            <div
              onClick={onOpenPassportStudio}
              className="cursor-pointer bg-[#191A1F] hover:bg-[#1e1f26] border border-[#292A30] rounded-[18px] p-3.5 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-[#222329] flex items-center justify-center text-[#F5F5F7] mb-2 group-hover:scale-105 transition-transform">
                <Camera className="w-4 h-4 stroke-[1.8]" />
              </div>
              <h4 className="text-xs font-semibold text-[#F5F5F7]">Passport Studio</h4>
              <p className="text-[11px] text-[#A5A5AD] mt-0.5">35×45mm, Suit, Background</p>
            </div>

            {/* Four Section Designer */}
            <div
              onClick={onOpenFourSection}
              className="cursor-pointer bg-[#191A1F] hover:bg-[#1e1f26] border border-[#292A30] rounded-[18px] p-3.5 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-[#222329] flex items-center justify-center text-[#F5F5F7] mb-2 group-hover:scale-105 transition-transform">
                <LayoutGrid className="w-4 h-4 stroke-[1.8]" />
              </div>
              <h4 className="text-xs font-semibold text-[#F5F5F7]">Four Section Designer</h4>
              <p className="text-[11px] text-[#A5A5AD] mt-0.5">2×2 Grid, Cutting Guides</p>
            </div>

            {/* One-by-One Sheet Generator */}
            <div
              onClick={onOpenOneByOne}
              className="cursor-pointer bg-[#191A1F] hover:bg-[#1e1f26] border border-[#292A30] rounded-[18px] p-3.5 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-[#222329] flex items-center justify-center text-[#F5F5F7] mb-2 group-hover:scale-105 transition-transform">
                <Grid className="w-4 h-4 stroke-[1.8]" />
              </div>
              <h4 className="text-xs font-semibold text-[#F5F5F7]">Sheet Builder</h4>
              <p className="text-[11px] text-[#A5A5AD] mt-0.5">4×6", 5×7", A4 Placement</p>
            </div>

            {/* Phone & Laptop Connect */}
            <div
              onClick={onOpenPairingModal}
              className="cursor-pointer bg-[#191A1F] hover:bg-[#1e1f26] border border-[#292A30] rounded-[18px] p-3.5 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-[#222329] flex items-center justify-center text-[#F5F5F7] mb-2 group-hover:scale-105 transition-transform">
                <Laptop className="w-4 h-4 stroke-[1.8]" />
              </div>
              <h4 className="text-xs font-semibold text-[#F5F5F7]">Laptop Sync</h4>
              <p className="text-[11px] text-[#A5A5AD] mt-0.5">PIN Pairing & Windows Spooler</p>
            </div>
          </div>
        )}
      </section>

      {/* 5. RECENT JOBS Section (Matches Reference Empty State or Activity List) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold tracking-wider text-[#A5A5AD] uppercase">
            RECENT JOBS
          </h2>
          {recentJobs.length > 0 && (
            <button
              onClick={() => onOpenHistory ? onOpenHistory() : onNavigateTab('PRINT')}
              className="text-[11px] font-semibold text-[#A5A5AD] hover:text-[#F5F5F7]"
            >
              View All
            </button>
          )}
        </div>

        {recentJobs.length === 0 ? (
          // Centered empty-state appearance matching the OpenPage screenshot
          <div className="bg-[#191A1F] border border-[#292A30] rounded-[22px] p-8 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#222329] border border-[#292A30] flex items-center justify-center text-[#A5A5AD] mb-3.5">
              <Clock className="w-7 h-7 stroke-[1.8]" />
            </div>
            <h3 className="text-base font-semibold text-[#F5F5F7]">
              Nothing printed yet
            </h3>
            <p className="text-xs text-[#A5A5AD] mt-1 max-w-xs leading-relaxed">
              Your print and scan jobs will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentJobs.slice(0, 4).map((job) => (
              <div
                key={job.id}
                className="bg-[#191A1F] border border-[#292A30] rounded-[18px] p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#222329] flex items-center justify-center text-[#F5F5F7] shrink-0 font-bold text-xs font-mono">
                    {job.colorMode === 'COLOR' ? 'CLR' : 'B/W'}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#F5F5F7] line-clamp-1">
                      {job.title}
                    </h4>
                    <p className="text-[11px] text-[#A5A5AD] mt-0.5">
                      {job.printerName} · {job.pages}p · {job.paperSize} · {job.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                    job.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{job.status === 'COMPLETED' ? 'Completed' : job.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
