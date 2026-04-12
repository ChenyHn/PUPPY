import React from 'react';

export const GlassCard = ({ children, className = "", blur, opacity, darkOpacity, ...props }: { children: React.ReactNode, className?: string, blur?: string, opacity?: string, darkOpacity?: string, [key: string]: any }) => {
  return (
    <div
      className={`glass-card shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px] border border-white/20 dark:border-white/10 ${className}`}
      style={{
        backdropFilter: blur ? `blur(${blur})` : 'var(--glass-blur, blur(40px))',
        WebkitBackdropFilter: blur ? `blur(${blur})` : 'var(--glass-blur, blur(40px))',
        '--glass-opacity': opacity || 'var(--glass-base-opacity, 0.2)',
        '--glass-dark-opacity': darkOpacity || 'var(--glass-base-dark-opacity, 0.4)',
      } as React.CSSProperties}
      {...props}
    >
      <div className="glass-noise" />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
