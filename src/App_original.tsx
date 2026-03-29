/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Lock, 
  Unlock, 
  Delete, 
  MessageCircle, 
  Users, 
  Camera, 
  Wallet, 
  Music, 
  FileText, 
  Image as ImageIcon, 
  Settings, 
  Phone, 
  Globe, 
  Sparkles,
  Wifi,
  Battery,
  Signal,
  CloudSun,
  ChevronRight,
  LogOut,
  Search,
  Plus,
  Heart,
  MessageSquare,
  User,
  CreditCard,
  ShieldCheck,
  CircleUserRound,
  Send,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Globe2,
  BookOpen,
  Check,
  Palette,
  Type,
  Layout,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Screen = 'splash' | 'lock' | 'password-setup' | 'password-unlock' | 'home' | 'app-chat' | 'app-settings' | 'ai-chat' | 'app-appearance' | 'app-persona' | 'app-phone-list';
type ChatTab = 'messages' | 'contacts' | 'moments' | 'me';

interface Persona {
  id: string;
  name: string;
  gender: string;
  chatName: string;
  chatId: string;
  avatar: string | null;
  height: string;
  weight: string;
  age: string;
  occupation: string;
  location: string;
  personality: string;
  bio: string;
}

interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  models: string[];
}

// --- Components ---

const GlassCard = ({ children, className = "", blur = "20px", opacity = "0.3", ...props }: { children: React.ReactNode, className?: string, blur?: string, opacity?: string, [key: string]: any }) => (
  <div 
    className={`shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[24px] border border-white/40 ${className}`}
    style={{ 
      backdropFilter: `blur(${blur})`, 
      WebkitBackdropFilter: `blur(${blur})`,
      backgroundColor: `rgba(255, 255, 255, ${opacity})` 
    }}
    {...props}
  >
    {children}
  </div>
);

const StatusBar = ({ className = "", time }: { className?: string, time: string }) => (
  <div className={`flex justify-between items-center px-8 py-3 font-semibold text-[12px] text-zinc-800 backdrop-blur-md bg-white/10 ${className}`}>
    <span>{time}</span>
    <div className="flex items-center gap-2">
      <Signal size={14} strokeWidth={2} />
      <Wifi size={14} strokeWidth={2} />
      <Battery size={14} strokeWidth={2} className="rotate-90" />
    </div>
  </div>
);

const AppIcon = ({ icon: Icon, label, onClick, isEditingLayout, customIcon }: { icon: any, label: string, onClick?: () => void, isEditingLayout?: boolean, customIcon?: string }) => (
  <motion.div 
    drag={isEditingLayout}
    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
    dragElastic={0.1}
    animate={isEditingLayout ? { rotate: [0, -1, 1, 0], scale: 1.05 } : { rotate: 0, scale: 1 }}
    transition={isEditingLayout ? { repeat: Infinity, duration: 0.2 } : {}}
    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform relative" 
    onClick={isEditingLayout ? undefined : onClick}
  >
    <div className="w-[60px] h-[60px] flex items-center justify-center bg-white/30 backdrop-blur-xl rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden relative border border-white/40">
      {customIcon ? (
        <img src={customIcon} alt={label} className="w-full h-full object-cover" />
      ) : (
        <Icon size={26} strokeWidth={1.2} className="text-zinc-800" />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
    </div>
    {label && <span className="text-[10px] text-zinc-800 font-bold tracking-tight drop-shadow-sm">{label}</span>}
    {isEditingLayout && (
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-lg">
        <Plus size={12} className="rotate-45" />
      </div>
    )}
  </motion.div>
);

const ChatListItem = ({ name, msg, time, unread = 0, avatar }: any) => (
  <div className="flex items-center gap-4 p-4 active:bg-zinc-50 transition-colors cursor-pointer">
    <div className="w-[56px] h-[56px] rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 flex-shrink-0 overflow-hidden border border-zinc-100">
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <User size={28} strokeWidth={1.5} />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-0.5">
        <span className="font-bold text-zinc-900 text-[14px]">{name}</span>
        <span className="text-[10px] text-zinc-400 font-medium">{time}</span>
      </div>
      <p className="text-[12px] text-zinc-500 truncate font-medium">{msg}</p>
    </div>
    {unread > 0 && (
      <div className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center">
        <span className="text-[10px] text-white font-bold">{unread}</span>
      </div>
    )}
  </div>
);

const AppearanceScreen = ({ 
  onBack, 
  time,
  isLockScreenEnabled,
  setIsLockScreenEnabled,
  isPasswordEnabled,
  setIsPasswordEnabled,
  wallpaper,
  setWallpaper,
  fontLink,
  setFontLink,
  customIcons,
  setCustomIcons
}: any) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'font' | 'icons' | 'more'>('privacy');
  const [success, setSuccess] = useState('');

  // Temporary state for settings
  const [tempSettings, setTempSettings] = useState({
    isLockScreenEnabled,
    isPasswordEnabled,
    fontLink,
    customIcons: { ...customIcons }
  });

  const handleSave = () => {
    setIsLockScreenEnabled(tempSettings.isLockScreenEnabled);
    setIsPasswordEnabled(tempSettings.isPasswordEnabled);
    setFontLink(tempSettings.fontLink);
    setCustomIcons(tempSettings.customIcons);
    
    setSuccess('设置已应用');
    setTimeout(() => setSuccess(''), 2000);
  };

  const appList = [
    { id: 'chat', name: '聊天', icon: MessageCircle },
    { id: 'music', name: '音乐', icon: Music },
    { id: 'notes', name: '备忘录', icon: FileText },
    { id: 'photos', name: '相册', icon: ImageIcon },
    { id: 'world', name: '世界书', icon: BookOpen },
    { id: 'settings', name: '设置', icon: Settings },
    { id: 'appearance', name: '外观', icon: Palette },
    { id: 'phone', name: '电话', icon: Phone },
    { id: 'browser', name: '浏览器', icon: Globe },
    { id: 'ai', name: 'AI', icon: Sparkles },
  ];

  const handleIconChange = (appId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings(prev => ({
          ...prev,
          customIcons: { ...prev.customIcons, [appId]: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'privacy', name: '隐私防护' },
    { id: 'font', name: '字体与大小' },
    { id: 'icons', name: '图标定制' },
    { id: 'more', name: '更多' },
  ];

  return (
    <motion.div 
      key="app-appearance"
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
          <h2 className="text-xl font-bold text-zinc-700">外观</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-800 text-white rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Check size={14} />
          保存
        </button>
      </div>

      <div className="flex bg-white border-b border-zinc-100 overflow-x-auto no-scrollbar">
        <div className="flex min-w-full px-2">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap px-6 py-3 text-xs font-bold transition-all border-b-2 ${activeTab === tab.id ? 'text-zinc-800 border-zinc-800' : 'text-zinc-400 border-transparent'}`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-50 text-emerald-600 text-[10px] font-bold py-2 px-4 rounded-xl text-center"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'privacy' && (
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">隐私防护</span>
            <GlassCard className="p-4 flex flex-col gap-4" opacity="0.8" blur="10px">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-zinc-400" />
                  <span className="text-sm text-zinc-700">启用锁屏界面</span>
                </div>
                <button 
                  onClick={() => setTempSettings(prev => ({ ...prev, isLockScreenEnabled: !prev.isLockScreenEnabled }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${tempSettings.isLockScreenEnabled ? 'bg-zinc-600' : 'bg-zinc-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${tempSettings.isLockScreenEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="h-px bg-zinc-100 w-full" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-zinc-400" />
                  <span className="text-sm text-zinc-700">启用锁屏密码</span>
                </div>
                <button 
                  onClick={() => setTempSettings(prev => ({ ...prev, isPasswordEnabled: !prev.isPasswordEnabled }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${tempSettings.isPasswordEnabled ? 'bg-zinc-600' : 'bg-zinc-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${tempSettings.isPasswordEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="h-px bg-zinc-100 w-full" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ImageIcon size={18} className="text-zinc-400" />
                  <span className="text-sm text-zinc-700">壁纸管理</span>
                </div>
                <button 
                  onClick={() => {
                    if (wallpaper) {
                      setWallpaper(null);
                      localStorage.removeItem('aiphone_wallpaper');
                    }
                  }}
                  className="text-[10px] font-bold text-zinc-500 active:text-zinc-800"
                >
                  {wallpaper ? '重置壁纸' : '桌面空白处修改'}
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'font' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">字体加载链接</span>
              <GlassCard className="p-4" opacity="0.8" blur="10px">
                <div className="flex items-center gap-3">
                  <Globe2 size={18} className="text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="https://fonts.googleapis.com/css2?family=..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 placeholder:text-zinc-300"
                    value={tempSettings.fontLink}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, fontLink: e.target.value }))}
                  />
                </div>
              </GlassCard>
              <p className="text-[9px] text-zinc-400 px-1">输入 Google Fonts 或其他 CSS 字体链接。</p>
            </div>
          </div>
        )}

        {activeTab === 'icons' && (
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">图标定制</span>
            <div className="grid grid-cols-2 gap-4">
              {appList.map((app) => (
                <GlassCard key={app.id} className="p-4 flex flex-col items-center gap-3 relative" opacity="0.8" blur="10px">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center overflow-hidden">
                    {tempSettings.customIcons[app.id] ? (
                      <img src={tempSettings.customIcons[app.id]} alt={app.name} className="w-full h-full object-cover" />
                    ) : (
                      <app.icon size={24} className="text-zinc-500" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-zinc-700">{app.name}</span>
                  <label className="absolute inset-0 cursor-pointer">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleIconChange(app.id, e)} 
                    />
                  </label>
                  {tempSettings.customIcons[app.id] && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempSettings(prev => {
                          const nextIcons = { ...prev.customIcons };
                          delete nextIcons[app.id];
                          return { ...prev, customIcons: nextIcons };
                        });
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-50 text-red-400 rounded-full flex items-center justify-center"
                    >
                      <Plus size={12} className="rotate-45" />
                    </button>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'more' && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-300">
            <Sparkles size={48} strokeWidth={1} />
            <p className="mt-4 text-xs font-bold tracking-widest uppercase">更多功能敬请期待</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const PhoneListScreen = ({ onBack, time, personas, onEditPersona, onAddPersona, onDeletePersona }: any) => {
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

const PersonaScreen = ({ onBack, time, onSavePersona, initialPersona }: any) => {
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

const SettingsScreen = ({ 
  apiConfig, 
  setApiConfig, 
  onBack, 
  fetchModels, 
  isAiLoading, 
  apiError, 
  setApiError,
  apiSuccess,
  setApiSuccess,
  time
}: any) => {
  const [tempConfig, setTempConfig] = useState(apiConfig);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    setApiConfig(tempConfig);
    setApiSuccess('配置已保存');
    setTimeout(() => setApiSuccess(''), 3000);
  };

  return (
    <motion.div 
      key="app-settings"
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
          <h2 className="text-xl font-bold text-zinc-700">设置</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-800 text-white rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Check size={14} />
          保存
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">API 基础地址 (Base URL)</span>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <Globe2 size={18} className="text-zinc-400" />
              <input 
                type="text" 
                placeholder="https://api.openai.com/v1"
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 placeholder:text-zinc-300"
                value={tempConfig.baseUrl}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, baseUrl: e.target.value }))}
              />
            </div>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">API 密钥 (API Key)</span>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-zinc-400" />
              <input 
                type={showKey ? "text" : "password"} 
                placeholder="sk-..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 placeholder:text-zinc-300"
                value={tempConfig.apiKey}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, apiKey: e.target.value }))}
              />
              <button onClick={() => setShowKey(!showKey)} className="text-zinc-300 active:text-zinc-500">
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">模型选择</span>
            <button 
              onClick={() => fetchModels(tempConfig)}
              disabled={isAiLoading}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 active:scale-95 transition-all"
            >
              <RefreshCw size={12} className={isAiLoading ? "animate-spin" : ""} />
              获取模型列表
            </button>
          </div>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <select 
              className="w-full bg-transparent border-none outline-none text-sm text-zinc-700 appearance-none cursor-pointer"
              value={tempConfig.selectedModel}
              onChange={(e) => setTempConfig((prev: any) => ({ ...prev, selectedModel: e.target.value }))}
            >
              {tempConfig.models.length > 0 ? (
                tempConfig.models.map((m: any) => <option key={m} value={m}>{m}</option>)
              ) : (
                <option value="">请先获取模型列表</option>
              )}
            </select>
          </GlassCard>
        </div>

        {apiSuccess && (
          <div className="px-1 py-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
            {apiSuccess}
          </div>
        )}

        <div className="mt-auto pt-10">
          <p className="text-[10px] text-center text-zinc-300 leading-relaxed">
            配置完成后，点击右上角“保存”。您可以在“聊天”应用的“AI 助手”中与模型对话。
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [chatTab, setChatTab] = useState<ChatTab>('messages');
  const [password, setPassword] = useState<string | null>(() => localStorage.getItem('aiphone_password'));
  const [input, setInput] = useState('');
  const [setupStep, setSetupStep] = useState<'first' | 'confirm'>('first');
  const [firstInput, setFirstInput] = useState('');
  const [error, setError] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [isLockScreenEnabled, setIsLockScreenEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('aiphone_lock_screen_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isPasswordEnabled, setIsPasswordEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('aiphone_password_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // API Config State
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem('aiphone_api_config');
    return saved ? JSON.parse(saved) : { baseUrl: '', apiKey: '', selectedModel: '', models: [] };
  });

  // Chat State
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  // Home Screen Customization State
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem('aiphone_avatar'));
  const [wallpaper, setWallpaper] = useState<string | null>(() => localStorage.getItem('aiphone_wallpaper'));
  const [motto, setMotto] = useState(() => localStorage.getItem('aiphone_motto') || '生活明朗，万物可爱');
  const [fontLink, setFontLink] = useState(() => localStorage.getItem('aiphone_font_link') || '');
  const [customIcons, setCustomIcons] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('aiphone_custom_icons');
    return saved ? JSON.parse(saved) : {};
  });
  const [contacts, setContacts] = useState<Persona[]>(() => {
    const saved = localStorage.getItem('aiphone_contacts');
    return saved ? JSON.parse(saved) : [];
  });
  const [phonePersonas, setPhonePersonas] = useState<Persona[]>(() => {
    const saved = localStorage.getItem('aiphone_phone_personas');
    return saved ? JSON.parse(saved) : [];
  });

  const wallpaperInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('aiphone_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('aiphone_phone_personas', JSON.stringify(phonePersonas));
    // Synchronize contacts: remove any contact that is no longer in phonePersonas
    setContacts(prev => prev.filter(c => phonePersonas.some(p => p.id === c.id)));
  }, [phonePersonas]);

  useEffect(() => {
    localStorage.setItem('aiphone_font_link', fontLink);
    if (fontLink) {
      const id = 'custom-font-style';
      let link = document.getElementById(id) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = fontLink;

      // Extract font family from link if possible, or just apply it globally
      // This is a bit tricky with just a link, but we can try to find the family name
      const match = fontLink.match(/family=([^&:]+)/);
      if (match) {
        const family = match[1].replace(/\+/g, ' ');
        document.documentElement.style.setProperty('--custom-font-family', `"${family}", sans-serif`);
      }
    } else {
      document.documentElement.style.removeProperty('--custom-font-family');
    }
  }, [fontLink]);

  useEffect(() => {
    localStorage.setItem('aiphone_custom_icons', JSON.stringify(customIcons));
  }, [customIcons]);

  useEffect(() => {
    localStorage.setItem('aiphone_lock_screen_enabled', JSON.stringify(isLockScreenEnabled));
  }, [isLockScreenEnabled]);

  useEffect(() => {
    localStorage.setItem('aiphone_password_enabled', JSON.stringify(isPasswordEnabled));
  }, [isPasswordEnabled]);

  useEffect(() => {
    if (avatar) localStorage.setItem('aiphone_avatar', avatar);
  }, [avatar]);

  useEffect(() => {
    if (wallpaper) localStorage.setItem('aiphone_wallpaper', wallpaper);
  }, [wallpaper]);

  useEffect(() => {
    localStorage.setItem('aiphone_motto', motto);
  }, [motto]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWallpaper(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    localStorage.setItem('aiphone_api_config', JSON.stringify(apiConfig));
  }, [apiConfig]);

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      setDate(`${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchModels = async (configToUse = apiConfig) => {
    if (!configToUse.baseUrl || !configToUse.apiKey) {
      setApiError('请先输入 API 地址和密钥');
      return;
    }
    setIsAiLoading(true);
    setApiError('');
    setApiSuccess('');
    try {
      let baseUrl = configToUse.baseUrl.replace(/\/$/, '');
      // Smart URL handling: if user didn't include /v1, and it's not a custom endpoint that might not need it
      // we append /v1/models. If they did include /v1, we just append /models.
      const url = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${configToUse.apiKey}`,
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `请求失败 (${response.status})`);
      }
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const modelNames = data.data.map((m: any) => m.id);
        if (modelNames.length > 0) {
          setApiConfig(prev => ({ ...prev, models: modelNames, selectedModel: prev.selectedModel || modelNames[0] }));
          setApiSuccess('模型列表获取成功');
        } else {
          setApiError('未找到可用模型');
        }
      } else {
        setApiError('返回数据格式不正确');
      }
    } catch (err: any) {
      setApiError(`获取失败: ${err.message || '请检查网络或配置'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const sendAiMessage = async () => {
    if (!chatInput.trim() || !apiConfig.selectedModel) return;
    if (!apiConfig.apiKey) {
      const errorMsg = { role: 'assistant' as const, content: '请先在“设置”中配置 API 密钥。' };
      if (activeChatContact) {
        setChatHistories(prev => ({
          ...prev,
          [activeChatContact.id]: [...(prev[activeChatContact.id] || []), errorMsg]
        }));
      } else {
        setChatMessages(prev => [...prev, errorMsg]);
      }
      return;
    }
    
    const currentMessages = activeChatContact ? (chatHistories[activeChatContact.id] || []) : chatMessages;
    const newMessages = [...currentMessages, { role: 'user' as const, content: chatInput }];
    
    if (activeChatContact) {
      setChatHistories(prev => ({
        ...prev,
        [activeChatContact.id]: newMessages
      }));
    } else {
      setChatMessages(newMessages);
    }
    
    setChatInput('');
    setIsAiLoading(true);

    const systemPrompt = activeChatContact ? `
你现在正在扮演一个真实的人，你的名字是 ${activeChatContact.chatName}。
你的基本信息如下：
- 真实姓名：${activeChatContact.name}
- 性别：${activeChatContact.gender}
- 年龄：${activeChatContact.age}
- 职业：${activeChatContact.occupation}
- 所在地：${activeChatContact.location}
- 身高/体重：${activeChatContact.height}/${activeChatContact.weight}
- 性格特点：${activeChatContact.personality}
- 个人简介：${activeChatContact.bio}

请严格遵守以下规则：
1. 你的回复必须完全符合你的人设。
2. 你的语气、用词习惯、反应方式都要体现你的性格。
3. 不要承认自己是AI，也不要提及自己是人工智能。
4. 保持对话自然，像是在社交软件上聊天一样。
5. 如果对方问及你的信息，请根据上述设定回答。
` : "你是一个乐于助人的AI助手。";

    try {
      const baseUrl = apiConfig.baseUrl.replace(/\/$/, '');
      const url = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: apiConfig.selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessages
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = { 
          role: 'assistant' as const, 
          content: `发送失败: ${errorData.error?.message || `请求失败 (${response.status})`}` 
        };
        if (activeChatContact) {
          setChatHistories(prev => ({
            ...prev,
            [activeChatContact.id]: [...(prev[activeChatContact.id] || []), errorMsg]
          }));
        } else {
          setChatMessages(prev => [...prev, errorMsg]);
        }
        return;
      }

      const data = await response.json();
      if (data.choices?.[0]?.message) {
        if (activeChatContact) {
          setChatHistories(prev => ({
            ...prev,
            [activeChatContact.id]: [...(prev[activeChatContact.id] || []), data.choices[0].message]
          }));
        } else {
          setChatMessages(prev => [...prev, data.choices[0].message]);
        }
      } else {
        throw new Error('返回数据格式不正确，未找到回复内容。');
      }
    } catch (err: any) {
      const errorMsg = { role: 'assistant' as const, content: `发送失败: ${err.message || '请检查 API 配置。'}` };
      if (activeChatContact) {
        setChatHistories(prev => ({
          ...prev,
          [activeChatContact.id]: [...(prev[activeChatContact.id] || []), errorMsg]
        }));
      } else {
        setChatMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  // ... (handleNumpad, handleDelete, AppIcon, ChatListItem remain same)

  // Splash screen timeout
  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => {
        if (!isLockScreenEnabled) {
          setScreen('home');
        } else {
          setScreen('lock');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [screen, isLockScreenEnabled]);

  const handleNumpad = (num: string) => {
    if (input.length >= 6) return;
    const newInput = input + num;
    setInput(newInput);
    setError('');

    if (newInput.length === 6) {
      setTimeout(() => {
        if (screen === 'password-setup') {
          if (setupStep === 'first') {
            setFirstInput(newInput);
            setInput('');
            setSetupStep('confirm');
          } else {
            if (newInput === firstInput) {
              localStorage.setItem('aiphone_password', newInput);
              setPassword(newInput);
              setScreen('home');
              setInput('');
            } else {
              setError('两次密码不一致，请重试');
              setInput('');
              setSetupStep('first');
            }
          }
        } else if (screen === 'password-unlock') {
          if (newInput === password) {
            setScreen('home');
            setInput('');
          } else {
            setError('密码错误，请重试');
            setInput('');
          }
        }
      }, 300);
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
    setError('');
  };

  const [showApiKey, setShowApiKey] = useState(false);
  const [activeChatContact, setActiveChatContact] = useState<Persona | null>(null);
  const [chatHistories, setChatHistories] = useState<Record<string, {role: 'user' | 'assistant', content: string}[]>>(() => {
    const saved = localStorage.getItem('aiphone_chat_histories');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('aiphone_chat_histories', JSON.stringify(chatHistories));
  }, [chatHistories]);

  return (
    <div 
      className="relative w-full h-full bg-zinc-50 flex items-center justify-center overflow-hidden font-sans"
      style={{ 
        fontFamily: 'var(--custom-font-family, inherit)'
      }}
    >
      {/* Mobile Frame */}
      <div className="relative w-full h-full max-w-[390px] max-h-[844px] sm:h-[844px] sm:rounded-[44px] sm:border-[12px] sm:border-white sm:shadow-[0_20px_60px_rgba(0,0,0,0.05)] overflow-hidden bg-zinc-100">
        
        <AnimatePresence mode="wait">
          {/* 1. Splash Screen */}
          {screen === 'splash' && (
            <motion.div 
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-100 flex items-center justify-center"
            >
              <div className="absolute top-[5%] left-[-10%] w-80 h-80 bg-white rounded-full blur-[100px] opacity-80" />
              <div className="absolute bottom-[10%] right-[-5%] w-96 h-96 bg-white rounded-full blur-[100px] opacity-80" />
              
              <GlassCard className="flex flex-col items-center gap-6 p-14" blur="50px" opacity="0.4">
                <div className="w-24 h-24 bg-white/50 rounded-[32px] flex items-center justify-center text-zinc-600 shadow-sm animate-pulse">
                  <Smartphone size={52} strokeWidth={1} />
                </div>
                <div className="flex flex-col items-center">
                  <h1 className="text-3xl font-light text-zinc-600 tracking-[0.2em]">AI PHONE</h1>
                  <p className="text-[9px] text-zinc-400 font-bold tracking-[0.4em] uppercase mt-2">Pure White Edition</p>
                </div>
                <div className="w-32 h-0.5 bg-zinc-100 rounded-full mt-10 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    className="h-full bg-zinc-300"
                  />
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* 2. Lock Screen */}
          {screen === 'lock' && (
            <motion.div 
              key="lock"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 bg-zinc-100 flex flex-col"
              onClick={() => {
                if (!isPasswordEnabled) {
                  setScreen('home');
                } else {
                  setScreen(password ? 'password-unlock' : 'password-setup');
                }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200" />
              <StatusBar time={time} className="z-10" />
              
              <div className="flex-1 flex flex-col items-center justify-start pt-24 relative z-10">
                <span className="text-[84px] font-thin tracking-tighter text-zinc-700 leading-none">{time}</span>
                <span className="text-sm font-medium mt-4 text-zinc-500 tracking-[0.2em] uppercase">{date}</span>
              </div>

              <div className="pb-14 flex justify-center z-10">
                <motion.div 
                  animate={{ y: [0, -8, 0] }} 
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-1 bg-zinc-200 rounded-full" />
                  <span className="text-[9px] text-zinc-400 font-bold tracking-[0.3em] uppercase">Slide to Unlock</span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* 3 & 4. Password Screen */}
          {(screen === 'password-setup' || screen === 'password-unlock') && (
            <motion.div 
              key="password"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white flex flex-col items-center justify-center"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-zinc-50/50" />
              
              <GlassCard className="w-full max-w-[350px] flex flex-col items-center p-12" blur="40px" opacity="0.6">
                <div className="flex flex-col items-center mb-10">
                  <div className="text-zinc-600 mb-6">
                    {screen === 'password-setup' ? <Lock size={40} strokeWidth={1} /> : <Unlock size={40} strokeWidth={1} />}
                  </div>
                  <h2 className="text-xl font-light text-zinc-600 tracking-widest mb-2">
                    {screen === 'password-setup' ? (setupStep === 'first' ? '设置密码' : '确认密码') : '输入密码'}
                  </h2>
                  <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">
                    {screen === 'password-setup' ? 'Security Configuration' : 'Identity Verification'}
                  </p>
                </div>

                <div className="flex gap-5 mb-6">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2.5 h-2.5 rounded-full border transition-all duration-400 ${
                        i < input.length 
                          ? 'bg-zinc-500 border-zinc-500 scale-125 shadow-sm' 
                          : 'border-zinc-200 bg-transparent'
                      } ${error ? 'border-red-400 bg-red-400 animate-shake' : ''}`} 
                    />
                  ))}
                </div>

                <div className="h-6 text-[9px] font-bold text-red-400 mb-6 tracking-[0.2em] uppercase">{error}</div>

                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0].map((num, i) => (
                    num === '' ? <div key={i} /> : (
                      <button 
                        key={i}
                        onClick={() => handleNumpad(num.toString())}
                        className="w-[74px] h-[74px] rounded-full border border-white bg-white/80 backdrop-blur-2xl flex flex-col items-center justify-center text-zinc-600 text-2xl font-light active:bg-zinc-100 active:scale-90 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                      >
                        {num}
                        <span className="text-[7px] tracking-[0.3em] text-zinc-300 font-bold uppercase mt-1">
                          {num === 2 ? 'ABC' : num === 3 ? 'DEF' : num === 4 ? 'GHI' : num === 5 ? 'JKL' : num === 6 ? 'MNO' : num === 7 ? 'PQRS' : num === 8 ? 'TUV' : num === 9 ? 'WXYZ' : ''}
                        </span>
                      </button>
                    )
                  ))}
                  <button 
                    onClick={handleDelete}
                    className="w-[74px] h-[74px] flex items-center justify-center text-zinc-400 active:text-zinc-800 active:scale-75 transition-all"
                  >
                    <Delete size={20} strokeWidth={1} />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* 5. Home Screen */}
          {screen === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-zinc-100 flex flex-col"
              onContextMenu={(e) => e.preventDefault()}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{ 
                  backgroundImage: wallpaper ? `url(${wallpaper})` : 'none',
                  backgroundColor: wallpaper ? 'transparent' : '#f4f4f5'
                }}
              />
              {!wallpaper && <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200 pointer-events-none" />}
              
              <input 
                type="file" 
                ref={wallpaperInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleWallpaperChange} 
              />

              <StatusBar time={time} className="z-10 backdrop-blur-xl bg-white/20" />
              
              <div 
                className="flex-1 flex flex-col relative z-10"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const isInteractive = target.closest('button') || target.closest('input') || target.closest('.app-icon-container') || target.closest('.widget-container');
                  if (!isInteractive) {
                    wallpaperInputRef.current?.click();
                  }
                }}
                onPointerDown={(e) => {
                  const target = e.target as HTMLElement;
                  const isInteractive = target.closest('button') || target.closest('input') || target.closest('.app-icon-container') || target.closest('.widget-container');
                  if (!isInteractive) {
                    const timer = setTimeout(() => setIsEditingLayout(true), 800);
                    const cleanup = () => {
                      clearTimeout(timer);
                      window.removeEventListener('pointerup', cleanup);
                    };
                    window.addEventListener('pointerup', cleanup);
                  }
                }}
              >
                {/* Exit Edit Mode Button */}
                {/* Removed duplicate top button */}
                {/* Combined Widget Area */}
                <motion.div 
                  drag={isEditingLayout}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  animate={isEditingLayout ? { rotate: [0, -0.5, 0.5, 0] } : {}}
                  transition={isEditingLayout ? { repeat: Infinity, duration: 0.3 } : {}}
                  className="px-6 pt-10 pb-4 widget-container"
                >
                  <GlassCard className="p-6 flex gap-6 items-center" blur="60px" opacity="0.3">
                    {/* Time & Weather Section */}
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="font-thin text-zinc-700 tracking-tighter leading-none" style={{ fontSize: '48px' }}>{time}</span>
                      <span className="font-bold text-zinc-500 tracking-[0.3em] uppercase mt-2" style={{ fontSize: '9px' }}>{date}</span>
                      <div className="mt-4 pt-3 border-t border-zinc-200/30 flex items-center gap-3">
                        <CloudSun className="text-zinc-400" size={16} strokeWidth={1} />
                        <div className="flex gap-2 items-center">
                          <span className="font-light text-zinc-600" style={{ fontSize: '20px' }}>22°</span>
                          <span className="font-bold text-zinc-400 tracking-[0.2em] uppercase" style={{ fontSize: '8px' }}>Cloudy</span>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-20 bg-zinc-200/30" />

                    {/* Avatar & Motto Section */}
                    <div className="w-[140px] flex flex-col items-center gap-3">
                      <label className="cursor-pointer group relative">
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        <div className="w-[96px] h-[96px] rounded-[32px] bg-white/50 border border-white flex items-center justify-center text-zinc-300 overflow-hidden group-hover:bg-white/80 transition-colors">
                          {avatar ? (
                            <img src={avatar} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <CircleUserRound size={48} strokeWidth={1} />
                          )}
                        </div>
                        {isEditingLayout && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-500 shadow-sm">
                            <Plus size={12} />
                          </div>
                        )}
                      </label>
                      <div className="w-full">
                        <input 
                          type="text"
                          value={motto}
                          onChange={(e) => setMotto(e.target.value)}
                          style={{ fontSize: '10px' }}
                          className="w-full bg-transparent border-none outline-none text-zinc-500 text-center font-medium placeholder:text-zinc-300"
                          placeholder="点击输入文案"
                        />
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* App Grid */}
                <div className="flex-1 grid grid-cols-4 gap-y-6 px-6 py-6 content-start">
                  <div className="app-icon-container flex justify-center"><AppIcon icon={MessageCircle} label="聊天" onClick={() => setScreen('app-chat')} isEditingLayout={isEditingLayout} customIcon={customIcons['chat']} /></div>
                  <div className="app-icon-container flex justify-center"><AppIcon icon={Music} label="音乐" isEditingLayout={isEditingLayout} customIcon={customIcons['music']} /></div>
                  <div className="app-icon-container flex justify-center"><AppIcon icon={FileText} label="备忘录" isEditingLayout={isEditingLayout} customIcon={customIcons['notes']} /></div>
                  <div className="app-icon-container flex justify-center"><AppIcon icon={ImageIcon} label="相册" isEditingLayout={isEditingLayout} customIcon={customIcons['photos']} /></div>
                  <div className="app-icon-container flex justify-center"><AppIcon icon={BookOpen} label="世界书" isEditingLayout={isEditingLayout} customIcon={customIcons['world']} /></div>
                  <div className="app-icon-container flex justify-center"><AppIcon icon={Settings} label="设置" onClick={() => setScreen('app-settings')} isEditingLayout={isEditingLayout} customIcon={customIcons['settings']} /></div>
                  <div className="app-icon-container flex justify-center"><AppIcon icon={Palette} label="外观" onClick={() => setScreen('app-appearance')} isEditingLayout={isEditingLayout} customIcon={customIcons['appearance']} /></div>
                </div>

                {/* Page Indicator */}
                <div className="flex justify-center gap-2.5 py-4">
                  <div className="w-8 h-1 bg-zinc-300 rounded-full" />
                  <div className="w-1.5 h-1 bg-zinc-100 rounded-full" />
                </div>

                {/* Dock */}
                <div className="mx-4 mb-2">
                  <GlassCard className="flex justify-around p-2 rounded-[24px]" blur="80px" opacity="0.4">
                    <div className="app-icon-container"><AppIcon icon={Phone} label="" onClick={() => setScreen('app-phone-list')} isEditingLayout={isEditingLayout} customIcon={customIcons['phone']} /></div>
                    <div className="app-icon-container"><AppIcon icon={MessageCircle} label="" onClick={() => setScreen('app-chat')} isEditingLayout={isEditingLayout} customIcon={customIcons['chat']} /></div>
                    <div className="app-icon-container"><AppIcon icon={Globe} label="" isEditingLayout={isEditingLayout} customIcon={customIcons['browser']} /></div>
                    <div className="app-icon-container"><AppIcon icon={Sparkles} label="" isEditingLayout={isEditingLayout} customIcon={customIcons['ai']} /></div>
                  </GlassCard>
                </div>

                {/* Exit Edit Mode Button */}
                <AnimatePresence>
                  {isEditingLayout && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      onClick={() => setIsEditingLayout(false)}
                      className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/80 backdrop-blur-xl rounded-full text-xs font-bold text-zinc-500 shadow-lg border border-white active:scale-95 transition-all z-50"
                    >
                      完成
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Home Indicator */}
                <div className="w-32 h-1 bg-zinc-200 rounded-full mx-auto my-4" />
              </div>
            </motion.div>
          )}

          {/* 6. Chat App (Integrated Moments & Wallet) */}
          {screen === 'app-chat' && (
            <motion.div 
              key="app-chat"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 bg-white flex flex-col z-50"
            >
              <StatusBar time={time} className="bg-white/80 backdrop-blur-md z-10" />
              
              {/* Top Nav */}
              <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-100 bg-white">
                <div className="w-10">
                  {isAddingFriend ? (
                    <button onClick={() => setIsAddingFriend(false)} className="text-zinc-400 active:text-zinc-600">
                      <ArrowLeft size={20} strokeWidth={1.5} />
                    </button>
                  ) : (
                    <button onClick={() => setScreen('home')} className="p-1.5 bg-zinc-50 rounded-full text-zinc-400 active:text-zinc-600">
                      <LogOut size={18} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                <h2 className="text-[16px] font-bold text-zinc-800 flex-1 text-center">
                  {isAddingFriend ? '添加好友' : (
                    <>
                      {chatTab === 'messages' && '消息'}
                      {chatTab === 'contacts' && '通讯录'}
                      {chatTab === 'moments' && '朋友圈'}
                      {chatTab === 'me' && '个人中心'}
                    </>
                  )}
                </h2>
                <div className="flex gap-4 items-center w-10 justify-end">
                  {!isAddingFriend && chatTab === 'messages' && <Plus size={20} className="text-zinc-400" strokeWidth={1.5} />}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto bg-white/20 backdrop-blur-2xl">
                {isAddingFriend ? (
                  <div className="flex flex-col p-4 gap-4">
                    <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 tracking-widest uppercase">从电话簿添加</div>
                    {phonePersonas.length === 0 ? (
                      <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-4">
                        <Phone size={48} strokeWidth={1} />
                        <p className="text-xs font-bold tracking-widest uppercase">电话簿为空</p>
                      </div>
                    ) : (
                      phonePersonas.map(persona => {
                        const isAdded = contacts.some(c => c.id === persona.id);
                        return (
                          <GlassCard key={persona.id} className="flex items-center gap-4 p-4" opacity="0.4" blur="10px">
                            <div className="w-[48px] h-[48px] rounded-full bg-white/50 flex items-center justify-center text-zinc-400 overflow-hidden flex-shrink-0 border border-white/40">
                              {persona.avatar ? (
                                <img src={persona.avatar} alt={persona.chatName} className="w-full h-full object-cover" />
                              ) : (
                                <User size={24} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[14px] font-bold text-zinc-800 truncate">{persona.chatName}</span>
                              <span className="block text-[10px] text-zinc-500 truncate">ID: {persona.chatId}</span>
                            </div>
                            <button 
                              disabled={isAdded}
                              onClick={() => {
                                if (!isAdded) {
                                  setContacts(prev => [...prev, persona]);
                                  setIsAddingFriend(false);
                                }
                              }}
                              className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${isAdded ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-800 text-white active:scale-95 shadow-lg'}`}
                            >
                              {isAdded ? '已添加' : '发送好友申请'}
                            </button>
                          </GlassCard>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <>
                    {chatTab === 'messages' && (
                      <div className="flex flex-col">
                        {contacts.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center py-40 text-zinc-400 gap-4">
                            <MessageSquare size={48} strokeWidth={1} />
                            <p className="text-xs font-bold tracking-widest uppercase">暂无消息</p>
                            <p className="text-[10px] text-zinc-400">去通讯录添加好友开始聊天</p>
                          </div>
                        ) : (
                          <>
                            <div onClick={() => {
                              setActiveChatContact(null);
                              setScreen('ai-chat');
                            }}>
                              <ChatListItem name="AI 助手" msg={chatMessages.length > 0 ? chatMessages[chatMessages.length-1].content : "你好！有什么我可以帮你的吗？"} time="10:24" unread={0} />
                            </div>
                            {contacts.map(contact => {
                              const history = chatHistories[contact.id] || [];
                              const lastMsg = history.length > 0 ? history[history.length - 1].content : "点击开始聊天";
                              return (
                                <div key={contact.id} onClick={() => {
                                  setActiveChatContact(contact);
                                  setScreen('ai-chat');
                                }}>
                                  <ChatListItem name={contact.chatName} msg={lastMsg} time="09:15" avatar={contact.avatar} />
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}

                    {chatTab === 'contacts' && (
                      <div className="flex flex-col gap-1 p-4">
                        <button 
                          onClick={() => setIsAddingFriend(true)}
                          className="flex items-center gap-4 p-4 bg-white/40 backdrop-blur-md rounded-2xl active:bg-white/60 transition-colors mb-4 border border-white/40 shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-zinc-600 border border-white/40"><Plus size={20} /></div>
                          <span className="text-sm font-bold text-zinc-800">添加好友</span>
                        </button>

                        <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 tracking-widest uppercase">所有联系人</div>
                        {contacts.length === 0 ? (
                          <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-4">
                            <Users size={48} strokeWidth={1} />
                            <p className="text-xs font-bold tracking-widest uppercase">暂无好友</p>
                          </div>
                        ) : (
                          contacts.map(contact => (
                            <div 
                              key={contact.id} 
                              onClick={() => {
                                setActiveChatContact(contact);
                                setScreen('ai-chat');
                              }}
                              className="flex items-center gap-4 p-4 hover:bg-white/40 rounded-2xl transition-colors cursor-pointer"
                            >
                              <div className="w-[48px] h-[48px] rounded-full bg-white/60 flex items-center justify-center text-zinc-400 overflow-hidden flex-shrink-0 border border-white/40">
                                {contact.avatar ? (
                                  <img src={contact.avatar} alt={contact.chatName} className="w-full h-full object-cover" />
                                ) : (
                                  <User size={24} />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-zinc-800">{contact.chatName}</span>
                                <span className="text-[10px] text-zinc-500">ID: {contact.chatId}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {chatTab === 'moments' && (
                      <div className="flex flex-col">
                        <div className="relative h-64 bg-zinc-100/20 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                          <div className="absolute bottom-4 right-6 flex items-center gap-4">
                            <span className="text-white font-bold text-shadow-md" style={{ fontSize: '16px' }}>AI User</span>
                            <div className="w-[64px] h-[64px] rounded-2xl bg-white/40 backdrop-blur-md shadow-lg flex items-center justify-center text-zinc-200 border-2 border-white/60 flex-shrink-0 overflow-hidden">
                              {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <CircleUserRound size={40} strokeWidth={1} />}
                            </div>
                          </div>
                        </div>
                        <div className="p-6 flex flex-col gap-8">
                          {contacts.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-4">
                              <Sparkles size={48} strokeWidth={1} />
                              <p className="text-xs font-bold tracking-widest uppercase">暂无动态</p>
                            </div>
                          ) : (
                            contacts.map(contact => (
                              <div key={contact.id} className="flex gap-4">
                                <div className="w-[40px] h-[40px] rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-zinc-400 flex-shrink-0 overflow-hidden border border-white/40">
                                  {contact.avatar ? <img src={contact.avatar} className="w-full h-full object-cover" /> : <User size={20} />}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-zinc-800 mb-1" style={{ fontSize: '14px' }}>{contact.chatName}</h4>
                                  <p className="text-xs text-zinc-600 leading-relaxed mb-3">极致纯白，通透如冰。这就是我们追求的未来感设计语言。#纯白 #毛玻璃 #UI设计</p>
                                  <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="aspect-square bg-white/20 backdrop-blur-sm rounded-lg border border-white/20" />
                                    <div className="aspect-square bg-white/10 backdrop-blur-sm rounded-lg border border-white/10" />
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-400">2小时前</span>
                                    <div className="flex gap-4">
                                      <Heart size={18} className="text-zinc-400 hover:text-red-400 transition-colors cursor-pointer" />
                                      <MessageSquare size={18} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {chatTab === 'me' && (
                      <div className="flex flex-col gap-6 p-6">
                        <div className="flex items-center gap-5">
                          <div className="w-[80px] h-[80px] rounded-full bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-center text-zinc-200 flex-shrink-0 overflow-hidden shadow-sm">
                            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <CircleUserRound size={48} strokeWidth={1} />}
                          </div>
                          <div>
                            <h3 className="font-bold text-zinc-800" style={{ fontSize: '20px' }}>AI User</h3>
                            <p className="text-zinc-500 mt-1 uppercase tracking-widest" style={{ fontSize: '10px' }}>ID: aiphone_001</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-md rounded-2xl active:bg-white/60 transition-colors border border-white/40 shadow-sm" onClick={() => {}}>
                            <div className="flex items-center gap-4">
                              <Wallet size={20} className="text-zinc-600" strokeWidth={1.5} />
                              <span className="text-sm font-bold text-zinc-700">钱包</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500">¥ 8,888.00</span>
                              <ChevronRight size={16} className="text-zinc-400" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-md rounded-2xl active:bg-white/60 transition-colors border border-white/40 shadow-sm">
                            <div className="flex items-center gap-4">
                              <CreditCard size={20} className="text-zinc-600" strokeWidth={1.5} />
                              <span className="text-sm font-bold text-zinc-700">卡包</span>
                            </div>
                            <ChevronRight size={16} className="text-zinc-400" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-md rounded-2xl active:bg-white/60 transition-colors border border-white/40 shadow-sm">
                            <div className="flex items-center gap-4">
                              <ShieldCheck size={20} className="text-zinc-600" strokeWidth={1.5} />
                              <span className="text-sm font-bold text-zinc-700">支付安全</span>
                            </div>
                            <ChevronRight size={16} className="text-zinc-400" />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-md rounded-2xl active:bg-white/60 transition-colors border border-white/40 shadow-sm">
                            <div className="flex items-center gap-4">
                              <Settings size={20} className="text-zinc-600" strokeWidth={1.5} />
                              <span className="text-sm font-bold text-zinc-700">设置</span>
                            </div>
                            <ChevronRight size={16} className="text-zinc-400" />
                          </div>
                        </div>

                        <button 
                          onClick={() => setScreen('home')}
                          className="mt-4 p-4 bg-white/40 backdrop-blur-md rounded-2xl text-zinc-500 font-bold text-sm active:bg-white/60 transition-colors flex items-center justify-center gap-2 border border-white/40 shadow-sm"
                        >
                          <LogOut size={18} />
                          退出应用
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Tab Bar */}
              <div className="bg-white/80 backdrop-blur-xl border-t border-zinc-100 px-4 pb-8 pt-2 flex justify-around">
                <button onClick={() => setChatTab('messages')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${chatTab === 'messages' ? 'text-zinc-600' : 'text-zinc-300'}`}>
                  <MessageSquare size={24} strokeWidth={chatTab === 'messages' ? 2 : 1.5} />
                  <span className="text-[10px] font-bold">消息</span>
                </button>
                <button onClick={() => setChatTab('contacts')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${chatTab === 'contacts' ? 'text-zinc-600' : 'text-zinc-300'}`}>
                  <Users size={24} strokeWidth={chatTab === 'contacts' ? 2 : 1.5} />
                  <span className="text-[10px] font-bold">通讯录</span>
                </button>
                <button onClick={() => setChatTab('moments')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${chatTab === 'moments' ? 'text-zinc-600' : 'text-zinc-300'}`}>
                  <Camera size={24} strokeWidth={chatTab === 'moments' ? 2 : 1.5} />
                  <span className="text-[10px] font-bold">朋友圈</span>
                </button>
                <button onClick={() => setChatTab('me')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${chatTab === 'me' ? 'text-zinc-600' : 'text-zinc-300'}`}>
                  <User size={24} strokeWidth={chatTab === 'me' ? 2 : 1.5} />
                  <span className="text-[10px] font-bold">我</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* 7. Settings App (API Config) */}
          {screen === 'app-settings' && (
            <SettingsScreen 
              apiConfig={apiConfig} 
              setApiConfig={setApiConfig} 
              onBack={() => setScreen('home')}
              fetchModels={fetchModels}
              isAiLoading={isAiLoading}
              apiError={apiError}
              setApiError={setApiError}
              apiSuccess={apiSuccess}
              setApiSuccess={setApiSuccess}
              time={time}
            />
          )}

          {/* 7.5 Appearance App */}
          {screen === 'app-appearance' && (
            <AppearanceScreen 
              onBack={() => setScreen('home')}
              time={time}
              isLockScreenEnabled={isLockScreenEnabled}
              setIsLockScreenEnabled={setIsLockScreenEnabled}
              isPasswordEnabled={isPasswordEnabled}
              setIsPasswordEnabled={setIsPasswordEnabled}
              wallpaper={wallpaper}
              setWallpaper={setWallpaper}
              fontLink={fontLink}
              setFontLink={setFontLink}
              customIcons={customIcons}
              setCustomIcons={setCustomIcons}
            />
          )}

          {/* 7.6 Persona App */}
          {screen === 'app-persona' && (
            <PersonaScreen 
              onBack={() => {
                setScreen('app-phone-list');
                setEditingPersona(null);
              }}
              time={time}
              initialPersona={editingPersona}
              onSavePersona={(p: Persona) => {
                if (editingPersona) {
                  setPhonePersonas(prev => prev.map(item => item.id === p.id ? p : item));
                } else {
                  setPhonePersonas(prev => [...prev, p]);
                }
                setEditingPersona(null);
              }}
            />
          )}

          {/* 7.7 Phone List App */}
          {screen === 'app-phone-list' && (
            <PhoneListScreen 
              onBack={() => setScreen('home')}
              time={time}
              personas={phonePersonas}
              onEditPersona={(p: Persona) => {
                setEditingPersona(p);
                setScreen('app-persona');
              }}
              onAddPersona={() => {
                setEditingPersona(null);
                setScreen('app-persona');
              }}
              onDeletePersona={(id: string) => {
                setPhonePersonas(prev => prev.filter(p => p.id !== id));
              }}
            />
          )}

          {/* 8. AI Chat Screen */}
          {screen === 'ai-chat' && (
            <motion.div 
              key="ai-chat"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 bg-white flex flex-col z-50"
            >
              <StatusBar time={time} className="bg-white/80 backdrop-blur-md z-10" />
              
              <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-zinc-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => {
                      setScreen('app-chat');
                      setActiveChatContact(null);
                    }} className="text-zinc-400 active:text-zinc-600">
                      <ArrowLeft size={24} strokeWidth={1.5} />
                    </button>
                    <div className="flex items-center gap-3">
                      {activeChatContact?.avatar && (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-100">
                          <img src={activeChatContact.avatar} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-[14px] font-bold text-zinc-700">{activeChatContact ? activeChatContact.chatName : 'AI 助手'}</h2>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest">{apiConfig.selectedModel || '未配置模型'}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => {
                    if (activeChatContact) {
                      setChatHistories(prev => ({ ...prev, [activeChatContact.id]: [] }));
                    } else {
                      setChatMessages([]);
                    }
                  }} className="text-[10px] font-bold text-zinc-300 active:text-zinc-500">清空对话</button>
                </div>
  
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-zinc-50/30">
                  {((activeChatContact ? (chatHistories[activeChatContact.id] || []) : chatMessages)).length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-4">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-zinc-200">
                        {activeChatContact?.avatar ? (
                          <img src={activeChatContact.avatar} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <Sparkles size={32} strokeWidth={1} />
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {apiConfig.selectedModel ? (activeChatContact ? `已连接到 ${activeChatContact.chatName}，开始聊天吧！` : `已连接到 ${apiConfig.selectedModel}，开始聊天吧！`) : '请先在“设置”中配置 API 信息以开始对话。'}
                      </p>
                    </div>
                  )}
                  {(activeChatContact ? (chatHistories[activeChatContact.id] || []) : chatMessages).map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-white/80 backdrop-blur-md text-zinc-700 rounded-tr-none shadow-sm border border-white' 
                        : 'bg-white text-zinc-500 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                      <div className="w-1.5 h-1.5 bg-zinc-200 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-zinc-200 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-200 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-zinc-100 pb-10">
                <div className="flex items-center gap-3">
                  <GlassCard className="flex-1 p-4" opacity="0.9" blur="10px">
                    <input 
                      type="text" 
                      placeholder="输入消息..."
                      className="w-full bg-transparent border-none outline-none text-sm text-zinc-700 placeholder:text-zinc-300"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                    />
                  </GlassCard>
                  <button 
                    onClick={sendAiMessage}
                    disabled={isAiLoading || !chatInput.trim()}
                    className="w-12 h-12 bg-white shadow-sm border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 active:scale-90 transition-all disabled:opacity-20"
                  >
                    <Send size={20} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        :root {
          --custom-font-family: inherit;
        }
        * {
          font-family: var(--custom-font-family) !important;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease;
        }
        .text-shadow-sm {
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
