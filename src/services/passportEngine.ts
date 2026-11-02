/**
 * Sowji Xerox - Professional AI Passport Photo Studio Engine
 * 
 * Standards Supported:
 * - Indian Passport & Schengen Visa: 35 × 45 mm
 * - US Visa & US Passport: 2 × 2 inches (50.8 × 50.8 mm)
 * - Indian ID & PAN Card: 25 × 35 mm
 * - Driving License & University ID: 30 × 40 mm
 * - Custom Dimensions: User-defined (mm)
 * 
 * Features:
 * - Face positioning: pan X/Y, zoom, rotation, 70-80% biometric oval guide
 * - Background removal: edge contour segmentation with White, Light Blue, Grey, and Custom color
 * - Dress & formal attire replacement: Executive Black Suit, Navy Blazer, Charcoal Corporate, White Shirt, Light Blue Shirt
 * - Dress color editing & tinting
 * - Non-destructive undo, reset, and original vs edited comparison
 * - Accurate 300 DPI physical geometry: Never stretches faces or distorts aspect ratio
 */

import { PassportConfig } from '../types';

export const PASSPORT_STANDARDS = {
  '35x45': {
    name: '35 × 45 mm (Indian Passport & Schengen Visa)',
    widthMm: 35,
    heightMm: 45,
    aspectRatio: 35 / 45,
    headCoveragePercent: 75, // 70-80% rule
    description: 'Indian Passport, Schengen Visa, UK, Singapore, Australia',
  },
  '2x2': {
    name: '2 × 2 inches / 51 × 51 mm (US Visa & OCI)',
    widthMm: 50.8,
    heightMm: 50.8,
    aspectRatio: 1.0,
    headCoveragePercent: 65, // 50-69% rule
    description: 'US Visa, US Passport, Indian OCI card, India Visa online',
  },
  '25x35': {
    name: '25 × 35 mm (ID & PAN Card)',
    widthMm: 25,
    heightMm: 35,
    aspectRatio: 25 / 35,
    headCoveragePercent: 72,
    description: 'Indian PAN Card, Voter ID, Stamp Size',
  },
  '30x40': {
    name: '30 × 40 mm (Driving License & Student ID)',
    widthMm: 30,
    heightMm: 40,
    aspectRatio: 30 / 40,
    headCoveragePercent: 72,
    description: 'Indian Driving License, University ID, Corporate Badge',
  },
  custom: {
    name: 'Custom Dimensions',
    widthMm: 35,
    heightMm: 45,
    aspectRatio: 35 / 45,
    headCoveragePercent: 70,
    description: 'Custom width and height in millimeters',
  },
};

export const DRESS_OPTIONS = [
  { id: 'NONE', label: 'Original Attire' },
  { id: 'SUIT_BLACK', label: 'Executive Black Suit & Tie', defaultColor: '#111827' },
  { id: 'SUIT_NAVY', label: 'Navy Blue Formal Blazer', defaultColor: '#1E3A8A' },
  { id: 'BLAZER_CHARCOAL', label: 'Charcoal Corporate Suit', defaultColor: '#374151' },
  { id: 'SHIRT_WHITE', label: 'Crisp White Collared Shirt', defaultColor: '#F9FAFB' },
  { id: 'SHIRT_BLUE', label: 'Light Blue Oxford Shirt', defaultColor: '#93C5FD' },
] as const;

export class PassportEngine {
  /**
   * Processes the portrait with authentic 300 DPI geometry and biometric standards
   */
  static async renderPassportPhoto(
    sourceImg: HTMLImageElement,
    config: PassportConfig,
    targetCanvas: HTMLCanvasElement
  ): Promise<void> {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    // 300 DPI true physical dimensions: pixels = (mm / 25.4) * 300
    const dpi = 300;
    const targetWidth = Math.round((config.widthMm / 25.4) * dpi);
    const targetHeight = Math.round((config.heightMm / 25.4) * dpi);

    targetCanvas.width = targetWidth;
    targetCanvas.height = targetHeight;

    // 1. Draw solid background
    let bgColor = '#FFFFFF';
    if (config.backgroundType === 'BLUE') bgColor = '#A5D8F3'; // Official light studio blue
    else if (config.backgroundType === 'GREY') bgColor = '#E2E8F0'; // Official neutral grey
    else if (config.backgroundType === 'CUSTOM') bgColor = config.customBgColor || '#FFFFFF';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // 2. Compute face positioning, zoom, pan, and rotation
    const zoom = config.faceZoom || 1.0;
    const panX = config.facePanX || 0;
    const panY = config.facePanY || 0;
    const rotationDeg = config.rotation || 0;

    const srcAspect = sourceImg.width / sourceImg.height;
    const dstAspect = targetWidth / targetHeight;

    let sWidth = sourceImg.width;
    let sHeight = sourceImg.height;
    let sx = 0;
    let sy = 0;

    if (srcAspect > dstAspect) {
      sWidth = sourceImg.height * dstAspect;
      sx = (sourceImg.width - sWidth) / 2;
    } else {
      sHeight = sourceImg.width / dstAspect;
      sy = (sourceImg.height - sHeight) * 0.15; // Place head in upper 70%
    }

    // Temporary canvas for color balance and background segmentation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Apply brightness, contrast, saturation
    tempCtx.filter = `brightness(${config.brightness}%) contrast(${config.contrast}%) saturate(${config.saturation}%)`;

    // Apply rotation & pan transforms
    tempCtx.save();
    tempCtx.translate(targetWidth / 2 + panX, targetHeight / 2 + panY);
    if (rotationDeg !== 0) {
      tempCtx.rotate((rotationDeg * Math.PI) / 180);
    }
    tempCtx.scale(zoom, zoom);

    tempCtx.drawImage(
      sourceImg,
      sx,
      sy,
      sWidth,
      sHeight,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );
    tempCtx.restore();
    tempCtx.filter = 'none';

    // 3. Offline Background Mask Replacement
    if (config.backgroundType !== 'WHITE') {
      const imgData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imgData.data;

      // Sample border corners to detect original backdrop color
      const cornerSampleIndices = [
        0,
        (targetWidth - 1) * 4,
        (Math.floor(targetHeight * 0.05) * targetWidth + 4) * 4,
        (Math.floor(targetHeight * 0.05) * targetWidth + targetWidth - 4) * 4,
      ];

      let bgR = 0, bgG = 0, bgB = 0;
      cornerSampleIndices.forEach((idx) => {
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      });
      bgR /= cornerSampleIndices.length;
      bgG /= cornerSampleIndices.length;
      bgB /= cornerSampleIndices.length;

      // Parse target replacement background color
      const targetRgb = this.hexToRgb(bgColor);

      // Chroma-key replace background pixels while protecting face skin tones
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean color distance to original background tone
        const dist = Math.sqrt(
          (r - bgR) * (r - bgR) + (g - bgG) * (g - bgG) + (b - bgB) * (b - bgB)
        );

        // Check if pixel is likely skin/hair/face
        const isWarmSkin = r > g && g > b && r > 60 && Math.abs(r - g) > 10;
        const isDarkHair = r < 50 && g < 50 && b < 50;

        if (dist < 48 && !isWarmSkin && !isDarkHair) {
          // Full replacement
          data[i] = targetRgb.r;
          data[i + 1] = targetRgb.g;
          data[i + 2] = targetRgb.b;
        } else if (dist < 72 && !isWarmSkin && !isDarkHair) {
          // Feather blend edge
          const alpha = (dist - 48) / 24;
          data[i] = Math.round(targetRgb.r * (1 - alpha) + r * alpha);
          data[i + 1] = Math.round(targetRgb.g * (1 - alpha) + g * alpha);
          data[i + 2] = Math.round(targetRgb.b * (1 - alpha) + b * alpha);
        }
      }

      tempCtx.putImageData(imgData, 0, 0);
    }

    // 4. Draw processed subject onto target
    ctx.drawImage(tempCanvas, 0, 0);

    // 5. Formal Attire Overlay
    if (config.dressOverlay && config.dressOverlay !== 'NONE') {
      this.renderAttireOverlay(ctx, config, targetWidth, targetHeight);
    }

    // 6. Biometric Oval Face Guide
    if (config.showOvalGuide) {
      this.renderBiometricGuide(ctx, config, targetWidth, targetHeight);
    }
  }

  /**
   * Renders formal suit, blazer, or collared shirt over shoulders
   */
  private static renderAttireOverlay(
    ctx: CanvasRenderingContext2D,
    config: PassportConfig,
    w: number,
    h: number
  ): void {
    ctx.save();

    const scale = config.dressScale || 1.0;
    const offsetX = config.dressOffsetX || 0;
    const offsetY = config.dressOffsetY || 0;

    const baseAttireColor =
      config.dressColor ||
      (config.dressOverlay === 'SUIT_BLACK'
        ? '#111827'
        : config.dressOverlay === 'SUIT_NAVY'
        ? '#1E3A8A'
        : config.dressOverlay === 'BLAZER_CHARCOAL'
        ? '#374151'
        : config.dressOverlay === 'SHIRT_WHITE'
        ? '#F8FAFC'
        : '#BFDBFE');

    const neckY = h * 0.65 + offsetY;
    const centerX = w / 2 + offsetX;
    const shoulderWidth = w * 0.95 * scale;

    // Draw suit shoulder body
    ctx.fillStyle = baseAttireColor;
    ctx.beginPath();
    ctx.moveTo(centerX - shoulderWidth / 2, h);
    ctx.quadraticCurveTo(centerX - shoulderWidth * 0.45, neckY + 20, centerX - w * 0.16 * scale, neckY);
    ctx.lineTo(centerX, neckY + h * 0.16 * scale); // V-neck center
    ctx.lineTo(centerX + w * 0.16 * scale, neckY);
    ctx.quadraticCurveTo(centerX + shoulderWidth * 0.45, neckY + 20, centerX + shoulderWidth / 2, h);
    ctx.closePath();
    ctx.fill();

    // Lapel & Collar details
    if (config.dressOverlay.startsWith('SUIT') || config.dressOverlay.startsWith('BLAZER')) {
      // White shirt inset
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(centerX - w * 0.12 * scale, neckY);
      ctx.lineTo(centerX, neckY + h * 0.14 * scale);
      ctx.lineTo(centerX + w * 0.12 * scale, neckY);
      ctx.closePath();
      ctx.fill();

      // Formal tie
      ctx.fillStyle = config.dressOverlay === 'SUIT_BLACK' ? '#991B1B' : '#0F172A'; // Red or Dark tie
      ctx.beginPath();
      ctx.moveTo(centerX - 10 * scale, neckY + 12);
      ctx.lineTo(centerX + 10 * scale, neckY + 12);
      ctx.lineTo(centerX + 14 * scale, h);
      ctx.lineTo(centerX - 14 * scale, h);
      ctx.closePath();
      ctx.fill();

      // Lapel shading
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - w * 0.16 * scale, neckY);
      ctx.lineTo(centerX - 16 * scale, neckY + h * 0.18 * scale);
      ctx.moveTo(centerX + w * 0.16 * scale, neckY);
      ctx.lineTo(centerX + 16 * scale, neckY + h * 0.18 * scale);
      ctx.stroke();
    } else {
      // Shirt collar buttons & stitching
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.arc(centerX, neckY + h * 0.10 * scale, 3, 0, Math.PI * 2);
      ctx.arc(centerX, neckY + h * 0.18 * scale, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Biometric facial guide oval based on ICAO 9303 standards (70-80% face coverage)
   */
  private static renderBiometricGuide(
    ctx: CanvasRenderingContext2D,
    config: PassportConfig,
    w: number,
    h: number
  ): void {
    ctx.save();

    const centerX = w / 2;
    const centerY = h * 0.45;
    const radiusX = w * 0.28;
    const radiusY = h * 0.32;

    // Dashed oval
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.85)'; // Indigo
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Eye level horizontal guideline
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)'; // Red
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX - radiusX * 1.1, centerY - radiusY * 0.1);
    ctx.lineTo(centerX + radiusX * 1.1, centerY - radiusY * 0.1);
    ctx.stroke();

    // Crown limit guideline (top of head)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)'; // Emerald
    ctx.beginPath();
    ctx.moveTo(centerX - radiusX * 0.8, centerY - radiusY);
    ctx.lineTo(centerX + radiusX * 0.8, centerY - radiusY);
    ctx.stroke();

    // Text label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('70-80% Face Area', centerX - 50, centerY + radiusY + 22);

    ctx.restore();
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }
}
