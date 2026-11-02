import React, { useState } from 'react';
import {
  PrinterDevice,
  PaperSize,
  PassportConfig,
  SavedLayoutTemplate,
} from '../types';
import { PassportStudioScreen } from './PassportStudioScreen';
import { OneByOneSheetScreen } from './OneByOneSheetScreen';
import { PhotoPrintScreen } from './PhotoPrintScreen';
import {
  UserCheck,
  Grid,
  Image as ImageIcon,
} from 'lucide-react';

interface PhotoStudioHubScreenProps {
  activePrinter: PrinterDevice;
  onSpoolJob: (title: string, pages: number, copies: number, paperSize: PaperSize, colorMode: 'COLOR' | 'MONOCHROME') => Promise<void>;
  onOpenSheetWithCanvas: (canvas: HTMLCanvasElement, config: PassportConfig) => void;
  onSaveTemplate?: (template: SavedLayoutTemplate) => void;
}

export const PhotoStudioHubScreen: React.FC<PhotoStudioHubScreenProps> = ({
  activePrinter,
  onSpoolJob,
  onOpenSheetWithCanvas,
  onSaveTemplate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PASSPORT' | 'ONE_BY_ONE' | 'LAB'>('PASSPORT');

  return (
    <div className="space-y-5 pb-28 max-w-xl mx-auto px-1 sm:px-0">
      {/* Studio Segmented Navigation Tabs */}
      <div className="pt-2 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[24px] sm:text-2xl font-extrabold text-[#F5F5F7] tracking-tight">
            Photo Studio & Sheet Lab
          </h2>
          <p className="text-xs text-[#A5A5AD]">
            Passport Studio · One-by-One Sheet Placement · Photo Lab
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-[#191A1F] border border-[#292A30] p-1 rounded-2xl overflow-x-auto text-xs">
        <button
          onClick={() => setActiveSubTab('PASSPORT')}
          className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'PASSPORT'
              ? 'bg-[#222329] text-[#F5F5F7] shadow-sm'
              : 'text-[#A5A5AD] hover:text-[#F5F5F7]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Passport Studio</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ONE_BY_ONE')}
          className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'ONE_BY_ONE'
              ? 'bg-[#222329] text-[#F5F5F7] shadow-sm'
              : 'text-[#A5A5AD] hover:text-[#F5F5F7]'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Sheet Builder</span>
        </button>

        <button
          onClick={() => setActiveSubTab('LAB')}
          className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'LAB'
              ? 'bg-[#222329] text-[#F5F5F7] shadow-sm'
              : 'text-[#A5A5AD] hover:text-[#F5F5F7]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Photo Print</span>
        </button>
      </div>

      {/* Sub-tab Views */}
      {activeSubTab === 'PASSPORT' && (
        <PassportStudioScreen
          onOpenSheetWithCanvas={onOpenSheetWithCanvas}
        />
      )}

      {activeSubTab === 'ONE_BY_ONE' && (
        <OneByOneSheetScreen
          activePrinter={activePrinter}
          onSpoolJob={onSpoolJob}
          onSaveTemplate={onSaveTemplate}
        />
      )}

      {activeSubTab === 'LAB' && (
        <PhotoPrintScreen
          activePrinter={activePrinter}
          onSpoolJob={onSpoolJob}
        />
      )}
    </div>
  );
};
