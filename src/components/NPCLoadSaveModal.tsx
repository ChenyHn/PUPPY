import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Clock, Map, Heart } from 'lucide-react';
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

  useEffect(() => {
    loadSaves();
  }, []);

  const loadSaves = () => {
    setSaves(npcGameService.getAllSaves());
  };

  const handleDeleteSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 防止触发整行点击
    if (window.confirm('确定要删除这个存档吗？')) {
      npcGameService.deleteSaveSlot(id);
      loadSaves();
      // 如果删除后没有存档了，自动进入新游戏
      if (npcGameService.getAllSaves().length === 0) {
        onNewGame();
      }
    }
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
    <div className="absolute inset-0 z-50 flex flex-col bg-white/30 dark:bg-black/40 backdrop-blur-xl">
      {/* Header */}
      <div className="relative flex items-center justify-center p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">选择存档</h2>
        <button
          onClick={onClose}
          className="absolute right-4 p-2 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Save List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {saves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
            <Clock size={48} className="mb-4 opacity-20" />
            <p>暂无存档记录</p>
          </div>
        ) : (
          saves.map((save) => (
            <motion.div
              key={save.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm"
              onClick={() => onLoadGame(save.id)}
            >
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <Clock size={12} />
                  <span>{formatDate(save.timestamp)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  <Map size={14} className="text-zinc-400" />
                  <span className="truncate">{save.state.background || '未知世界'}</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md">
                    <Heart size={12} className={save.state.user.affection > 50 ? 'text-rose-500' : 'text-zinc-400'} />
                    <span>好感度: {save.state.user.affection}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md">
                    <span className="w-3 h-3 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px] font-bold text-purple-700 dark:text-purple-300">黑</span>
                    <span>黑化值: {save.state.user.darkening}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDeleteSave(e, save.id)}
                  className="p-2.5 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="删除存档"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50 pb-safe flex flex-col gap-3">
        {onResumeCurrent && (
          <button
            onClick={onResumeCurrent}
            className="w-full py-3.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-2xl font-bold active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>继续当前游戏</span>
          </button>
        )}
        <button
          onClick={onNewGame}
          className={`w-full py-3.5 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 ${onResumeCurrent ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md'}`}
        >
          <span>开始新游戏</span>
        </button>
      </div>
    </div>
  );
}
