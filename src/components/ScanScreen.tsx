import React, { useState, useRef, useEffect } from 'react';
import { PrinterDevice, PaperSize } from '../types';
import jsPDF from 'jspdf';
import {
  ScanLine,
  Camera,
  Printer,
  RotateCw,
  RotateCcw,
  Crop,
  Sliders,
  CheckCircle2,
  Trash2,
  Download,
  Plus,
  FileText,
  FileCheck,
  Play,
  Layers,
  ChevronRight,
  RefreshCw,
  Sun,
  Contrast,
  Image as ImageIcon,
  Zap,
  Sparkles,
  Scissors,
  Check,
  X,
  Eye,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface ScanScreenProps {
  activePrinter: PrinterDevice;
  onSpoolJob: (
    title: string,
    pages: number,
    copies: number,
    paperSize: PaperSize,
    colorMode: 'COLOR' | 'MONOCHROME'
  ) => Promise<void>;
  onNavigateTab: (tab: any) => void;
}

interface ScannedPage {
  id: string;
  dataUrl: string;
  originalDataUrl: string;
  rotation: number;
  brightness: number; // 50 to 150 (default 100)
  contrast: number; // 50 to 150 (default 100)
  sharpness: number; // 0 to 100 (default 0)
  threshold: number; // 0 to 255 (default 128)
  filter: 'COLOR' | 'ENHANCED' | 'GRAYSCALE' | 'BW' | 'DESPECKLE';
}

interface ScanHistoryItem {
  id: string;
  name: string;
  pages: number;
  date: string;
  thumbnailUrl: string;
  fileFormat: 'PDF' | 'JPG';
  sizeKb: number;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  activePrinter,
  onSpoolJob,
  onNavigateTab,
}) => {
  const [scanMode, setScanMode] = useState<'FLATBED' | 'CAMERA'>('FLATBED');
  const [resolutionDpi, setResolutionDpi] = useState<number>(300);
  const [scanColorMode, setScanColorMode] = useState<'COLOR' | 'GRAYSCALE' | 'BW'>('COLOR');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scannerStatus, setScannerStatus] = useState<string>(
    activePrinter.model === 'HP_M1005'
      ? 'HP LaserJet M1005 Flatbed Ready (USB Bulk 0x81)'
      : 'Canon PIXMA G3010 CIS Scanner Ready (Port 8611)'
  );

  // Camera state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Scanned pages
  const [pages, setPages] = useState<ScannedPage[]>([
    {
      id: 'sample-page-1',
      dataUrl: createSampleDocumentDataUrl('Tax Invoice & Bill of Supply', 1),
      originalDataUrl: createSampleDocumentDataUrl('Tax Invoice & Bill of Supply', 1),
      rotation: 0,
      brightness: 100,
      contrast: 100,
      sharpness: 20,
      threshold: 128,
      filter: 'ENHANCED',
    },
  ]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);

  // Interactive Crop State
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [cropInset, setCropInset] = useState<{ top: number; bottom: number; left: number; right: number }>({
    top: 5,
    bottom: 5,
    left: 5,
    right: 5,
  });

  // Scan History
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([
    {
      id: 'hist-1',
      name: 'Tax_Invoice_SX_2026.pdf',
      pages: 1,
      date: 'Today, 10:20 AM',
      thumbnailUrl: createSampleDocumentDataUrl('Tax Invoice', 1),
      fileFormat: 'PDF',
      sizeKb: 142,
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activePage = pages[selectedPageIndex] || pages[0];

  // Helper to generate a realistic crisp document sample
  function createSampleDocumentDataUrl(title: string, pageNum: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = 1240;
    canvas.height = 1754; // A4 150 DPI
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Paper background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header bar
    ctx.fillStyle = '#191A1F';
    ctx.fillRect(80, 80, canvas.width - 160, 100);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('SOWJI XEROX · PRECISION SCANNER', 110, 145);

    // Document Content Lines
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(title, 80, 240);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`Hardware Flatbed Scan · Resolution: 300 DPI · Page ${pageNum} of 1`, 80, 280);
    ctx.fillText(`Timestamp: ${new Date().toLocaleString()} · Contact Image Sensor (CIS)`, 80, 315);

    // Decorative table simulation
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 360, canvas.width - 160, 480);

    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(80, 360, canvas.width - 160, 50);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('DESCRIPTION / ITEM', 110, 395);
    ctx.fillText('RATE', 600, 395);
    ctx.fillText('QTY', 850, 395);
    ctx.fillText('AMOUNT', 1050, 395);

    for (let i = 0; i < 5; i++) {
      const y = 460 + i * 65;
      ctx.fillStyle = '#475569';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Photocopying & Printing Service - Lot #${100 + i}`, 110, y);
      ctx.fillText('₹ 5.00', 600, y);
      ctx.fillText(`${10 * (i + 1)}`, 850, y);
      ctx.fillText(`₹ ${(50 * (i + 1)).toFixed(2)}`, 1050, y);

      ctx.beginPath();
      ctx.moveTo(80, y + 25);
      ctx.lineTo(canvas.width - 80, y + 25);
      ctx.stroke();
    }

    // Seal / Watermark
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width - 340, 920, 260, 90);
    ctx.fillStyle = '#4F46E5';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('VERIFIED XEROX', canvas.width - 320, 958);
    ctx.font = '14px sans-serif';
    ctx.fillText('SOWJI XEROX STUDIO', canvas.width - 320, 985);

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  // Camera stream controls
  useEffect(() => {
    if (scanMode === 'CAMERA') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [scanMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError('Camera access not granted or unavailable. You can use image upload as fallback.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const newPage: ScannedPage = {
      id: `scan-${Date.now()}`,
      dataUrl,
      originalDataUrl: dataUrl,
      rotation: 0,
      brightness: 100,
      contrast: 100,
      sharpness: 20,
      threshold: 128,
      filter: 'ENHANCED',
    };
    setPages((prev) => [...prev, newPage]);
    setSelectedPageIndex(pages.length);
    showToast('Snapshot captured from camera!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newPage: ScannedPage = {
        id: `upload-${Date.now()}`,
        dataUrl,
        originalDataUrl: dataUrl,
        rotation: 0,
        brightness: 100,
        contrast: 100,
        sharpness: 0,
        threshold: 128,
        filter: 'COLOR',
      };
      setPages((prev) => [...prev, newPage]);
      setSelectedPageIndex(pages.length);
      showToast('Document image imported!');
    };
    reader.readAsDataURL(file);
  };

  // Hardware Scanner Simulation / SANE / USB trigger
  const handleStartHardwareScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScannerStatus(
      activePrinter.model === 'HP_M1005'
        ? 'Querying HP M1005 USB Bulk IN 0x81... Lamp warming up'
        : 'Querying Canon G3010 CIS optical sensor via BJNP 8611...'
    );

    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      if (p < 80) {
        setScanProgress(p);
        setScannerStatus(`Optical CIS scanner scanning flatbed glass (${p}%)...`);
      } else if (p < 100) {
        setScanProgress(90);
        setScannerStatus('Digitizing bi-level raster and transferring bytes...');
      } else {
        clearInterval(interval);
        setScanProgress(100);
        setIsScanning(false);
        setScannerStatus('Scan complete! Page digitized.');

        const sample = createSampleDocumentDataUrl(
          `Sowji Xerox Hardware Scan #${pages.length + 1}`,
          pages.length + 1
        );
        const newPage: ScannedPage = {
          id: `hardware-${Date.now()}`,
          dataUrl: sample,
          originalDataUrl: sample,
          rotation: 0,
          brightness: 100,
          contrast: 100,
          sharpness: 25,
          threshold: 128,
          filter: scanColorMode === 'BW' ? 'BW' : scanColorMode === 'GRAYSCALE' ? 'GRAYSCALE' : 'ENHANCED',
        };
        setPages((prev) => [...prev, newPage]);
        setSelectedPageIndex(pages.length);

        const newHist: ScanHistoryItem = {
          id: `hist-${Date.now()}`,
          name: `Scan_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.pdf`,
          pages: 1,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thumbnailUrl: sample,
          fileFormat: 'PDF',
          sizeKb: 165,
        };
        setScanHistory((prev) => [newHist, ...prev]);
        showToast('Hardware flatbed scan completed!');
      }
    }, 250);
  };

  const handleRotatePage = (direction: 'CW' | 'CCW') => {
    if (!activePage) return;
    const delta = direction === 'CW' ? 90 : -90;
    const nextRot = (activePage.rotation + delta + 360) % 360;
    setPages((prev) =>
      prev.map((p, idx) => (idx === selectedPageIndex ? { ...p, rotation: nextRot } : p))
    );
  };

  const handleFilterChange = (filter: ScannedPage['filter']) => {
    if (!activePage) return;
    setPages((prev) =>
      prev.map((p, idx) => (idx === selectedPageIndex ? { ...p, filter } : p))
    );
  };

  const handleBrightnessChange = (val: number) => {
    if (!activePage) return;
    setPages((prev) =>
      prev.map((p, idx) => (idx === selectedPageIndex ? { ...p, brightness: val } : p))
    );
  };

  const handleContrastChange = (val: number) => {
    if (!activePage) return;
    setPages((prev) =>
      prev.map((p, idx) => (idx === selectedPageIndex ? { ...p, contrast: val } : p))
    );
  };

  /**
   * Apply interactive crop to active page
   */
  const handleApplyCrop = () => {
    if (!activePage) return;
    const img = new Image();
    img.src = activePage.dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const leftPx = (cropInset.left / 100) * img.width;
      const topPx = (cropInset.top / 100) * img.height;
      const widthPx = img.width - leftPx - (cropInset.right / 100) * img.width;
      const heightPx = img.height - topPx - (cropInset.bottom / 100) * img.height;

      canvas.width = Math.max(50, widthPx);
      canvas.height = Math.max(50, heightPx);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, leftPx, topPx, widthPx, heightPx, 0, 0, canvas.width, canvas.height);
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      setPages((prev) =>
        prev.map((p, idx) => (idx === selectedPageIndex ? { ...p, dataUrl: croppedDataUrl } : p))
      );
      setShowCropModal(false);
      showToast('Cropped page successfully!');
    };
  };

  const handleResetPage = () => {
    if (!activePage) return;
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === selectedPageIndex
          ? {
              ...p,
              dataUrl: p.originalDataUrl,
              rotation: 0,
              brightness: 100,
              contrast: 100,
              filter: 'COLOR',
            }
          : p
      )
    );
    showToast('Page reset to original state.');
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, idx) => idx !== selectedPageIndex));
    setSelectedPageIndex(Math.max(0, selectedPageIndex - 1));
    showToast('Page removed from scan batch.');
  };

  // Export to Multi-page PDF
  const handleSaveAsPdf = () => {
    if (pages.length === 0) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    pages.forEach((page, idx) => {
      if (idx > 0) doc.addPage('a4', 'portrait');
      doc.addImage(page.dataUrl, 'JPEG', 0, 0, 210, 297);
    });

    const filename = `Sowji_Xerox_Scan_${Date.now()}.pdf`;
    doc.save(filename);

    const newHist: ScanHistoryItem = {
      id: `hist-${Date.now()}`,
      name: filename,
      pages: pages.length,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thumbnailUrl: pages[0].dataUrl,
      fileFormat: 'PDF',
      sizeKb: pages.length * 150,
    };
    setScanHistory((prev) => [newHist, ...prev]);
    showToast('PDF downloaded successfully!');
  };

  // Export single/active page as JPG
  const handleSaveAsJpg = () => {
    if (!activePage) return;
    const link = document.createElement('a');
    link.href = activePage.dataUrl;
    const filename = `Sowji_Xerox_Scan_Page${selectedPageIndex + 1}_${Date.now()}.jpg`;
    link.download = filename;
    link.click();

    const newHist: ScanHistoryItem = {
      id: `hist-${Date.now()}`,
      name: filename,
      pages: 1,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thumbnailUrl: activePage.dataUrl,
      fileFormat: 'JPG',
      sizeKb: 120,
    };
    setScanHistory((prev) => [newHist, ...prev]);
    showToast('JPEG image downloaded!');
  };

  // Direct Print of Scanned Document
  const handleDirectPrint = async () => {
    await onSpoolJob(
      `SowjiXerox_Scanned_${pages.length}Pages`,
      pages.length,
      1,
      'A4',
      scanColorMode === 'COLOR' ? 'COLOR' : 'MONOCHROME'
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-5 pb-28 max-w-xl mx-auto px-1 sm:px-0">
      {/* Header */}
      <div className="pt-2 px-1 flex items-center justify-between">
        <div>
          <h1 className="text-[26px] sm:text-2xl font-extrabold text-[#F5F5F7] tracking-tight">
            Document Scanner
          </h1>
          <p className="text-xs text-[#A5A5AD]">
            Hardware flatbed scanning, camera capture, enhancement & PDF/JPG export
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex bg-[#191A1F] border border-[#292A30] p-1 rounded-2xl">
        <button
          onClick={() => setScanMode('FLATBED')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            scanMode === 'FLATBED'
              ? 'bg-[#222329] text-[#F5F5F7] shadow-sm'
              : 'text-[#A5A5AD] hover:text-[#F5F5F7]'
          }`}
        >
          <Printer className="w-4 h-4 text-indigo-400" />
          <span>Hardware Flatbed</span>
        </button>

        <button
          onClick={() => setScanMode('CAMERA')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            scanMode === 'CAMERA'
              ? 'bg-[#222329] text-[#F5F5F7] shadow-sm'
              : 'text-[#A5A5AD] hover:text-[#F5F5F7]'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Camera Scanner</span>
        </button>
      </div>

      {/* HARDWARE FLATBED SECTION */}
      {scanMode === 'FLATBED' ? (
        <section className="bg-[#191A1F] border border-[#292A30] rounded-[22px] p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[14px] bg-[#222329] border border-[#292A30] flex items-center justify-center text-[#F5F5F7]">
                <ScanLine className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F7]">
                  {activePrinter.model === 'HP_M1005'
                    ? 'HP LaserJet M1005 Flatbed Scanner'
                    : 'Canon PIXMA G3010 CIS Scanner'}
                </h3>
                <p className="text-xs text-[#A5A5AD]">
                  {activePrinter.connectionType === 'USB_OTG'
                    ? 'USB SANE Bulk Pipe (0x81)'
                    : 'Canon BJNP Scan Socket (8611)'}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Ready
            </span>
          </div>

          {/* Scanner Parameters */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs">
            <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
              <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
                Resolution
              </label>
              <select
                value={resolutionDpi}
                onChange={(e) => setResolutionDpi(parseInt(e.target.value))}
                className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
              >
                <option value={150} className="bg-[#191A1F]">150 DPI (Fast)</option>
                <option value={300} className="bg-[#191A1F]">300 DPI (Standard)</option>
                <option value={600} className="bg-[#191A1F]">600 DPI (High Res)</option>
              </select>
            </div>

            <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
              <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
                Color Mode
              </label>
              <select
                value={scanColorMode}
                onChange={(e) => setScanColorMode(e.target.value as any)}
                className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
              >
                <option value="COLOR" className="bg-[#191A1F]">Full Color (24-bit)</option>
                <option value="GRAYSCALE" className="bg-[#191A1F]">Grayscale (8-bit)</option>
                <option value="BW" className="bg-[#191A1F]">B&W Xerox LineArt</option>
              </select>
            </div>

            <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
              <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
                Platen Glass
              </label>
              <div className="text-[#F5F5F7] font-semibold truncate pt-0.5">
                A4 (216×297mm)
              </div>
            </div>
          </div>

          {/* Progress bar when scanning */}
          {isScanning && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#222329] border border-[#292A30]">
              <div className="flex justify-between text-xs text-[#F5F5F7] font-medium">
                <span>{scannerStatus}</span>
                <span className="font-mono">{scanProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#191A1F] overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Trigger Hardware Scan Button */}
          <button
            onClick={handleStartHardwareScan}
            disabled={isScanning}
            className="w-full py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Digitizing Hardware Flatbed...</span>
              </>
            ) : (
              <>
                <ScanLine className="w-4 h-4" />
                <span>Start Hardware Scan</span>
              </>
            )}
          </button>
        </section>
      ) : (
        // CAMERA SCANNER SECTION
        <section className="bg-[#191A1F] border border-[#292A30] rounded-[22px] p-5 space-y-4 shadow-md">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center border border-[#292A30]">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <Camera className="w-10 h-10 text-[#A5A5AD] mx-auto mb-2 opacity-60" />
                <p className="text-xs text-[#A5A5AD] max-w-xs">
                  {cameraError || 'Camera inactive. Click enable camera or upload a document photo.'}
                </p>
                <button
                  onClick={startCamera}
                  className="mt-3 px-4 py-2 rounded-full bg-[#222329] text-[#F5F5F7] text-xs font-semibold border border-[#292A30]"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Document alignment overlay */}
            {cameraActive && (
              <div className="absolute inset-8 border-2 border-dashed border-indigo-400/80 pointer-events-none rounded-lg flex items-center justify-center">
                <span className="text-[11px] text-white/90 bg-black/60 px-2.5 py-1 rounded-full font-medium">
                  Align Document Edges Inside Bounds
                </span>
              </div>
            )}
          </div>

          {/* Camera Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCaptureCamera}
              disabled={!cameraActive}
              className="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Snapshot</span>
            </button>

            <label className="cursor-pointer px-4 py-3 rounded-full bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] text-xs font-semibold border border-[#292A30] flex items-center gap-2 transition-colors">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </section>
      )}

      {/* MULTI-PAGE SCAN BATCH & ENHANCEMENT */}
      {pages.length > 0 && (
        <section className="bg-[#191A1F] border border-[#292A30] rounded-[22px] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD]">
              Scanned Pages Batch ({pages.length})
            </h3>
            <span className="text-[11px] text-[#A5A5AD] font-mono">
              Page {selectedPageIndex + 1} of {pages.length} selected
            </span>
          </div>

          {/* Thumbnails Row */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => setSelectedPageIndex(idx)}
                className={`relative w-16 h-22 rounded-xl overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
                  idx === selectedPageIndex
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-[#292A30] opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={p.dataUrl}
                  alt={`Page ${idx + 1}`}
                  className="w-full h-full object-cover"
                  style={{
                    transform: `rotate(${p.rotation}deg)`,
                    filter:
                      p.filter === 'GRAYSCALE'
                        ? 'grayscale(100%)'
                        : p.filter === 'BW'
                        ? 'contrast(200%) grayscale(100%)'
                        : undefined,
                  }}
                />
                <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-bold text-white">
                  #{idx + 1}
                </span>
              </div>
            ))}

            <label className="cursor-pointer w-16 h-22 rounded-xl border border-dashed border-[#292A30] hover:border-[#393A42] bg-[#222329] flex flex-col items-center justify-center text-[#A5A5AD] shrink-0 gap-1 text-[10px] font-semibold">
              <Plus className="w-4 h-4" />
              <span>Add</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Active Page Image & Enhancement Controls */}
          {activePage && (
            <div className="pt-3 border-t border-[#292A30] space-y-4">
              {/* Toolbar: Rotate, Crop, Reset, Delete */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F5F7]">
                  Enhance & Calibrate Page #{selectedPageIndex + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRotatePage('CCW')}
                    className="p-1.5 rounded-lg bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7] border border-[#292A30]"
                    title="Rotate 90° CCW"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRotatePage('CW')}
                    className="p-1.5 rounded-lg bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7] border border-[#292A30]"
                    title="Rotate 90° CW"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowCropModal(true)}
                    className="p-1.5 rounded-lg bg-[#222329] text-indigo-400 hover:text-indigo-300 border border-[#292A30]"
                    title="Crop Document"
                  >
                    <Crop className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleResetPage}
                    className="p-1.5 rounded-lg bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7] border border-[#292A30]"
                    title="Reset to Original"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  {pages.length > 1 && (
                    <button
                      onClick={handleDeletePage}
                      className="p-1.5 rounded-lg bg-[#222329] text-rose-400 hover:text-rose-300 border border-[#292A30]"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Presets: Color, Crisp Doc, Clean B&W, Grayscale */}
              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-medium">
                {[
                  { id: 'COLOR', label: 'Color' },
                  { id: 'ENHANCED', label: 'Crisp Doc' },
                  { id: 'BW', label: 'Clean B&W' },
                  { id: 'GRAYSCALE', label: 'Grayscale' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleFilterChange(f.id as any)}
                    className={`py-1.5 rounded-lg border text-center transition-all ${
                      activePage.filter === f.id
                        ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                        : 'bg-[#222329] border-[#292A30] text-[#A5A5AD] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Fine Sliders: Brightness & Contrast */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#222329] border border-[#292A30] text-xs">
                <div>
                  <div className="flex justify-between text-[#A5A5AD] text-[10px] font-bold mb-1">
                    <span>BRIGHTNESS</span>
                    <span>{activePage.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={activePage.brightness}
                    onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#A5A5AD] text-[10px] font-bold mb-1">
                    <span>CONTRAST</span>
                    <span>{activePage.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={activePage.contrast}
                    onChange={(e) => handleContrastChange(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Active Page Large Preview Box */}
              <div className="max-h-80 overflow-hidden rounded-xl bg-black/50 border border-[#292A30] flex items-center justify-center p-3">
                <img
                  src={activePage.dataUrl}
                  alt="Scanned Preview"
                  className="max-h-72 max-w-full object-contain rounded shadow"
                  style={{
                    transform: `rotate(${activePage.rotation}deg)`,
                    filter: `brightness(${activePage.brightness}%) contrast(${activePage.contrast}%) ${
                      activePage.filter === 'GRAYSCALE'
                        ? 'grayscale(100%)'
                        : activePage.filter === 'BW'
                        ? 'contrast(240%) grayscale(100%)'
                        : activePage.filter === 'ENHANCED'
                        ? 'contrast(125%) brightness(105%)'
                        : ''
                    }`,
                  }}
                />
              </div>

              {/* Export & Print Options: Save as PDF, Save as JPG, Print Document */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={handleSaveAsPdf}
                  className="py-2.5 rounded-full bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] font-semibold text-xs border border-[#292A30] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Save PDF</span>
                </button>

                <button
                  onClick={handleSaveAsJpg}
                  className="py-2.5 rounded-full bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] font-semibold text-xs border border-[#292A30] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save JPG</span>
                </button>

                <button
                  onClick={handleDirectPrint}
                  className="py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* CROP MODAL */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#191A1F] border border-[#292A30] rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#F5F5F7] flex items-center gap-2">
                <Crop className="w-4 h-4 text-indigo-400" />
                <span>Crop Document Margins</span>
              </h3>
              <button
                onClick={() => setShowCropModal(false)}
                className="text-[#A5A5AD] hover:text-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#A5A5AD]">
              Adjust margin insets to eliminate scanning bed edges and dark borders.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-[#A5A5AD] font-bold block mb-1">
                  TOP INSET ({cropInset.top}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={cropInset.top}
                  onChange={(e) => setCropInset({ ...cropInset, top: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#A5A5AD] font-bold block mb-1">
                  BOTTOM INSET ({cropInset.bottom}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={cropInset.bottom}
                  onChange={(e) => setCropInset({ ...cropInset, bottom: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#A5A5AD] font-bold block mb-1">
                  LEFT INSET ({cropInset.left}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={cropInset.left}
                  onChange={(e) => setCropInset({ ...cropInset, left: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#A5A5AD] font-bold block mb-1">
                  RIGHT INSET ({cropInset.right}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={cropInset.right}
                  onChange={(e) => setCropInset({ ...cropInset, right: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowCropModal(false)}
                className="flex-1 py-2.5 rounded-full bg-[#222329] border border-[#292A30] text-xs font-semibold text-[#A5A5AD]"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCrop}
                className="flex-1 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCAN HISTORY SECTION */}
      <section className="bg-[#191A1F] border border-[#292A30] rounded-[22px] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD]">
            Scan History ({scanHistory.length})
          </h3>
          <span className="text-[11px] text-[#A5A5AD]">Stored locally</span>
        </div>

        <div className="divide-y divide-[#292A30]">
          {scanHistory.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-11 rounded-lg bg-[#222329] border border-[#292A30] overflow-hidden shrink-0 flex items-center justify-center">
                  <img src={item.thumbnailUrl} alt="Thumb" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#F5F5F7] truncate max-w-[200px]">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#A5A5AD]">
                    {item.pages} page{item.pages > 1 ? 's' : ''} · {item.date} · {item.fileFormat} ({item.sizeKb} KB)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={item.fileFormat === 'PDF' ? handleSaveAsPdf : handleSaveAsJpg}
                  className="px-2.5 py-1 rounded bg-[#222329] text-indigo-400 hover:text-indigo-300 font-semibold text-[11px] border border-[#292A30]"
                >
                  Download
                </button>
                <button
                  onClick={() => setScanHistory((prev) => prev.filter((h) => h.id !== item.id))}
                  className="p-1 text-[#A5A5AD] hover:text-rose-400"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
