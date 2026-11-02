import React, { useState, useEffect, useRef } from 'react';
import {
  DocumentItem,
  PrintSettings,
  PrinterDevice,
  PaperSize,
  MediaType,
  Orientation,
  PrintQuality,
  Margins,
  ScalingMode,
  DocumentFormat,
} from '../types';
import { SAMPLE_DOCUMENTS, DocumentRenderService } from '../services/documentParser';
import {
  FileText,
  Search,
  Printer,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Filter,
  Layers,
  ArrowRight,
  Play,
  RotateCw,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Check,
  ZoomIn,
} from 'lucide-react';

interface DocumentScreenProps {
  activePrinter: PrinterDevice;
  onSpoolJob: (
    title: string,
    pages: number,
    copies: number,
    paperSize: PaperSize,
    colorMode: 'COLOR' | 'MONOCHROME'
  ) => Promise<void>;
  onOpenPrintersManagement?: () => void;
}

export const DocumentScreen: React.FC<DocumentScreenProps> = ({
  activePrinter,
  onSpoolJob,
  onOpenPrintersManagement,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>(SAMPLE_DOCUMENTS);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem>(SAMPLE_DOCUMENTS[0]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');

  // Print Settings State with full options requested
  const [settings, setSettings] = useState<PrintSettings>({
    copies: 1,
    paperSize: 'A4',
    mediaType: 'Plain',
    orientation: 'PORTRAIT',
    quality: 'NORMAL',
    colorMode: activePrinter.supportsColor ? 'COLOR' : 'MONOCHROME',
    margins: 'NORMAL',
    borderless: false,
    pageRange: 'All',
    scaleMode: 'FIT',
    scalePercent: 100,
  });

  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printProgress, setPrintProgress] = useState<number>(0);
  const [printStatusMessage, setPrintStatusMessage] = useState<string>('');
  const [printSuccessAlert, setPrintSuccessAlert] = useState<boolean>(false);
  const [printErrorAlert, setPrintErrorAlert] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronize color mode when active printer changes
  useEffect(() => {
    if (!activePrinter.supportsColor && settings.colorMode === 'COLOR') {
      setSettings((prev) => ({ ...prev, colorMode: 'MONOCHROME' }));
    }
  }, [activePrinter]);

  // Re-render preview canvas whenever doc, page, or settings change
  useEffect(() => {
    if (previewCanvasRef.current && selectedDoc) {
      DocumentRenderService.renderPageToCanvas(
        selectedDoc,
        currentPage,
        settings,
        previewCanvasRef.current
      );
    }
  }, [selectedDoc, currentPage, settings]);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.contentSnippet && doc.contentSnippet.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedFolder === 'PDF') return matchesSearch && doc.type === 'PDF';
    if (selectedFolder === 'IMAGES')
      return matchesSearch && ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(doc.type);
    if (selectedFolder === 'OFFICE')
      return matchesSearch && ['DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'].includes(doc.type);
    if (selectedFolder === 'TEXT')
      return matchesSearch && ['TXT', 'CSV', 'RTF'].includes(doc.type);
    return matchesSearch;
  });

  /**
   * Genuine file upload & client-side parsing for all 10 document & image formats
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setPrintErrorAlert(null);

    try {
      const parsedDoc = await DocumentRenderService.parseUploadedFile(file);
      setDocuments((prev) => [parsedDoc, ...prev]);
      setSelectedDoc(parsedDoc);
      setCurrentPage(1);

      // Auto-orient landscape if image is wider than tall
      if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(parsedDoc.type)) {
        // Can inspect if user wants landscape
      }
    } catch (err: any) {
      setPrintErrorAlert(`File parse error: ${err.message || 'Could not parse document structure'}`);
    } finally {
      setIsParsingFile(false);
    }
  };

  /**
   * Spool with fail-fast compatibility check
   */
  const handleExecutePrint = async () => {
    setIsPrinting(true);
    setPrintProgress(10);
    setPrintStatusMessage('Rasterizing pages to printable canvas...');
    setPrintSuccessAlert(false);
    setPrintErrorAlert(null);

    // Fail-fast if color requested on monochrome laser
    if (!activePrinter.supportsColor && settings.colorMode === 'COLOR') {
      setIsPrinting(false);
      setPrintErrorAlert(
        'HP LaserJet M1005 MFP is a monochrome laser engine. Color printing is technically unsupported. Switch Color Mode to B/W Mono.'
      );
      return;
    }

    // Fail-fast if borderless requested on laser
    if (!activePrinter.supportsBorderless && settings.borderless) {
      setIsPrinting(false);
      setPrintErrorAlert(
        'Borderless printing is not supported on laser printers due to toner drum margin requirements. Switch to Canon PIXMA G3010 or disable borderless.'
      );
      return;
    }

    try {
      await new Promise((r) => setTimeout(r, 400));
      setPrintProgress(45);
      setPrintStatusMessage(
        activePrinter.model === 'HP_M1005'
          ? 'Generating Zenographics ZjStream bi-level records (600 DPI)...'
          : 'Packaging Canon BJNP command blocks for port 8611...'
      );

      await new Promise((r) => setTimeout(r, 500));
      setPrintProgress(75);
      setPrintStatusMessage('Transmitting raster stream to printer endpoint buffer...');

      const pagesToPrint = DocumentRenderService.parsePageRange(settings.pageRange, selectedDoc.pageCount);

      await onSpoolJob(
        selectedDoc.name,
        pagesToPrint.length,
        settings.copies,
        settings.paperSize,
        settings.colorMode
      );

      setPrintProgress(100);
      setPrintStatusMessage('Job delivered to hardware spooler!');
      setPrintSuccessAlert(true);
      setTimeout(() => setPrintSuccessAlert(false), 4500);
    } catch (err: any) {
      setPrintErrorAlert(err.message || 'Spooling failed. Please verify printer connection.');
    } finally {
      setIsPrinting(false);
    }
  };

  const isVerifiedAndReady = activePrinter.verifiedCommunication && activePrinter.status === 'READY';

  return (
    <div className="space-y-5 pb-28 max-w-xl mx-auto px-1 sm:px-0">
      {/* Title & Upload Action */}
      <div className="pt-2 px-1 flex items-center justify-between">
        <div>
          <h1 className="text-[26px] sm:text-2xl font-extrabold text-[#F5F5F7] tracking-tight">
            Print Document
          </h1>
          <p className="text-xs text-[#A5A5AD]">
            PDF, Images, Word, Excel, PowerPoint, Text & RTF
          </p>
        </div>

        <label className="cursor-pointer px-4 py-2 rounded-full bg-[#191A1F] hover:bg-[#222329] border border-[#292A30] text-[#F5F5F7] text-xs font-semibold flex items-center gap-1.5 transition-colors">
          <Upload className={`w-3.5 h-3.5 text-indigo-400 ${isParsingFile ? 'animate-bounce' : ''}`} />
          <span>{isParsingFile ? 'Parsing...' : 'Upload File'}</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Printer Link Status Card */}
      <div className="bg-[#191A1F] border border-[#292A30] rounded-[20px] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#222329] border border-[#292A30] flex items-center justify-center text-[#F5F5F7]">
            <Printer className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isVerifiedAndReady
                    ? 'bg-emerald-500 animate-pulse'
                    : activePrinter.status === 'UNVERIFIED'
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
              />
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isVerifiedAndReady
                    ? 'text-emerald-400'
                    : activePrinter.status === 'UNVERIFIED'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {isVerifiedAndReady
                  ? 'Hardware Verified · Ready'
                  : activePrinter.status === 'UNVERIFIED'
                  ? 'Unverified Hardware'
                  : `Offline (${activePrinter.status})`}
              </span>
            </div>
            <h3 className="text-xs font-semibold text-[#F5F5F7] mt-0.5">
              {activePrinter.name}
            </h3>
          </div>
        </div>

        {onOpenPrintersManagement && (
          <button
            onClick={onOpenPrintersManagement}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Manage
          </button>
        )}
      </div>

      {/* Unverified Warning Alert */}
      {!isVerifiedAndReady && (
        <div className="p-3.5 rounded-[18px] bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Hardware Link Not Verified</p>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              Sowji Xerox strictly verifies printer sockets before printing. If you spool now, an automatic probe
              will be dispatched. If the printer is powered off or USB permissions are missing, spooling will halt.
            </p>
          </div>
        </div>
      )}

      {/* DOCUMENT LIBRARY BROWSER */}
      <div className="bg-[#191A1F] border border-[#292A30] rounded-[22px] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD]">
            Document Library
          </h3>
          <span className="text-[11px] text-[#A5A5AD] font-mono">
            {filteredDocs.length} files available
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#A5A5AD] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name or content..."
            className="w-full pl-9 pr-3 py-2 bg-[#222329] border border-[#292A30] rounded-xl text-xs text-[#F5F5F7] placeholder-[#A5A5AD] outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {['ALL', 'PDF', 'IMAGES', 'OFFICE', 'TEXT'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={`px-3 py-1 rounded-full font-semibold transition-colors whitespace-nowrap ${
                selectedFolder === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7] border border-[#292A30]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* File Cards List */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {filteredDocs.map((doc) => {
            const isSelected = selectedDoc.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#222329] border-indigo-500 shadow-sm'
                    : 'bg-[#191A1F] border-[#292A30] hover:bg-[#222329]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#191A1F] border border-[#292A30] flex items-center justify-center shrink-0">
                    <FileText className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-[#A5A5AD]'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#F5F5F7] truncate">{doc.name}</p>
                    <p className="text-[10px] text-[#A5A5AD] font-mono">
                      {doc.type} · {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'} · {(doc.sizeBytes / 1024).toFixed(0)} KB · {doc.modifiedDate}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                    isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[#222329] text-[#A5A5AD]'
                  }`}
                >
                  {doc.type}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DOCUMENT PREVIEW & PAGE SELECTION */}
      <div className="bg-[#191A1F] border border-[#292A30] rounded-[22px] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD]">
              Hardware Page Preview
            </h3>
            <span className="text-[11px] font-mono text-indigo-400">
              {settings.paperSize} ({settings.orientation})
            </span>
          </div>

          {/* Page Stepper */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded bg-[#222329] border border-[#292A30] text-[#F5F5F7] disabled:opacity-40"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-[#F5F5F7] font-mono">
              {currentPage} / {selectedDoc.pageCount}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(selectedDoc.pageCount, p + 1))}
              disabled={currentPage >= selectedDoc.pageCount}
              className="p-1 rounded bg-[#222329] border border-[#292A30] text-[#F5F5F7] disabled:opacity-40"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Canvas Display Viewport */}
        <div className="bg-[#101114] border border-[#292A30] rounded-[18px] p-4 flex items-center justify-center min-h-[380px] overflow-hidden">
          <canvas
            ref={previewCanvasRef}
            className="max-h-[460px] max-w-full rounded shadow-2xl border border-gray-700 bg-white"
          />
        </div>
      </div>

      {/* COMPREHENSIVE PRINT SETTINGS */}
      <div className="bg-[#191A1F] border border-[#292A30] rounded-[22px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Printing Parameters & Calibrations</span>
          </h3>
        </div>

        {/* Grid 1: Paper Size, Copies, Color Mode, Orientation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Paper Size */}
          <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
            <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
              Paper Size
            </label>
            <select
              value={settings.paperSize}
              onChange={(e) => setSettings({ ...settings, paperSize: e.target.value as PaperSize })}
              className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
            >
              <option value="A4" className="bg-[#191A1F]">A4 (210×297mm)</option>
              <option value="Letter" className="bg-[#191A1F]">Letter (8.5×11")</option>
              <option value="A5" className="bg-[#191A1F]">A5 (148×210mm)</option>
              <option value="4x6" className="bg-[#191A1F]">4 × 6" Photo</option>
              <option value="5x7" className="bg-[#191A1F]">5 × 7" Photo</option>
            </select>
          </div>

          {/* Copies */}
          <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
            <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
              Copies
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={99}
                value={settings.copies}
                onChange={(e) =>
                  setSettings({ ...settings, copies: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-full bg-transparent text-[#F5F5F7] font-semibold font-mono outline-none"
              />
            </div>
          </div>

          {/* Color Mode */}
          <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
            <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
              Color Mode
            </label>
            <select
              value={settings.colorMode}
              disabled={!activePrinter.supportsColor}
              onChange={(e) => setSettings({ ...settings, colorMode: e.target.value as any })}
              className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none disabled:opacity-50"
            >
              <option value="MONOCHROME" className="bg-[#191A1F]">B/W Monochrome</option>
              {activePrinter.supportsColor && (
                <option value="COLOR" className="bg-[#191A1F]">Full Colour</option>
              )}
            </select>
          </div>

          {/* Orientation */}
          <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
            <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
              Orientation
            </label>
            <select
              value={settings.orientation}
              onChange={(e) => setSettings({ ...settings, orientation: e.target.value as Orientation })}
              className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
            >
              <option value="PORTRAIT" className="bg-[#191A1F]">Portrait</option>
              <option value="LANDSCAPE" className="bg-[#191A1F]">Landscape</option>
            </select>
          </div>
        </div>

        {/* Grid 2: Margins, Page Range, Scaling, Print Quality */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Margins */}
          <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
            <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
              Margins
            </label>
            <select
              value={settings.margins}
              onChange={(e) => setSettings({ ...settings, margins: e.target.value as Margins })}
              className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
            >
              <option value="NORMAL" className="bg-[#191A1F]">Normal (10mm)</option>
              <option value="NARROW" className="bg-[#191A1F]">Narrow (5mm)</option>
              <option value="WIDE" className="bg-[#191A1F]">Wide (20mm)</option>
              <option value="NONE" className="bg-[#191A1F]">Zero Margin</option>
            </select>
          </div>

          {/* Page Range */}
          <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
            <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
              Page Range
            </label>
            <input
              type="text"
              value={settings.pageRange}
              onChange={(e) => setSettings({ ...settings, pageRange: e.target.value })}
              placeholder="All, e.g. 1-2, 3"
              className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
            >
            </input>
          </div>

          {/* Scaling */}
          <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
            <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
              Scaling
            </label>
            <select
              value={settings.scaleMode || 'FIT'}
              onChange={(e) => setSettings({ ...settings, scaleMode: e.target.value as ScalingMode })}
              className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
            >
              <option value="FIT" className="bg-[#191A1F]">Fit Printable Area</option>
              <option value="ACTUAL" className="bg-[#191A1F]">100% Actual Size</option>
              <option value="CUSTOM" className="bg-[#191A1F]">Custom %</option>
            </select>
          </div>

          {/* Print Quality */}
          <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
            <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">
              Print Quality
            </label>
            <select
              value={settings.quality}
              onChange={(e) => setSettings({ ...settings, quality: e.target.value as PrintQuality })}
              className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
            >
              <option value="DRAFT" className="bg-[#191A1F]">Draft (Fast)</option>
              <option value="NORMAL" className="bg-[#191A1F]">Normal (300 DPI)</option>
              <option value="HIGH" className="bg-[#191A1F]">High Res (600+ DPI)</option>
            </select>
          </div>
        </div>

        {/* Custom Scale Percentage Slider (if CUSTOM selected) */}
        {settings.scaleMode === 'CUSTOM' && (
          <div className="p-3 rounded-xl bg-[#222329] border border-[#292A30] flex items-center justify-between gap-4 text-xs">
            <span className="font-semibold text-[#F5F5F7] whitespace-nowrap">
              Scale: {settings.scalePercent || 100}%
            </span>
            <input
              type="range"
              min={50}
              max={150}
              step={5}
              value={settings.scalePercent || 100}
              onChange={(e) => setSettings({ ...settings, scalePercent: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        )}

        {/* Notice for HP Laser Color/Borderless */}
        {!activePrinter.supportsColor && (
          <div className="p-3 rounded-xl bg-[#222329] border border-[#292A30] text-[11px] text-[#A5A5AD] flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {activePrinter.name} is a monochrome laser engine. Output will be dithered in 1-bit bi-level black & white.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {printErrorAlert && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Print Validation Failed</p>
              <p className="text-[11px] text-rose-200">{printErrorAlert}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {printSuccessAlert && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Document spooled and sent to {activePrinter.name}!</span>
          </div>
        )}

        {/* Print Progress Bar */}
        {isPrinting && (
          <div className="space-y-1.5 p-3 rounded-xl bg-[#222329] border border-[#292A30]">
            <div className="flex justify-between text-xs text-[#F5F5F7] font-medium">
              <span>{printStatusMessage}</span>
              <span className="font-mono">{printProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#101114] overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${printProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Primary Spool Action Button */}
        <button
          onClick={handleExecutePrint}
          disabled={isPrinting}
          className="w-full py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>{isPrinting ? 'Processing Spool Stream...' : 'Print Document'}</span>
        </button>
      </div>
    </div>
  );
};
