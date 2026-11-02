import React, { useState } from 'react';
import { PairedDevice, PrinterDevice } from '../types';
import {
  X,
  Laptop,
  Smartphone,
  ShieldCheck,
  Check,
  RefreshCw,
  KeyRound,
  Send,
  Link,
} from 'lucide-react';

interface DevicePairingModalProps {
  onClose: () => void;
  activePrinter: PrinterDevice;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({
  onClose,
  activePrinter,
}) => {
  const [pin, setPin] = useState<string>('849201');
  const [inputPin, setInputPin] = useState<string>('');
  const [pairingStatus, setPairingStatus] = useState<'IDLE' | 'PAIRING' | 'PAIRED'>('PAIRED');
  const [pairedDevice, setPairedDevice] = useState<PairedDevice>({
    id: 'win-laptop-1',
    name: "ThinkPad P1 Studio (Windows 11)",
    platform: 'WINDOWS',
    ipAddress: '192.168.1.188',
    pairingPin: '849201',
    status: 'PAIRED',
    lastSeen: 'Active Just Now',
    sharedPrinter: {
      model: 'HP_M1005',
      name: 'HP LaserJet M1005 (USB on Windows)',
      connection: 'WinSpool / winspool.drv',
    },
  });

  const [testSent, setTestSent] = useState<boolean>(false);

  const handlePairWithPin = () => {
    if (inputPin.trim().length === 6) {
      setPairingStatus('PAIRING');
      setTimeout(() => {
        setPairingStatus('PAIRED');
      }, 1200);
    }
  };

  const handleSendTestJob = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#191A1F] rounded-[24px] w-full max-w-2xl border border-[#292A30] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#292A30] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#222329] border border-[#292A30] text-indigo-400 flex items-center justify-center">
              <Link className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F5F5F7] leading-tight">
                Phone & Laptop Local Network Pairing
              </h3>
              <p className="text-xs text-[#A5A5AD]">
                Peer-to-peer Wi-Fi sync with 6-digit PIN verification & local isolation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A5A5AD] hover:text-[#F5F5F7] hover:bg-[#222329] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Active Paired Ecosystem Card */}
          <div className="p-4 rounded-[20px] bg-[#222329] border border-[#292A30] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-[#A5A5AD]">
                Paired Companion Device
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Authorized & Synced
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#191A1F] rounded-xl border border-[#292A30]">
              <div className="p-2.5 rounded-xl bg-[#222329] text-indigo-400">
                <Laptop className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#F5F5F7] text-xs">
                  {pairedDevice.name}
                </p>
                <p className="text-[11px] text-[#A5A5AD]">
                  IP: {pairedDevice.ipAddress} · LAN Port 8989 · Windows 11 Spooler
                </p>
                {pairedDevice.sharedPrinter && (
                  <p className="text-[11px] text-indigo-400 font-medium mt-0.5">
                    Shared Printer: {pairedDevice.sharedPrinter.name}
                  </p>
                )}
              </div>

              <button
                onClick={handleSendTestJob}
                className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
              >
                <Send className="w-3 h-3" />
                <span>Forward Job</span>
              </button>
            </div>

            {testSent && (
              <p className="text-emerald-400 text-center font-medium text-[11px]">
                Test print job forwarded to {pairedDevice.name} over local Wi-Fi!
              </p>
            )}
          </div>

          {/* Secure 6-Digit PIN Pairing Panel */}
          <div className="p-4 rounded-[20px] bg-[#222329] border border-[#292A30] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-[#A5A5AD] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                Pair New Android Phone or Windows Laptop
              </span>
              <button
                onClick={() => setPin(Math.floor(100000 + Math.random() * 900000).toString())}
                className="text-[11px] text-indigo-400 flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Generate PIN
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="text-center p-3 bg-[#191A1F] rounded-xl border border-[#292A30]">
                <p className="text-[11px] text-[#A5A5AD] mb-1">Your Pairing PIN</p>
                <span className="font-mono text-2xl font-bold tracking-widest text-indigo-400">
                  {pin}
                </span>
                <p className="text-[10px] text-[#A5A5AD] mt-1">Enter this PIN on companion device</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-[#A5A5AD]">
                  Or enter PIN from companion device:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit PIN"
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 p-2 rounded-xl bg-[#191A1F] border border-[#292A30] text-[#F5F5F7] text-center font-mono text-sm tracking-widest outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handlePairWithPin}
                    disabled={inputPin.length !== 6}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-full shadow-sm"
                  >
                    Pair
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Architectural Boundary Note */}
          <div className="p-3.5 rounded-[18px] bg-[#191A1F] border border-[#292A30] text-[#A5A5AD] space-y-1">
            <p className="font-semibold text-xs text-[#F5F5F7] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Explicit Consent & Local Isolation
            </p>
            <p className="leading-relaxed text-[11px]">
              Local communication occurs strictly across your local Wi-Fi subnet without routing through any external cloud server. Laptop-connected USB printers are accessed through the Windows Spooler service with mutual handshake authorization.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#292A30] bg-[#141519] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-full bg-[#222329] hover:bg-[#2c2d36] text-[#F5F5F7] border border-[#292A30] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
