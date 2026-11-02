import React, { useState, useRef, useEffect } from 'react';
import {
  FourSectionPageConfig,
  FourSectionSlot,
  FourSectionLayoutType,
  PaperSize,
  Orientation,
  PrinterDevice,
  SavedLayoutTemplate,
} from '../types';
import {
  FourSectionEngine,
  PAPER_SIZES_MM,
} from '../services/fourSectionEngine';
import {
  LayoutGrid,
  Columns,
  Rows,
  Sparkles,
  Upload,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Trash2,
  Copy,
  Printer,
  FileDown,
  Download,
  Check,
  Save,
  Palette,
  Scissors,
  ArrowLeftRight,
} from 'lucide-react';

interface FourSectionDesignerScreenProps {
  activePrinter: PrinterDevice;
  onSpoolJob: (title: string, pages: number, copies: number, paperSize: PaperSize, colorMode: 'COLOR' | 'MONOCHROME') => Promise<void>;
  onSaveTemplate?: (template: SavedLayoutTemplate) => void;
}

const DEFAULT_SLOTS: [FourSectionSlot, FourSectionSlot, FourSectionSlot, FourSectionSlot] = [
  {
    id: 0,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    photoName: 'Portrait_Studio.jpg',
    zoom: 1.0,
    rotation: 0,
    panX: 0,
    panY: 0,
    cropAspect: 'FILL',
    bgColor: '#FFFFFF',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    isMonochrome: false,
  },
  {
    id: 1,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    photoName: 'Executive_Profile.jpg',
    zoom: 1.0,
    rotation: 0,
    panX: 0,
    panY: 0,
    cropAspect: 'FILL',
    bgColor: '#FFFFFF',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    isMonochrome: false,
  },
  {
    id: 2,
    photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    photoName: 'Alpine_Scenery.jpg',
    zoom: 1.0,
    rotation: 0,
    panX: 0,
    panY: 0,
    cropAspect: 'FILL',
    bgColor: '#FFFFFF',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    isMonochrome: false,
  },
  {
    id: 3,
    photoUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    photoName: 'Architecture_City.jpg',
    zoom: 1.0,
    rotation: 0,
    panX: 0,
    panY: 0,
    cropAspect: 'FILL',
    bgColor: '#FFFFFF',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    isMonochrome: false,
  },
];

export const FourSectionDesignerScreen: React.FC<FourSectionDesignerScreenProps> = ({
  activePrinter,
  onSpoolJob,
  onSaveTemplate,
}) => {
  const [config, setConfig] = useState<FourSectionPageConfig>({
    paperSize: 'A4',
    orientation: 'PORTRAIT',
    layout: 'GRID_2X2',
    marginMm: 6,
    gapMm: 4,
    cuttingGuides: true,
    showSectionBorders: true,
    pageBgColor: '#FFFFFF',
    slots: DEFAULT_SLOTS,
  });

  const [activeSlotId, setActiveSlotId] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSpooling, setIsSpooling] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render to canvas on changes
  useEffect(() => {
    if (!canvasRef.current) return;
    FourSectionEngine.renderToCanvas(config, canvasRef.current, 300);
  }, [config]);

  const activeSlot = config.slots[activeSlotId];

  const updateActiveSlot = (updates: Partial<FourSectionSlot>) => {
    const newSlots = [...config.slots] as [FourSectionSlot, FourSectionSlot, FourSectionSlot, FourSectionSlot];
    newSlots[activeSlotId] = { ...newSlots[activeSlotId], ...updates };
    setConfig({ ...config, slots: newSlots });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateActiveSlot({
        photoUrl: dataUrl,
        photoName: file.name,
        zoom: 1.0,
        rotation: 0,
        panX: 0,
        panY: 0,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDuplicateTo = (targetSlotId: number) => {
    if (!activeSlot.photoUrl) return;
    const newSlots = [...config.slots] as [FourSectionSlot, FourSectionSlot, FourSectionSlot, FourSectionSlot];
    newSlots[targetSlotId] = {
      ...newSlots[targetSlotId],
      photoUrl: activeSlot.photoUrl,
      photoName: activeSlot.photoName,
      zoom: activeSlot.zoom,
      rotation: activeSlot.rotation,
      brightness: activeSlot.brightness,
      contrast: activeSlot.contrast,
      saturation: activeSlot.saturation,
      isMonochrome: activeSlot.isMonochrome,
    };
    setConfig({ ...config, slots: newSlots });
  };

  const handleSwapWith = (targetSlotId: number) => {
    const newSlots = [...config.slots] as [FourSectionSlot, FourSectionSlot, FourSectionSlot, FourSectionSlot];
    const temp = newSlots[activeSlotId];
    newSlots[activeSlotId] = { ...newSlots[targetSlotId], id: activeSlotId };
    newSlots[targetSlotId] = { ...temp, id: targetSlotId };
    setConfig({ ...config, slots: newSlots });
    setActiveSlotId(targetSlotId);
  };

  const handleDownloadPdf = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const blob = await FourSectionEngine.exportToPdf(config, canvasRef.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FourSection_${config.layout}_${config.paperSize}_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJpg = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.98);
    link.download = `FourSection_${config.layout}_${config.paperSize}_${Date.now()}.jpg`;
    link.click();
  };

  const handlePrint = async () => {
    setIsSpooling(true);
    try {
      await onSpoolJob(
        `FourSection_Layout_${config.paperSize}`,
        1,
        1,
        config.paperSize,
        activePrinter.supportsColor ? 'COLOR' : 'MONOCHROME'
      );
    } finally {
      setIsSpooling(false);
    }
  };

  const handleSaveForLater = () => {
    const template: SavedLayoutTemplate = {
      id: `fs-${Date.now()}`,
      title: `Four Section ${config.layout} (${config.paperSize})`,
      createdAt: new Date().toLocaleDateString(),
      type: 'FOUR_SECTION',
      paperSize: config.paperSize,
      data: config,
    };
    if (onSaveTemplate) onSaveTemplate(template);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="space-y-6 pb-28 max-w-xl mx-auto px-1 sm:px-0">
      {/* Title Header */}
      <div className="pt-2 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] sm:text-2xl font-extrabold text-[#F5F5F7] tracking-tight">
            Four Section Designer
          </h1>
          <p className="text-xs text-[#A5A5AD]">
            2×2 Grid, 4 vertical/horizontal strips, independent cropping & cutting guides
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveForLater}
            className="px-3.5 py-2 text-xs font-semibold rounded-full border border-[#292A30] bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isSpooling}
            className="px-5 py-2 text-xs font-bold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isSpooling ? 'Spooling...' : 'Print Page'}</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Layout saved to local library. Available in Print Preview & Export!</span>
        </div>
      )}

      {/* Main Grid: Controls Left, Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Layout Form & Section Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {/* Layout & Paper Config Card */}
          <div className="bg-[#191A1F] rounded-[20px] p-4 border border-[#292A30] space-y-3">
            <span className="text-xs font-bold text-[#F5F5F7] block">
              1. Page & Layout Mode
            </span>

            {/* Layout Switcher */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { id: 'GRID_2X2', label: '2 × 2 Grid', icon: LayoutGrid },
                { id: 'VERTICAL_4', label: '4 Vertical', icon: Columns },
                { id: 'HORIZONTAL_4', label: '4 Horizontal', icon: Rows },
                { id: 'FEATURE_1_PLUS_3', label: '1 + 3 Feature', icon: Sparkles },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setConfig({ ...config, layout: l.id as FourSectionLayoutType })}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    config.layout === l.id
                      ? 'bg-[#222329] border-indigo-500 text-[#F5F5F7] font-semibold ring-1 ring-indigo-500'
                      : 'border-[#292A30] bg-[#191A1F] hover:bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7]'
                  }`}
                >
                  <l.icon className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] leading-tight">{l.label}</span>
                </button>
              ))}
            </div>

            {/* Paper Size & Orientation */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
                <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">Paper Size</label>
                <select
                  value={config.paperSize}
                  onChange={(e) => setConfig({ ...config, paperSize: e.target.value as PaperSize })}
                  className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
                >
                  {(Object.keys(PAPER_SIZES_MM) as PaperSize[]).map((ps) => (
                    <option key={ps} value={ps} className="bg-[#191A1F]">{PAPER_SIZES_MM[ps].label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
                <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">Orientation</label>
                <select
                  value={config.orientation}
                  onChange={(e) => setConfig({ ...config, orientation: e.target.value as Orientation })}
                  className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
                >
                  <option value="PORTRAIT" className="bg-[#191A1F]">Portrait</option>
                  <option value="LANDSCAPE" className="bg-[#191A1F]">Landscape</option>
                </select>
              </div>
            </div>

            {/* Margins, Gaps & Cutting Guides */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#292A30]">
              <div>
                <div className="flex justify-between text-[11px] text-[#A5A5AD] mb-1">
                  <span>Margin ({config.marginMm}mm)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={config.marginMm}
                  onChange={(e) => setConfig({ ...config, marginMm: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-[#A5A5AD] mb-1">
                  <span>Section Gap ({config.gapMm}mm)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={config.gapMm}
                  onChange={(e) => setConfig({ ...config, gapMm: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-[#A5A5AD] hover:text-[#F5F5F7]">
                <input
                  type="checkbox"
                  checked={config.cuttingGuides}
                  onChange={(e) => setConfig({ ...config, cuttingGuides: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Cutting Guides (Ticks)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-[#A5A5AD] hover:text-[#F5F5F7]">
                <input
                  type="checkbox"
                  checked={config.showSectionBorders}
                  onChange={(e) => setConfig({ ...config, showSectionBorders: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Section Boundaries</span>
              </label>
            </div>
          </div>

          {/* Section Selector Strip */}
          <div className="bg-[#191A1F] rounded-[20px] p-4 border border-[#292A30] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F5F5F7]">
                2. Select Active Section (0–3)
              </span>
              <span className="text-[11px] text-indigo-400 font-semibold">
                Editing Section {activeSlotId + 1}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              {[0, 1, 2, 3].map((slotIdx) => {
                const s = config.slots[slotIdx];
                const isSelected = activeSlotId === slotIdx;
                return (
                  <button
                    key={slotIdx}
                    onClick={() => setActiveSlotId(slotIdx)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-[#222329] ring-1 ring-indigo-500 font-bold text-[#F5F5F7]'
                        : 'border-[#292A30] bg-[#191A1F] hover:bg-[#222329] text-[#A5A5AD]'
                    }`}
                  >
                    <p className="text-xs">Section {slotIdx + 1}</p>
                    <span className="text-[10px] text-[#A5A5AD] truncate block mt-0.5">
                      {s.photoUrl ? s.photoName?.split('.')[0] || 'Image' : 'Empty'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Section Inspector Controls */}
            <div className="pt-3 border-t border-[#292A30] space-y-3 text-xs">
              {/* Photo Upload / Replace / Remove */}
              <div className="flex items-center justify-between gap-2">
                <label className="cursor-pointer px-4 py-2 rounded-full bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] border border-[#292A30] font-semibold text-xs flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{activeSlot.photoUrl ? 'Replace Photo' : 'Add Photo'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </label>

                {activeSlot.photoUrl && (
                  <button
                    onClick={() => updateActiveSlot({ photoUrl: undefined, photoName: undefined })}
                    className="p-2 rounded-xl border border-red-800 text-red-400 bg-red-950/40 hover:bg-red-900/60"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Duplicate & Swap actions */}
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>Duplicate to:</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((id) => (
                    id !== activeSlotId && (
                      <button
                        key={id}
                        onClick={() => handleDuplicateTo(id)}
                        className="px-2 py-0.5 rounded-lg border border-[#292A30] bg-[#191A1F] hover:bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7]"
                        title={`Copy photo to Section ${id + 1}`}
                      >
                        Sec {id + 1}
                      </button>
                    )
                  ))}
                </div>
              </div>

              {/* Zoom & Rotation Controls */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="flex justify-between text-[#A5A5AD] mb-1">
                    <span>Zoom ({activeSlot.zoom.toFixed(1)}x)</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    value={activeSlot.zoom}
                    onChange={(e) => updateActiveSlot({ zoom: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#A5A5AD] mb-1">
                    <span>Rotate</span>
                    <button
                      onClick={() => updateActiveSlot({ rotation: (activeSlot.rotation + 90) % 360 })}
                      className="text-indigo-400 font-medium flex items-center gap-1 hover:underline"
                    >
                      <RotateCw className="w-3 h-3" /> {activeSlot.rotation}°
                    </button>
                  </div>
                </div>
              </div>

              {/* Pan Horizontal / Vertical */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[#A5A5AD] mb-1">
                    <span>Pan X ({activeSlot.panX})</span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={activeSlot.panX}
                    onChange={(e) => updateActiveSlot({ panX: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#A5A5AD] mb-1">
                    <span>Pan Y ({activeSlot.panY})</span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={activeSlot.panY}
                    onChange={(e) => updateActiveSlot({ panY: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Color Tuning: Brightness & Monochrome */}
              <div className="pt-2 border-t border-[#292A30] flex items-center justify-between">
                <span className="text-[#A5A5AD] font-medium">
                  Monochrome (B&W)
                </span>
                <button
                  onClick={() => updateActiveSlot({ isMonochrome: !activeSlot.isMonochrome })}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                    activeSlot.isMonochrome ? 'bg-indigo-600' : 'bg-[#292A30]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      activeSlot.isMonochrome ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Canvas Preview */}
        <div className="lg:col-span-7 bg-[#191A1F] rounded-[22px] border border-[#292A30] p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#292A30]">
            <div>
              <h3 className="font-bold text-sm text-[#F5F5F7]">
                Full-Page Canvas Preview
              </h3>
              <p className="text-[11px] text-[#A5A5AD]">
                {PAPER_SIZES_MM[config.paperSize].label} · {config.orientation} · {config.layout}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-[#292A30] bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] flex items-center gap-1.5 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-red-400" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleDownloadJpg}
                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-[#292A30] bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>JPG</span>
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="bg-[#101114] border border-[#292A30] rounded-2xl p-4 flex items-center justify-center min-h-[440px] overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-h-[460px] max-w-full object-contain shadow-2xl block bg-white rounded"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#A5A5AD] pt-1">
            <span>Click any section above to tune zoom, rotation, or pan</span>
            <span>Target: <strong className="text-[#F5F5F7]">{activePrinter.name}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
