import React from 'react';
import { Signal, Wifi, Battery } from 'lucide-react';

export const GlassCard = ({ children, className = "", blur = "20px", opacity = "0.3", ...props }: { children: React.ReactNode, className?: string, blur?: string, opacity?: string, [key: string]: any }) => (
  <div 
    className={`shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[24px] border border-white/40 ${className}`}
    style={{ 
      backdropFilter: `blur(${blur})`, 
      WebkitBackdropFilter: `blur(${blur})`,
      backgroundColor: `rgba(255, 255, 255, ${opacity})` 
    }}
    {...props}
  >
    {children}
  </div>
);

export const StatusBar = ({ className = "", time }: { className?: string, time: string }) => (
  <div className={`flex justify-between items-center px-8 py-3 font-semibold text-[12px] text-zinc-800 backdrop-blur-md bg-white/10 ${className}`}>
    <span>{time}</span>
    <div className="flex items-center gap-2">
      <Signal size={14} strokeWidth={2} />
      <Wifi size={14} strokeWidth={2} />
      <Battery size={14} strokeWidth={2} className="rotate-90" />
    </div>
  </div>
);
