/**
 * Sowji Xerox - Automatic Photo Sheet Generator Service
 * 
 * Supported Sheet Sizes:
 * - 4 × 6 inch (101.6 × 152.4 mm)
 * - 5 × 7 inch (127.0 × 177.8 mm)
 * - A4 (210.0 × 297.0 mm)
 * - A5 (148.0 × 210.0 mm)
 * 
 * Quantities:
 * - 4, 8, 12, 16, or custom count
 * 
 * Media Settings:
 * - Glossy (PP-201 260 GSM), Matte (MP-101), Plain
 * 
 * Strict Physical Capacity Warning:
 * - Warns users when the requested photo quantity cannot fit at the selected physical size.
 * - Maintains 100% accurate physical dimensions and 300 DPI without stretching.
 */

import { jsPDF } from 'jspdf';
import { SheetConfig } from '../types';

export const PAPER_DIMENSIONS_MM: Record<
  '4x6' | '5x7' | 'A4' | 'A5',
  { widthMm: number; heightMm: number; name: string }
> = {
  '4x6': { widthMm: 101.6, heightMm: 152.4, name: '4 × 6 inch (10 × 15 cm)' },
  '5x7': { widthMm: 127.0, heightMm: 177.8, name: '5 × 7 inch (13 × 18 cm)' },
  'A4': { widthMm: 210.0, heightMm: 297.0, name: 'A4 (210 × 297 mm)' },
  'A5': { widthMm: 148.0, heightMm: 210.0, name: 'A5 (148 × 210 mm)' },
};

export interface SheetCalculationResult {
  fits: boolean;
  cols: number;
  rows: number;
  maxCapacity: number;
  requestedCount: number;
  photoWidthMm: number;
  photoHeightMm: number;
  spacingMm: number;
  marginMm: number;
  totalOccupiedWidthMm: number;
  totalOccupiedHeightMm: number;
  marginXOffsetMm: number;
  marginYOffsetMm: number;
  warning?: string;
}

export class SheetGeneratorService {
  /**
   * Computes layout grid and checks if requested photo quantity fits on selected paper
   */
  static computeLayout(
    paperSize: SheetConfig['paperSize'],
    photosCount: number,
    photoWidthMm: number,
    photoHeightMm: number,
    spacingMm: number = 3,
    marginMm: number = 4
  ): SheetCalculationResult {
    const paper = PAPER_DIMENSIONS_MM[paperSize] || PAPER_DIMENSIONS_MM['4x6'];

    const printableWidth = paper.widthMm - 2 * marginMm;
    const printableHeight = paper.heightMm - 2 * marginMm;

    // Calculate maximum theoretical capacity in portrait layout
    const maxCols = Math.max(1, Math.floor((printableWidth + spacingMm) / (photoWidthMm + spacingMm)));
    const maxRows = Math.max(1, Math.floor((printableHeight + spacingMm) / (photoHeightMm + spacingMm)));
    const maxCapacity = maxCols * maxRows;

    // Determine optimal column and row configuration for requested count
    let cols = 2;
    let rows = Math.ceil(photosCount / cols);

    if (photosCount <= 4) {
      cols = Math.min(2, maxCols);
      rows = Math.ceil(photosCount / cols);
    } else if (photosCount <= 8) {
      cols = Math.min(maxCols, paperSize === 'A4' || paperSize === '5x7' ? 4 : 2);
      rows = Math.ceil(photosCount / cols);
    } else if (photosCount <= 12) {
      cols = Math.min(maxCols, paperSize === 'A4' ? 4 : 3);
      rows = Math.ceil(photosCount / cols);
    } else if (photosCount <= 16) {
      cols = Math.min(maxCols, 4);
      rows = Math.ceil(photosCount / cols);
    } else {
      cols = maxCols;
      rows = Math.ceil(photosCount / cols);
    }

    const totalWidthMm = cols * photoWidthMm + (cols - 1) * spacingMm;
    const totalHeightMm = rows * photoHeightMm + (rows - 1) * spacingMm;

    const fits = photosCount <= maxCapacity && totalWidthMm <= paper.widthMm && totalHeightMm <= paper.heightMm;

    const marginXOffsetMm = Math.max(marginMm, (paper.widthMm - totalWidthMm) / 2);
    const marginYOffsetMm = Math.max(marginMm, (paper.heightMm - totalHeightMm) / 2);

    let warning: string | undefined;
    if (!fits) {
      warning = `Warning: Requested ${photosCount} copies cannot fit on ${paper.name}. At ${photoWidthMm}×${photoHeightMm} mm, the maximum capacity is ${maxCapacity} photos (${maxCols} columns × ${maxRows} rows). Please reduce photo count to ${maxCapacity} or select a larger paper size (e.g. A4 or 5×7).`;
    }

    return {
      fits,
      cols,
      rows,
      maxCapacity,
      requestedCount: photosCount,
      photoWidthMm,
      photoHeightMm,
      spacingMm,
      marginMm,
      totalOccupiedWidthMm: totalWidthMm,
      totalOccupiedHeightMm: totalHeightMm,
      marginXOffsetMm,
      marginYOffsetMm,
      warning,
    };
  }

  /**
   * Renders the complete multi-photo sheet to high-DPI canvas
   */
  static renderSheetToCanvas(
    passportCanvas: HTMLCanvasElement,
    config: SheetConfig,
    photoWidthMm: number,
    photoHeightMm: number,
    targetCanvas: HTMLCanvasElement,
    dpi: number = 300
  ): SheetCalculationResult {
    const paper = PAPER_DIMENSIONS_MM[config.paperSize] || PAPER_DIMENSIONS_MM['4x6'];
    const layout = this.computeLayout(
      config.paperSize,
      config.photosCount,
      photoWidthMm,
      photoHeightMm,
      config.spacingMm,
      config.marginMm
    );

    const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi);
    const canvasWidthPx = mmToPx(paper.widthMm);
    const canvasHeightPx = mmToPx(paper.heightMm);

    targetCanvas.width = canvasWidthPx;
    targetCanvas.height = canvasHeightPx;

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return layout;

    // 1. Fill clean white paper
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);

    const photoWidthPx = mmToPx(photoWidthMm);
    const photoHeightPx = mmToPx(photoHeightMm);
    const spacingPx = mmToPx(config.spacingMm);
    const startXPx = mmToPx(layout.marginXOffsetMm);
    const startYPx = mmToPx(layout.marginYOffsetMm);

    let photoIndex = 0;
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        if (photoIndex >= config.photosCount) break;

        const x = startXPx + c * (photoWidthPx + spacingPx);
        const y = startYPx + r * (photoHeightPx + spacingPx);

        // Draw portrait onto sheet without any distortion
        ctx.drawImage(passportCanvas, x, y, photoWidthPx, photoHeightPx);

        // Thin photo boundary border
        if (config.addBorder) {
          ctx.strokeStyle = '#CBD5E1';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, photoWidthPx, photoHeightPx);
        }

        photoIndex++;
      }
    }

    // 2. Cutting Guides (dashed grid lines)
    if (config.includeCuttingGuides) {
      this.drawCuttingGuides(ctx, layout, startXPx, startYPx, photoWidthPx, photoHeightPx, spacingPx, canvasWidthPx, canvasHeightPx);
    }

    // 3. Sowji Xerox Sheet Margin Stamp
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.fillText(
      `Sowji Xerox Studio · ${config.photosCount}× (${photoWidthMm}×${photoHeightMm}mm) · ${paper.name} · Media: ${config.mediaType || 'Glossy'}`,
      mmToPx(layout.marginMm),
      canvasHeightPx - 10
    );

    return layout;
  }

  /**
   * Draws professional cutting guides and crosshair ticks
   */
  private static drawCuttingGuides(
    ctx: CanvasRenderingContext2D,
    layout: SheetCalculationResult,
    startXPx: number,
    startYPx: number,
    photoWPx: number,
    photoHPx: number,
    spacingPx: number,
    sheetWPx: number,
    sheetHPx: number
  ): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)'; // Slate 500
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const tickLength = 16;

    // Vertical cutting lines & edge ticks
    for (let c = 0; c <= layout.cols; c++) {
      const x = startXPx + c * (photoWPx + spacingPx);
      if (c < layout.cols) {
        // Left edge of column
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, tickLength);
        ctx.moveTo(x, sheetHPx - tickLength);
        ctx.lineTo(x, sheetHPx);
        ctx.stroke();

        // Right edge of column
        const xRight = x + photoWPx;
        ctx.beginPath();
        ctx.moveTo(xRight, 0);
        ctx.lineTo(xRight, tickLength);
        ctx.moveTo(xRight, sheetHPx - tickLength);
        ctx.lineTo(xRight, sheetHPx);
        ctx.stroke();
      }
    }

    // Horizontal cutting lines & edge ticks
    for (let r = 0; r <= layout.rows; r++) {
      const y = startYPx + r * (photoHPx + spacingPx);
      if (r < layout.rows) {
        // Top edge of row
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(tickLength, y);
        ctx.moveTo(sheetWPx - tickLength, y);
        ctx.lineTo(sheetWPx, y);
        ctx.stroke();

        // Bottom edge of row
        const yBottom = y + photoHPx;
        ctx.beginPath();
        ctx.moveTo(0, yBottom);
        ctx.lineTo(tickLength, yBottom);
        ctx.moveTo(sheetWPx - tickLength, yBottom);
        ctx.lineTo(sheetWPx, yBottom);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Exports the high-res photo sheet to a vector-wrapped A4 / 4x6 / 5x7 / A5 PDF
   */
  static async exportToPdf(
    passportCanvas: HTMLCanvasElement,
    config: SheetConfig,
    photoWidthMm: number,
    photoHeightMm: number
  ): Promise<Blob> {
    const paper = PAPER_DIMENSIONS_MM[config.paperSize] || PAPER_DIMENSIONS_MM['4x6'];

    const doc = new jsPDF({
      orientation: paper.widthMm > paper.heightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [paper.widthMm, paper.heightMm],
    });

    const layout = this.computeLayout(
      config.paperSize,
      config.photosCount,
      photoWidthMm,
      photoHeightMm,
      config.spacingMm,
      config.marginMm
    );

    const passportDataUrl = passportCanvas.toDataURL('image/jpeg', 0.98);

    let photoIndex = 0;
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        if (photoIndex >= config.photosCount) break;

        const xMm = layout.marginXOffsetMm + c * (photoWidthMm + config.spacingMm);
        const yMm = layout.marginYOffsetMm + r * (photoHeightMm + config.spacingMm);

        doc.addImage(passportDataUrl, 'JPEG', xMm, yMm, photoWidthMm, photoHeightMm);

        if (config.addBorder) {
          doc.setDrawColor(200, 200, 200);
          doc.rect(xMm, yMm, photoWidthMm, photoHeightMm);
        }

        photoIndex++;
      }
    }

    return doc.output('blob');
  }
}
