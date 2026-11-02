import React, { useState, useRef, useEffect } from 'react';
import { PhotoItem, PrinterDevice, PaperSize } from '../types';
import {
  Upload,
  RotateCw,
  Sliders,
  Crop,
  Printer,
  Check,
  Sparkles,
  Layers,
  Maximize2,
  Trash2,
  Sun,
  Contrast as ContrastIcon,
} from 'lucide-react';

interface PhotoPrintScreenProps {
  activePrinter: PrinterDevice;
  onSpoolJob: (title: string, pages: number, copies: number, paperSize: PaperSize, colorMode: 'COLOR' | 'MONOCHROME') => Promise<void>;
}

// Default high quality photography samples
const INITIAL_PHOTOS: PhotoItem[] = [
  {
    id: 'sample-photo-1',
    name: 'Executive_Portrait_Studio.jpg',
    type: 'JPG',
    sizeBytes: 1420000,
    width: 1200,
    height: 1600,
    dataUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    dateAdded: 'Today',
  },
  {
    id: 'sample-photo-2',
    name: 'Landscape_Mountain_Lake.jpg',
    type: 'JPG',
    sizeBytes: 2140000,
    width: 1600,
    height: 1200,
    dataUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    dateAdded: 'Yesterday',
  },
];

export const PhotoPrintScreen: React.FC<PhotoPrintScreenProps> = ({
  activePrinter,
  onSpoolJob,
}) => {
  const [photos, setPhotos] = useState<PhotoItem[]>(INITIAL_PHOTOS);
  const [activePhoto, setActivePhoto] = useState<PhotoItem>(INITIAL_PHOTOS[0]);

  // Adjustments State
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [isBlackAndWhite, setIsBlackAndWhite] = useState<boolean>(!activePrinter.supportsColor);

  // Print settings
  const [paperSize, setPaperSize] = useState<PaperSize>('4x6');
  const [mediaType, setMediaType] = useState<'Glossy' | 'Matte' | 'Plain'>('Glossy');
  const [borderless, setBorderless] = useState<boolean>(activePrinter.supportsBorderless);
  const [copies, setCopies] = useState<number>(1);
  const [aspectCrop, setAspectCrop] = useState<'ORIGINAL' | '1:1' | '4:6' | '5:7'>('4:6');

  const [isSpooling, setIsSpooling] = useState<boolean>(false);
  const [spoolStatus, setSpoolStatus] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ensure mono if HP M1005 is selected
  useEffect(() => {
    if (!activePrinter.supportsColor) {
      setIsBlackAndWhite(true);
    }
  }, [activePrinter]);

  // Render on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activePhoto) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activePhoto.dataUrl;

    img.onload = () => {
      // Determine crop bounding
      let cropAspect = img.width / img.height;
      if (aspectCrop === '1:1') cropAspect = 1;
      else if (aspectCrop === '4:6') cropAspect = 4 / 6;
      else if (aspectCrop === '5:7') cropAspect = 5 / 7;

      let sw = img.width;
      let sh = img.height;
      let sx = 0;
      let sy = 0;

      const currentImgAspect = img.width / img.height;
      if (currentImgAspect > cropAspect) {
        sw = img.height * cropAspect;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / cropAspect;
        sy = (img.height - sh) / 2;
      }

      // Handle rotation dimension flip
      const is90or270 = rotation % 180 !== 0;
      const targetW = is90or270 ? 600 : Math.round(600 * cropAspect);
      const targetH = is90or270 ? Math.round(600 * cropAspect) : 600;

      canvas.width = targetW;
      canvas.height = targetH;

      ctx.save();
      // Apply filters
      const monoFilter = isBlackAndWhite ? 'grayscale(100%)' : `saturate(${saturation}%)`;
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) ${monoFilter}`;

      // Translate to center for rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      const drawW = is90or270 ? targetH : targetW;
      const drawH = is90or270 ? targetW : targetH;

      ctx.drawImage(img, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    };
  }, [activePhoto, rotation, brightness, contrast, saturation, isBlackAndWhite, aspectCrop]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const ext = file.name.split('.').pop()?.toUpperCase() as PhotoItem['type'] || 'JPG';
      const newPhoto: PhotoItem = {
        id: `photo-${Date.now()}`,
        name: file.name,
        type: ext,
        sizeBytes: file.size,
        width: 1200,
        height: 1600,
        dataUrl,
        dateAdded: 'Just now',
      };
      setPhotos([newPhoto, ...photos]);
      setActivePhoto(newPhoto);
      setRotation(0);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
    };
    reader.readAsDataURL(file);
  };

  const handlePrintPhoto = async () => {
    setIsSpooling(true);
    setSpoolStatus(
      activePrinter.model === 'HP_M1005'
        ? 'Dithering monochrome halftone for HP LaserJet M1005...'
        : 'Rendering 4800 DPI photo raster for Canon PIXMA G3010...'
    );

    try {
      await new Promise((r) => setTimeout(r, 1000));
      await onSpoolJob(
        activePhoto.name,
        1,
        copies,
        paperSize,
        isBlackAndWhite || !activePrinter.supportsColor ? 'MONOCHROME' : 'COLOR'
      );
      setSpoolStatus('Photo successfully sent to printer spooler!');
      await new Promise((r) => setTimeout(r, 800));
    } finally {
      setIsSpooling(false);
      setSpoolStatus('');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Photo Printing & Studio Lab
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            JPG, PNG, WEBP, BMP, TIFF with cropping, color tuning & borderless output
          </p>
        </div>

        <label className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2 shadow-xs self-start sm:self-auto">
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image</span>
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Gallery Selector & Edit Tools */}
        <div className="lg:col-span-5 space-y-4">
          {/* Thumbnails Strip */}
          <div className="bg-[#191A1F] rounded-[20px] p-4 border border-[#292A30]">
            <p className="text-xs font-semibold text-[#F5F5F7] mb-2.5">
              Select Photo ({photos.length})
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {photos.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActivePhoto(item)}
                  className={`cursor-pointer shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition-all relative ${
                    activePhoto.id === item.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={item.dataUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-[#101114]/80 text-[#F5F5F7] px-1 rounded">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cropping & Aspect Ratio Selector */}
          <div className="bg-[#191A1F] rounded-[20px] p-4 border border-[#292A30] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-indigo-400" />
                Aspect Ratio / Crop
              </span>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="text-xs text-indigo-400 font-medium flex items-center gap-1 hover:underline"
              >
                <RotateCw className="w-3 h-3" /> Rotate 90° ({rotation}°)
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(['ORIGINAL', '1:1', '4:6', '5:7'] as const).map((asp) => (
                <button
                  key={asp}
                  onClick={() => setAspectCrop(asp)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-xl border transition-all ${
                    aspectCrop === asp
                      ? 'bg-[#222329] border-indigo-500 text-[#F5F5F7] font-semibold ring-1 ring-indigo-500'
                      : 'border-[#292A30] bg-[#191A1F] text-[#A5A5AD] hover:bg-[#222329]'
                  }`}
                >
                  {asp === 'ORIGINAL' ? 'Original' : asp}
                </button>
              ))}
            </div>
          </div>

          {/* Color Adjustment Sliders */}
          <div className="bg-[#191A1F] rounded-[20px] p-4 border border-[#292A30] space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Color & Tone Adjustments
              </span>
              <button
                onClick={() => {
                  setBrightness(100);
                  setContrast(100);
                  setSaturation(100);
                  setRotation(0);
                  setIsBlackAndWhite(!activePrinter.supportsColor);
                }}
                className="text-[11px] text-[#A5A5AD] hover:text-[#F5F5F7]"
              >
                Reset
              </button>
            </div>

            {/* Brightness */}
            <div>
              <div className="flex justify-between text-[#A5A5AD] mb-1">
                <span>Brightness</span>
                <span className="font-mono text-[#F5F5F7]">{brightness}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-[#A5A5AD] mb-1">
                <span>Contrast</span>
                <span className="font-mono text-[#F5F5F7]">{contrast}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Saturation */}
            {activePrinter.supportsColor && (
              <div>
                <div className="flex justify-between text-[#A5A5AD] mb-1">
                  <span>Saturation</span>
                  <span className="font-mono text-[#F5F5F7]">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={saturation}
                  disabled={isBlackAndWhite}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer disabled:opacity-40"
                />
              </div>
            )}

            {/* B&W Switch */}
            <div className="pt-2 border-t border-[#292A30] flex items-center justify-between">
              <span className="text-[#F5F5F7] font-medium">
                Monochrome Halftone (B&W)
              </span>
              <button
                onClick={() => setIsBlackAndWhite(!isBlackAndWhite)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isBlackAndWhite ? 'bg-indigo-600' : 'bg-[#292A30]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isBlackAndWhite ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Photo Canvas Preview & Print Settings */}
        <div className="lg:col-span-7 bg-[#191A1F] rounded-[22px] border border-[#292A30] p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#292A30]">
            <div>
              <h3 className="font-bold text-sm text-[#F5F5F7]">
                Photo Print Canvas Preview
              </h3>
              <p className="text-[11px] text-[#A5A5AD]">
                Size: {paperSize} · {mediaType} Paper {borderless ? '· Borderless Active' : ''}
              </p>
            </div>

            {activePrinter.supportsBorderless && (
              <label className="flex items-center gap-1.5 text-xs text-[#A5A5AD] hover:text-[#F5F5F7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={borderless}
                  onChange={(e) => setBorderless(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Borderless Mode</span>
              </label>
            )}
          </div>

          {/* Preview Container with Simulated Photographic Frame */}
          <div className="bg-[#101114] border border-[#292A30] rounded-2xl p-6 flex items-center justify-center min-h-[380px] overflow-hidden">
            <div className={`p-2 bg-white shadow-2xl transition-all ${borderless ? 'p-0' : 'p-3'}`}>
              <canvas
                ref={canvasRef}
                className="max-h-[380px] max-w-full object-contain block"
              />
            </div>
          </div>

          {/* Paper and Hardware Settings */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
              <label className="block text-[10px] uppercase font-bold text-[#A5A5AD] mb-1">
                Paper Size
              </label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
              >
                <option value="4x6" className="bg-[#191A1F]">4 × 6 inch (10×15 cm)</option>
                <option value="5x7" className="bg-[#191A1F]">5 × 7 inch (13×18 cm)</option>
                <option value="A4" className="bg-[#191A1F]">A4 Full Page</option>
                <option value="A5" className="bg-[#191A1F]">A5 Photo Size</option>
              </select>
            </div>

            <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
              <label className="block text-[10px] uppercase font-bold text-[#A5A5AD] mb-1">
                Media Coating
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'Glossy' | 'Matte' | 'Plain')}
                className="w-full bg-transparent text-[#F5F5F7] font-semibold outline-none"
              >
                <option value="Glossy" className="bg-[#191A1F]">Glossy Photo Paper (PP-201)</option>
                <option value="Matte" className="bg-[#191A1F]">Matte Photo Paper (MP-101)</option>
                <option value="Plain" className="bg-[#191A1F]">Standard Plain Paper</option>
              </select>
            </div>

            <div className="bg-[#222329] border border-[#292A30] rounded-xl p-2.5">
              <label className="block text-[10px] uppercase font-bold text-[#A5A5AD] mb-1">
                Print Copies
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-transparent text-[#F5F5F7] font-semibold font-mono outline-none"
              />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-3 border-t border-[#292A30] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-[#A5A5AD]">
              Output: <strong className="text-[#F5F5F7]">{activePrinter.name}</strong>
              {activePrinter.model === 'HP_M1005' ? ' · 600 DPI ZjStream' : ' · 4800 DPI Canon BJNP'}
            </span>

            <button
              onClick={handlePrintPhoto}
              disabled={isSpooling}
              className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{isSpooling ? 'Printing Photo...' : 'Print Photo Now'}</span>
            </button>
          </div>

          {isSpooling && (
            <div className="p-3 rounded-xl bg-[#222329] border border-indigo-500/40 text-xs text-indigo-300 font-medium">
              {spoolStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
