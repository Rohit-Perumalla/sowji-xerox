import React, { useState, useEffect } from 'react';
import {
  PrinterDevice,
  PrintJob,
  PaperSize,
  PassportConfig,
  PlatformViewMode,
  SavedLayoutTemplate,
  PrinterTestRecord,
  SavedPrinterItem,
} from './types';
import { printerCommunicationManager } from './services/printerManager';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { DocumentScreen } from './components/DocumentScreen';
import { PhotoStudioHubScreen } from './components/PhotoStudioHubScreen';
import { FourSectionDesignerScreen } from './components/FourSectionDesignerScreen';
import { SheetGeneratorModal } from './components/SheetGeneratorModal';
import { PrinterScreen } from './components/PrinterScreen';
import { PrinterDiagnosticsScreen } from './components/PrinterDiagnosticsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { WindowsProjectModal } from './components/WindowsProjectModal';
import { DevicePairingModal } from './components/DevicePairingModal';
import { TestPrintModal } from './components/TestPrintModal';
import { ScanScreen } from './components/ScanScreen';
import { PrintPreviewExportModal } from './components/PrintPreviewExportModal';
import {
  LayoutDashboard,
  FolderOpen,
  Camera,
  LayoutGrid,
  Printer,
  History,
  Settings,
  ScanLine,
  Minus,
  Square,
  X,
  Laptop,
  Smartphone,
} from 'lucide-react';

const INITIAL_PRINTERS: Record<'CANON_G3010' | 'HP_M1005', PrinterDevice> = {
  CANON_G3010: {
    id: 'canon-g3010',
    name: 'Canon PIXMA G3010',
    model: 'CANON_G3010',
    connectionType: 'WIFI',
    status: 'UNVERIFIED',
    verifiedCommunication: false,
    ipAddress: '192.168.1.145',
    paperTrayStatus: 'READY',
    supportedPaperSizes: ['A4', 'A5', 'Letter', '4x6', '5x7'],
    supportedMediaTypes: ['Plain', 'Glossy', 'Matte', 'Semi-Gloss', 'High-Res'],
    supportsColor: true,
    supportsBorderless: true,
    isDefault: true,
  },
  HP_M1005: {
    id: 'hp-m1005',
    name: 'HP LaserJet M1005 MFP',
    model: 'HP_M1005',
    connectionType: 'USB_OTG',
    status: 'UNVERIFIED',
    verifiedCommunication: false,
    usbPermissionState: 'NOT_REQUESTED',
    usbVendorId: 0x03F0,
    usbProductId: 0x3B17,
    tonerLevel: 82,
    paperTrayStatus: 'READY',
    supportedPaperSizes: ['A4', 'A5', 'Letter'],
    supportedMediaTypes: ['Plain'],
    supportsColor: false,
    supportsBorderless: false,
    isDefault: false,
  },
};

const INITIAL_JOBS: PrintJob[] = [
  {
    id: 'job-1',
    title: 'Tax_Invoice_GST_2026.pdf',
    printerId: 'canon-g3010',
    printerName: 'Canon PIXMA G3010',
    printerModel: 'CANON_G3010',
    timestamp: '10:45 AM',
    pages: 3,
    copies: 1,
    colorMode: 'COLOR',
    paperSize: 'A4',
    status: 'COMPLETED',
    progressPercent: 100,
    rawBytesSize: 184520,
  },
  {
    id: 'job-2',
    title: 'FourSection_Grid_4x6.pdf',
    printerId: 'hp-m1005',
    printerName: 'HP LaserJet M1005 MFP',
    printerModel: 'HP_M1005',
    timestamp: '09:20 AM',
    pages: 1,
    copies: 1,
    colorMode: 'MONOCHROME',
    paperSize: '4x6',
    status: 'COMPLETED',
    progressPercent: 100,
    rawBytesSize: 524288,
  },
];

export default function App() {
  const [activePrinter, setActivePrinter] = useState<PrinterDevice>(INITIAL_PRINTERS.CANON_G3010);
  const [currentTab, setCurrentTab] = useState<NavTab>('HOME');
  const [platformMode, setPlatformMode] = useState<PlatformViewMode>('ANDROID');
  const [jobs, setJobs] = useState<PrintJob[]>(INITIAL_JOBS);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [savedTemplates, setSavedTemplates] = useState<SavedLayoutTemplate[]>([]);
  const [settingsSubTab, setSettingsSubTab] = useState<'SETTINGS' | 'UPDATES' | 'BUG_REPORTS' | 'ABOUT'>('SETTINGS');

  // SOWJI XEROX: Saved Printers & Test Print State
  const [testPrintTargetPrinter, setTestPrintTargetPrinter] = useState<PrinterDevice | null>(null);
  const [testRecords, setTestRecords] = useState<PrinterTestRecord[]>([
    {
      id: 'test-canon-init',
      printerId: 'canon-g3010',
      printerName: 'Canon PIXMA G3010',
      printerModel: 'CANON_G3010',
      testDate: 'Today, 10:15 AM',
      connectionMethod: 'WIFI (192.168.1.145:8611)',
      result: 'PRINTED_VERIFIED',
      statusMessage: 'CMYK calibration pattern, 0.25pt alignment grid, and micro-text verified.',
      colorTested: true,
    },
    {
      id: 'test-hp-init',
      printerId: 'hp-m1005',
      printerName: 'HP LaserJet M1005 MFP',
      printerModel: 'HP_M1005',
      testDate: 'Today, 09:30 AM',
      connectionMethod: 'USB_OTG (0x03F0:0x3B17)',
      result: 'PRINTED_VERIFIED',
      statusMessage: 'Zenographics ZjStream bi-level records delivered via Bulk OUT 0x02.',
      colorTested: false,
    },
  ]);

  const [savedPrinters, setSavedPrinters] = useState<SavedPrinterItem[]>([
    {
      id: 'canon-g3010',
      displayName: 'Canon PIXMA G3010',
      customLabel: 'Front Counter - Photo & Color Tank',
      model: 'CANON_G3010',
      connectionType: 'WIFI',
      ipAddress: '192.168.1.145',
      isDefault: true,
      lastConnected: 'Today, 10:15 AM',
      status: 'ONLINE',
    },
    {
      id: 'hp-m1005',
      displayName: 'HP LaserJet M1005 MFP',
      customLabel: 'Billing Counter - Monochrome Laser',
      model: 'HP_M1005',
      connectionType: 'USB_OTG',
      usbVendorId: 0x03F0,
      usbProductId: 0x3B17,
      isDefault: false,
      lastConnected: 'Today, 09:30 AM',
      status: 'ONLINE',
    },
  ]);

  // Modals state
  const [showDiagnosticsView, setShowDiagnosticsView] = useState<boolean>(false);
  const [showAndroidModal, setShowAndroidModal] = useState<boolean>(false);
  const [showWindowsModal, setShowWindowsModal] = useState<boolean>(false);
  const [showPairingModal, setShowPairingModal] = useState<boolean>(false);
  const [showSheetModal, setShowSheetModal] = useState<boolean>(false);
  const [sheetSourceCanvas, setSheetSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [sheetPassportConfig, setSheetPassportConfig] = useState<PassportConfig>({
    standard: '35x45',
    widthMm: 35,
    heightMm: 45,
    backgroundType: 'WHITE',
    customBgColor: '#FFFFFF',
    dressOverlay: 'NONE',
    dressScale: 1.0,
    dressOffsetY: 0,
    dressOffsetX: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    showOvalGuide: true,
  });

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSwitchPrinter = (model: 'CANON_G3010' | 'HP_M1005') => {
    setActivePrinter(INITIAL_PRINTERS[model]);
  };

  const handleOpenTestPrint = (printer: PrinterDevice) => {
    setTestPrintTargetPrinter(printer);
  };

  const handleLogTestRecord = (record: PrinterTestRecord) => {
    setTestRecords((prev) => [record, ...prev]);
  };

  const handleSavePrinter = (printer: SavedPrinterItem) => {
    setSavedPrinters((prev) => [printer, ...prev.filter((p) => p.id !== printer.id)]);
  };

  const handleRemoveSavedPrinter = (id: string) => {
    setSavedPrinters((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateSavedLabel = (id: string, label: string) => {
    setSavedPrinters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, customLabel: label } : p))
    );
  };

  const handleSelectDefaultPrinter = (printerId: string) => {
    setSavedPrinters((prev) =>
      prev.map((p) => ({
        ...p,
        isDefault: p.id === printerId,
      }))
    );
    if (printerId === 'canon-g3010') {
      setActivePrinter(INITIAL_PRINTERS.CANON_G3010);
    } else if (printerId === 'hp-m1005') {
      setActivePrinter(INITIAL_PRINTERS.HP_M1005);
    }
  };

  const handleClearTestHistory = () => {
    setTestRecords([]);
  };

  const handleSpoolJob = async (
    title: string,
    pages: number,
    copies: number,
    paperSize: PaperSize,
    colorMode: 'COLOR' | 'MONOCHROME'
  ): Promise<void> => {
    const newJobId = `job-${Date.now()}`;
    const newJob: PrintJob = {
      id: newJobId,
      title,
      printerId: activePrinter.id,
      printerName: activePrinter.name,
      printerModel: activePrinter.model,
      platformSource: platformMode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pages,
      copies,
      colorMode,
      paperSize,
      status: 'SPOOLING',
      progressPercent: 15,
      rawBytesSize: Math.round(128000 + Math.random() * 256000),
    };

    setJobs((prev) => [newJob, ...prev]);

    // 1. Driver Compatibility Check (Fail fast for invalid operations like color on HP M1005)
    const compat = printerCommunicationManager.checkDriverCompatibility(activePrinter, {
      colorMode,
      paperSize,
      copies,
    });

    if (!compat.compatible) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJobId
            ? {
                ...j,
                status: 'FAILED',
                progressPercent: 100,
                errorMessage: compat.message,
              }
            : j
        )
      );
      throw new Error(compat.message);
    }

    // 2. Hardware Verification Check
    let currentPrinter = activePrinter;
    if (!currentPrinter.verifiedCommunication || currentPrinter.status === 'UNVERIFIED') {
      // Attempt live probe before sending
      const probeResult = await printerCommunicationManager.verifyPrinter(currentPrinter);
      if (!probeResult.verifiedCommunication || probeResult.status !== 'READY') {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === newJobId
              ? {
                  ...j,
                  status: 'FAILED',
                  progressPercent: 100,
                  errorMessage: `Print Failed: ${probeResult.message}`,
                }
              : j
          )
        );
        throw new Error(`Printer Communication Error: ${probeResult.message}`);
      }
      currentPrinter = {
        ...currentPrinter,
        status: probeResult.status,
        verifiedCommunication: true,
        lastVerifiedTime: probeResult.timestamp,
      };
      setActivePrinter(currentPrinter);
    }

    // 3. Multi-stage real driver execution
    try {
      await printerCommunicationManager.spoolJobWithVerification(
        currentPrinter,
        { title, pages, copies, paperSize, colorMode },
        (phase, percent) => {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === newJobId
                ? {
                    ...j,
                    status:
                      phase === 'PREPARING_RASTER'
                        ? currentPrinter.model === 'HP_M1005'
                          ? 'ENCODING_ZJSTREAM'
                          : 'SPOOLING'
                        : phase === 'TRANSMITTING_DATA'
                        ? 'SENDING'
                        : 'SPOOLING',
                    progressPercent: percent,
                  }
                : j
            )
          );
        }
      );

      // Successfully transmitted and buffered in printer hardware
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJobId
            ? {
                ...j,
                status: 'COMPLETED',
                progressPercent: 100,
              }
            : j
        )
      );
    } catch (err: any) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJobId
            ? {
                ...j,
                status: 'FAILED',
                progressPercent: 100,
                errorMessage: err.message || 'Spooling failed.',
              }
            : j
        )
      );
      throw err;
    }
  };

  const handleReprintJob = (job: PrintJob) => {
    handleSpoolJob(job.title, job.pages, job.copies, job.paperSize, job.colorMode);
  };

  const handleClearHistory = () => {
    setJobs([]);
  };

  const handleOpenSheetWithCanvas = (canvas: HTMLCanvasElement, config: PassportConfig) => {
    setSheetSourceCanvas(canvas);
    setSheetPassportConfig(config);
    setShowSheetModal(true);
  };

  const handleSaveTemplate = (tpl: SavedLayoutTemplate) => {
    setSavedTemplates((prev) => [tpl, ...prev]);
  };

  const [printSubView, setPrintSubView] = useState<'DOCUMENTS' | 'PHOTO_STUDIO' | 'FOUR_SECTION' | 'PRINTERS' | 'HISTORY'>('DOCUMENTS');

  const activeQueueCount = jobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'FAILED').length;

  const windowsNavItems = [
    { id: 'HOME' as NavTab, label: 'Home', icon: LayoutDashboard },
    { id: 'PRINT' as NavTab, label: 'Print Studio', icon: Printer, badge: activeQueueCount > 0 ? activeQueueCount : undefined },
    { id: 'SCAN' as NavTab, label: 'Scanner', icon: ScanLine },
    { id: 'SETTINGS' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#101114] text-[#F5F5F7] flex flex-col font-sans transition-colors">
      {/* Windows 10/11 Desktop Title Bar Simulation when in Windows Mode */}
      {platformMode === 'WINDOWS' && (
        <div className="bg-[#141519] px-4 py-1.5 flex items-center justify-between text-xs select-none border-b border-[#292A30]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#222329] border border-[#292A30] flex items-center justify-center text-[10px] text-white font-bold">
              SX
            </div>
            <span className="font-semibold text-[#F5F5F7] text-[11px]">
              Sowji Xerox - Windows 11 Desktop (.NET 8 WinSpool)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[#A5A5AD]">
            <button
              onClick={() => setPlatformMode('ANDROID')}
              className="text-[10px] text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Smartphone className="w-3 h-3" /> Switch to Android Mode
            </button>
            <div className="flex items-center gap-2 text-[#A5A5AD] pl-2 border-l border-[#292A30]">
              <Minus className="w-3 h-3" />
              <Square className="w-2.5 h-2.5" />
              <X className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}

      {/* Top App Bar */}
      <Navbar
        activePrinter={activePrinter}
        onOpenPrinterModal={() => {
          setCurrentTab('PRINT');
          setPrintSubView('PRINTERS');
        }}
        onOpenAndroidProject={() => setShowAndroidModal(true)}
        onOpenWindowsProject={() => setShowWindowsModal(true)}
        onOpenPairingModal={() => setShowPairingModal(true)}
        onOpenUpdates={() => {
          setSettingsSubTab('UPDATES');
          setCurrentTab('SETTINGS');
        }}
        platformMode={platformMode}
        onTogglePlatformMode={() =>
          setPlatformMode(platformMode === 'ANDROID' ? 'WINDOWS' : 'ANDROID')
        }
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Windows Desktop Split Sidebar or Standard Android Container */}
      <div className={`flex-1 flex w-full ${platformMode === 'WINDOWS' ? 'max-w-7xl mx-auto' : ''}`}>
        {/* Windows Fluent Sidebar (visible in Windows Mode) */}
        {platformMode === 'WINDOWS' && (
          <aside className="w-60 shrink-0 bg-[#191A1F] border-r border-[#292A30] p-3 hidden md:flex flex-col justify-between">
            <div className="space-y-1">
              <p className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#A5A5AD]">
                Navigation
              </p>
              {windowsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-[#222329] text-[#F5F5F7] font-semibold border border-[#292A30]'
                        : 'text-[#A5A5AD] hover:bg-[#222329]/60 hover:text-[#F5F5F7]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-[#222329] border border-[#292A30] text-[11px] space-y-1">
              <p className="font-bold text-[#F5F5F7] flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                Windows 10/11 Spooler
              </p>
              <p className="text-[#A5A5AD] text-[10px]">
                Direct Win32 GDI & raw ZjStream writing via <code>winspool.drv</code>
              </p>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-4">
          {currentTab === 'HOME' && (
            <HomeScreen
              activePrinter={activePrinter}
              onSwitchPrinter={handleSwitchPrinter}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenPassportStudio={() => {
                setCurrentTab('PRINT');
                setPrintSubView('PHOTO_STUDIO');
              }}
              onOpenPhotoPrint={() => {
                setCurrentTab('PRINT');
                setPrintSubView('PHOTO_STUDIO');
              }}
              onOpenSheetGenerator={() => {
                const canvas = document.createElement('canvas');
                canvas.width = 413;
                canvas.height = 531;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(0, 0, 413, 531);
                  ctx.fillStyle = '#1E3A8A';
                  ctx.font = 'bold 24px sans-serif';
                  ctx.fillText('PASSPORT', 50, 200);
                }
                setSheetSourceCanvas(canvas);
                setShowSheetModal(true);
              }}
              onOpenDocuments={() => {
                setCurrentTab('PRINT');
                setPrintSubView('DOCUMENTS');
              }}
              onOpenFourSection={() => {
                setCurrentTab('PRINT');
                setPrintSubView('FOUR_SECTION');
              }}
              onOpenOneByOne={() => {
                setCurrentTab('PRINT');
                setPrintSubView('PHOTO_STUDIO');
              }}
              onOpenPrintersManagement={() => {
                setCurrentTab('PRINT');
                setPrintSubView('PRINTERS');
              }}
              onOpenScanScreen={() => setCurrentTab('SCAN')}
              onOpenAndroidProject={() => setShowAndroidModal(true)}
              onOpenWindowsProject={() => setShowWindowsModal(true)}
              onOpenPairingModal={() => setShowPairingModal(true)}
              onOpenTestPrint={handleOpenTestPrint}
              onOpenHistory={() => {
                setCurrentTab('PRINT');
                setPrintSubView('HISTORY');
              }}
              platformMode={platformMode}
              recentJobs={jobs}
            />
          )}

          {currentTab === 'PRINT' && (
            <div className="space-y-4">
              {/* Secondary Segment Bar inside Print Hub */}
              <div className="flex bg-[#191A1F] border border-[#292A30] p-1 rounded-2xl overflow-x-auto gap-1">
                {[
                  { id: 'DOCUMENTS', label: 'Documents' },
                  { id: 'PHOTO_STUDIO', label: 'Photo Studio' },
                  { id: 'FOUR_SECTION', label: '4-Section' },
                  { id: 'PRINTERS', label: 'Printers' },
                  { id: 'HISTORY', label: 'History' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPrintSubView(item.id as any)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      printSubView === item.id
                        ? 'bg-[#222329] text-[#F5F5F7] shadow-sm'
                        : 'text-[#A5A5AD] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {printSubView === 'DOCUMENTS' && (
                <DocumentScreen
                  activePrinter={activePrinter}
                  onSpoolJob={handleSpoolJob}
                  onOpenPrintersManagement={() => setPrintSubView('PRINTERS')}
                />
              )}

              {printSubView === 'PHOTO_STUDIO' && (
                <PhotoStudioHubScreen
                  activePrinter={activePrinter}
                  onSpoolJob={handleSpoolJob}
                  onOpenSheetWithCanvas={handleOpenSheetWithCanvas}
                  onSaveTemplate={handleSaveTemplate}
                />
              )}

              {printSubView === 'FOUR_SECTION' && (
                <FourSectionDesignerScreen
                  activePrinter={activePrinter}
                  onSpoolJob={handleSpoolJob}
                  onSaveTemplate={handleSaveTemplate}
                />
              )}

              {printSubView === 'PRINTERS' && (
                showDiagnosticsView ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowDiagnosticsView(false)}
                      className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      ← Back to Printer Hardware & Modes
                    </button>
                    <PrinterDiagnosticsScreen
                      activePrinter={activePrinter}
                      platformMode={platformMode}
                      onSpoolJob={handleSpoolJob}
                      onBackToPrinters={() => setShowDiagnosticsView(false)}
                    />
                  </div>
                ) : (
                  <PrinterScreen
                    activePrinter={activePrinter}
                    onSelectPrinter={(p) => setActivePrinter(p)}
                    onSpoolJob={handleSpoolJob}
                    onOpenDiagnostics={() => setShowDiagnosticsView(true)}
                    onOpenTestPrint={handleOpenTestPrint}
                    savedPrinters={savedPrinters}
                    onSavePrinter={handleSavePrinter}
                    onRemoveSavedPrinter={handleRemoveSavedPrinter}
                    onUpdateSavedLabel={handleUpdateSavedLabel}
                    onSelectDefaultPrinter={handleSelectDefaultPrinter}
                  />
                )
              )}

              {printSubView === 'HISTORY' && (
                <HistoryScreen
                  jobs={jobs}
                  onClearHistory={handleClearHistory}
                  onReprintJob={handleReprintJob}
                  onBack={() => setPrintSubView('DOCUMENTS')}
                />
              )}
            </div>
          )}

          {currentTab === 'SCAN' && (
            <ScanScreen
              activePrinter={activePrinter}
              onSpoolJob={handleSpoolJob}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'SETTINGS' && (
            <SettingsScreen
              activePrinter={activePrinter}
              savedPrinters={savedPrinters}
              testRecords={testRecords}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              onSelectDefaultPrinter={handleSelectDefaultPrinter}
              onUpdateSavedLabel={handleUpdateSavedLabel}
              onRemoveSavedPrinter={handleRemoveSavedPrinter}
              onClearTestHistory={handleClearTestHistory}
              onOpenDiagnostics={() => {
                setCurrentTab('PRINT');
                setPrintSubView('PRINTERS');
                setShowDiagnosticsView(true);
              }}
              onOpenTestPrint={handleOpenTestPrint}
              initialTab={settingsSubTab}
            />
          )}
        </main>
      </div>

      {/* Bottom Navigation Bar for Mobile / Android Mode */}
      {platformMode === 'ANDROID' && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          activeQueueCount={activeQueueCount}
        />
      )}

      {/* Universal Calibration Test Print Modal */}
      {testPrintTargetPrinter && (
        <TestPrintModal
          printer={testPrintTargetPrinter}
          onClose={() => setTestPrintTargetPrinter(null)}
          onSpoolJob={handleSpoolJob}
          onLogTestRecord={handleLogTestRecord}
        />
      )}

      {/* Automatic Photo Sheet Generator Modal */}
      {showSheetModal && (
        <SheetGeneratorModal
          sourcePassportCanvas={sheetSourceCanvas}
          passportConfig={sheetPassportConfig}
          activePrinter={activePrinter}
          onClose={() => setShowSheetModal(false)}
          onSpoolJob={handleSpoolJob}
        />
      )}

      {/* Android Studio Complete Project Codebase Modal */}
      {showAndroidModal && (
        <AndroidProjectModal onClose={() => setShowAndroidModal(false)} />
      )}

      {/* Windows 10/11 Desktop Complete Project Codebase Modal */}
      {showWindowsModal && (
        <WindowsProjectModal onClose={() => setShowWindowsModal(false)} />
      )}

      {/* Phone & Laptop Local Wi-Fi Pairing Modal */}
      {showPairingModal && (
        <DevicePairingModal
          activePrinter={activePrinter}
          onClose={() => setShowPairingModal(false)}
        />
      )}
    </div>
  );
}
