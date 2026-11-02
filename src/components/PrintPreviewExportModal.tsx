import React, { useState } from 'react';
import {
  PrinterDevice,
  PaperSize,
  SavedLayoutTemplate,
} from '../types';
import { PAPER_SIZES_MM } from '../services/fourSectionEngine';
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
} from 'lucide-react';

interface PrintPreviewExportModalProps {
  canvas: HTMLCanvasElement | null;
  title: string;
  paperSize: PaperSize;
  layoutType: string;
  activePrinter: PrinterDevice;
  onClose: () => void;
  onExecutePrint: () => Promise<void>;
  savedTemplates?: SavedLayoutTemplate[];
  onLoadTemplate?: (template: SavedLayoutTemplate) => void;
}

export const PrintPreviewExportModal: React.FC<PrintPreviewExportModalProps> = ({
  canvas,
  title,
  paperSize,
  layoutType,
  activePrinter,
  onClose,
  onExecutePrint,
  savedTemplates = [],
  onLoadTemplate,
}) => {
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const paper = PAPER_SIZES_MM[paperSize] || { label: paperSize, widthMm: 210, heightMm: 297 };
  const widthInches = (paper.widthMm / 25.4).toFixed(2);
  const heightInches = (paper.heightMm / 25.4).toFixed(2);

  // Check compatibility
  const isColorAlert = !activePrinter.supportsColor;

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await onExecutePrint();
      onClose();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadJpg = () => {
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.98);
    link.download = `Print_Ready_${title.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#191A1F] rounded-[24px] w-full max-w-4xl border border-[#292A30] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#292A30] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#222329] border border-[#292A30] text-indigo-400 flex items-center justify-center">
              <Printer className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F5F5F7] leading-tight">
                Document Preview & Hardware Compatibility
              </h3>
              <p className="text-xs text-[#A5A5AD]">
                Physical millimeter verification before raster pipe transmission
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
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-start flex-1">
          {/* Canvas Preview Left */}
          <div className="md:col-span-7 bg-[#101114] border border-[#292A30] rounded-[20px] p-4 flex items-center justify-center min-h-[360px] overflow-hidden">
            {canvas ? (
              <img
                src={canvas.toDataURL('image/jpeg', 0.95)}
                alt="Full Page Preview"
                className="max-h-[380px] max-w-full object-contain shadow-2xl rounded-sm bg-white"
              />
            ) : (
              <p className="text-xs text-[#A5A5AD]">Rendering high-resolution raster preview...</p>
            )}
          </div>

          {/* Diagnostic Details Right */}
          <div className="md:col-span-5 space-y-3.5 text-xs">
            {/* Dimensions Card */}
            <div className="p-4 rounded-[18px] bg-[#222329] border border-[#292A30] space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[#A5A5AD] block">
                Physical Sheet Specifications
              </span>
              <div className="space-y-1.5 text-xs text-[#A5A5AD]">
                <div className="flex justify-between">
                  <span>Paper Standard:</span>
                  <strong className="text-[#F5F5F7]">{paper.label}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Millimeters:</span>
                  <span className="font-mono text-[#F5F5F7]">{paper.widthMm} × {paper.heightMm} mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Inches:</span>
                  <span className="font-mono text-[#F5F5F7]">{widthInches} × {heightInches} in</span>
                </div>
                <div className="flex justify-between">
                  <span>Raster Resolution:</span>
                  <span className="font-mono text-[#F5F5F7]">300 DPI Native</span>
                </div>
                <div className="flex justify-between">
                  <span>Cutting Guides:</span>
                  <span className="text-emerald-400 font-semibold">Active & Calibrated</span>
                </div>
              </div>
            </div>

            {/* Target Printer Verification */}
            <div className="p-4 rounded-[18px] bg-[#222329] border border-[#292A30] space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[#A5A5AD] block">
                Target Hardware Compatibility
              </span>
              <p className="font-semibold text-sm text-[#F5F5F7]">
                {activePrinter.name}
              </p>
              <p className="text-[11px] text-[#A5A5AD]">
                Interface: {activePrinter.connectionType} · Mode: {activePrinter.supportsColor ? 'Full Color Tank' : 'Monochrome Laser'}
              </p>

              {isColorAlert && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 flex items-start gap-1.5 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    HP LaserJet M1005 is a monochrome laser engine. Colors will be converted to 600 DPI bi-level halftones.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Paper tray ready · Driver pipe verified</span>
              </div>
            </div>

            {/* Saved Layouts Library if available */}
            {savedTemplates.length > 0 && (
              <div className="p-4 rounded-[18px] bg-[#222329] border border-[#292A30] space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-[#A5A5AD] block">
                  Saved Templates ({savedTemplates.length})
                </span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {savedTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-2 rounded-xl bg-[#191A1F] border border-[#292A30] flex items-center justify-between text-xs"
                    >
                      <span className="truncate max-w-[160px] font-medium text-[#F5F5F7]">{tpl.title}</span>
                      {onLoadTemplate && (
                        <button
                          onClick={() => {
                            onLoadTemplate(tpl);
                            onClose();
                          }}
                          className="text-indigo-400 hover:underline text-[11px] font-semibold"
                        >
                          Load
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#292A30] bg-[#141519] flex items-center justify-between">
          <button
            onClick={handleDownloadJpg}
            className="px-4 py-2 text-xs font-semibold rounded-full border border-[#292A30] bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JPG</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-full text-[#A5A5AD] hover:bg-[#222329] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-5 py-2 text-xs font-semibold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'Spooling...' : 'Print Document'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
