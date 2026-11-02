import React, { useState, useRef, useEffect } from 'react';
import {
  OneByOneSheetConfig,
  PlacedPhotoItem,
  PaperSize,
  PrinterDevice,
  SavedLayoutTemplate,
} from '../types';
import {
  OneByOneEngine,
  PHOTO_SIZE_PRESETS,
  SheetPackingResult,
} from '../services/oneByOneEngine';
import { PAPER_SIZES_MM } from '../services/fourSectionEngine';
import {
  Plus,
  Trash2,
  Copy,
  Printer,
  FileDown,
  Download,
  AlertTriangle,
  Check,
  Grid,
  Upload,
  ArrowUp,
  ArrowDown,
  Save,
  Layers,
} from 'lucide-react';

interface OneByOneSheetScreenProps {
  activePrinter: PrinterDevice;
  onSpoolJob: (title: string, pages: number, copies: number, paperSize: PaperSize, colorMode: 'COLOR' | 'MONOCHROME') => Promise<void>;
  onSaveTemplate?: (template: SavedLayoutTemplate) => void;
}

const INITIAL_PLACED_PHOTOS: PlacedPhotoItem[] = [
  {
    id: 'p-1',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    photoName: 'Photo_1.jpg',
    widthMm: 35,
    heightMm: 45,
    rotation: 0,
  },
  {
    id: 'p-2',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    photoName: 'Photo_2.jpg',
    widthMm: 35,
    heightMm: 45,
    rotation: 0,
  },
  {
    id: 'p-3',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    photoName: 'Photo_3.jpg',
    widthMm: 35,
    heightMm: 45,
    rotation: 0,
  },
  {
    id: 'p-4',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    photoName: 'Photo_4.jpg',
    widthMm: 35,
    heightMm: 45,
    rotation: 0,
  },
];

export const OneByOneSheetScreen: React.FC<OneByOneSheetScreenProps> = ({
  activePrinter,
  onSpoolJob,
  onSaveTemplate,
}) => {
  const [config, setConfig] = useState<OneByOneSheetConfig>({
    paperSize: '4x6',
    photoPreset: '35x45',
    photoWidthMm: 35,
    photoHeightMm: 45,
    spacingMm: 3,
    marginMm: 4,
    includeCuttingGuides: true,
    addBorder: true,
    photos: INITIAL_PLACED_PHOTOS,
  });

  const [packing, setPacking] = useState<SheetPackingResult | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSpooling, setIsSpooling] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-calculate layout and render canvas on change
  useEffect(() => {
    if (!canvasRef.current) return;
    OneByOneEngine.renderToCanvas(config, canvasRef.current, 300).then((res) => {
      setPacking(res);
    });
  }, [config]);

  const handlePresetChange = (presetKey: keyof typeof PHOTO_SIZE_PRESETS) => {
    const preset = PHOTO_SIZE_PRESETS[presetKey];
    setConfig({
      ...config,
      photoPreset: presetKey,
      photoWidthMm: preset.widthMm,
      photoHeightMm: preset.heightMm,
      photos: config.photos.map((p) => ({
        ...p,
        widthMm: preset.widthMm,
        heightMm: preset.heightMm,
      })),
    });
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newPhoto: PlacedPhotoItem = {
        id: `photo-${Date.now()}`,
        photoUrl: dataUrl,
        photoName: `Photo_${config.photos.length + 1}.jpg`,
        widthMm: config.photoWidthMm,
        heightMm: config.photoHeightMm,
        rotation: 0,
      };
      setConfig({
        ...config,
        photos: [...config.photos, newPhoto],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDuplicatePhoto = (index: number) => {
    const target = config.photos[index];
    const duplicate: PlacedPhotoItem = {
      ...target,
      id: `photo-copy-${Date.now()}`,
      photoName: `${target.photoName.split('.')[0]}_Copy.jpg`,
    };
    const newPhotos = [...config.photos];
    newPhotos.splice(index + 1, 0, duplicate);
    setConfig({ ...config, photos: newPhotos });
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = config.photos.filter((_, i) => i !== index);
    setConfig({ ...config, photos: newPhotos });
  };

  const handleMovePhoto = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.photos.length) return;

    const newPhotos = [...config.photos];
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIdx];
    newPhotos[targetIdx] = temp;
    setConfig({ ...config, photos: newPhotos });
  };

  const handleSetExactCount = (count: number) => {
    if (config.photos.length === 0) return;
    const basePhoto = config.photos[0];
    const newPhotos: PlacedPhotoItem[] = [];
    for (let i = 0; i < count; i++) {
      const src = config.photos[i % config.photos.length] || basePhoto;
      newPhotos.push({
        ...src,
        id: `photo-${i + 1}-${Date.now()}`,
        photoName: `Photo_${i + 1}.jpg`,
      });
    }
    setConfig({ ...config, photos: newPhotos });
  };

  const handleDownloadPdf = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const blob = await OneByOneEngine.exportToPdf(config, canvasRef.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PhotoSheet_${config.photos.length}Photos_${config.paperSize}_${Date.now()}.pdf`;
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
    link.download = `PhotoSheet_${config.photos.length}Photos_${config.paperSize}_${Date.now()}.jpg`;
    link.click();
  };

  const handlePrint = async () => {
    setIsSpooling(true);
    try {
      await onSpoolJob(
        `PhotoSheet_${config.photos.length}Photos_${config.paperSize}`,
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
      id: `obo-${Date.now()}`,
      title: `One-by-One Sheet (${config.photos.length} Photos on ${config.paperSize})`,
      createdAt: new Date().toLocaleDateString(),
      type: 'ONE_BY_ONE',
      paperSize: config.paperSize,
      data: config,
    };
    if (onSaveTemplate) onSaveTemplate(template);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-28 max-w-xl mx-auto px-1 sm:px-0">
      {/* Header */}
      <div className="pt-2 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] sm:text-2xl font-extrabold text-[#F5F5F7] tracking-tight">
            One-by-One Sheet Builder
          </h1>
          <p className="text-xs text-[#A5A5AD]">
            Add photos one by one (Photo 1, 2, 3, 4...), auto-pack with zero facial distortion
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
            <span>{isSpooling ? 'Spooling...' : 'Print Sheet'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Sheet configuration saved to local library.</span>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Sheet Setup & Photo Sequence */}
        <div className="lg:col-span-5 space-y-4">
          {/* Step 1 & 2: Paper & Photo Size Selection */}
          <div className="bg-[#191A1F] rounded-[20px] p-4 border border-[#292A30] space-y-3">
            <span className="text-xs font-bold text-[#F5F5F7] block">
              1. Paper & Photo Specifications
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
                <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">Sheet Paper Size</label>
                <select
                  value={config.paperSize}
                  onChange={(e) => setConfig({ ...config, paperSize: e.target.value as PaperSize })}
                  className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
                >
                  <option value="4x6" className="bg-[#191A1F]">4 × 6 inch Photo</option>
                  <option value="5x7" className="bg-[#191A1F]">5 × 7 inch Photo</option>
                  <option value="A4" className="bg-[#191A1F]">A4 Full Sheet</option>
                  <option value="A5" className="bg-[#191A1F]">A5 Sheet</option>
                  <option value="Letter" className="bg-[#191A1F]">Letter</option>
                </select>
              </div>

              <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
                <label className="text-[10px] uppercase font-bold text-[#A5A5AD] block mb-1">Photo Preset</label>
                <select
                  value={config.photoPreset}
                  onChange={(e) => handlePresetChange(e.target.value as any)}
                  className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
                >
                  {(Object.keys(PHOTO_SIZE_PRESETS) as (keyof typeof PHOTO_SIZE_PRESETS)[]).map((k) => (
                    <option key={k} value={k} className="bg-[#191A1F]">{PHOTO_SIZE_PRESETS[k].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {config.photoPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <label className="text-[10px] text-[#A5A5AD]">Width (mm)</label>
                  <input
                    type="number"
                    value={config.photoWidthMm}
                    onChange={(e) => setConfig({ ...config, photoWidthMm: parseInt(e.target.value) || 35 })}
                    className="w-full p-2 rounded-xl bg-[#222329] border border-[#292A30] text-[#F5F5F7] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#A5A5AD]">Height (mm)</label>
                  <input
                    type="number"
                    value={config.photoHeightMm}
                    onChange={(e) => setConfig({ ...config, photoHeightMm: parseInt(e.target.value) || 45 })}
                    className="w-full p-2 rounded-xl bg-[#222329] border border-[#292A30] text-[#F5F5F7] font-mono outline-none"
                  />
                </div>
              </div>
            )}

            {/* Quick Grid Quantities */}
            <div className="pt-2 border-t border-[#292A30] space-y-1.5 text-xs">
              <span className="text-[11px] font-semibold text-[#A5A5AD]">Quick Layout Quantities</span>
              <div className="grid grid-cols-4 gap-2">
                {[4, 8, 12, 16].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => handleSetExactCount(cnt)}
                    className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      config.photos.length === cnt
                        ? 'bg-[#222329] border-emerald-500 text-emerald-400 ring-1 ring-emerald-500'
                        : 'border-[#292A30] bg-[#191A1F] text-[#A5A5AD] hover:bg-[#222329]'
                    }`}
                  >
                    {cnt} Photos
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sequential Photo List (Add Photo 1, 2, 3...) */}
          <div className="bg-[#191A1F] rounded-[20px] p-4 border border-[#292A30] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F5F5F7]">
                2. Placed Photos Queue ({config.photos.length})
              </span>

              <label className="cursor-pointer px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Photo</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAddPhoto}
                />
              </label>
            </div>

            {/* Warning if photos exceed capacity */}
            {packing?.warning && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <p>{packing.warning}</p>
              </div>
            )}

            {/* Photos List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {config.photos.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-[#292A30] bg-[#222329] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#101114] border border-[#292A30] text-[10px] font-bold text-[#F5F5F7] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={item.photoUrl}
                      alt={item.photoName}
                      className="w-8 h-10 object-cover rounded-lg border border-[#292A30] shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-[#F5F5F7] truncate">
                        {item.photoName}
                      </p>
                      <p className="text-[10px] text-[#A5A5AD]">
                        {item.widthMm} × {item.heightMm} mm
                      </p>
                    </div>
                  </div>

                  {/* Move Up/Down, Duplicate, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMovePhoto(idx, 'UP')}
                      disabled={idx === 0}
                      className="p-1 rounded text-[#A5A5AD] hover:text-[#F5F5F7] hover:bg-[#191A1F] disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMovePhoto(idx, 'DOWN')}
                      disabled={idx === config.photos.length - 1}
                      className="p-1 rounded text-[#A5A5AD] hover:text-[#F5F5F7] hover:bg-[#191A1F] disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDuplicatePhoto(idx)}
                      className="p-1 rounded text-[#A5A5AD] hover:text-[#F5F5F7] hover:bg-[#191A1F]"
                      title="Duplicate photo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-1 rounded text-red-400 hover:bg-red-950/40"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Sheet Canvas Preview */}
        <div className="lg:col-span-7 bg-[#191A1F] rounded-[22px] border border-[#292A30] p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#292A30]">
            <div>
              <h3 className="font-bold text-sm text-[#F5F5F7]">
                Live Auto-Arranged Sheet Preview
              </h3>
              <p className="text-[11px] text-[#A5A5AD]">
                {PAPER_SIZES_MM[config.paperSize].label} · {config.photos.length} Placed Photos · 300 DPI
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

          {/* Canvas Box */}
          <div className="bg-[#101114] border border-[#292A30] rounded-2xl p-4 flex items-center justify-center min-h-[440px] overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-h-[460px] max-w-full object-contain shadow-2xl block bg-white rounded"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#A5A5AD] pt-1">
            <span>
              Grid: {packing?.cols} cols × {packing?.rows} rows ({packing?.fits ? '100% Fit' : 'Exceeds Bounds'})
            </span>
            <span>Target: <strong className="text-[#F5F5F7]">{activePrinter.name}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
