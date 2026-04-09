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
    <div className="absolute top-0 left-0 w-full h-8 z-[100] flex justify-between items-center px-6 bg-white/15 dark:bg-black/20 backdrop-blur-md text-[12px] text-gray-800 dark:text-zinc-200 font-medium select-none pointer-events-none border-b border-white/10 dark:border-white/5">
      <div>{time}</div>
      <div className="flex items-center gap-1.5">
        <Signal size={14} />
        <Wifi size={14} />
        <Battery size={14} />
      </div>
    </div>
  );
};
