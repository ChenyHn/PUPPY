import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Megaphone, X } from 'lucide-react';
import { renderInPhoneContainer } from '../utils/portal';

interface UpdateNoticeCardProps {
  message: string;
  version: string;
}

export const UpdateNoticeCard: React.FC<UpdateNoticeCardProps> = ({ message, version }) => {
  const storageKey = useMemo(() => `aiphone_update_notice_dismissed_${version}`, [version]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(storageKey) === 'true');
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // ignore storage failures for a cosmetic dismiss action
    }
  };

  const modalContent = (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[120] flex items-center justify-center p-5 bg-black/28 backdrop-blur-[3px]"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 18 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="w-full max-w-[320px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card rounded-[30px] px-5 py-5 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <button
                onClick={handleDismiss}
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 bg-white/45 dark:bg-black/20 active:scale-95 transition-all"
                aria-label="关闭更新公告"
              >
                <X size={15} />
              </button>

              <div className="flex items-start gap-3.5 pr-9">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Megaphone size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Update Notice
                  </div>
                  <div className="text-[12px] leading-6 text-zinc-700 dark:text-zinc-200 break-words">
                    {message}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return dismissed ? null : renderInPhoneContainer(modalContent);
};
