import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Smartphone, Lock, Unlock, Delete, Image as ImageIcon, Globe2, Plus, Sparkles, MessageCircle, Music, FileText, BookOpen, Settings, Palette, Phone, Globe, RotateCcw, CloudSun, Layers, Type, Shield, ShieldCheck, Layout, Grid3x3, MoreHorizontal, Info, ChevronRight, Sun, Moon } from 'lucide-react';
import { GlassCard } from './Shared';

interface CardItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  column: 'left' | 'right';
  theme: 'light' | 'dark';
  onClick: () => void;
}

const AdaptiveCardWall = ({ items }: { items: CardItem[] }) => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const { leftItems, rightItems } = useMemo(() => {
    return {
      leftItems: items.filter(i => i.column === 'left'),
      rightItems: items.filter(i => i.column === 'right')
    };
  }, [items]);

  const animDelays = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.id] = Math.random() * 1.5;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  const layout = useMemo(() => {
    const headerHeight = 80; // 假设顶部状态栏+导航栏等高度
    const bottomSafeArea = 16; // 较小的底部安全区，让卡片组更扁
    const topBarHeight = 76; // 顶部隐私防护横条高度
    const gap = 10; // 更紧凑的间距，改为10
    const topOffset = 24; // 顶部留白，整体下移

    let rawHeight = viewportHeight - headerHeight - topOffset - topBarHeight - gap - bottomSafeArea;
    
    // 限制最大高度：不超过屏幕高度的 0.52，避免太长（进一步压缩）
    rawHeight = Math.min(rawHeight, viewportHeight * 0.52);
    // 限制最小高度：保证卡片可读
    rawHeight = Math.max(rawHeight, 340);

    const wallHeight = rawHeight;
    const leftAvailable = wallHeight - gap;
    const rightAvailable = wallHeight - 2 * gap;

    // 左列比例（上:下 = 0.62 : 0.38）
    const leftTopH = leftAvailable * 0.62;
    const leftBottomH = leftAvailable * 0.38;

    // 右列比例（上:中:下 = 0.42 : 0.28 : 0.10）—— 下（关于）刻意压扁
    let rightBottomH = rightAvailable * 0.10;

    // 对关于卡片额外 clamp，防止过高或过扁溢出文字
    const minAbout = 45;
    const maxAbout = 65;
    rightBottomH = Math.min(Math.max(rightBottomH, minAbout), maxAbout);

    // 根据关于卡片的高度，重新严格按比例分配上方两张卡的高度，确保左右列完美对齐
    const rightRemain = rightAvailable - rightBottomH;
    const sumRightTopMid = 0.42 + 0.28;
    const rightTopH = rightRemain * (0.42 / sumRightTopMid);
    const rightMidH = rightRemain * (0.28 / sumRightTopMid);

    const leftHeights = [leftTopH, leftBottomH];
    const rightHeights = [rightTopH, rightMidH, rightBottomH];

    const left = leftItems.map((item, i) => ({
      ...item,
      height: leftHeights[i] || 100,
      top: i === 0 ? 0 : leftHeights[0] + gap
    }));

    const right = rightItems.map((item, i) => {
      let top = 0;
      if (i === 1) top = rightHeights[0] + gap;
      if (i === 2) top = rightHeights[0] + rightHeights[1] + 2 * gap;
      return {
        ...item,
        height: rightHeights[i] || 100,
        top
      };
    });

    return { left, right, containerHeight: wallHeight };

  }, [viewportHeight, leftItems, rightItems]);

  const renderCard = (item: any) => {
    const isDark = item.theme === 'dark';
    const isAbout = item.id === 'about';
    const delay = animDelays[item.id];
    
    return (
      <motion.div
        key={item.id}
        layout
        onClick={item.onClick}
        whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.97, transition: { duration: 0.15 } }}
        style={{
          position: 'absolute',
          top: item.top,
          height: item.height,
          left: 0,
          right: 0,
          animationDelay: `${delay}s`
        }}
      className={`animate-float relative cursor-pointer overflow-hidden box-border ${
        isDark 
          ? 'bg-black rounded-[24px]' 
          : 'bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-zinc-800 shadow-sm rounded-[24px]'
      } ${
        isAbout 
          ? 'flex flex-row justify-between items-center px-4 py-2' 
          : 'flex flex-col justify-end items-start p-4'
      }`}
    >
      {isAbout ? (
        <>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="shrink-0 flex items-center justify-center text-white">
              {React.cloneElement(item.icon, { size: 18, strokeWidth: 1.5 })}
            </div>
            <span className="font-[500] tracking-[-0.015em] leading-[1.2] truncate text-sm text-white">
              {item.title}
            </span>
          </div>
          <ChevronRight size={16} className="text-white shrink-0 ml-2" />
        </>
      ) : (
        <>
          <div className={`absolute top-4 left-4 shrink-0 flex items-center justify-center ${isDark ? 'text-white' : 'text-gray-800 dark:text-zinc-100'}`}>
            {React.cloneElement(item.icon, { size: 22, strokeWidth: 1.5 })}
          </div>
          
          <div className="flex flex-col items-start text-left gap-1 min-w-0 flex-1 w-full justify-end">
            <span className={`font-[500] tracking-[-0.015em] leading-[1.2] truncate w-full text-[15px] ${isDark ? 'text-white' : 'text-gray-800 dark:text-zinc-100'}`}>
              {item.title}
            </span>
          </div>
          
          <ChevronRight size={20} className={`absolute bottom-4 right-4 ${isDark ? 'text-white' : 'text-gray-400 dark:text-white'}`} />
        </>
      )}
      </motion.div>
    );
  };

  return (
    <div className="flex w-full relative items-center justify-center">
      <div className="flex gap-[10px] w-full relative" style={{ height: layout.containerHeight }}>
        <div className="flex-1 relative h-full">
          {layout.left.map(renderCard)}
        </div>
        <div className="flex-1 relative h-full">
          {layout.right.map(renderCard)}
        </div>
      </div>
    </div>
  );
};

export const AppearanceScreen = ({ 
  onBack, 
  time,
  isLockScreenEnabled,
  setIsLockScreenEnabled,
  isPasswordEnabled,
  setIsPasswordEnabled,
  password,
  setPassword,
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
  setComponentBgOpacity,
  themeMode,
  setThemeMode,
  baseFontSize,
  setBaseFontSize,
  baseFontColor,
  setBaseFontColor
}: any) => {
  const [activeView, setActiveView] = useState<'home' | 'privacy' | 'frost' | 'font' | 'icons' | 'more' | 'about'>('home');
  const [success, setSuccess] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'verify' | 'new1' | 'new2'>('verify');
  const [passwordInput, setPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showStatusBar, setShowStatusBar] = useState<boolean>(() => {
    const saved = localStorage.getItem('aiphone_show_status_bar');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [tempSettings, setTempSettings] = useState({
    showStatusBar,
    isLockScreenEnabled,
    isPasswordEnabled,
    fontLink,
    customIcons: { ...customIcons },
    iconStyleConfig: { ...iconStyleConfig },
    iconFrostIntensity,
    frostIntensity,
    componentBgOpacity: componentBgOpacity ?? 0.2,
    baseFontSize: baseFontSize ?? 16,
    baseFontColor: baseFontColor ?? ''
  });

  const handleSave = () => {
    setShowStatusBar(tempSettings.showStatusBar);
    localStorage.setItem('aiphone_show_status_bar', JSON.stringify(tempSettings.showStatusBar));
    setIsLockScreenEnabled(tempSettings.isLockScreenEnabled);
    setIsPasswordEnabled(tempSettings.isPasswordEnabled);
    setFontLink(tempSettings.fontLink);
    setBaseFontSize(tempSettings.baseFontSize);
    setBaseFontColor(tempSettings.baseFontColor);
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

  const resPx = (px: number) => `min(${px}px, ${px / 3.75}vw)`;

  const getViewName = (id: string) => {
    const names: Record<string, string> = {
      privacy: '隐私防护',
      frost: '组件外观',
      icons: '图标定制',
      font: '字体与大小',
      more: '更多设置',
      about: '关于小手机'
    };
    return names[id] || '外观';
  };

  const wallItems = useMemo<CardItem[]>(() => [
    {
      id: 'frost',
      title: '组件外观',
      icon: <Palette size={32} strokeWidth={1.2} />,
      column: 'left',
      theme: 'light',
      onClick: () => setActiveView('frost')
    },
    {
      id: 'icons',
      title: '图标定制',
      icon: <ImageIcon size={32} strokeWidth={1.2} />,
      column: 'left',
      theme: 'light',
      onClick: () => setActiveView('icons')
    },
    {
      id: 'font',
      title: '字体设置',
      icon: <Type size={24} strokeWidth={1.2} />,
      column: 'right',
      theme: 'light',
      onClick: () => setActiveView('font')
    },
    {
      id: 'more',
      title: '更多设置',
      icon: <Settings size={24} strokeWidth={1.2} />,
      column: 'right',
      theme: 'light',
      onClick: () => setActiveView('more')
    },
    {
      id: 'about',
      title: '关于小手机',
      icon: <Info size={24} strokeWidth={1.2} />,
      column: 'right',
      theme: 'dark',
      onClick: () => setActiveView('about')
    }
  ], []);

  return (
    <motion.div 
      key="app-appearance"
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      exit={{ x: 0 }}
      transition={{ duration: 0 }}
      className="absolute inset-0 bg-zinc-50 dark:bg-black flex flex-col z-50"
    >
      
      <div className="px-6 pt-4 pb-4 flex items-center justify-between bg-white dark:bg-[#1c1c1e] border-b border-zinc-100 dark:border-zinc-800 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => activeView === 'home' ? onBack() : setActiveView('home')} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 -ml-1 transition-colors">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-100">
            {activeView === 'home' ? '外观' : getViewName(activeView)}
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

        <AnimatePresence mode="wait">
          {activeView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full relative pb-10 flex flex-col flex-1 min-h-full"
            >
              <div className="flex flex-col w-full gap-[10px] flex-1 justify-center pt-6">
                
                {/* 顶部满宽卡片1：隐私防护 (附带主题切换) */}
                <motion.div
                  className="animate-float flex flex-row items-center justify-between px-5 py-4 bg-[#1c1c1e] dark:bg-black rounded-[26px] w-full shrink-0 min-h-[76px] border border-transparent dark:border-zinc-800 cursor-pointer"
                  onClick={() => setActiveView('privacy')}
                >
                  <div 
                    className="flex items-center gap-[12px]"
                  >
                    <ShieldCheck size={22} strokeWidth={1.5} className="text-white" />
                    <div className="flex flex-col">
                      <span className="font-[500] tracking-[-0.015em] leading-[1.2] text-[15px] text-white">隐私防护</span>
                      <span className="text-[10px] text-white/50 tracking-[0.02em] mt-0.5">仅本地存储</span>
                    </div>
                  </div>
                  
                  {/* Theme Switcher */}
                  <div className="flex items-center bg-white/10 rounded-full p-1 border border-white/5" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setThemeMode('light')}
                      className={`p-1.5 rounded-full transition-all ${themeMode === 'light' ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10 dark:text-zinc-400 dark:hover:text-white'}`}
                      title="浅色模式"
                    >
                      <Sun size={14} strokeWidth={2} />
                    </button>
                    <button 
                      onClick={() => setThemeMode('system')}
                      className={`p-1.5 rounded-full transition-all ${themeMode === 'system' ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10 dark:text-zinc-400 dark:hover:text-white'}`}
                      title="跟随系统"
                    >
                      <Smartphone size={14} strokeWidth={2} />
                    </button>
                    <button 
                      onClick={() => setThemeMode('dark')}
                      className={`p-1.5 rounded-full transition-all ${themeMode === 'dark' ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10 dark:text-zinc-400 dark:hover:text-white'}`}
                      title="深色模式"
                    >
                      <Moon size={14} strokeWidth={2} />
                    </button>
                  </div>
                </motion.div>

                {/* 下方双列比例自适应卡片墙 */}
                <AdaptiveCardWall items={wallItems} />
              </div>
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
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">系统显示</span>
            <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
              <div className="flex flex-col gap-4">
                <div className="flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <Smartphone size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-100 whitespace-nowrap">显示状态栏</span>
                  </div>
                  <button 
                    onClick={() => setTempSettings(prev => ({ ...prev, showStatusBar: !prev.showStatusBar }))}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${tempSettings.showStatusBar ? 'bg-zinc-800 dark:bg-zinc-300' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white dark:bg-[#1c1c1e] rounded-full transition-all ${tempSettings.showStatusBar ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </GlassCard>

            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1 mt-2">隐私防护</span>
            <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
              <div className="flex flex-col gap-4">
                <div className="flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <Smartphone size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-100 whitespace-nowrap">启用锁屏界面</span>
                  </div>
                  <button 
                    onClick={() => setTempSettings(prev => ({ ...prev, isLockScreenEnabled: !prev.isLockScreenEnabled }))}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${tempSettings.isLockScreenEnabled ? 'bg-zinc-800 dark:bg-zinc-300' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white dark:bg-[#1c1c1e] rounded-full transition-all ${tempSettings.isLockScreenEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full" />
                <div className="flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <Lock size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-100 whitespace-nowrap">启用锁屏密码</span>
                  </div>
                  <button 
                    onClick={() => setTempSettings(prev => ({ ...prev, isPasswordEnabled: !prev.isPasswordEnabled }))}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${tempSettings.isPasswordEnabled ? 'bg-zinc-800 dark:bg-zinc-300' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white dark:bg-[#1c1c1e] rounded-full transition-all ${tempSettings.isPasswordEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full" />
                
                <div 
                  className="flex flex-row justify-between items-center cursor-pointer active:opacity-70 transition-opacity"
                  onClick={() => {
                    setPasswordStep(password ? 'verify' : 'new1');
                    setPasswordInput('');
                    setPasswordError('');
                    setShowPasswordModal(true);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ShieldCheck size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-100 whitespace-nowrap">修改密码</span>
                  </div>
                  <ChevronRight size={16} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full" />

                <div className="flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <ImageIcon size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-100 whitespace-nowrap">壁纸管理</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (wallpaper) {
                        setWallpaper(null);
                        localStorage.removeItem('aiphone_wallpaper');
                      }
                    }}
                    className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex-shrink-0 transition-colors"
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
              <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-row justify-between items-center">
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-100">磨砂强度</span>
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
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-100">背景透明度</span>
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
                    onClick={() => setTempSettings(prev => ({ ...prev, frostIntensity: 60, componentBgOpacity: 0.2 }))}
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
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">全局基础字体大小</span>
              <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] font-bold text-zinc-500">A</span>
                    <input 
                      type="range" min="12" max="24" step="1"
                      value={tempSettings.baseFontSize}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, baseFontSize: Number(e.target.value) }))}
                      className="flex-1 accent-zinc-800 dark:accent-zinc-300"
                    />
                    <span className="text-[24px] font-bold text-zinc-500">A</span>
                  </div>
                  <div className="text-center text-[10px] text-zinc-400">{tempSettings.baseFontSize}px</div>
                </div>
              </GlassCard>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">全局文本颜色</span>
              <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={tempSettings.baseFontColor || '#000000'}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, baseFontColor: e.target.value }))}
                      className="w-8 h-8 rounded border-0 p-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-100">{tempSettings.baseFontColor ? '已自定义' : '跟随深浅模式'}</span>
                  </div>
                  <button 
                    onClick={() => setTempSettings(prev => ({ ...prev, baseFontColor: '' }))}
                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-300 active:scale-95 transition-all"
                  >
                    恢复默认
                  </button>
                </div>
              </GlassCard>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">字体加载链接</span>
              <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
                <div className="flex items-center gap-3">
                  <Globe2 size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="https://fonts.googleapis.com/css2?family=..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
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
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 active:scale-95 transition-all mt-2 border border-zinc-200 dark:border-zinc-700"
                  >
                    <RotateCcw size={14} />
                    恢复系统默认设置
                  </button>
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

        {/* 关于与反馈 Tab */}
        {activeView === 'about' && (
          <motion.div
            key="about"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center py-10 gap-6 text-zinc-300 dark:text-zinc-600"
          >
            <div className="flex flex-col items-center justify-center">
              <Sparkles size={48} strokeWidth={1} />
              <p className="mt-4 text-xs font-bold tracking-widest uppercase">PUPPY OS v1.0</p>
              <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">当前版本</p>
            </div>
            
            <button 
              onClick={() => {
                setSuccess('正在更新… 请稍后');
                setTimeout(() => {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      for (let registration of registrations) {
                        registration.unregister();
                      }
                    }).then(() => {
                      window.location.reload();
                    });
                  } else {
                    window.location.reload();
                  }
                }, 1500);
              }}
              className="flex items-center gap-2 px-6 h-[44px] bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 rounded-full text-sm font-bold active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors"
            >
              <RotateCcw size={16} />
              立即更新
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Password Modification Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-sm px-6"
          >
            <GlassCard className="w-full max-w-[320px] p-6 !rounded-3xl border-none shadow-none bg-white/60 dark:bg-black/60 backdrop-blur-md">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 flex items-center justify-center mb-4 text-zinc-600 dark:text-zinc-300">
                  {passwordStep === 'verify' ? <Lock size={24} /> : <Unlock size={24} />}
                </div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">
                  {passwordStep === 'verify' ? '验证原密码' : passwordStep === 'new1' ? '输入新密码' : '确认新密码'}
                </h3>
                <p className="text-[10px] text-zinc-500 mb-6">
                  {passwordStep === 'verify' ? '请输入当前的6位锁屏密码' : '请输入6位数字新密码'}
                </p>

                <div className="flex gap-4 mb-6">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i < passwordInput.length 
                          ? 'bg-zinc-800 dark:bg-zinc-200 scale-125' 
                          : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="h-4 text-[10px] text-red-500 font-bold mb-4 tracking-wider">
                  {passwordError}
                </div>

                <div className="grid grid-cols-3 gap-3 w-full mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0].map((num, i) => (
                    num === '' ? <div key={i} /> : (
                      <button 
                        key={i}
                        onClick={() => {
                          if (passwordInput.length >= 6) return;
                          const newVal = passwordInput + num;
                          setPasswordInput(newVal);
                          setPasswordError('');
                          
                          if (newVal.length === 6) {
                            setTimeout(() => {
                              if (passwordStep === 'verify') {
                                if (!password || newVal === password) {
                                  setPasswordStep('new1');
                                  setPasswordInput('');
                                } else {
                                  setPasswordError('原密码错误');
                                  setPasswordInput('');
                                }
                              } else if (passwordStep === 'new1') {
                                setNewPassword(newVal);
                                setPasswordStep('new2');
                                setPasswordInput('');
                              } else if (passwordStep === 'new2') {
                                if (newVal === newPassword) {
                                  localStorage.setItem('aiphone_password', newVal);
                                  if (setPassword) setPassword(newVal);
                                  setShowPasswordModal(false);
                                  setSuccess('密码修改成功');
                                  setTimeout(() => setSuccess(''), 2000);
                                } else {
                                  setPasswordError('两次密码不一致');
                                  setPasswordInput('');
                                  setPasswordStep('new1');
                                }
                              }
                            }, 200);
                          }
                        }}
                        className="aspect-square rounded-full bg-white/40 dark:bg-zinc-800/40 hover:bg-white/60 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-200 text-xl font-medium flex flex-col items-center justify-center active:scale-95 transition-all border-none"
                      >
                        {num}
                        <span className="text-[7px] tracking-[0.3em] text-zinc-400 dark:text-zinc-500 font-bold uppercase mt-0.5">
                          {num === 2 ? 'ABC' : num === 3 ? 'DEF' : num === 4 ? 'GHI' : num === 5 ? 'JKL' : num === 6 ? 'MNO' : num === 7 ? 'PQRS' : num === 8 ? 'TUV' : num === 9 ? 'WXYZ' : ''}
                        </span>
                      </button>
                    )
                  ))}
                  <button 
                    onClick={() => {
                      setPasswordInput(prev => prev.slice(0, -1));
                      setPasswordError('');
                    }}
                    className="aspect-square flex items-center justify-center text-zinc-400 dark:text-zinc-500 active:scale-95 transition-all bg-transparent"
                  >
                    <Delete size={20} strokeWidth={1.5} />
                  </button>
                </div>

                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="w-full py-3.5 rounded-full bg-white/50 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300 text-xs font-bold active:scale-95 transition-all border-none"
                >
                  取消
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Toast Notification */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
          >
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800/90 dark:bg-zinc-200/90 backdrop-blur-md shadow-lg">
              <Check size={14} className="text-green-400 dark:text-green-600" />
              <span className="text-xs font-bold text-white dark:text-zinc-900 whitespace-nowrap">{success}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
