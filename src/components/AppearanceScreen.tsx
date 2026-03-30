import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Smartphone, Lock, Image as ImageIcon, Globe2, Plus, Sparkles, MessageCircle, Music, FileText, BookOpen, Settings, Palette, Phone, Globe, RotateCcw, CloudSun, Layers, Type, Shield, ShieldCheck, Layout, Grid3x3 } from 'lucide-react';
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
  setCustomIcons,
  iconStyleConfig,
  setIconStyleConfig,
  iconFrostIntensity,
  setIconFrostIntensity,
  frostIntensity,
  setFrostIntensity,
  componentBgOpacity,
  setComponentBgOpacity
}: any) => {
  const [activeView, setActiveView] = useState<'home' | 'privacy' | 'frost' | 'font' | 'icons' | 'more'>('home');
  const [success, setSuccess] = useState('');

  const [tempSettings, setTempSettings] = useState({
    isLockScreenEnabled,
    isPasswordEnabled,
    fontLink,
    customIcons: { ...customIcons },
    iconStyleConfig: { ...iconStyleConfig },
    iconFrostIntensity,
    frostIntensity,
    componentBgOpacity: componentBgOpacity ?? 0.3
  });

  const handleSave = () => {
    setIsLockScreenEnabled(tempSettings.isLockScreenEnabled);
    setIsPasswordEnabled(tempSettings.isPasswordEnabled);
    setFontLink(tempSettings.fontLink);
    setCustomIcons(tempSettings.customIcons);
    setIconStyleConfig(tempSettings.iconStyleConfig);
    setIconFrostIntensity(tempSettings.iconFrostIntensity);
    setFrostIntensity(tempSettings.frostIntensity);
    if (setComponentBgOpacity) {
      setComponentBgOpacity(tempSettings.componentBgOpacity);
    }
    localStorage.setItem('componentBgOpacity', tempSettings.componentBgOpacity.toString());
    
    // Dispatch storage event to trigger immediate update in other components
    window.dispatchEvent(new Event('storage'));
    
    setSuccess('设置已应用');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Real-time update for frost intensity since it affects visual preview
  React.useEffect(() => {
    setFrostIntensity(tempSettings.frostIntensity);
  }, [tempSettings.frostIntensity, setFrostIntensity]);

  React.useEffect(() => {
    setIconFrostIntensity(tempSettings.iconFrostIntensity);
  }, [tempSettings.iconFrostIntensity, setIconFrostIntensity]);

  // Real-time update for component background opacity
  React.useEffect(() => {
    if (setComponentBgOpacity) {
      setComponentBgOpacity(tempSettings.componentBgOpacity);
    }
    localStorage.setItem('componentBgOpacity', tempSettings.componentBgOpacity.toString());
    window.dispatchEvent(new Event('storage'));
  }, [tempSettings.componentBgOpacity, setComponentBgOpacity]);

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

  // Calculate preview blur value from frost intensity
  const previewBlurPx = (tempSettings.frostIntensity / 100) * 40;
  // Use explicitly set opacity
  const previewLightOpacity = tempSettings.componentBgOpacity;
  const previewDarkOpacity = tempSettings.componentBgOpacity;
  const previewNoiseOpacity = (tempSettings.frostIntensity / 100) * 0.15;

  const views = [
    { 
      id: 'privacy', name: '隐私防护', icon: ShieldCheck, 
      desc: '锁屏与密码保护\n安全壁纸管理',
      style: { marginTop: '0', marginBottom: '-16px', zIndex: 10, padding: '24px 20px', alignItems: 'flex-start' }
    },
    { 
      id: 'font', name: '字体与大小', icon: Type, 
      desc: '全局自定义字体',
      style: { marginTop: '24px', marginBottom: '-8px', zIndex: 11, padding: '20px 16px', alignItems: 'flex-start' }
    },
    { 
      id: 'icons', name: '图标定制', icon: Palette, 
      desc: '圆角、大小调整\n阴影与主题色',
      style: { marginTop: '8px', marginBottom: '-24px', zIndex: 12, padding: '24px 20px', alignItems: 'flex-start' }
    },
    { 
      id: 'frost', name: '组件外观', icon: Layout, 
      desc: '组件磨砂与透明度\n深度定制',
      style: { marginTop: '16px', marginBottom: '-12px', zIndex: 13, padding: '24px 16px', alignItems: 'flex-start' }
    },
    { 
      id: 'more', name: '更多', icon: Grid3x3, 
      desc: null,
      style: { marginTop: '24px', marginBottom: '0', zIndex: 14, padding: '20px 20px', alignItems: 'flex-start' }
    },
  ];

  return (
    <motion.div 
      key="app-appearance"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 bg-zinc-50 dark:bg-zinc-900 flex flex-col z-50"
    >
      <StatusBar time={time} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10" />
      
      <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => activeView === 'home' ? onBack() : setActiveView('home')} className="text-zinc-400 active:text-zinc-600 dark:active:text-zinc-200 p-1 -ml-1">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">
            {activeView === 'home' ? '外观' : views.find(v => v.id === activeView)?.name}
          </h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Check size={14} />
          保存
        </button>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 flex flex-col gap-6">
        <AnimatePresence>
          {success && (
            <motion.div 
              key="success-msg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 text-[10px] font-bold py-2 px-4 rounded-xl text-center shadow-sm shrink-0"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="relative grid grid-cols-2 gap-x-3 pb-20 items-start"
              style={{ gridAutoRows: 'minmax(auto, auto)' }}
            >
              {/* Background Decorative Elements */}
              <div className="absolute top-[40px] right-[5%] w-32 h-32 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-[200px] left-[5%] w-40 h-40 bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-[40px] right-[15%] w-24 h-24 bg-pink-400/10 dark:bg-pink-500/10 rounded-full blur-xl pointer-events-none" />
              
              <svg className="absolute top-[60px] left-[45%] w-6 h-6 text-zinc-300/40 dark:text-zinc-600/40 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/></svg>
              <svg className="absolute top-[280px] right-[10%] w-8 h-8 text-zinc-300/30 dark:text-zinc-600/30 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>

              {views.map((view, index) => (
                <motion.div
                  key={view.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                  className="w-full relative"
                  style={{ 
                    marginTop: view.style.marginTop, 
                    marginBottom: view.style.marginBottom,
                    zIndex: view.style.zIndex
                  }}
                >
                  <GlassCard
                    opacity={tempSettings.componentBgOpacity.toString()}
                    blur={`${(tempSettings.frostIntensity / 100) * 40}px`}
                    className="cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[0.98] active:scale-[0.96] rounded-[28px] border border-white/20 dark:border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] w-full h-full backdrop-blur-xl"
                  >
                    <div 
                      onClick={() => setActiveView(view.id as any)}
                      className="w-full h-full flex flex-col box-border"
                      style={{
                        padding: view.style.padding,
                        alignItems: view.style.alignItems,
                        textAlign: view.style.alignItems === 'center' ? 'center' : 'left',
                      }}
                    >
                      <view.icon size={28} strokeWidth={1.2} className="text-zinc-700 dark:text-zinc-300 mb-3" />
                      
                      <span className="text-[15px] font-medium text-zinc-800 dark:text-zinc-100 leading-tight mb-1.5 tracking-wide">
                        {view.name}
                      </span>
                      
                      {view.desc && (
                        <span className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 leading-[1.4] whitespace-pre-wrap opacity-90">
                          {view.desc}
                        </span>
                      )}

                      {/* Decorative elements */}
                      {view.id === 'icons' && (
                        <div className="flex gap-1.5 mt-3 opacity-90">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm" />
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm" />
                          <div className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-sm" />
                        </div>
                      )}
                      {view.id === 'frost' && (
                        <div className="w-full h-1 bg-zinc-200/60 dark:bg-zinc-700/60 rounded-full mt-3 overflow-hidden flex backdrop-blur-md">
                          <div className="w-3/5 h-full bg-zinc-400 dark:bg-zinc-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          )}

        {/* 隐私防护 Tab */}
        {activeView === 'privacy' && (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">隐私防护</span>
            <GlassCard className="p-4" opacity="0.8" blur="10px">
              <div className="flex flex-col gap-4">
                <div className="flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <Smartphone size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-200 whitespace-nowrap">启用锁屏界面</span>
                  </div>
                  <button 
                    onClick={() => setTempSettings(prev => ({ ...prev, isLockScreenEnabled: !prev.isLockScreenEnabled }))}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${tempSettings.isLockScreenEnabled ? 'bg-zinc-600 dark:bg-zinc-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${tempSettings.isLockScreenEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div className="h-px bg-zinc-100 dark:bg-zinc-700 w-full" />
                <div className="flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <Lock size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-200 whitespace-nowrap">启用锁屏密码</span>
                  </div>
                  <button 
                    onClick={() => setTempSettings(prev => ({ ...prev, isPasswordEnabled: !prev.isPasswordEnabled }))}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${tempSettings.isPasswordEnabled ? 'bg-zinc-600 dark:bg-zinc-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${tempSettings.isPasswordEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div className="h-px bg-zinc-100 dark:bg-zinc-700 w-full" />
                <div className="flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <ImageIcon size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-200 whitespace-nowrap">壁纸管理</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (wallpaper) {
                        setWallpaper(null);
                        localStorage.removeItem('aiphone_wallpaper');
                      }
                    }}
                    className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 active:text-zinc-800 dark:active:text-zinc-200 flex-shrink-0"
                  >
                    {wallpaper ? '重置壁纸' : '桌面空白处修改'}
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* 组件外观 Tab (磨砂玻璃) */}
        {activeView === 'frost' && (
          <motion.div
            key="frost"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-row justify-between items-center px-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">组件外观设置</span>
              </div>

              {/* 磨砂强度和背景透明度滑块 */}
              <GlassCard className="p-4" opacity="0.8" blur="10px">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-row justify-between items-center">
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">磨砂强度</span>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{tempSettings.frostIntensity}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="1" 
                      value={tempSettings.frostIntensity} 
                      onChange={(e) => setTempSettings(prev => ({ ...prev, frostIntensity: Number(e.target.value) }))} 
                      className="w-full accent-zinc-800 dark:accent-zinc-300" 
                    />
                    <div className="flex flex-row justify-between items-center">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500">0% 无模糊</span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500">100% 最大模糊</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-row justify-between items-center">
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">背景透明度</span>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{Math.round(tempSettings.componentBgOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={tempSettings.componentBgOpacity} 
                      onChange={(e) => setTempSettings(prev => ({ ...prev, componentBgOpacity: Number(e.target.value) }))} 
                      className="w-full accent-zinc-800 dark:accent-zinc-300" 
                    />
                    <div className="flex flex-row justify-between items-center">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500">0% 完全透明</span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500">100% 不透明</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setTempSettings(prev => ({ ...prev, frostIntensity: 60, componentBgOpacity: 0.3 }))}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 active:scale-95 transition-all mt-1"
                  >
                    <RotateCcw size={14} />
                    恢复默认
                  </button>
                  
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">
                    控制所有卡片、Dock 的背景透明度和毛玻璃模糊程度。
                  </p>
                </div>
              </GlassCard>

              {/* 实时预览 */}
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1 mt-2">浅色模式预览</span>
              
              {/* 预览容器 - 浅色背景（使用明显渐变以展示毛玻璃效果） */}
              <div className="relative rounded-[24px] overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-center p-8" style={{ minHeight: '160px' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6] to-[#9333ea]" />
                
                <div 
                  className="rounded-[20px] border border-white/40 p-6 relative overflow-hidden w-full max-w-[200px]"
                  style={{
                    backdropFilter: `blur(${previewBlurPx}px)`,
                    WebkitBackdropFilter: `blur(${previewBlurPx}px)`,
                    backgroundColor: tempSettings.componentBgOpacity === 0 ? 'transparent' : `rgba(255, 255, 255, ${previewLightOpacity})`,
                  }}
                >
                  {/* Noise overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none mix-blend-overlay"
                    style={{
                      opacity: previewNoiseOpacity,
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                    <span className="text-xl font-bold text-zinc-800 tracking-widest uppercase">预览</span>
                    <span className="text-[10px] font-medium text-zinc-600">浅色组件外观</span>
                  </div>
                </div>
              </div>

              {/* 深色模式预览 */}
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1 mt-2">深色模式预览</span>
              <div className="relative rounded-[24px] overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50 flex flex-col items-center justify-center p-8" style={{ minHeight: '160px' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] to-[#5b21b6]" />
                
                <div 
                  className="rounded-[20px] border border-white/10 p-6 relative overflow-hidden w-full max-w-[200px]"
                  style={{
                    backdropFilter: `blur(${previewBlurPx}px)`,
                    WebkitBackdropFilter: `blur(${previewBlurPx}px)`,
                    backgroundColor: tempSettings.componentBgOpacity === 0 ? 'transparent' : `rgba(0, 0, 0, ${previewDarkOpacity})`,
                  }}
                >
                  <div 
                    className="absolute inset-0 pointer-events-none mix-blend-screen"
                    style={{ 
                      opacity: previewNoiseOpacity * 1.5, 
                      filter: 'invert(1) brightness(0.8)',
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" 
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                    <span className="text-xl font-bold text-white tracking-widest uppercase">预览</span>
                    <span className="text-[10px] font-medium text-zinc-300">深色组件外观</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 字体与大小 Tab */}
        {activeView === 'font' && (
          <motion.div
            key="font"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">字体加载链接</span>
              <GlassCard className="p-4" opacity="0.8" blur="10px">
                <div className="flex items-center gap-3">
                  <Globe2 size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="https://fonts.googleapis.com/css2?family=..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                    value={tempSettings.fontLink}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, fontLink: e.target.value }))}
                  />
                </div>
              </GlassCard>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 px-1">输入 Google Fonts 或其他 CSS 字体链接。</p>
            </div>
          </motion.div>
        )}

        {/* 图标定制 Tab */}
        {activeView === 'icons' && (
          <motion.div
            key="icons"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-row justify-between items-center px-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">图标样式定制</span>
                <button 
                  onClick={() => setTempSettings(prev => ({
                    ...prev,
                    iconFrostIntensity: 60,
                  iconStyleConfig: {
                      isEnabled: true,
                      borderRadius: 20,
                      iconSize: 60,
                      bgOpacity: 0.3,
                      bgLightColor: '#ffffff',
                      bgDarkColor: '#18181b',
                      shadowIntensity: 0.05,
                      shadowColorMode: 'auto',
                      shadowLightColor: '#000000',
                      shadowDarkColor: '#555555',
                      iconLightColor: '#27272a',
                      iconDarkColor: '#f4f4f5'
                    }
                  }))}
                  className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 active:text-zinc-700 dark:active:text-zinc-200 transition-colors"
                >
                  <RotateCcw size={12} />
                  恢复默认
                </button>
              </div>

              <div className="flex flex-col items-center justify-center p-8 rounded-[24px] relative overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] to-[#5b21b6] pointer-events-none" />
                {(() => {
                  const config = tempSettings.iconStyleConfig;
                  const shadowMode = config.isEnabled ? (config.shadowColorMode || 'auto') : 'auto';
                  const shadowColorHex = shadowMode === 'auto' ? '#000000' : (config.shadowLightColor || '#000000');
                  const sR = parseInt(shadowColorHex.slice(1, 3), 16) || 0;
                  const sG = parseInt(shadowColorHex.slice(3, 5), 16) || 0;
                  const sB = parseInt(shadowColorHex.slice(5, 7), 16) || 0;
                  return (
                    <div 
                      className="flex items-center justify-center overflow-hidden relative border border-white/40 dark:border-white/20 z-10"
                      style={{
                        backdropFilter: `blur(${(tempSettings.iconFrostIntensity / 100) * 40}px)`,
                        WebkitBackdropFilter: `blur(${(tempSettings.iconFrostIntensity / 100) * 40}px)`,
                        width: `${config.isEnabled ? config.iconSize : 60}px`,
                        height: `${config.isEnabled ? config.iconSize : 60}px`,
                        borderRadius: `${config.isEnabled ? config.borderRadius : 20}px`,
                        backgroundColor: config.isEnabled 
                          ? (() => {
                              const hex = config.bgLightColor || '#ffffff';
                              const r = parseInt(hex.slice(1, 3), 16) || 255;
                              const g = parseInt(hex.slice(3, 5), 16) || 255;
                              const b = parseInt(hex.slice(5, 7), 16) || 255;
                              return `rgba(${r}, ${g}, ${b}, ${config.bgOpacity})`;
                            })()
                          : `rgba(255, 255, 255, 0.3)`,
                        boxShadow: `0 4px 16px rgba(${sR},${sG},${sB},${config.isEnabled ? config.shadowIntensity : 0.05})`
                      }}
                    >
                      <Sparkles size={Math.max(20, (config.isEnabled ? config.iconSize : 60) * 0.45)} strokeWidth={1.2} color={config.isEnabled ? config.iconLightColor : '#27272a'} />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                    </div>
                  );
                })()}
                <span className="text-[10px] text-zinc-800 dark:text-zinc-200 font-bold tracking-tight drop-shadow-sm mt-2 relative z-10">预览</span>
              </div>

              <GlassCard className="p-4" opacity="0.8" blur="10px">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-row justify-between items-center">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">启用自定义样式</span>
                    <button 
                      onClick={() => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, isEnabled: !prev.iconStyleConfig.isEnabled } }))}
                      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${tempSettings.iconStyleConfig.isEnabled ? 'bg-zinc-800 dark:bg-zinc-300' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white dark:bg-zinc-900 rounded-full transition-all ${tempSettings.iconStyleConfig.isEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {tempSettings.iconStyleConfig.isEnabled && (
                    <div className="flex flex-col gap-4 mt-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-row justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">圆角大小</span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{tempSettings.iconStyleConfig.borderRadius}px</span>
                        </div>
                        <input 
                          type="range" min="0" max="32" step="1" 
                          value={tempSettings.iconStyleConfig.borderRadius} 
                          onChange={(e) => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, borderRadius: Number(e.target.value) } }))} 
                          className="w-full accent-zinc-800 dark:accent-zinc-300" 
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-row justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">图标大小</span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{tempSettings.iconStyleConfig.iconSize}px</span>
                        </div>
                        <input 
                          type="range" min="40" max="80" step="1" 
                          value={tempSettings.iconStyleConfig.iconSize} 
                          onChange={(e) => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, iconSize: Number(e.target.value) } }))} 
                          className="w-full accent-zinc-800 dark:accent-zinc-300" 
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-row justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">背景透明度</span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{tempSettings.iconStyleConfig.bgOpacity}</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.05" 
                          value={tempSettings.iconStyleConfig.bgOpacity} 
                          onChange={(e) => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, bgOpacity: Number(e.target.value) } }))} 
                          className="w-full accent-zinc-800 dark:accent-zinc-300" 
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-row justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">磨砂强度</span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{tempSettings.iconFrostIntensity}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="1" 
                          value={tempSettings.iconFrostIntensity} 
                          onChange={(e) => setTempSettings(prev => ({ ...prev, iconFrostIntensity: Number(e.target.value) }))} 
                          className="w-full accent-zinc-800 dark:accent-zinc-300" 
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-row justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">阴影强度</span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{tempSettings.iconStyleConfig.shadowIntensity}</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.05" 
                          value={tempSettings.iconStyleConfig.shadowIntensity} 
                          onChange={(e) => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, shadowIntensity: Number(e.target.value) } }))} 
                          className="w-full accent-zinc-800 dark:accent-zinc-300" 
                        />
                      </div>

                      {/* Shadow Color Control */}
                      <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
                        <div className="flex flex-row justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">阴影颜色模式</span>
                          <div className="flex gap-1.5">
                            {[
                              { value: 'auto', label: '自动' },
                              { value: 'custom', label: '自定义' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, shadowColorMode: opt.value } }))}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${
                                  (tempSettings.iconStyleConfig.shadowColorMode || 'auto') === opt.value 
                                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900' 
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {(tempSettings.iconStyleConfig.shadowColorMode || 'auto') === 'auto' && (
                          <p className="text-[9px] text-zinc-400 dark:text-zinc-500">
                            浅色模式: 黑色阴影 · 深色模式: 深灰色阴影
                          </p>
                        )}
                        
                        {(tempSettings.iconStyleConfig.shadowColorMode || 'auto') === 'custom' && (
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-row justify-between items-center">
                              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">浅色模式阴影</span>
                              <div className="flex items-center gap-2">
                                {['#000000', '#4a4a4a', '#808080'].map(color => (
                                  <button
                                    key={color}
                                    onClick={() => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, shadowLightColor: color } }))}
                                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                                      (tempSettings.iconStyleConfig.shadowLightColor || '#000000') === color 
                                        ? 'border-zinc-800 dark:border-zinc-200 scale-110' 
                                        : 'border-zinc-200 dark:border-zinc-600'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                                <input 
                                  type="color" 
                                  value={tempSettings.iconStyleConfig.shadowLightColor || '#000000'} 
                                  onChange={(e) => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, shadowLightColor: e.target.value } }))} 
                                  className="w-5 h-5 rounded-md border-0 p-0 cursor-pointer" 
                                />
                              </div>
                            </div>
                            <div className="flex flex-row justify-between items-center">
                              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">深色模式阴影</span>
                              <div className="flex items-center gap-2">
                                {['#555555', '#888888', '#ffffff'].map(color => (
                                  <button
                                    key={color}
                                    onClick={() => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, shadowDarkColor: color } }))}
                                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                                      (tempSettings.iconStyleConfig.shadowDarkColor || '#555555') === color 
                                        ? 'border-zinc-800 dark:border-zinc-200 scale-110' 
                                        : 'border-zinc-200 dark:border-zinc-600'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                                <input 
                                  type="color" 
                                  value={tempSettings.iconStyleConfig.shadowDarkColor || '#555555'} 
                                  onChange={(e) => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, shadowDarkColor: e.target.value } }))} 
                                  className="w-5 h-5 rounded-md border-0 p-0 cursor-pointer" 
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row justify-between items-center">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">背景颜色</span>
                        <input 
                          type="color" 
                          value={tempSettings.iconStyleConfig.bgLightColor} 
                          onChange={(e) => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, bgLightColor: e.target.value } }))} 
                          className="w-6 h-6 rounded-md border-0 p-0 cursor-pointer" 
                        />
                      </div>

                      <div className="flex flex-row justify-between items-center">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">图标颜色</span>
                        <input 
                          type="color" 
                          value={tempSettings.iconStyleConfig.iconLightColor} 
                          onChange={(e) => setTempSettings(prev => ({ ...prev, iconStyleConfig: { ...prev.iconStyleConfig, iconLightColor: e.target.value } }))} 
                          className="w-6 h-6 rounded-md border-0 p-0 cursor-pointer" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">自定义图片</span>
              <div className="grid grid-cols-2 gap-4">
                {appList.map((app) => (
                  <GlassCard key={app.id} className="p-4 relative" opacity="0.8" blur="10px">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                        {tempSettings.customIcons[app.id] ? (
                          <img src={tempSettings.customIcons[app.id]} alt={app.name} className="w-full h-full object-cover" />
                        ) : (
                          <app.icon size={24} className="text-zinc-500 dark:text-zinc-400" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{app.name}</span>
                    </div>
                    <label className="absolute inset-0 cursor-pointer z-20">
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
                        className="absolute top-1 right-1 w-5 h-5 bg-red-50 dark:bg-red-900/50 text-red-400 rounded-full flex items-center justify-center z-30"
                      >
                        <Plus size={12} className="rotate-45" />
                      </button>
                    )}
                  </GlassCard>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 更多 Tab */}
        {activeView === 'more' && (
          <motion.div
            key="more"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center py-20 text-zinc-300 dark:text-zinc-600"
          >
            <Sparkles size={48} strokeWidth={1} />
            <p className="mt-4 text-xs font-bold tracking-widest uppercase">更多功能敬请期待</p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
