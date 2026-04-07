import React, { useEffect, useState } from 'react';
import { renderInPhoneContainer } from '../../utils/portal';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, isOpen, onClose, duration = 2000 }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return renderInPhoneContainer(
    <div className="absolute inset-x-0 bottom-32 z-[200] flex justify-center pointer-events-none px-4">
      <div 
        className="bg-[rgba(30,30,35,0.85)] dark:bg-[rgba(255,255,255,0.85)] backdrop-blur-[12px] px-4 py-3 rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center gap-2 animate-slide-up"
      >
        <div className="w-5 h-5 rounded-full bg-white dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
           <Check size={12} className="text-[#1a1a1a] dark:text-white" strokeWidth={3} />
        </div>
        <span className="text-sm font-bold text-white dark:text-[#1a1a1a]">{message}</span>
      </div>
    </div>
  );
};
