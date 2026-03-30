import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Smartphone, Lock, Image as ImageIcon, Globe2, Plus, Sparkles, MessageCircle, Music, FileText, BookOpen, Settings, Palette, Phone, Globe } from 'lucide-react';
import { StatusBar, GlassCard } from './Shared';

export const AppearanceScreen = ({ 
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
              className="bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 text-[10px] font-bold py-2 px-4 rounded-xl text-center shadow-sm"
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
