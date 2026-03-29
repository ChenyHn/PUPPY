import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users, Pencil, Delete, CircleUserRound } from 'lucide-react';
import { StatusBar, GlassCard } from './Shared';
import { Persona } from '../types';

export const PhoneListScreen = ({ onBack, time, personas, onEditPersona, onAddPersona, onDeletePersona }: any) => {
  return (
    <motion.div 
      key="app-phone-list"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 bg-zinc-50 flex flex-col z-50"
    >
      <StatusBar time={time} className="bg-white/80 backdrop-blur-md z-10" />
      
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 active:text-zinc-600">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700">联系人</h2>
        </div>
        <button 
          onClick={onAddPersona}
          className="w-10 h-10 bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {personas.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 py-20">
            <Users size={64} strokeWidth={1} />
            <p className="mt-4 text-sm font-bold tracking-widest uppercase">暂无联系人</p>
            <button 
              onClick={onAddPersona}
              className="mt-6 px-6 py-2 bg-zinc-800 text-white rounded-full text-xs font-bold active:scale-95 transition-all"
            >
              新建联系人
            </button>
          </div>
        ) : (
          personas.map((p: Persona) => (
            <GlassCard key={p.id} className="p-4 flex items-center gap-4 group" opacity="0.8" blur="10px">
              <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-300 overflow-hidden shadow-sm">
                {p.avatar ? (
                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <CircleUserRound size={32} strokeWidth={1} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-800 truncate">{p.chatName || p.name || '未命名'}</h3>
                <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase truncate">{p.occupation || '无职业'}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onEditPersona(p)}
                  className="w-8 h-8 bg-zinc-100 text-zinc-500 rounded-full flex items-center justify-center active:bg-zinc-200 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button 
                  onClick={() => onDeletePersona(p.id)}
                  className="w-8 h-8 bg-red-50 text-red-400 rounded-full flex items-center justify-center active:bg-red-100 transition-colors"
                >
                  <Delete size={14} />
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </motion.div>
  );
};
