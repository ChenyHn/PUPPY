import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderInPhoneContainer } from '../../utils/portal';
import { X, Map, Navigation } from 'lucide-react';
import { getRealLocation, createVirtualLocation, LocationData } from '../../services/locationService';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (locationData: LocationData) => void;
}

export default function LocationModal({ isOpen, onClose, onConfirm }: LocationModalProps) {
  const [mode, setMode] = useState<'select' | 'virtual_input'>('select');
  const [virtualName, setVirtualName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorToast, setErrorToast] = useState('');

  const showToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 3000);
  };

  const handleRealLocation = async () => {
    setIsLoading(true);
    try {
      const data = await getRealLocation();
      onConfirm(data);
      handleClose();
    } catch (err: any) {
      showToast(err.message || '获取位置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVirtualLocation = () => {
    setMode('virtual_input');
  };

  const handleConfirmVirtual = () => {
    if (!virtualName.trim()) {
      showToast('请输入位置名称');
      return;
    }
    const data = createVirtualLocation(virtualName.trim());
    onConfirm(data);
    handleClose();
  };

  const handleClose = () => {
    setMode('select');
    setVirtualName('');
    setIsLoading(false);
    setErrorToast('');
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-[320px] bg-white dark:bg-zinc-800 rounded-[24px] overflow-hidden shadow-2xl flex flex-col relative"
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700">
              <span className="text-[15px] font-bold text-zinc-800 dark:text-zinc-100">
                {mode === 'select' ? '发送位置' : '输入虚拟位置'}
              </span>
              <button
                onClick={handleClose}
                className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-4">
              {mode === 'select' ? (
                <>
                  <button
                    onClick={handleRealLocation}
                    disabled={isLoading}
                    className="flex items-center gap-3 w-full p-4 bg-zinc-50 dark:bg-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl transition-colors text-left relative overflow-hidden"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-zinc-700 dark:text-zinc-300 flex-shrink-0 z-10">
                      <Navigation size={20} />
                    </div>
                    <div className="flex flex-col flex-1 z-10">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">发送真实位置</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">获取当前设备的地理位置</span>
                    </div>
                    {isLoading && (
                      <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-20 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={handleVirtualLocation}
                    disabled={isLoading}
                    className="flex items-center gap-3 w-full p-4 bg-zinc-50 dark:bg-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-zinc-700 dark:text-zinc-300 flex-shrink-0">
                      <Map size={20} />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">发送虚拟位置</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">自定义任意地点名称发送</span>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-1">地点名称</label>
                    <input
                      type="text"
                      placeholder="例如：巴黎埃菲尔铁塔"
                      value={virtualName}
                      onChange={(e) => setVirtualName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 outline-none border border-zinc-200 dark:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmVirtual();
                      }}
                    />
                  </div>
                  
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setMode('select')}
                      className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                    >
                      返回
                    </button>
                    <button
                      onClick={handleConfirmVirtual}
                      className="flex-1 py-3.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rounded-xl text-sm font-bold shadow-md hover:bg-zinc-700 dark:hover:bg-zinc-300 active:scale-95 transition-all"
                    >
                      确认发送
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Error Toast */}
            <AnimatePresence>
              {errorToast && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-800 text-white rounded-full text-xs font-bold shadow-lg whitespace-nowrap z-50"
                >
                  {errorToast}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return isOpen ? renderInPhoneContainer(modalContent) : null;
}
