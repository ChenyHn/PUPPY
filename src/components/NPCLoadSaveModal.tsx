import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Clock, Map, Heart, FileText } from 'lucide-react';
import { NPCGameSaveSlot } from '../utils/npcGameService';
import { npcGameService } from '../utils/npcGameService';

interface NPCLoadSaveModalProps {
  onClose: () => void;
  onLoadGame: (saveId: string) => void;
  onNewGame: () => void;
  onResumeCurrent?: () => void;
}

export function NPCLoadSaveModal({ onClose, onLoadGame, onNewGame, onResumeCurrent }: NPCLoadSaveModalProps) {
  const [saves, setSaves] = useState<NPCGameSaveSlot[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadSaves();
  }, []);

  const loadSaves = () => {
    setSaves(npcGameService.getAllSaves());
  };

  const handleDeleteSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 防止触发整行点击
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      npcGameService.deleteSaveSlot(deleteConfirmId);
      loadSaves();
      setDeleteConfirmId(null);
      // 如果删除后没有存档了，自动进入新游戏
      if (npcGameService.getAllSaves().length === 0) {
        onNewGame();
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}`;
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-100 dark:bg-black">
      {/* Header - 退出按钮移到左上角 */}
      <div className="relative flex items-center justify-center p-4">
        <button
          onClick={onClose}
          className="absolute left-4 p-2 rounded-full bg-gray-200/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">选择存档</h2>
      </div>

      {/* Save List - 固定最大高度，可滚动，不溢出覆盖底部按钮 */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: 'calc(100% - 60px - 80px)' }}>
        {saves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
            <Clock size={48} className="mb-4 opacity-20" />
            <p>暂无存档记录</p>
          </div>
        ) : (
          saves.map((save) => (
            <motion.div
              key={save.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group bg-white dark:bg-gray-800 rounded-sm p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-b border-dashed border-gray-300 dark:border-gray-600"
              onClick={() => onLoadGame(save.id)}
            >
              {/* 左侧半圆缺口 */}
              <div className="absolute top-1/2 -left-[6px] -translate-y-1/2 w-[12px] h-[24px] bg-gray-100 dark:bg-black rounded-r-full z-10 pointer-events-none" />
              {/* 右侧半圆缺口 */}
              <div className="absolute top-1/2 -right-[6px] -translate-y-1/2 w-[12px] h-[24px] bg-gray-100 dark:bg-black rounded-l-full z-10 pointer-events-none" />
              {/* 左上角打孔 */}
              <div className="absolute top-[12px] left-[12px] w-[10px] h-[10px] bg-gray-100 dark:bg-black rounded-full z-10 pointer-events-none" />

              <div className="flex-1 min-w-0 flex flex-col gap-1.5 relative z-[5] pl-4">
                {/* 存档名称 */}
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  <FileText size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <span className="truncate">{save.name || '未命名存档'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock size={12} />
                  <span>{formatDate(save.timestamp)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                  <Map size={12} className="text-gray-400 dark:text-gray-500" />
                  <span className="truncate">{save.state.background || '未知世界'}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded">
                    <Heart size={12} className={save.state.user.affection > 50 ? 'text-rose-500' : 'text-gray-400'} />
                    <span>好感度: {save.state.user.affection}</span>
                  </div>
                  {save.state.statsSchema && save.state.statsSchema.filter(s => !s.name.includes('好感')).length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500/20 flex items-center justify-center text-[8px] font-bold text-blue-700 dark:text-blue-300">特</span>
                      <span>{save.state.statsSchema.filter(s => !s.name.includes('好感'))[0].name}: {save.state.user.customStats?.[save.state.statsSchema.filter(s => !s.name.includes('好感'))[0].name] ?? 0}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 relative z-[5]">
                <button
                  onClick={(e) => handleDeleteSave(e, save.id)}
                  className="p-2.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="删除存档"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 底部按钮区域 - 无外层大容器包裹，z-index高于存档卡片 */}
      <div className="relative z-20 p-4 pb-safe flex flex-row justify-around gap-3">
        {onResumeCurrent && (
          <button
            onClick={onResumeCurrent}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>继续游戏</span>
          </button>
        )}
        <button
          onClick={onNewGame}
          className="flex-1 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>开始新游戏</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[280px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-6 flex flex-col items-center shadow-none"
          >
            <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-500">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">删除存档</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">确定要删除此存档吗？此操作不可撤销。</p>
            
            <div className="flex w-full gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-bold active:scale-95 transition-all"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold active:scale-95 transition-all"
              >
                确认
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
