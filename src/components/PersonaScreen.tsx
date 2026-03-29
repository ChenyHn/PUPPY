import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Camera, CircleUserRound } from 'lucide-react';
import { StatusBar, GlassCard } from './Shared';
import { Persona } from '../types';

export const PersonaScreen = ({ onBack, time, onSavePersona, initialPersona }: any) => {
  const [persona, setPersona] = useState<Persona>(initialPersona || {
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    gender: '男',
    chatName: '',
    chatId: '',
    avatar: null,
    height: '',
    weight: '',
    age: '',
    occupation: '',
    location: '',
    personality: '',
    bio: ''
  });

  useEffect(() => {
    if (initialPersona) {
      setPersona(initialPersona);
    }
  }, [initialPersona]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersona(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!persona.chatName || !persona.chatId) {
      alert('请填写聊天名和账号ID');
      return;
    }
    onSavePersona(persona);
    onBack();
  };

  return (
    <motion.div 
      key="app-persona"
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
          <h2 className="text-xl font-bold text-zinc-700">人设修改</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-800 text-white rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Check size={14} />
          保存人设
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <label className="cursor-pointer group relative">
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            <div className="w-[96px] h-[96px] rounded-[32px] bg-white border border-zinc-100 flex items-center justify-center text-zinc-300 overflow-hidden shadow-sm">
              {persona.avatar ? (
                <img src={persona.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <CircleUserRound size={48} strokeWidth={1} />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-lg">
              <Camera size={16} />
            </div>
          </label>
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">点击修改头像</span>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">基本信息</span>
          <GlassCard className="p-4 flex flex-col gap-4" opacity="0.8" blur="10px">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 px-1">姓名</label>
              <input 
                type="text" 
                placeholder="真实姓名"
                className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none border border-transparent focus:border-zinc-200 transition-all"
                value={persona.name}
                onChange={(e) => setPersona(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 px-1">性别</label>
                <select 
                  className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none border border-transparent focus:border-zinc-200 transition-all appearance-none"
                  value={persona.gender}
                  onChange={(e) => setPersona(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 px-1">年龄</label>
                <input 
                  type="text" 
                  placeholder="24"
                  className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none border border-transparent focus:border-zinc-200 transition-all"
                  value={persona.age}
                  onChange={(e) => setPersona(prev => ({ ...prev, age: e.target.value }))}
                />
              </div>
            </div>
          </GlassCard>

          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1 mt-2">聊天账号</span>
          <GlassCard className="p-4 flex flex-col gap-4" opacity="0.8" blur="10px">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 px-1">聊天名 (必填)</label>
              <input 
                type="text" 
                placeholder="例如：设计灵感"
                className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none border border-transparent focus:border-zinc-200 transition-all"
                value={persona.chatName}
                onChange={(e) => setPersona(prev => ({ ...prev, chatName: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 px-1">账号ID (必填)</label>
              <input 
                type="text" 
                placeholder="例如：aiphone_002"
                className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none border border-transparent focus:border-zinc-200 transition-all"
                value={persona.chatId}
                onChange={(e) => setPersona(prev => ({ ...prev, chatId: e.target.value }))}
              />
            </div>
          </GlassCard>

          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1 mt-2">详细人设</span>
          <GlassCard className="p-4 flex flex-col gap-4" opacity="0.8" blur="10px">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 px-1">身高 (cm)</label>
                <input type="text" placeholder="180" className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none" value={persona.height} onChange={(e) => setPersona(prev => ({ ...prev, height: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 px-1">体重 (kg)</label>
                <input type="text" placeholder="70" className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none" value={persona.weight} onChange={(e) => setPersona(prev => ({ ...prev, weight: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 px-1">职业</label>
              <input type="text" placeholder="UI 设计师" className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none" value={persona.occupation} onChange={(e) => setPersona(prev => ({ ...prev, occupation: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 px-1">所在地</label>
              <input type="text" placeholder="上海" className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none" value={persona.location} onChange={(e) => setPersona(prev => ({ ...prev, location: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 px-1">性格</label>
              <input type="text" placeholder="温柔、内向" className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none" value={persona.personality} onChange={(e) => setPersona(prev => ({ ...prev, personality: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 px-1">具体人设</label>
              <textarea 
                rows={4}
                placeholder="输入详细的人物背景和设定..."
                className="w-full bg-zinc-50/50 p-3 rounded-xl text-sm text-zinc-700 outline-none border border-transparent focus:border-zinc-200 transition-all resize-none"
                value={persona.bio}
                onChange={(e) => setPersona(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
};
