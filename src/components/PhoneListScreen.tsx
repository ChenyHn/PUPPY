import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users, Pencil, Delete, CircleUserRound } from 'lucide-react';
import { StatusBar, GlassCard } from './Shared';
import { Persona } from '../types';

export const PhoneListScreen = ({ onBack, time, personas, onEditPersona, onAddPersona, onDeletePersona }: any) => {
  return (
    <motion.div 
      key="app-phone-list"
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      exit={{ x: 0 }}
      transition={{ duration: 0 }}
      className="absolute inset-0 bg-white dark:bg-black z-50 flex flex-col"
    >
      <StatusBar time={time} className="bg-white/80 dark:bg-black/80 dark:text-zinc-200 backdrop-blur-md z-10" />
      
      <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-[#1c1c1e]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-100">联系人</h2>
        </div>
        <button 
          onClick={onAddPersona}
          className="w-10 h-10 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-full flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col bg-[#F5F5F5] dark:bg-black">
        {personas.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600 py-20">
            <Users size={64} strokeWidth={1} />
            <p className="mt-4 text-sm font-bold tracking-widest uppercase">暂无联系人</p>
            <button 
              onClick={onAddPersona}
              className="mt-6 px-6 py-2 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-full text-xs font-bold active:scale-95 transition-all"
            >
              新建联系人
            </button>
          </div>
        ) : (
          <div className="flex flex-col p-4">
            {personas.map((p: Persona) => (
              <div 
                key={p.id} 
                className="rounded-[16px] p-3 mb-3 flex items-center justify-between"
                style={{
                  background: document.documentElement.classList.contains('dark') ? 'rgba(40, 40, 45, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: document.documentElement.classList.contains('dark') ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: 'none',
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-gray-700 flex items-center justify-center text-gray-300 dark:text-gray-500 overflow-hidden shrink-0">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.chatName || p.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <CircleUserRound size={24} strokeWidth={1} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-medium text-gray-900 dark:text-gray-100 truncate block">{p.chatName || p.name || '未命名'}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate block mt-0.5">{p.chatId || '未设置 ID'}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 ml-3">
                  <button 
                    onClick={() => onEditPersona(p)}
                    className="text-sm px-3 py-1 rounded-full bg-neutral-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    编辑
                  </button>
                  <button 
                    onClick={() => onDeletePersona(p.id)}
                    className="text-sm px-3 py-1 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
