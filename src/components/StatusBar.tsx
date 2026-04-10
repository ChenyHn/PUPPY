import React, { useState, useEffect } from 'react';
import { Signal, Wifi, Battery } from 'lucide-react';

export const StatusBar: React.FC = () => {
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
    <div className="absolute top-0 left-0 w-full h-8 z-[100] flex justify-between items-center px-6 bg-white/10 backdrop-blur-xl border-b border-white/10 text-zinc-900 dark:text-zinc-100 select-none text-[12px] font-medium pointer-events-none dark:bg-black/20">
      <div>{time}</div>
      <div className="flex items-center gap-1.5">
        <Signal size={14} />
        <Wifi size={14} />
        <Battery size={14} />
      </div>
    </div>
  );
};
