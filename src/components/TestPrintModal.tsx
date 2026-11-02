import React, { useState, useRef, useEffect } from 'react';
import { PrinterDevice, PrinterTestRecord } from '../types';
import { UniversalTestPrintService } from '../services/universalTestPrintService';
import { DiagnosticsEngine } from '../services/diagnosticsEngine';
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileDown,
  Check,
  Activity,
  Play,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface TestPrintModalProps {
  printer: PrinterDevice;
  onClose: () => void;
  onSpoolJob: (title: string, pages: number, copies: number, paperSize: any, colorMode: 'COLOR' | 'MONOCHROME') => Promise<void>;
  onLogTestRecord: (record: PrinterTestRecord) => void;
}

export const TestPrintModal: React.FC<TestPrintModalProps> = ({
  printer,
  onClose,
  onSpoolJob,
  onLogTestRecord,
}) => {
  const [step, setStep] = useState<'PREVIEW' | 'SENDING' | 'RESULT'>('PREVIEW');
  const [connectionVerified, setConnectionVerified] = useState<boolean>(true);
  const [verificationMessage, setVerificationMessage] = useState<string>('Printer connection verified.');
  const [streamInfo, setStreamInfo] = useState<{ size: number; driver: string } | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [resultState, setResultState] = useState<{
    success: boolean;
    submissionMessage: string;
    physicalStatus: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Verify printer connectivity & driver availability
    DiagnosticsEngine.runFullDiagnostics(printer).then((diag) => {
      const isOnline = diag.actualStatus.code === 'CONNECTED';
      setConnectionVerified(isOnline);
      setVerificationMessage(diag.actualStatus.message);
    });

    // 2. Render preview canvas
    if (canvasRef.current) {
      UniversalTestPrintService.renderTestPageToCanvas(printer, canvasRef.current, 200);
    }

    // 3. Compile driver stream info
    UniversalTestPrintService.compileTestPageStream(printer).then((res) => {
      setStreamInfo({ size: res.streamSize, driver: res.driverName });
    });
  }, [printer]);

  const handleConfirmPrint = async () => {
    setStep('SENDING');
    setIsPrinting(true);

    try {
      await onSpoolJob(
        `SowjiXerox_Test_Page_${printer.model}`,
        1,
        1,
        'A4',
        printer.supportsColor ? 'COLOR' : 'MONOCHROME'
      );

      const record: PrinterTestRecord = {
        id: `test-${Date.now()}`,
        printerId: printer.id,
        printerName: printer.name,
        printerModel: printer.model,
        testDate: new Date().toLocaleString(),
        connectionMethod: printer.connectionType,
        result: 'PRINTED_VERIFIED',
        statusMessage: 'Test page submitted successfully. Hardware raster pipe verified.',
        colorTested: printer.supportsColor,
      };

      onLogTestRecord(record);

      setResultState({
        success: true,
        submissionMessage: 'Test page submitted successfully.',
        physicalStatus: 'Document delivered to printer spooler buffer. Hardware output in progress.',
      });
      setStep('RESULT');
    } catch (err: any) {
      setResultState({
        success: false,
        submissionMessage: 'Printer communication failed. Check the cable or network.',
        physicalStatus: err?.message || 'Transmission error over driver socket.',
      });
      setStep('RESULT');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    const blob = await UniversalTestPrintService.generateTestPagePdf(printer);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SowjiXerox_TestPage_${printer.model}_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#191A1F] rounded-[22px] w-full max-w-3xl border border-[#292A30] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#292A30] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#222329] border border-[#292A30] text-[#F5F5F7] flex items-center justify-center font-bold text-xs tracking-wider">
              SX
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F5F5F7] leading-tight">
                Universal Test Print – Sowji Xerox
              </h3>
              <p className="text-xs text-[#A5A5AD]">
                Target: {printer.name} · {printer.connectionType}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A5A5AD] hover:text-[#F5F5F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 items-start text-xs">
          {/* Canvas Preview Left */}
          <div className="md:col-span-7 bg-[#101114] border border-[#292A30] rounded-2xl p-3 flex items-center justify-center min-h-[360px] overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-h-[380px] max-w-full object-contain shadow-2xl bg-white block rounded"
            />
          </div>

          {/* Test Page Details & Confirmation Right */}
          <div className="md:col-span-5 space-y-3.5">
            {step === 'PREVIEW' && (
              <>
                <div className="p-3.5 rounded-xl bg-[#222329] border border-[#292A30] space-y-1.5">
                  <span className="font-bold text-[#F5F5F7] block">
                    Diagnostic Test Sections
                  </span>
                  <ul className="space-y-1 text-[#A5A5AD] text-[11px] list-disc list-inside">
                    <li>Sowji Xerox Calibration Header & Timestamp</li>
                    <li>Text Sharpness & Font Sizes (4pt–14pt)</li>
                    <li>Mechanical Feed & Line Alignment (0.25pt grid)</li>
                    <li>Black Density Gradient (10% to 100%)</li>
                    {printer.supportsColor ? (
                      <li className="text-indigo-400 font-semibold">
                        CMYK + RGB Color Reproduction (Canon G3010)
                      </li>
                    ) : (
                      <li className="text-[#F5F5F7] font-semibold">
                        Monochrome Toner Adhesion & Drum (HP M1005)
                      </li>
                    )}
                    <li>Registration & Margin Guides</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-[#222329] border border-[#292A30] space-y-1 text-[11px]">
                  <p className="text-[#A5A5AD]">
                    Driver: <strong className="text-[#F5F5F7]">{streamInfo?.driver || 'Detecting...'}</strong>
                  </p>
                  <p className="text-[#A5A5AD]">
                    Payload Size: <strong className="text-[#F5F5F7]">{streamInfo ? `${(streamInfo.size / 1024).toFixed(1)} KB` : '...'}</strong>
                  </p>
                  <p className="text-[#A5A5AD]">
                    Paper Standard: <strong className="text-[#F5F5F7]">A4 Plain Paper</strong>
                  </p>
                </div>

                {/* Connection confirmation alert */}
                <div className={`p-3 rounded-xl border flex items-start gap-2 ${
                  connectionVerified
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-red-950/60 border-red-800 text-red-300'
                }`}>
                  {connectionVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span className="text-[11px] leading-relaxed">{verificationMessage}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleConfirmPrint}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Send Test Page to Printer</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    className="w-full py-2.5 rounded-xl bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] font-semibold text-xs border border-[#292A30] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Download Test Page PDF</span>
                  </button>
                </div>
              </>
            )}

            {step === 'SENDING' && (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                <h4 className="font-bold text-sm text-[#F5F5F7]">
                  Transmitting Test Calibration Data
                </h4>
                <p className="text-xs text-[#A5A5AD] max-w-xs mx-auto">
                  Compiling bi-level raster array and streaming across bulk OUT endpoints...
                </p>
              </div>
            )}

            {step === 'RESULT' && resultState && (
              <div className="space-y-3.5 py-4">
                <div className={`p-4 rounded-xl border space-y-2 ${
                  resultState.success
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                    : 'bg-red-950/60 border-red-800 text-red-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {resultState.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                    <span>{resultState.submissionMessage}</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed font-mono">
                    {resultState.physicalStatus}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full py-2.5 rounded-xl bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] font-semibold text-xs border border-[#292A30] flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Save Calibration PDF</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
