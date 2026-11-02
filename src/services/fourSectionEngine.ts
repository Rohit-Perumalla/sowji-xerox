/**
 * Four-Section Page Designer Engine
 * 
 * Supports:
 * - 2x2 Grid Layout
 * - 4 Vertical Panels
 * - 4 Horizontal Panels
 * - 1 Feature + 3 Small Custom Layout
 * - Paper: A4, A5, Letter, 4x6", 5x7"
 * - Individual cropping, zoom, pan, 90-deg rotation, and color tuning per section
 * - Section boundaries, margins, and cutting guides
 * - High-resolution PDF and JPG export
 */

import { jsPDF } from 'jspdf';
import { FourSectionPageConfig, FourSectionSlot, PaperSize } from '../types';

export const PAPER_SIZES_MM: Record<PaperSize, { widthMm: number; heightMm: number; label: string }> = {
  'A4': { widthMm: 210, heightMm: 297, label: 'A4 (210 × 297 mm)' },
  'A5': { widthMm: 148, heightMm: 210, label: 'A5 (148 × 210 mm)' },
  'Letter': { widthMm: 215.9, heightMm: 279.4, label: 'Letter (8.5 × 11 in)' },
  '4x6': { widthMm: 101.6, heightMm: 152.4, label: '4 × 6 inch (10 × 15 cm)' },
  '5x7': { widthMm: 127.0, heightMm: 177.8, label: '5 × 7 inch (13 × 18 cm)' },
};

export interface SectionRectMm {
  slotId: number;
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
}

export class FourSectionEngine {
  /**
   * Calculates precise physical millimeter boxes for all 4 sections
   */
  static computeSectionRects(config: FourSectionPageConfig): {
    pageWidthMm: number;
    pageHeightMm: number;
    rects: SectionRectMm[];
  } {
    const paper = PAPER_SIZES_MM[config.paperSize];
    const isLandscape = config.orientation === 'LANDSCAPE';
    const pageWidthMm = isLandscape ? paper.heightMm : paper.widthMm;
    const pageHeightMm = isLandscape ? paper.widthMm : paper.heightMm;

    const margin = config.marginMm;
    const gap = config.gapMm;

    const printableW = pageWidthMm - margin * 2;
    const printableH = pageHeightMm - margin * 2;

    const rects: SectionRectMm[] = [];

    switch (config.layout) {
      case 'GRID_2X2': {
        const slotW = (printableW - gap) / 2;
        const slotH = (printableH - gap) / 2;
        rects.push(
          { slotId: 0, xMm: margin, yMm: margin, wMm: slotW, hMm: slotH },
          { slotId: 1, xMm: margin + slotW + gap, yMm: margin, wMm: slotW, hMm: slotH },
          { slotId: 2, xMm: margin, yMm: margin + slotH + gap, wMm: slotW, hMm: slotH },
          { slotId: 3, xMm: margin + slotW + gap, yMm: margin + slotH + gap, wMm: slotW, hMm: slotH }
        );
        break;
      }
      case 'VERTICAL_4': {
        const slotW = (printableW - gap * 3) / 4;
        const slotH = printableH;
        for (let i = 0; i < 4; i++) {
          rects.push({
            slotId: i,
            xMm: margin + i * (slotW + gap),
            yMm: margin,
            wMm: slotW,
            hMm: slotH,
          });
        }
        break;
      }
      case 'HORIZONTAL_4': {
        const slotW = printableW;
        const slotH = (printableH - gap * 3) / 4;
        for (let i = 0; i < 4; i++) {
          rects.push({
            slotId: i,
            xMm: margin,
            yMm: margin + i * (slotH + gap),
            wMm: slotW,
            hMm: slotH,
          });
        }
        break;
      }
      case 'FEATURE_1_PLUS_3': {
        // Large hero on left half (or top), 3 stacked on right (or bottom)
        const halfW = (printableW - gap) / 2;
        const smallH = (printableH - gap * 2) / 3;
        rects.push(
          { slotId: 0, xMm: margin, yMm: margin, wMm: halfW, hMm: printableH },
          { slotId: 1, xMm: margin + halfW + gap, yMm: margin, wMm: halfW, hMm: smallH },
          { slotId: 2, xMm: margin + halfW + gap, yMm: margin + smallH + gap, wMm: halfW, hMm: smallH },
          { slotId: 3, xMm: margin + halfW + gap, yMm: margin + (smallH + gap) * 2, wMm: halfW, hMm: smallH }
        );
        break;
      }
    }

    return { pageWidthMm, pageHeightMm, rects };
  }

  /**
   * Renders the complete 4-section layout onto an HTMLCanvasElement
   */
  static async renderToCanvas(
    config: FourSectionPageConfig,
    canvas: HTMLCanvasElement,
    dpi: number = 300
  ): Promise<void> {
    const { pageWidthMm, pageHeightMm, rects } = this.computeSectionRects(config);

    const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi);
    const canvasW = mmToPx(pageWidthMm);
    const canvasH = mmToPx(pageHeightMm);

    canvas.width = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill Page Background
    ctx.fillStyle = config.pageBgColor || '#FFFFFF';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Render Each Section
    for (const rect of rects) {
      const slot = config.slots[rect.slotId];
      const slotX = mmToPx(rect.xMm);
      const slotY = mmToPx(rect.yMm);
      const slotW = mmToPx(rect.wMm);
      const slotH = mmToPx(rect.hMm);

      ctx.save();
      // Clip to section boundary
      ctx.beginPath();
      ctx.rect(slotX, slotY, slotW, slotH);
      ctx.clip();

      // Section Background
      ctx.fillStyle = slot.bgColor || '#F8FAFC';
      ctx.fillRect(slotX, slotY, slotW, slotH);

      // Render Photo if available
      if (slot.photoUrl) {
        await this.drawSlotPhoto(ctx, slot, slotX, slotY, slotW, slotH);
      } else {
        // Empty slot placeholder
        ctx.fillStyle = '#94A3B8';
        ctx.font = `${Math.round(dpi * 0.04)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Section ${slot.id + 1}`, slotX + slotW / 2, slotY + slotH / 2 - 10);
        ctx.font = `${Math.round(dpi * 0.025)}px sans-serif`;
        ctx.fillText('Tap to add photo', slotX + slotW / 2, slotY + slotH / 2 + 15);
      }

      ctx.restore();

      // Section Border if enabled
      if (config.showSectionBorders) {
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = Math.max(1, Math.round(dpi * 0.003));
        ctx.strokeRect(slotX, slotY, slotW, slotH);
      }

      // Cutting Guides (Crosshairs)
      if (config.cuttingGuides) {
        this.drawCuttingMarks(ctx, slotX, slotY, slotW, slotH, mmToPx(2.5));
      }
    }

    // Outer Margin Box (Quiet guide)
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmToPx(config.marginMm), mmToPx(config.marginMm), mmToPx(pageWidthMm - config.marginMm * 2), mmToPx(pageHeightMm - config.marginMm * 2));

    // Footer Label
    ctx.fillStyle = '#94A3B8';
    ctx.font = `${Math.round(dpi * 0.03)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(
      `Rohit Universal Print · Four-Section Designer · ${PAPER_SIZES_MM[config.paperSize].label} (${config.orientation}) · 300 DPI`,
      mmToPx(config.marginMm),
      canvasH - mmToPx(3)
    );
  }

  private static async drawSlotPhoto(
    ctx: CanvasRenderingContext2D,
    slot: FourSectionSlot,
    x: number,
    y: number,
    w: number,
    h: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = slot.photoUrl!;

      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        // Apply filters
        const mono = slot.isMonochrome ? 'grayscale(100%)' : `saturate(${slot.saturation}%)`;
        ctx.filter = `brightness(${slot.brightness}%) contrast(${slot.contrast}%) ${mono}`;

        // Move origin to center of slot for pan, zoom, and rotation
        const centerX = x + w / 2 + (slot.panX * w) / 100;
        const centerY = y + h / 2 + (slot.panY * h) / 100;
        ctx.translate(centerX, centerY);

        // Rotation
        ctx.rotate((slot.rotation * Math.PI) / 180);

        // Scaling / Zoom
        const isRotated = slot.rotation % 180 !== 0;
        const availableW = isRotated ? h : w;
        const availableH = isRotated ? w : h;

        let scale = slot.zoom || 1.0;
        const imgAspect = img.width / img.height;
        const slotAspect = availableW / availableH;

        let targetW: number;
        let targetH: number;

        if (slot.cropAspect === 'FILL') {
          if (imgAspect > slotAspect) {
            targetH = availableH * scale;
            targetW = targetH * imgAspect;
          } else {
            targetW = availableW * scale;
            targetH = targetW / imgAspect;
          }
        } else {
          // FIT
          if (imgAspect > slotAspect) {
            targetW = availableW * scale;
            targetH = targetW / imgAspect;
          } else {
            targetH = availableH * scale;
            targetW = targetH * imgAspect;
          }
        }

        ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
        ctx.restore();
        resolve();
      };

      img.onerror = () => resolve();
    });
  }

  /**
   * Exports the 4-section layout directly to a high-res printable PDF in millimeters
   */
  static async exportToPdf(config: FourSectionPageConfig, canvas: HTMLCanvasElement): Promise<Blob> {
    const { pageWidthMm, pageHeightMm } = this.computeSectionRects(config);

    const doc = new jsPDF({
      orientation: config.orientation === 'LANDSCAPE' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
      compress: true,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    doc.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm);

    return doc.output('blob');
  }

  private static drawCuttingMarks(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    tickLen: number
  ): void {
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;

    // Corner cutting ticks
    const corners = [
      { x, y, dx: -tickLen, dy: 0, dx2: 0, dy2: -tickLen },
      { x: x + w, y, dx: tickLen, dy: 0, dx2: 0, dy2: -tickLen },
      { x, y: y + h, dx: -tickLen, dy: 0, dx2: 0, dy2: tickLen },
      { x: x + w, y: y + h, dx: tickLen, dy: 0, dx2: 0, dy2: tickLen },
    ];

    for (const c of corners) {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.dx, c.y + c.dy);
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.dx2, c.y + c.dy2);
      ctx.stroke();
    }
  }
}
