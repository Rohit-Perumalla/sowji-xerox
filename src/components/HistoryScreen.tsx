import React from 'react';
import { PrintJob } from '../types';
import {
  History,
  CheckCircle2,
  Clock,
  Printer,
  RefreshCw,
  Trash2,
  Cpu,
  ArrowLeft,
} from 'lucide-react';

interface HistoryScreenProps {
  jobs: PrintJob[];
  onClearHistory: () => void;
  onReprintJob: (job: PrintJob) => void;
  onBack?: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  jobs,
  onClearHistory,
  onReprintJob,
  onBack,
}) => {
  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 rounded-full text-[#A5A5AD] hover:text-[#F5F5F7] hover:bg-[#222329] transition-colors mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-bold text-[#F5F5F7]">
              Print Spooler History
            </h2>
          </div>
          <p className="text-xs text-[#A5A5AD]">
            Buffer states, raster dimensions, and hardware delivery logs
          </p>
        </div>

        {jobs.length > 0 && (
          <button
            onClick={onClearHistory}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold rounded-full border border-[#292A30] hover:bg-[#222329] text-[#A5A5AD] hover:text-[#F5F5F7] flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#A5A5AD]" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="bg-[#191A1F] border border-[#292A30] rounded-[22px] p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#222329] border border-[#292A30] text-[#A5A5AD] flex items-center justify-center mx-auto">
            <History className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h3 className="font-semibold text-sm text-[#F5F5F7]">
            No Print Jobs Spooled Yet
          </h3>
          <p className="text-xs text-[#A5A5AD] max-w-sm mx-auto leading-relaxed">
            Spool a document, photo, or passport sheet from the Sowji Xerox home tab to observe live hardware transmission.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const isCompleted = job.status === 'COMPLETED';
            return (
              <div
                key={job.id}
                className="bg-[#191A1F] border border-[#292A30] rounded-[20px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#393A42] transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    job.colorMode === 'COLOR'
                      ? 'bg-rose-950/60 border border-rose-800 text-rose-400'
                      : 'bg-[#222329] border border-[#292A30] text-[#F5F5F7]'
                  }`}>
                    {job.printerModel === 'HP_M1005' ? (
                      <Cpu className="w-5 h-5 stroke-[1.8]" />
                    ) : (
                      <Printer className="w-5 h-5 stroke-[1.8]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs sm:text-sm text-[#F5F5F7] truncate">
                        {job.title}
                      </h4>
                      <span className="text-[10px] font-mono uppercase bg-[#222329] border border-[#292A30] px-2 py-0.5 rounded-full text-[#A5A5AD]">
                        {job.paperSize}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#A5A5AD] mt-1">
                      <span>{job.printerName}</span>
                      <span>·</span>
                      <span>{job.pages} page(s) × {job.copies} copy</span>
                      <span>·</span>
                      <span>{job.timestamp}</span>
                      {job.rawBytesSize && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{(job.rawBytesSize / 1024).toFixed(1)} KB Buffer</span>
                        </>
                      )}
                    </div>

                    {/* Progress Bar if not completed */}
                    {!isCompleted && (
                      <div className="w-48 h-1.5 rounded-full bg-[#222329] mt-2 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${job.progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                    isCompleted
                      ? 'text-emerald-400'
                      : 'text-indigo-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4 animate-spin" />
                    )}
                    <span>{job.status}</span>
                  </span>

                  <button
                    onClick={() => onReprintJob(job)}
                    className="p-2 rounded-full border border-[#292A30] bg-[#222329] hover:bg-[#2c2d36] text-[#A5A5AD] hover:text-[#F5F5F7] transition-colors"
                    title="Spool Reprint"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
