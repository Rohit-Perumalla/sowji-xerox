import React from 'react';
import {
  Home,
  Printer,
  ScanLine,
  Settings,
} from 'lucide-react';

export type NavTab = 'HOME' | 'PRINT' | 'SCAN' | 'SETTINGS';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeQueueCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  activeQueueCount = 0,
}) => {
  const tabs = [
    { id: 'HOME' as NavTab, label: 'Home', icon: Home },
    { id: 'PRINT' as NavTab, label: 'Print', icon: Printer, badge: activeQueueCount > 0 ? activeQueueCount : undefined },
    { id: 'SCAN' as NavTab, label: 'Scan', icon: ScanLine },
    { id: 'SETTINGS' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#101114] border-t border-[#292A30] pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="max-w-md mx-auto px-4 flex items-center justify-between h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 group select-none transition-all"
            >
              <div
                className={`relative px-5 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? 'bg-[#222329] text-[#F5F5F7]'
                    : 'text-[#A5A5AD] group-hover:text-[#F5F5F7]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 right-2 w-3.5 h-3.5 rounded-full bg-indigo-500 text-[9px] text-white flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-medium mt-1 tracking-tight transition-colors ${
                  isActive ? 'text-[#F5F5F7] font-semibold' : 'text-[#A5A5AD]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
