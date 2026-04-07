import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X } from 'lucide-react';
import { renderInPhoneContainer } from '../../utils/portal';

interface CustomGiftMessageProps {
  data: {
    imageUrl: string;
    name?: string;
    message?: string;
  };
  isSelf: boolean;
}

export function CustomGiftMessage({ data, isSelf }: CustomGiftMessageProps) {
  const [showImagePreview, setShowImagePreview] = useState(false);
  return (
    <div className={`relative ${isSelf ? 'ml-auto' : 'mr-auto'} max-w-[240px]`}>
      <div 
        className={`relative overflow-hidden rounded-2xl flex flex-col cursor-pointer ${
          isSelf 
            ? 'bg-red-500 text-white rounded-tr-none' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 rounded-tl-none border border-red-100 dark:border-red-900/30'
        }`}
        onClick={() => setShowImagePreview(true)}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-3 pb-2">
          <div className={`p-1.5 rounded-full shrink-0 ${
            isSelf ? 'bg-white/20' : 'bg-red-500 text-white'
          }`}>
            <Gift size={16} />
          </div>
          <div className="font-medium text-sm truncate">
            {data.name || '一份特别的礼物'}
          </div>
        </div>

        {/* Image Thumbnail */}
        <div className="px-3 pb-2">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <img 
              src={data.imageUrl} 
              alt={data.name || 'Gift'} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Message */}
        {data.message && (
          <div className={`px-3 pb-3 text-xs opacity-90 ${isSelf ? 'text-white/90' : 'text-red-800/80 dark:text-red-200/80'}`}>
            {data.message}
          </div>
        )}

        {/* Bottom bar */}
        <div className={`px-3 py-1.5 text-[10px] ${
          isSelf ? 'bg-black/10' : 'bg-red-100 dark:bg-red-900/40'
        }`}>
          自定义礼物
        </div>
      </div>

      {/* Image Preview Modal (Portal) */}
      {showImagePreview && renderInPhoneContainer(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={() => setShowImagePreview(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImagePreview(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <X size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={data.imageUrl}
              alt="Gift Preview"
              className="max-w-full max-h-full object-contain pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
