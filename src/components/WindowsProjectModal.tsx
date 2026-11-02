import React, { useState } from 'react';
import {
  WINDOWS_PROJECT_FILES,
  WindowsFile,
  downloadWindowsProjectZip,
} from '../services/windowsProjectTree';
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  Laptop,
  Terminal,
  Cpu,
  Layers,
} from 'lucide-react';

interface WindowsProjectModalProps {
  onClose: () => void;
}

export const WindowsProjectModal: React.FC<WindowsProjectModalProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<WindowsFile>(WINDOWS_PROJECT_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const blob = await downloadWindowsProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SowjiXerox_Windows_DotNet8_Project_v2.4.0.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  const filteredFiles = WINDOWS_PROJECT_FILES.filter((f) => {
    if (activeCategory === 'ALL') return true;
    return f.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#191A1F] rounded-2xl w-full max-w-6xl border border-[#292A30] shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#292A30] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#222329] border border-[#292A30] text-indigo-400 flex items-center justify-center font-bold text-sm">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  Windows 10 & 11 Desktop Project (.NET 8 WPF / WinUI 3)
                </h3>
                <span className="text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-800">
                  WinSpool API + LAN Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Complete C# codebase, P/Invoke winspool.drv, HP M1005 & Canon G3010 drivers, GitHub Actions CI/CD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Packing ZIP...' : 'Download Windows Project (.ZIP)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#292A30]">
          {/* File Tree Left */}
          <div className="md:col-span-4 p-4 space-y-3 bg-[#101114] overflow-y-auto max-h-[70vh]">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {(['ALL', 'C#', 'XAML', 'Project', 'CI/CD', 'Docs'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-[#A5A5AD] hover:bg-[#222329]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#191A1F] border-indigo-500 ring-1 ring-indigo-500 text-[#F5F5F7] shadow-xs'
                        : 'border-transparent hover:bg-[#191A1F]/60 text-[#A5A5AD]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-[#F5F5F7] truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] font-mono text-[#A5A5AD] truncate mt-0.5">
                        {file.path}
                      </p>
                    </div>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#222329] border border-[#292A30] text-[#A5A5AD]">
                      {file.category}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Architecture Highlights */}
            <div className="p-3 rounded-xl bg-[#191A1F] border border-[#292A30] text-[11px] space-y-1.5 text-[#A5A5AD]">
              <p className="font-bold text-[#F5F5F7] flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Windows Native Printing Architecture
              </p>
              <p>
                <strong className="text-[#F5F5F7]">winspool.drv:</strong> Direct raw packet spooling using Win32 API functions <code>OpenPrinter</code>, <code>StartDocPrinter</code>, and <code>WritePrinter</code>.
              </p>
              <p>
                <strong className="text-[#F5F5F7]">Local Network Sync:</strong> Built-in HTTP listener on port 8989 with 6-digit PIN authentication for companion phone transfer.
              </p>
            </div>
          </div>

          {/* Code Viewer Right */}
          <div className="md:col-span-8 flex flex-col bg-[#101114] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#191A1F] border-b border-[#292A30] flex items-center justify-between text-xs text-[#A5A5AD]">
              <div className="flex items-center gap-2 font-mono">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="text-[#F5F5F7]">{selectedFile.path}</span>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded bg-[#222329] hover:bg-[#292A30] text-[#F5F5F7] text-xs flex items-center gap-1.5 border border-[#292A30] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-300 leading-relaxed max-h-[64vh]">
              <pre className="whitespace-pre-wrap">{selectedFile.content}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#191A1F] border-t border-[#292A30] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#A5A5AD]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Build with: <code>dotnet build -c Release</code> or Visual Studio 2022</span>
          </div>

          <div className="text-[11px] text-[#A5A5AD]">
            Target: .NET 8.0-windows10.0.19041.0 (Windows 10 / 11)
          </div>
        </div>
      </div>
    </div>
  );
};
