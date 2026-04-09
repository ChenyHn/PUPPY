import React from 'react';

export const GlassCard = ({ children, className = "", blur, opacity, ...props }: { children: React.ReactNode, className?: string, blur?: string, opacity?: string, [key: string]: any }) => {
  return (
    <div 
      className={`glass-card shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-[24px] border border-white/40 dark:border-[#1c1c1e] dark:bg-[#1c1c1e] ${className}`}
      style={{ 
        backdropFilter: blur ? `blur(${blur})` : 'var(--glass-blur, blur(40px))', 
        WebkitBackdropFilter: blur ? `blur(${blur})` : 'var(--glass-blur, blur(40px))',
        '--glass-opacity': opacity || 'var(--glass-base-opacity, 0.2)',
      } as React.CSSProperties}
      {...props}
    >
      <div className="glass-noise dark:opacity-30" />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
