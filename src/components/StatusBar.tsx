import React, { useState, useEffect } from 'react';
import { Signal, Wifi, Battery } from 'lucide-react';

interface StatusBarProps {
  isDesktopWallpaperVisible?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ isDesktopWallpaperVisible = false }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`absolute top-0 left-0 w-full z-[100] backdrop-blur-xl border-b text-zinc-900 dark:text-white select-none text-[12px] font-medium pointer-events-none ${isDesktopWallpaperVisible ? 'bg-white/10 dark:bg-black/20 border-white/10' : 'bg-zinc-50/85 dark:bg-black/70 border-black/5 dark:border-white/10'}`}
      style={{ height: 'calc(2rem + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-8 flex justify-between items-center px-6">
        <div>{time}</div>
        <div className="flex items-center gap-1.5">
          <Signal size={14} />
          <Wifi size={14} />
          <Battery size={14} />
        </div>
      </div>
    </div>
  );
};
