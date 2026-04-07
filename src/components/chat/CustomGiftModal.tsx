import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, X, Send } from 'lucide-react';

interface CustomGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { imageUrl: string; name: string; message: string }) => void;
}

export function CustomGiftModal({ isOpen, onClose, onSend }: CustomGiftModalProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [name, setName] = useState('一份特别的礼物');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setImageUrl(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleSend = () => {
    if (imageUrl) {
      onSend({ imageUrl, name, message });
      onClose();
      // Reset state after sending
      setImageUrl('');
      setName('一份特别的礼物');
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4 pb-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-white/10 shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">自定义礼物</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Image Selection Area */}
            <div className="relative rounded-xl overflow-hidden bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 aspect-video flex flex-col items-center justify-center">
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Gift" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                    >
                      <ImageIcon size={24} />
                    </button>
                    <button 
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                    >
                      <Camera size={24} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors text-gray-500 dark:text-gray-400"
                  >
                    <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                      <ImageIcon size={24} />
                    </div>
                    <span className="text-sm">相册选择</span>
                  </button>
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors text-gray-500 dark:text-gray-400"
                  >
                    <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                      <Camera size={24} />
                    </div>
                    <span className="text-sm">拍照</span>
                  </button>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={cameraInputRef}
                onChange={handleFileChange}
              />
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">礼物名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="一份特别的礼物"
                  className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">祝福语 (可选)</label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="写下你的祝福..."
                  className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                />
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!imageUrl}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${
                imageUrl 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm' 
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
              送出礼物
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
