import React, { useState, useRef, useEffect } from 'react';
import { PassportConfig } from '../types';
import {
  PASSPORT_STANDARDS,
  DRESS_OPTIONS,
  PassportEngine,
} from '../services/passportEngine';
import {
  UserCheck,
  Upload,
  Eye,
  RefreshCw,
  Sparkles,
  Grid3X3,
  Download,
  Check,
  Shirt,
  Palette,
  Maximize2,
  Sliders,
  ShieldAlert,
  RotateCw,
  RotateCcw,
  ZoomIn,
  Move,
  Undo2,
  Image as ImageIcon,
  Crop,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface PassportStudioScreenProps {
  onOpenSheetWithCanvas: (canvas: HTMLCanvasElement, config: PassportConfig) => void;
}

const DEFAULT_PORTRAIT_URL =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80';

export const PassportStudioScreen: React.FC<PassportStudioScreenProps> = ({
  onOpenSheetWithCanvas,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_PORTRAIT_URL);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string>('');

  const [config, setConfig] = useState<PassportConfig>({
    standard: '35x45',
    widthMm: 35,
    heightMm: 45,
    backgroundType: 'WHITE',
    customBgColor: '#FFFFFF',
    dressOverlay: 'NONE',
    dressColor: '#1E3A8A',
    dressScale: 1.0,
    dressOffsetY: 0,
    dressOffsetX: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    faceZoom: 1.0,
    facePanX: 0,
    facePanY: 0,
    rotation: 0,
    showOvalGuide: true,
  });

  const [historyStack, setHistoryStack] = useState<PassportConfig[]>([config]);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update width/height mm when standard changes
  const handleStandardChange = (stdKey: keyof typeof PASSPORT_STANDARDS) => {
    const std = PASSPORT_STANDARDS[stdKey];
    const newConfig = {
      ...config,
      standard: stdKey,
      widthMm: std.widthMm,
      heightMm: std.heightMm,
    };
    pushState(newConfig);
  };

  const pushState = (newConfig: PassportConfig) => {
    setHistoryStack((prev) => [...prev.slice(-15), newConfig]);
    setConfig(newConfig);
  };

  const handleUndo = () => {
    if (historyStack.length > 1) {
      const prev = historyStack[historyStack.length - 2];
      setHistoryStack((s) => s.slice(0, s.length - 1));
      setConfig(prev);
    }
  };

  const handleReset = () => {
    const initialConfig: PassportConfig = {
      standard: '35x45',
      widthMm: 35,
      heightMm: 45,
      backgroundType: 'WHITE',
      customBgColor: '#FFFFFF',
      dressOverlay: 'NONE',
      dressColor: '#1E3A8A',
      dressScale: 1.0,
      dressOffsetY: 0,
      dressOffsetX: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      faceZoom: 1.0,
      facePanX: 0,
      facePanY: 0,
      rotation: 0,
      showOvalGuide: true,
    };
    pushState(initialConfig);
  };

  // Re-render when config or image changes
  useEffect(() => {
    if (!processedCanvasRef.current) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      if (processedCanvasRef.current) {
        PassportEngine.renderPassportPhoto(img, config, processedCanvasRef.current);
      }
    };
  }, [imageSrc, config]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRotateQuick = (deg: number) => {
    const next = ((config.rotation || 0) + deg + 360) % 360;
    pushState({ ...config, rotation: next });
  };

  const handleDownloadSinglePhoto = () => {
    if (!processedCanvasRef.current) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const exportCanvas = document.createElement('canvas');
      PassportEngine.renderPassportPhoto(
        img,
        { ...config, showOvalGuide: false },
        exportCanvas
      );
      const link = document.createElement('a');
      link.download = `Sowji_Xerox_Passport_${config.standard}_${Date.now()}.jpg`;
      link.href = exportCanvas.toDataURL('image/jpeg', 0.98);
      link.click();
    };
  };

  const handleTriggerSheetGenerator = () => {
    if (!processedCanvasRef.current) return;
    const cleanCanvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      PassportEngine.renderPassportPhoto(
        img,
        { ...config, showOvalGuide: false },
        cleanCanvas
      );
      onOpenSheetWithCanvas(cleanCanvas, config);
    };
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto px-1 sm:px-0">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] sm:text-2xl font-extrabold text-[#F5F5F7] tracking-tight">
              Passport Photo Studio
            </h1>
            <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Biometric ICAO 9303
            </span>
          </div>
          <p className="text-xs text-[#A5A5AD]">
            Indian 35×45mm, US 2×2", ID 25×35mm & 30×40mm with formal suits & backgrounds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyStack.length <= 1}
            className="px-3 py-2 text-xs font-semibold rounded-full bg-[#191A1F] hover:bg-[#222329] border border-[#292A30] text-[#F5F5F7] disabled:opacity-40 transition-colors flex items-center gap-1.5"
            title="Undo Last Edit"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-2 text-xs font-semibold rounded-full bg-[#191A1F] hover:bg-[#222329] border border-[#292A30] text-[#A5A5AD] hover:text-[#F5F5F7] transition-colors"
          >
            Reset
          </button>

          <label className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Control Column */}
        <div className="lg:col-span-6 space-y-4">
          {/* Section 1: Official Passport & ID Standards */}
          <div className="bg-[#191A1F] rounded-[22px] p-5 border border-[#292A30] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD]">
                1. Passport & Visa Standards
              </span>
              <span className="text-xs text-indigo-400 font-mono font-semibold">
                {config.widthMm} × {config.heightMm} mm
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(Object.keys(PASSPORT_STANDARDS) as (keyof typeof PASSPORT_STANDARDS)[]).map((key) => {
                const std = PASSPORT_STANDARDS[key];
                const isSelected = config.standard === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleStandardChange(key)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#222329] border-indigo-500 ring-1 ring-indigo-500 text-[#F5F5F7] font-semibold'
                        : 'border-[#292A30] bg-[#191A1F] hover:bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7]'
                    }`}
                  >
                    <p className="text-xs leading-tight font-bold text-[#F5F5F7]">{std.name.split('(')[0]}</p>
                    <p className="text-[10px] text-[#A5A5AD] mt-0.5 truncate">
                      {std.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {config.standard === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#292A30] text-xs">
                <div>
                  <label className="text-[10px] text-[#A5A5AD] font-bold block mb-1">Width (mm)</label>
                  <input
                    type="number"
                    value={config.widthMm}
                    onChange={(e) =>
                      setConfig({ ...config, widthMm: Math.max(15, parseInt(e.target.value) || 35) })
                    }
                    className="w-full p-2 rounded-xl bg-[#222329] border border-[#292A30] text-[#F5F5F7] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#A5A5AD] font-bold block mb-1">Height (mm)</label>
                  <input
                    type="number"
                    value={config.heightMm}
                    onChange={(e) =>
                      setConfig({ ...config, heightMm: Math.max(15, parseInt(e.target.value) || 45) })
                    }
                    className="w-full p-2 rounded-xl bg-[#222329] border border-[#292A30] text-[#F5F5F7] font-mono outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Face Positioning & Sizing */}
          <div className="bg-[#191A1F] rounded-[22px] p-5 border border-[#292A30] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD] flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-indigo-400" />
                2. Face Positioning, Zoom & Rotate
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-[#F5F5F7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showOvalGuide}
                  onChange={(e) => setConfig({ ...config, showOvalGuide: e.target.checked })}
                  className="rounded border-[#292A30] accent-indigo-500"
                />
                <span>Biometric Oval</span>
              </label>
            </div>

            {/* Sliders: Zoom, Pan X, Pan Y */}
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[#222329] p-2.5 rounded-xl border border-[#292A30]">
                <div className="flex justify-between text-[10px] text-[#A5A5AD] font-bold mb-1">
                  <span>ZOOM</span>
                  <span>{((config.faceZoom || 1.0) * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={2.0}
                  step={0.05}
                  value={config.faceZoom || 1.0}
                  onChange={(e) => setConfig({ ...config, faceZoom: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="bg-[#222329] p-2.5 rounded-xl border border-[#292A30]">
                <div className="flex justify-between text-[10px] text-[#A5A5AD] font-bold mb-1">
                  <span>PAN X</span>
                  <span>{config.facePanX || 0}px</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={2}
                  value={config.facePanX || 0}
                  onChange={(e) => setConfig({ ...config, facePanX: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="bg-[#222329] p-2.5 rounded-xl border border-[#292A30]">
                <div className="flex justify-between text-[10px] text-[#A5A5AD] font-bold mb-1">
                  <span>PAN Y</span>
                  <span>{config.facePanY || 0}px</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={2}
                  value={config.facePanY || 0}
                  onChange={(e) => setConfig({ ...config, facePanY: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            {/* Quick Rotate & Fine Tilt */}
            <div className="flex items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRotateQuick(-90)}
                  className="p-2 rounded-xl bg-[#222329] hover:bg-[#2c2d36] border border-[#292A30] text-[#F5F5F7]"
                  title="Rotate -90°"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRotateQuick(90)}
                  className="p-2 rounded-xl bg-[#222329] hover:bg-[#2c2d36] border border-[#292A30] text-[#F5F5F7]"
                  title="Rotate +90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] text-[#A5A5AD] font-bold whitespace-nowrap">TILT ({config.rotation || 0}°)</span>
                <input
                  type="range"
                  min={-15}
                  max={15}
                  step={1}
                  value={config.rotation || 0}
                  onChange={(e) => setConfig({ ...config, rotation: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Background Replacement */}
          <div className="bg-[#191A1F] rounded-[22px] p-5 border border-[#292A30] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                3. Solid Background Removal & Replacement
              </span>
              <span className="text-[10px] font-semibold text-emerald-400">Offline Safe</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { type: 'WHITE', label: 'White', colorHex: '#FFFFFF', border: true },
                { type: 'BLUE', label: 'Light Blue', colorHex: '#A5D8F3', border: false },
                { type: 'GREY', label: 'Grey', colorHex: '#E2E8F0', border: false },
                { type: 'CUSTOM', label: 'Custom', colorHex: config.customBgColor, border: false },
              ].map((bg) => {
                const isSelected = config.backgroundType === bg.type;
                return (
                  <button
                    key={bg.type}
                    onClick={() => setConfig({ ...config, backgroundType: bg.type as any })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-[#222329] ring-1 ring-indigo-500'
                        : 'border-[#292A30] bg-[#191A1F] hover:bg-[#222329]'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full ${bg.border ? 'border border-[#292A30]' : ''}`}
                      style={{ backgroundColor: bg.colorHex }}
                    />
                    <span className="text-[10px] text-[#A5A5AD] font-medium">
                      {bg.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {config.backgroundType === 'CUSTOM' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={config.customBgColor}
                  onChange={(e) => setConfig({ ...config, customBgColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border-none cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={config.customBgColor}
                  onChange={(e) => setConfig({ ...config, customBgColor: e.target.value })}
                  className="p-1.5 text-xs rounded-xl bg-[#222329] border border-[#292A30] text-[#F5F5F7] font-mono w-28 uppercase outline-none"
                />
                <span className="text-[11px] text-[#A5A5AD]">Pick exact background hex</span>
              </div>
            )}
          </div>

          {/* Section 4: Formal Attire & Dress Color Editing */}
          <div className="bg-[#191A1F] rounded-[22px] p-5 border border-[#292A30] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD] flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-indigo-400" />
                4. Formal Suits, Shirts & Dress Color
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DRESS_OPTIONS.map((item) => {
                const isSelected = config.dressOverlay === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      setConfig({
                        ...config,
                        dressOverlay: item.id,
                        dressColor: (item as any).defaultColor || '#1E3A8A',
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#222329] border-indigo-500 ring-1 ring-indigo-500 text-[#F5F5F7] font-semibold'
                        : 'border-[#292A30] bg-[#191A1F] hover:bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7]'
                    }`}
                  >
                    <p className="text-xs leading-tight">{item.label}</p>
                  </button>
                );
              })}
            </div>

            {config.dressOverlay !== 'NONE' && (
              <div className="space-y-3 pt-2 border-t border-[#292A30] text-xs">
                {/* Dress Color Editing */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#A5A5AD]">Dress Fabric Tint Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.dressColor || '#1E3A8A'}
                      onChange={(e) => setConfig({ ...config, dressColor: e.target.value })}
                      className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-[11px] text-[#F5F5F7] uppercase">
                      {config.dressColor || '#1E3A8A'}
                    </span>
                  </div>
                </div>

                {/* Collar Scale & Alignment */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#222329] p-2 rounded-xl border border-[#292A30]">
                    <div className="flex justify-between text-[10px] text-[#A5A5AD] mb-1">
                      <span>SCALE</span>
                      <span>{config.dressScale.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.7}
                      max={1.4}
                      step={0.02}
                      value={config.dressScale}
                      onChange={(e) => setConfig({ ...config, dressScale: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div className="bg-[#222329] p-2 rounded-xl border border-[#292A30]">
                    <div className="flex justify-between text-[10px] text-[#A5A5AD] mb-1">
                      <span>OFFSET Y</span>
                      <span>{config.dressOffsetY}</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      step={1}
                      value={config.dressOffsetY}
                      onChange={(e) => setConfig({ ...config, dressOffsetY: parseInt(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div className="bg-[#222329] p-2 rounded-xl border border-[#292A30]">
                    <div className="flex justify-between text-[10px] text-[#A5A5AD] mb-1">
                      <span>OFFSET X</span>
                      <span>{config.dressOffsetX}</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      step={1}
                      value={config.dressOffsetX}
                      onChange={(e) => setConfig({ ...config, dressOffsetX: parseInt(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview & Action Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#191A1F] rounded-[24px] p-5 border border-[#292A30] space-y-4 shadow-xl">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A5A5AD]">
                Live 300 DPI Canvas
              </span>

              {/* Compare Original Button */}
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="px-3 py-1.5 rounded-full bg-[#222329] hover:bg-[#2c2d36] text-xs font-semibold text-[#F5F5F7] border border-[#292A30] flex items-center gap-1.5 transition-colors select-none"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hold for Original</span>
              </button>
            </div>

            {/* Viewport Box */}
            <div className="relative bg-[#101114] rounded-2xl p-6 flex items-center justify-center min-h-[380px] overflow-hidden border border-[#292A30]">
              {showOriginal ? (
                <div className="relative flex flex-col items-center">
                  <img
                    src={imageSrc}
                    alt="Original Upload"
                    className="max-h-[340px] rounded shadow-lg object-contain border border-gray-700"
                  />
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    ORIGINAL
                  </span>
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  <canvas
                    ref={processedCanvasRef}
                    className="max-h-[340px] rounded shadow-2xl border border-gray-700 bg-white"
                  />
                  <span className="absolute top-2 left-2 bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {config.standard} · 300 DPI
                  </span>
                </div>
              )}
            </div>

            {/* Color & Tone Fine Tuning */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#222329] border border-[#292A30] text-xs">
              <div>
                <div className="flex justify-between text-[#A5A5AD] text-[10px] font-bold mb-1">
                  <span>BRIGHTNESS</span>
                  <span>{config.brightness}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={140}
                  value={config.brightness}
                  onChange={(e) => setConfig({ ...config, brightness: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#A5A5AD] text-[10px] font-bold mb-1">
                  <span>CONTRAST</span>
                  <span>{config.contrast}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={140}
                  value={config.contrast}
                  onChange={(e) => setConfig({ ...config, contrast: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#A5A5AD] text-[10px] font-bold mb-1">
                  <span>SATURATION</span>
                  <span>{config.saturation}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={140}
                  value={config.saturation}
                  onChange={(e) => setConfig({ ...config, saturation: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            {/* Action Buttons: Download Single & Generate Sheet */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadSinglePhoto}
                className="py-3 rounded-full bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] font-semibold text-xs border border-[#292A30] flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Download Single Photo</span>
              </button>

              <button
                onClick={handleTriggerSheetGenerator}
                className="py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Create Photo Sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
