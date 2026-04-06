import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageMessageProps {
  imageUrl: string;
  isSelf?: boolean;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({ imageUrl, isSelf = false }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <div className={`max-w-[70%] rounded-2xl overflow-hidden shadow-sm relative group ${isSelf ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
        <img 
          src={imageUrl} 
          alt="Chat Image" 
          className="w-full h-auto object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsPreviewOpen(true)}
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <ZoomIn className="text-white drop-shadow-md" size={32} />
        </div>
      </div>

      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(false);
            }}
          >
            <X size={24} />
          </button>
          
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="max-w-[95vw] max-h-[90vh] object-contain select-none shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
        </div>
      )}
    </>
  );
};
