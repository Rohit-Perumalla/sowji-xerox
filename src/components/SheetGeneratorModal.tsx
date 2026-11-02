import React, { useState, useRef, useEffect } from 'react';
import { SheetConfig, PassportConfig, PrinterDevice } from '../types';
import {
  SheetGeneratorService,
  PAPER_DIMENSIONS_MM,
  SheetCalculationResult,
} from '../services/sheetGenerator';
import {
  X,
  Printer,
  Download,
  AlertTriangle,
  Grid3X3,
  Check,
  FileDown,
  Layers,
  Sparkles,
  Sliders,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface SheetGeneratorModalProps {
  sourcePassportCanvas: HTMLCanvasElement | null;
  passportConfig: PassportConfig;
  activePrinter: PrinterDevice;
  onClose: () => void;
  onSpoolJob: (
    title: string,
    pages: number,
    copies: number,
    paperSize: any,
    colorMode: 'COLOR' | 'MONOCHROME'
  ) => Promise<void>;
}

export const SheetGeneratorModal: React.FC<SheetGeneratorModalProps> = ({
  sourcePassportCanvas,
  passportConfig,
  activePrinter,
  onClose,
  onSpoolJob,
}) => {
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>({
    paperSize: '4x6',
    photosCount: 8,
    spacingMm: 3,
    marginMm: 4,
    includeCuttingGuides: true,
    addBorder: true,
    mediaType: 'Glossy',
  });

  const [customCount, setCustomCount] = useState<string>('8');
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);

  const [calculationResult, setCalculationResult] = useState<SheetCalculationResult | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<string>('');

  const sheetCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-render sheet on canvas whenever config changes
  useEffect(() => {
    if (!sourcePassportCanvas || !sheetCanvasRef.current) return;

    const result = SheetGeneratorService.renderSheetToCanvas(
      sourcePassportCanvas,
      sheetConfig,
      passportConfig.widthMm,
      passportConfig.heightMm,
      sheetCanvasRef.current,
      300 // 300 DPI true physical resolution
    );

    setCalculationResult(result);
  }, [sourcePassportCanvas, sheetConfig, passportConfig]);

  const handleSelectCount = (count: number) => {
    setIsCustomCount(false);
    setSheetConfig((prev) => ({ ...prev, photosCount: count }));
  };

  const handleCustomCountChange = (val: string) => {
    setCustomCount(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSheetConfig((prev) => ({ ...prev, photosCount: parsed }));
    }
  };

  const handleDownloadPdf = async () => {
    if (!sourcePassportCanvas) return;
    setIsExportingPdf(true);
    try {
      const pdfBlob = await SheetGeneratorService.exportToPdf(
        sourcePassportCanvas,
        sheetConfig,
        passportConfig.widthMm,
        passportConfig.heightMm
      );

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sowji_Xerox_Sheet_${sheetConfig.paperSize}_${sheetConfig.photosCount}x_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadJpg = () => {
    if (!sheetCanvasRef.current) return;
    const link = document.createElement('a');
    link.href = sheetCanvasRef.current.toDataURL('image/jpeg', 0.98);
    link.download = `Sowji_Xerox_Sheet_${sheetConfig.paperSize}_${sheetConfig.photosCount}x_${Date.now()}.jpg`;
    link.click();
  };

  const handlePrintSheet = async () => {
    setIsPrinting(true);
    setPrintStatus('Compiling true 300 DPI millimeter sheet for printer...');
    try {
      await new Promise((r) => setTimeout(r, 600));
      await onSpoolJob(
        `Passport_Sheet_${sheetConfig.paperSize}_(${sheetConfig.photosCount}x)`,
        1,
        1,
        sheetConfig.paperSize as any,
        activePrinter.supportsColor ? 'COLOR' : 'MONOCHROME'
      );
      setPrintStatus('Sheet queued to printer spooler successfully!');
      await new Promise((r) => setTimeout(r, 600));
      onClose();
    } catch (err: any) {
      setPrintStatus(err.message || 'Spooling failed.');
    } finally {
      setIsPrinting(false);
    }
  };

  const currentPaper = PAPER_DIMENSIONS_MM[sheetConfig.paperSize] || {
    name: 'Photo Sheet',
    widthMm: 102,
    heightMm: 152,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#191A1F] rounded-[24px] w-full max-w-5xl border border-[#292A30] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-[#292A30] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-[#222329] border border-[#292A30] text-indigo-400 flex items-center justify-center font-bold">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F5F5F7] leading-tight">
                Sowji Xerox · Photo Sheet Generator
              </h3>
              <p className="text-xs text-[#A5A5AD]">
                Exact millimeter layout · Cutting guides · 300 DPI True Size · Never Stretches Faces
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A5A5AD] hover:text-[#F5F5F7] hover:bg-[#222329] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Sheet Size Selection */}
            <div className="bg-[#222329] rounded-[20px] p-4 border border-[#292A30] space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD]">
                1. Physical Paper Sheet Size
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['4x6', '5x7', 'A4', 'A5'] as const).map((size) => {
                  const p = PAPER_DIMENSIONS_MM[size];
                  const isSelected = sheetConfig.paperSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSheetConfig({ ...sheetConfig, paperSize: size })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-[#191A1F] ring-1 ring-indigo-500 text-[#F5F5F7] font-semibold'
                          : 'border-[#292A30] bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7]'
                      }`}
                    >
                      <p className="font-bold text-xs text-[#F5F5F7]">{p.name.split('(')[0]}</p>
                      <p className="text-[10px] text-[#A5A5AD] mt-0.5 font-mono">
                        {p.widthMm} × {p.heightMm} mm
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo Copies Quantity (4, 8, 12, 16, or custom) */}
            <div className="bg-[#222329] rounded-[20px] p-4 border border-[#292A30] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD]">
                  2. Photo Copies Quantity
                </span>
                <span className="text-xs text-indigo-400 font-mono font-bold">
                  {sheetConfig.photosCount} Copies
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                {[4, 8, 12, 16].map((cnt) => {
                  const isSelected = !isCustomCount && sheetConfig.photosCount === cnt;
                  return (
                    <button
                      key={cnt}
                      onClick={() => handleSelectCount(cnt)}
                      className={`py-2 rounded-xl border text-center font-bold transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-[#191A1F] text-white ring-1 ring-indigo-500'
                          : 'border-[#292A30] bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7]'
                      }`}
                    >
                      {cnt}×
                    </button>
                  );
                })}
              </div>

              {/* Custom Count Option */}
              <div className="pt-2 border-t border-[#292A30] flex items-center justify-between gap-3 text-xs">
                <button
                  onClick={() => setIsCustomCount(true)}
                  className={`text-xs font-semibold ${
                    isCustomCount ? 'text-indigo-400' : 'text-[#A5A5AD] hover:text-[#F5F5F7]'
                  }`}
                >
                  Custom Copies:
                </button>
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={isCustomCount ? customCount : sheetConfig.photosCount}
                  onFocus={() => setIsCustomCount(true)}
                  onChange={(e) => handleCustomCountChange(e.target.value)}
                  className="w-20 p-2 rounded-xl bg-[#191A1F] border border-[#292A30] text-[#F5F5F7] font-mono font-bold text-center outline-none"
                />
              </div>
            </div>

            {/* Media Settings (Glossy vs Matte) */}
            <div className="bg-[#222329] rounded-[20px] p-4 border border-[#292A30] space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD]">
                3. Paper Media Type (Canon MegaTank / Laser)
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'Glossy', label: 'Photo Glossy', sub: 'PP-201 260g' },
                  { id: 'Matte', label: 'Photo Matte', sub: 'MP-101 170g' },
                  { id: 'Plain', label: 'Plain Bond', sub: 'Copier 80g' },
                ].map((m) => {
                  const isSelected = sheetConfig.mediaType === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSheetConfig({ ...sheetConfig, mediaType: m.id as any })}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-[#191A1F] text-[#F5F5F7] ring-1 ring-indigo-500 font-bold'
                          : 'border-[#292A30] bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7]'
                      }`}
                    >
                      <p className="text-xs">{m.label}</p>
                      <p className="text-[9px] text-[#A5A5AD] mt-0.5">{m.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spacing, Margin & Guides */}
            <div className="bg-[#222329] rounded-[20px] p-4 border border-[#292A30] space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[#A5A5AD] text-[10px] font-bold mb-1">
                    <span>SPACING</span>
                    <span>{sheetConfig.spacingMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={sheetConfig.spacingMm}
                    onChange={(e) =>
                      setSheetConfig({ ...sheetConfig, spacingMm: parseInt(e.target.value) })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#A5A5AD] text-[10px] font-bold mb-1">
                    <span>MARGIN</span>
                    <span>{sheetConfig.marginMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={15}
                    value={sheetConfig.marginMm}
                    onChange={(e) =>
                      setSheetConfig({ ...sheetConfig, marginMm: parseInt(e.target.value) })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#292A30] flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-[#F5F5F7]">
                  <input
                    type="checkbox"
                    checked={sheetConfig.includeCuttingGuides}
                    onChange={(e) =>
                      setSheetConfig({ ...sheetConfig, includeCuttingGuides: e.target.checked })
                    }
                    className="rounded border-[#292A30] accent-indigo-500"
                  />
                  <span>Cutting Guides</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#F5F5F7]">
                  <input
                    type="checkbox"
                    checked={sheetConfig.addBorder}
                    onChange={(e) =>
                      setSheetConfig({ ...sheetConfig, addBorder: e.target.checked })
                    }
                    className="rounded border-[#292A30] accent-indigo-500"
                  />
                  <span>Photo Borders</span>
                </label>
              </div>
            </div>

            {/* CAPACITY WARNING (Strict requirement) */}
            {calculationResult && !calculationResult.fits && (
              <div className="p-3.5 rounded-[18px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 shadow-md">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Quantity Exceeds Physical Sheet Capacity</p>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    {calculationResult.warning}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preview & Print Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#222329] rounded-[22px] p-5 border border-[#292A30] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F5F5F7]">
                  Sheet View ({currentPaper.name})
                </span>
                <span className="text-[#A5A5AD] font-mono">
                  {passportConfig.widthMm} × {passportConfig.heightMm} mm per photo
                </span>
              </div>

              {/* High-DPI Sheet Viewport */}
              <div className="bg-[#101114] p-4 rounded-xl border border-[#292A30] flex items-center justify-center min-h-[380px] overflow-hidden">
                <canvas
                  ref={sheetCanvasRef}
                  className="max-h-[380px] max-w-full rounded shadow-2xl border border-gray-600 bg-white"
                />
              </div>

              {/* Status Message */}
              {printStatus && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  {printStatus}
                </div>
              )}

              {/* Action Buttons: PDF, JPG, Print */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="py-3 rounded-full bg-[#191A1F] hover:bg-[#2c2d36] text-[#F5F5F7] font-semibold text-xs border border-[#292A30] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isExportingPdf ? 'Exporting...' : 'Save PDF'}</span>
                </button>

                <button
                  onClick={handleDownloadJpg}
                  className="py-3 rounded-full bg-[#191A1F] hover:bg-[#2c2d36] text-[#F5F5F7] font-semibold text-xs border border-[#292A30] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save JPG</span>
                </button>

                <button
                  onClick={handlePrintSheet}
                  disabled={isPrinting || (calculationResult !== null && !calculationResult.fits)}
                  className="py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-40"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isPrinting ? 'Printing...' : 'Print Sheet'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
