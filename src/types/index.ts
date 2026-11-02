export type PrinterType = 'CANON_G3010' | 'HP_M1005';

export type PrinterDetailedStatus =
  | 'READY'
  | 'ONLINE'
  | 'BUSY'
  | 'PRINTING'
  | 'OFFLINE'
  | 'PAPER_JAM'
  | 'ERROR_PAPER_JAM'
  | 'ERROR_DOOR_OPEN'
  | 'ERROR_OUT_OF_PAPER'
  | 'ERROR_PERMISSION_DENIED'
  | 'LOW_INK'
  | 'DOOR_OPEN'
  | 'UNVERIFIED';

export interface PrinterDevice {
  id: string;
  name: string;
  model: PrinterType;
  connectionType: 'WIFI' | 'USB_OTG' | 'WIRELESS_DIRECT' | 'WINDOWS_USB' | 'WINDOWS_SPOOLER';
  status: PrinterDetailedStatus;
  verifiedCommunication?: boolean;
  lastVerifiedTime?: string;
  usbPermissionState?: 'NOT_REQUESTED' | 'REQUESTING' | 'GRANTED' | 'DENIED';
  driverCompatibility?: {
    compatible: boolean;
    driverName: string;
    protocol: string;
    notes: string;
  };
  isDefault?: boolean;
  ipAddress?: string;
  macAddress?: string;
  usbVendorId?: number; // 0x03F0 for HP, 0x04A9 for Canon
  usbProductId?: number; // 0x3B17 for HP M1005
  usbDeviceName?: string;
  windowsPortName?: string; // e.g. "USB001" or "\\laptop\CanonG3010"
  windowsDriverName?: string;
  inkLevels?: {
    black: number; // 0-100%
    cyan?: number;
    magenta?: number;
    yellow?: number;
  };
  tonerLevel?: number; // For HP M1005 (0-100%)
  paperTrayStatus: 'READY' | 'EMPTY' | 'MISMATCH';
  supportedPaperSizes: ('A4' | 'A5' | 'Letter' | '4x6' | '5x7')[];
  supportedMediaTypes: ('Plain' | 'Glossy' | 'Matte' | 'Semi-Gloss' | 'High-Res')[];
  supportsColor: boolean;
  supportsBorderless: boolean;
}

export type PaperSize = 'A4' | 'A5' | 'Letter' | '4x6' | '5x7';
export type MediaType = 'Plain' | 'Glossy' | 'Matte' | 'Semi-Gloss' | 'High-Res';
export type Orientation = 'PORTRAIT' | 'LANDSCAPE';
export type PrintQuality = 'DRAFT' | 'NORMAL' | 'HIGH';
export type Margins = 'NONE' | 'NARROW' | 'NORMAL' | 'WIDE';

export type ScalingMode = 'FIT' | 'ACTUAL' | 'FILL' | 'CUSTOM';

export type DocumentFormat =
  | 'PDF'
  | 'JPG'
  | 'JPEG'
  | 'PNG'
  | 'WEBP'
  | 'DOC'
  | 'DOCX'
  | 'XLS'
  | 'XLSX'
  | 'PPT'
  | 'PPTX'
  | 'TXT'
  | 'CSV'
  | 'RTF';

export interface PrintSettings {
  copies: number;
  paperSize: PaperSize;
  mediaType: MediaType;
  orientation: Orientation;
  quality: PrintQuality;
  colorMode: 'COLOR' | 'MONOCHROME';
  margins: Margins;
  borderless: boolean;
  pageRange: string; // e.g. "All" or "1-3, 5"
  scaleMode?: ScalingMode;
  scalePercent?: number; // 50 to 150 (default 100)
}

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentFormat;
  sizeBytes: number;
  modifiedDate: string;
  pageCount: number;
  contentSnippet?: string;
  thumbnailUrl?: string;
  url?: string;
  fileDataUrl?: string;
  parsedContent?: {
    pages?: string[][];
    tableRows?: string[][];
  };
}

export interface PhotoItem {
  id: string;
  name: string;
  type: 'JPG' | 'JPEG' | 'PNG' | 'WEBP' | 'BMP' | 'TIFF';
  sizeBytes: number;
  width: number;
  height: number;
  dataUrl: string;
  dateAdded: string;
}

export interface PassportConfig {
  standard: '35x45' | '2x2' | '25x35' | '30x40' | 'custom';
  widthMm: number;
  heightMm: number;
  backgroundType: 'WHITE' | 'BLUE' | 'GREY' | 'CUSTOM';
  customBgColor: string;
  dressOverlay: 'NONE' | 'SUIT_BLACK' | 'SUIT_NAVY' | 'BLAZER_CHARCOAL' | 'SHIRT_WHITE' | 'SHIRT_BLUE';
  dressColor?: string;
  dressScale: number;
  dressOffsetY: number;
  dressOffsetX: number;
  brightness: number;
  contrast: number;
  saturation: number;
  faceZoom?: number;
  facePanX?: number;
  facePanY?: number;
  rotation?: number;
  showOvalGuide: boolean;
}

export interface SheetConfig {
  paperSize: '4x6' | '5x7' | 'A4' | 'A5';
  photosCount: number;
  spacingMm: number;
  marginMm: number;
  includeCuttingGuides: boolean;
  addBorder: boolean;
  mediaType?: 'Plain' | 'Glossy' | 'Matte';
}

export interface PrintJob {
  id: string;
  title: string;
  printerId: string;
  printerName: string;
  printerModel: PrinterType;
  platformSource?: 'ANDROID' | 'WINDOWS';
  timestamp: string;
  pages: number;
  copies: number;
  colorMode: 'COLOR' | 'MONOCHROME';
  paperSize: PaperSize;
  status: 'PENDING' | 'SPOOLING' | 'ENCODING_ZJSTREAM' | 'SENDING' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  rawBytesSize?: number;
  errorMessage?: string;
}

// ==========================================
// MODULE 2: FOUR-SECTION PAGE DESIGNER TYPES
// ==========================================

export type FourSectionLayoutType = 'GRID_2X2' | 'VERTICAL_4' | 'HORIZONTAL_4' | 'FEATURE_1_PLUS_3';

export interface FourSectionSlot {
  id: number; // 0, 1, 2, 3
  photoUrl?: string;
  photoName?: string;
  zoom: number; // 0.5 to 3.0 (default 1.0)
  rotation: number; // 0, 90, 180, 270
  panX: number; // -100 to 100
  panY: number; // -100 to 100
  cropAspect: 'FILL' | 'FIT' | 'ORIGINAL';
  bgColor: string; // Background color if not filling
  brightness: number; // 50 to 150
  contrast: number;
  saturation: number;
  isMonochrome: boolean;
}

export interface FourSectionPageConfig {
  paperSize: PaperSize;
  orientation: Orientation;
  layout: FourSectionLayoutType;
  marginMm: number;
  gapMm: number;
  cuttingGuides: boolean;
  showSectionBorders: boolean;
  pageBgColor: string;
  slots: [FourSectionSlot, FourSectionSlot, FourSectionSlot, FourSectionSlot];
}

// ==========================================
// MODULE 3: ONE-BY-ONE PHOTO PLACEMENT TYPES
// ==========================================

export interface PlacedPhotoItem {
  id: string;
  photoUrl: string;
  photoName: string;
  widthMm: number;
  heightMm: number;
  rotation: number;
}

export interface OneByOneSheetConfig {
  paperSize: PaperSize;
  photoPreset: '35x45' | '2x2' | '25x35' | '2x3' | '3x4' | '4x6' | 'custom';
  photoWidthMm: number;
  photoHeightMm: number;
  spacingMm: number;
  marginMm: number;
  includeCuttingGuides: boolean;
  addBorder: boolean;
  photos: PlacedPhotoItem[];
}

// ==========================================
// MODULE 1: WINDOWS & ANDROID PAIRING TYPES
// ==========================================

export type PlatformViewMode = 'ANDROID' | 'WINDOWS';

export interface PairedDevice {
  id: string;
  name: string;
  platform: 'ANDROID' | 'WINDOWS';
  ipAddress: string;
  pairingPin: string;
  status: 'PAIRED' | 'REQUESTING' | 'DISCONNECTED';
  lastSeen: string;
  sharedPrinter?: {
    model: PrinterType;
    name: string;
    connection: string;
  };
}

// Saved Layout Template for Module 5
export interface SavedLayoutTemplate {
  id: string;
  title: string;
  createdAt: string;
  type: 'FOUR_SECTION' | 'ONE_BY_ONE' | 'PASSPORT';
  paperSize: PaperSize;
  data: any;
}

// ==========================================
// MODULE I: SMART CONNECTION DETECTION & DIAGNOSTICS
// ==========================================

export type PrinterConnectionCode =
  | 'CONNECTED'
  | 'NOT_CONNECTED'
  | 'USB_NOT_DETECTED'
  | 'USB_PERMISSION_DENIED'
  | 'WIFI_NOT_CONNECTED'
  | 'PRINTER_OFFLINE'
  | 'DRIVER_NOT_AVAILABLE'
  | 'PRINT_JOB_FAILED'
  | 'PAPER_ERROR'
  | 'UNKNOWN_ERROR';

export type StatusColor = 'GREEN' | 'YELLOW' | 'RED' | 'GREY';

export interface ConnectionStatusMessage {
  code: PrinterConnectionCode;
  headline: string;
  message: string;
  color: StatusColor;
  explanation: string;
  repairSteps: string[];
}

export interface DiagnosticCheck {
  id: string;
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'UNVERIFIED';
  details: string;
  timestamp: string;
}

export interface SanitizedBugReport {
  issueTitle: string;
  category: string;
  printerModel: string;
  connectionType: string;
  appVersion: string;
  osVersion: string;
  timestamp: string;
  sanitizedLog: string;
  errorStack: string;
}

export interface DiagnosticReport {
  printerId: string;
  printerName: string;
  printerModel: PrinterType;
  connectionType: string;
  actualStatus: ConnectionStatusMessage;
  lastSuccessfulConnection?: string;
  driverStatus: string;
  interfaceStatus: string;
  lastJobStatus: string;
  detectedErrors: string[];
  checks: DiagnosticCheck[];
  repairSteps: string[];
  sanitizedBugReport: SanitizedBugReport;
}

// ==========================================
// SOWJI XEROX: TEST PRINT & SAVED PRINTERS
// ==========================================

export interface PrinterTestRecord {
  id: string;
  printerId: string;
  printerName: string;
  printerModel: PrinterType;
  testDate: string;
  connectionMethod: string;
  result: 'SUBMITTED' | 'PRINTED_VERIFIED' | 'FAILED';
  statusMessage: string;
  errorInfo?: string;
  colorTested: boolean;
}

export interface SavedPrinterItem {
  id: string;
  displayName: string;
  customLabel?: string;
  model: PrinterType;
  connectionType: 'WIFI' | 'USB_OTG' | 'WIRELESS_DIRECT' | 'WINDOWS_USB' | 'WINDOWS_SPOOLER';
  ipAddress?: string;
  usbVendorId?: number;
  usbProductId?: number;
  isDefault: boolean;
  lastConnected?: string;
  status: 'ONLINE' | 'OFFLINE';
}
