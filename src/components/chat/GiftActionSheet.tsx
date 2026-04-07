import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ShoppingBag } from 'lucide-react';
import { renderInPhoneContainer } from '../../utils/portal';

interface GiftActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomGift: () => void;
  onSelectShopping: () => void;
}

export function GiftActionSheet({ isOpen, onClose, onSelectCustomGift, onSelectShopping }: GiftActionSheetProps) {
  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center pointer-events-auto">
          {/* Backdrop for handling outside clicks */}
          <div 
            className="absolute inset-0 bg-black/20"
            onClick={onClose}
          />
          
          {/* Action Sheet Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-64 p-4 flex flex-col gap-3 rounded-2xl border border-white dark:border-gray-600 shadow-none bg-[rgba(255,255,255,0.85)] dark:bg-gray-800/85 backdrop-blur-[12px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onClose();
                onSelectCustomGift();
              }}
              className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors rounded-xl"
            >
              <div className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                <Gift size={18} />
              </div>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 text-left">自定义礼物</span>
            </button>
            
            <button
              onClick={() => {
                onClose();
                onSelectShopping();
              }}
              className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors rounded-xl"
            >
              <div className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                <ShoppingBag size={18} />
              </div>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 text-left">跳转商城</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors rounded-xl mt-1"
            >
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">取消</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
  
  return renderInPhoneContainer(content);
}
