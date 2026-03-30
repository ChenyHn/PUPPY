import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Smartphone, Lock, Image as ImageIcon, Globe2, Plus, Sparkles, MessageCircle, Music, FileText, BookOpen, Settings, Palette, Phone, Globe, RotateCcw, CloudSun, Layers } from 'lucide-react';
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
  setFrostIntensity
}: any) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'frost' | 'font' | 'icons' | 'more'>('privacy');
  const [success, setSuccess] = useState('');

  const [tempSettings, setTempSettings] = useState({
    isLockScreenEnabled,
    isPasswordEnabled,
    fontLink,
    customIcons: { ...customIcons },
    iconStyleConfig: { ...iconStyleConfig },
    iconFrostIntensity,
    frostIntensity
  });

  const handleSave = () => {
    setIsLockScreenEnabled(tempSettings.isLockScreenEnabled);
    setIsPasswordEnabled(tempSettings.isPasswordEnabled);
    setFontLink(tempSettings.fontLink);
    setCustomIcons(tempSettings.customIcons);
    setIconStyleConfig(tempSettings.iconStyleConfig);
    setIconFrostIntensity(tempSettings.iconFrostIntensity);
    setFrostIntensity(tempSettings.frostIntensity);
    
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
  const previewLightOpacity = Math.max(0.05, 0.3 - (tempSettings.frostIntensity / 100) * 0.15);
  const previewDarkOpacity = Math.max(0.1, 0.5 - (tempSettings.frostIntensity / 100) * 0.25);
  const previewNoiseOpacity = (tempSettings.frostIntensity / 100) * 0.15;

  const tabs = [
    { id: 'privacy', name: '隐私防护' },
    { id: 'frost', name: '组件外观' },
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
      className="absolute inset-0 bg-zinc-50 dark:bg-zinc-900 flex flex-col z-50"
    >
      <StatusBar time={time} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10" />
      
      <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 active:text-zinc-600 dark:active:text-zinc-200">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">外观</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Check size={14} />
          保存
        </button>
      </div>

      <div className="flex bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto no-scrollbar">
        <div className="flex min-w-full px-2">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap px-5 py-3 text-xs font-bold transition-all border-b-2 ${activeTab === tab.id ? 'text-zinc-800 dark:text-zinc-100 border-zinc-800 dark:border-zinc-100' : 'text-zinc-400 dark:text-zinc-500 border-transparent'}`}
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

        {/* 隐私防护 Tab */}
        {activeTab === 'privacy' && (
          <div className="flex flex-col gap-4">
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
          </div>
        )}

        {/* 组件外观 Tab (磨砂玻璃) */}
        {activeTab === 'frost' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-row justify-between items-center px-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">磨砂玻璃效果</span>
                <button 
                  onClick={() => setTempSettings(prev => ({ ...prev, frostIntensity: 60 }))}
                  className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 active:text-zinc-700 dark:active:text-zinc-200 transition-colors"
                >
                  <RotateCcw size={12} />
                  恢复默认
                </button>
              </div>

              {/* 磨砂强度滑块 */}
              <GlassCard className="p-4" opacity="0.8" blur="10px">
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
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">
                    控制所有卡片背景的毛玻璃模糊程度和噪点质感。
                    <br />
                    当前: blur({previewBlurPx.toFixed(1)}px)
                  </p>
                </div>
              </GlassCard>

              {/* 实时预览 */}
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1 mt-2">实时预览</span>
              
              {/* 预览容器 - 模拟壁纸背景 */}
              <div className="relative rounded-[24px] overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50" style={{ minHeight: '200px' }}>
                {/* 模拟壁纸背景 */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-300/80 via-purple-300/60 to-pink-300/80 dark:from-blue-900/80 dark:via-purple-900/60 dark:to-pink-900/80" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 dark:to-black/30" />
                
                <div className="relative z-10 p-4 flex flex-col gap-3">
                  {/* 预览时间卡片 */}
                  <div 
                    className="rounded-[20px] border border-white/20 dark:border-white/10 p-4 relative overflow-hidden"
                    style={{
                      backdropFilter: `blur(${previewBlurPx}px)`,
                      WebkitBackdropFilter: `blur(${previewBlurPx}px)`,
                      backgroundColor: `rgba(255, 255, 255, ${previewLightOpacity})`,
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
                    <div className="relative z-10 flex flex-row items-center gap-4">
                      <div className="flex-1">
                        <span className="text-3xl font-thin text-zinc-800 dark:text-white tracking-tighter leading-none">{time}</span>
                        <div className="flex items-center gap-2 mt-2">
                          <CloudSun className="text-zinc-500 dark:text-zinc-300" size={14} strokeWidth={1} />
                          <span className="text-sm font-light text-zinc-700 dark:text-zinc-100">22°</span>
                          <span className="text-[8px] font-bold text-zinc-500 dark:text-zinc-300 tracking-wider uppercase">Cloudy</span>
                        </div>
                      </div>
                      <div 
                        className="w-12 h-12 rounded-xl bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/20 flex items-center justify-center"
                      >
                        <Layers size={20} className="text-zinc-400 dark:text-zinc-300" strokeWidth={1} />
                      </div>
                    </div>
                  </div>

                  {/* 预览应用图标行 */}
                  <div className="flex flex-row justify-around">
                    {[MessageCircle, Music, Settings, Sparkles].map((Icon, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div 
                          className="w-10 h-10 rounded-xl border border-white/20 dark:border-white/10 flex items-center justify-center relative overflow-hidden"
                          style={{
                            backdropFilter: `blur(${previewBlurPx}px)`,
                            WebkitBackdropFilter: `blur(${previewBlurPx}px)`,
                            backgroundColor: `rgba(255, 255, 255, ${previewLightOpacity})`,
                          }}
                        >
                          <div 
                            className="absolute inset-0 pointer-events-none mix-blend-overlay"
                            style={{ opacity: previewNoiseOpacity, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}
                          />
                          <Icon size={18} className="text-zinc-700 dark:text-zinc-200 relative z-10" strokeWidth={1.2} />
                        </div>
                        <span className="text-[8px] text-zinc-700 dark:text-zinc-200 font-bold">示例</span>
                      </div>
                    ))}
                  </div>

                  {/* 预览 Dock 栏 */}
                  <div 
                    className="rounded-[20px] border border-white/20 dark:border-white/10 p-2 relative overflow-hidden"
                    style={{
                      backdropFilter: `blur(${previewBlurPx}px)`,
                      WebkitBackdropFilter: `blur(${previewBlurPx}px)`,
                      backgroundColor: `rgba(255, 255, 255, ${previewLightOpacity})`,
                    }}
                  >
                    <div 
                      className="absolute inset-0 pointer-events-none mix-blend-overlay"
                      style={{ opacity: previewNoiseOpacity, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}
                    />
                    <div className="relative z-10 flex flex-row justify-around items-center">
                      {[Phone, MessageCircle, Globe, Sparkles].map((Icon, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center">
                          <Icon size={16} className="text-zinc-700 dark:text-zinc-200" strokeWidth={1.2} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 深色模式预览 */}
              <div className="relative rounded-[24px] overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50" style={{ minHeight: '80px' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
                <div className="relative z-10 p-4">
                  <span className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">深色模式预览</span>
                  <div 
                    className="rounded-[16px] border border-white/10 p-3 relative overflow-hidden"
                    style={{
                      backdropFilter: `blur(${previewBlurPx}px)`,
                      WebkitBackdropFilter: `blur(${previewBlurPx}px)`,
                      backgroundColor: `rgba(0, 0, 0, ${previewDarkOpacity})`,
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
                    <div className="relative z-10 flex flex-row items-center gap-3">
                      <span className="text-lg font-thin text-white tracking-tighter">{time}</span>
                      <span className="text-[8px] font-bold text-zinc-400 tracking-wider uppercase">深色卡片示例</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 字体与大小 Tab */}
        {activeTab === 'font' && (
          <div className="flex flex-col gap-6">
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
          </div>
        )}

        {/* 图标定制 Tab */}
        {activeTab === 'icons' && (
          <div className="flex flex-col gap-6">
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

              <div className="flex flex-col items-center justify-center p-8 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-[24px] relative overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-900/20 dark:to-purple-900/20 pointer-events-none" />
                <div 
                  className="flex items-center justify-center overflow-hidden relative border border-white/40 dark:border-white/20 z-10"
                  style={{
                    backdropFilter: `blur(${(tempSettings.iconFrostIntensity / 100) * 40}px)`,
                    WebkitBackdropFilter: `blur(${(tempSettings.iconFrostIntensity / 100) * 40}px)`,
                    width: `${tempSettings.iconStyleConfig.isEnabled ? tempSettings.iconStyleConfig.iconSize : 60}px`,
                    height: `${tempSettings.iconStyleConfig.isEnabled ? tempSettings.iconStyleConfig.iconSize : 60}px`,
                    borderRadius: `${tempSettings.iconStyleConfig.isEnabled ? tempSettings.iconStyleConfig.borderRadius : 20}px`,
                    backgroundColor: tempSettings.iconStyleConfig.isEnabled 
                      ? (() => {
                          const hex = tempSettings.iconStyleConfig.bgLightColor || '#ffffff';
                          const r = parseInt(hex.slice(1, 3), 16) || 255;
                          const g = parseInt(hex.slice(3, 5), 16) || 255;
                          const b = parseInt(hex.slice(5, 7), 16) || 255;
                          return `rgba(${r}, ${g}, ${b}, ${tempSettings.iconStyleConfig.bgOpacity})`;
                        })()
                      : `rgba(255, 255, 255, 0.3)`,
                    boxShadow: `0 4px 16px rgba(0,0,0,${tempSettings.iconStyleConfig.isEnabled ? tempSettings.iconStyleConfig.shadowIntensity : 0.05})`
                  }}
                >
                  <Sparkles size={Math.max(20, (tempSettings.iconStyleConfig.isEnabled ? tempSettings.iconStyleConfig.iconSize : 60) * 0.45)} strokeWidth={1.2} color={tempSettings.iconStyleConfig.isEnabled ? tempSettings.iconStyleConfig.iconLightColor : '#27272a'} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                </div>
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
          </div>
        )}

        {/* 更多 Tab */}
        {activeTab === 'more' && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-300 dark:text-zinc-600">
            <Sparkles size={48} strokeWidth={1} />
            <p className="mt-4 text-xs font-bold tracking-widest uppercase">更多功能敬请期待</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
