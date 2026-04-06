import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { renderInPhoneContainer } from '../utils/portal';
import { Save, Copy, X, AlertCircle } from 'lucide-react';
import { npcGameService } from '../utils/npcGameService';

interface NPCSaveNameModalProps {
  onClose: () => void;
  onOverwrite: (name: string) => void;
  onSaveAsNew: (name: string) => void;
  defaultName: string;
  /** 当前是否有可覆盖的存档（如果是全新游戏尚未保存过，则不显示覆盖按钮） */
  canOverwrite: boolean;
  /** 当前存档的 ID，用于覆盖时排除自身名称检查 */
  currentSaveSlotId: string | null;
}

export function NPCSaveNameModal({
  onClose,
  onOverwrite,
  onSaveAsNew,
  defaultName,
  canOverwrite,
  currentSaveSlotId,
}: NPCSaveNameModalProps) {
  const [saveName, setSaveName] = useState(defaultName);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 自动聚焦并全选
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 100);
  }, []);

  // 重名检查逻辑
  const checkDuplicateName = (targetName: string, isOverwrite: boolean): boolean => {
    const saves = npcGameService.getAllSaves();
    const existing = saves.find(s => s.name === targetName);
    
    if (!existing) return false;
    
    if (isOverwrite && currentSaveSlotId === existing.id) {
      // 覆盖模式下，如果同名的是当前存档自身，则允许
      return false;
    }
    
    return true;
  };

  const handleOverwrite = () => {
    const finalName = saveName.trim() || defaultName;
    if (checkDuplicateName(finalName, true)) {
      setErrorMsg('名称已存在，请重新输入');
      return;
    }
    setErrorMsg('');
    onOverwrite(finalName);
  };

  const handleSaveAsNew = () => {
    const finalName = saveName.trim() || defaultName;
    if (checkDuplicateName(finalName, false)) {
      setErrorMsg('名称已存在，请重新输入');
      return;
    }
    setErrorMsg('');
    onSaveAsNew(finalName);
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-[320px] bg-white/60 dark:bg-black/60 backdrop-blur-md rounded-2xl shadow-none p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Save size={16} className="text-gray-600 dark:text-gray-300" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">保存存档</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 输入区域 */}
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={saveName}
            onChange={(e) => {
              setSaveName(e.target.value);
              if (errorMsg) setErrorMsg(''); // 用户输入时清除错误
            }}
            placeholder={defaultName}
            maxLength={30}
            className="w-full px-4 py-3 bg-gray-100/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 rounded-xl text-sm border-none outline-none focus:ring-0 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (canOverwrite) {
                  handleOverwrite();
                } else {
                  handleSaveAsNew();
                }
              }
            }}
          />
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-1.5 text-xs text-red-500 px-2"
            >
              <AlertCircle size={12} />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </div>

        {/* 按钮区域 */}
        <div className="flex flex-col gap-2 mt-1">
          {canOverwrite && (
            <button
              onClick={handleOverwrite}
              className="w-full py-3 bg-gray-100/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 rounded-full font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none outline-none focus:ring-0"
            >
              <Save size={14} />
              <span>覆盖当前存档</span>
            </button>
          )}
          <button
            onClick={handleSaveAsNew}
            className="w-full py-3 bg-gray-100/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 rounded-full font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none outline-none focus:ring-0"
          >
            <Copy size={14} />
            <span>另存为新存档</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return renderInPhoneContainer(modalContent);
}
