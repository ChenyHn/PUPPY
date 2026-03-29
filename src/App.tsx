/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as mammoth from 'mammoth';
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
  Pencil,
  FolderOpen,
  Folder,
  ChevronDown,
  ChevronUp,
  FileUp,
  Filter,
  SlidersHorizontal,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type Screen = 'splash' | 'lock' | 'password-setup' | 'password-unlock' | 'home' | 'app-chat' | 'app-settings' | 'ai-chat' | 'app-appearance' | 'app-persona' | 'app-phone-list' | 'app-world' | 'app-world-edit';
type WorldBookScope = 'global' | 'local';

interface WorldBook {
  id: string;
  title: string;
  content: string;
  scope: WorldBookScope;
  isActive: boolean;
  boundPersonas: string[];
  folderId?: string; // Add folder ID
}

interface WorldBookFolder {
  id: string;
  name: string;
}
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
  temperature: number;
  maxTokens: number;
  contextMessageCount: number;
}

// --- Helper: Build character system prompt ---
function buildCharacterSystemPrompt(p: Persona): string {
  const otherTraits: string[] = [];
  if (p.height) otherTraits.push(`身高：${p.height}cm`);
  if (p.weight) otherTraits.push(`体重：${p.weight}kg`);
  if (p.age) otherTraits.push(`年龄：${p.age}岁`);
  if (p.gender) otherTraits.push(`性别：${p.gender}`);
  if (p.occupation) otherTraits.push(`职业：${p.occupation}`);
  if (p.location) otherTraits.push(`所在地：${p.location}`);

  return `你现在正扮演以下角色，必须严格遵循角色设定，以第一人称视角回复，语气、用词、思维方式都要完全符合角色特点，不能脱离角色，不能说出任何不符合角色身份的话。回复要像真人一样自然、生动、有情感，避免机械感或AI感。绝对不能以AI身份自居，不能说"作为AI"、"我是人工智能"之类的话。

角色信息：
- 姓名：${p.name || p.chatName}
- 性格：${p.personality || '未设定'}
- 背景故事：${p.bio || '未设定'}
- 其他特征：${otherTraits.length > 0 ? otherTraits.join('；') : '无'}

请以该角色的身份与用户进行对话，每一句话都要符合角色设定，让人感觉就是角色本人在说话。保持对话自然，像是在社交软件上聊天一样。`;
}

// --- Helper: Generate simulated reply based on persona ---
function generateSimulatedReply(persona: Persona | null, userMessage: string): string {
  if (!persona) {
    // AI assistant fallback
    const replies = [
      '你好呀！我是AI助手，不过目前API还没配置好，等配置好了我就能更好地帮你啦~',
      '嗯嗯，我收到你的消息了！不过现在API还没连上，我只能简单回复你哦。',
      '哈哈，我暂时还不太聪明，因为API还没配置好。去设置里配置一下吧！',
      '收到！不过我现在是离线模式，功能有限哦~',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  const name = persona.chatName || persona.name || '我';
  const personality = persona.personality || '';
  
  // Generate contextual replies based on persona traits
  const greetings = [
    `嗯？怎么了~`,
    `在呢在呢，说吧~`,
    `哈喽~`,
    `嗯嗯，我在听~`,
  ];
  
  const responses = [
    `嗯...让我想想怎么说...`,
    `哈哈，你说的挺有意思的~`,
    `是嘛？然后呢？`,
    `嗯嗯，我懂你的意思~`,
    `这样啊...`,
    `哦哦，原来如此~`,
  ];

  if (userMessage.length < 5) {
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  if (userMessage.includes('?') || userMessage.includes('？')) {
    const questionReplies = [
      `这个嘛...我觉得还好吧~`,
      `嗯...怎么说呢，我也不太确定诶`,
      `哈哈，你怎么突然问这个~`,
      `让我想想...嗯，我觉得可以的！`,
    ];
    return questionReplies[Math.floor(Math.random() * questionReplies.length)];
  }

  return responses[Math.floor(Math.random() * responses.length)];
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

const WorldBookListScreen = ({ onBack, time, worldBooks, setWorldBooks, folders, setFolders, onEdit, onAdd }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'local'>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const toggleActive = (id: string) => {
    setWorldBooks((prev: any[]) => {
      const target = prev.find(wb => wb.id === id);
      if (!target) return prev;
      
      const newActiveState = !target.isActive;
      
      return prev.map(wb => {
        if (wb.id === id) {
          return { ...wb, isActive: newActiveState };
        }
        // 当用户手动激活全局世界书时，其他全局世界书自动失效
        if (newActiveState && target.scope === 'global' && wb.scope === 'global') {
          return { ...wb, isActive: false };
        }
        return wb;
      });
    });
  };

  const deleteWorldBook = (id: string) => {
    setWorldBooks((prev: any[]) => prev.filter(wb => wb.id !== id));
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    if (editingFolderId) {
      setFolders((prev: any[]) => prev.map(f => f.id === editingFolderId ? { ...f, name: newFolderName.trim() } : f));
    } else {
      setFolders((prev: any[]) => [...prev, { id: Math.random().toString(36).substr(2, 9), name: newFolderName.trim() }]);
    }
    
    setNewFolderName('');
    setIsCreatingFolder(false);
    setEditingFolderId(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    // Optional: Ask for confirmation here in a real app
    setFolders((prev: any[]) => prev.filter(f => f.id !== folderId));
    // Move all books in this folder back to unassigned
    setWorldBooks((prev: any[]) => prev.map(wb => wb.folderId === folderId ? { ...wb, folderId: undefined } : wb));
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // 1. 过滤搜索和作用域
  const filteredBooks = worldBooks.filter((wb: any) => {
    const matchesSearch = wb.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScope = filterScope === 'all' || wb.scope === filterScope;
    return matchesSearch && matchesScope;
  });

  // 2. 将世界书分组
  const groupedBooks = {
    unassigned: filteredBooks.filter((wb: any) => !wb.folderId),
    ...folders.reduce((acc: any, folder: any) => {
      acc[folder.id] = filteredBooks.filter((wb: any) => wb.folderId === folder.id);
      return acc;
    }, {})
  };

  return (
    <motion.div 
      key="app-world"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 bg-zinc-50 dark:bg-zinc-900 flex flex-col z-50 transition-colors"
    >
      <StatusBar time={time} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 dark:text-zinc-200" />
      
      <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 dark:text-zinc-500 active:text-zinc-600 dark:active:text-zinc-300">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">世界书</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditingFolderId(null);
              setNewFolderName('');
              setIsCreatingFolder(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-sm active:scale-95 transition-all"
          >
            <FolderPlus size={16} />
          </button>
          <button 
            onClick={onAdd}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 dark:bg-zinc-700 text-white shadow-sm active:scale-95 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-3 z-10 transition-colors">
        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2">
          <Search size={16} className="text-zinc-400" />
          <input 
            type="text" 
            placeholder="搜索世界书..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 items-center">
          <Filter size={14} className="text-zinc-400" />
          <button 
            onClick={() => setFilterScope('all')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${filterScope === 'all' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
          >
            全部
          </button>
          <button 
            onClick={() => setFilterScope('global')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${filterScope === 'global' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
          >
            全局
          </button>
          <button 
            onClick={() => setFilterScope('local')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${filterScope === 'local' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
          >
            局部
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {/* Folder Creation Modal / Inline Input */}
        <AnimatePresence>
          {isCreatingFolder && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <GlassCard className="p-4 flex gap-2 items-center mb-4 dark:border-zinc-700 dark:bg-zinc-800/50" opacity="0.8" blur="10px">
                <FolderOpen size={18} className="text-zinc-500" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="输入文件夹名称..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-200"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
                <button onClick={() => setIsCreatingFolder(false)} className="text-zinc-400 p-1"><Delete size={16} /></button>
                <button onClick={handleCreateFolder} className="text-zinc-800 dark:text-zinc-200 p-1"><Check size={16} /></button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {worldBooks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600 py-20">
            <BookOpen size={64} strokeWidth={1} />
            <p className="mt-4 text-sm font-bold tracking-widest uppercase">暂无世界书</p>
            <button 
              onClick={onAdd}
              className="mt-6 px-6 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-full text-xs font-bold active:scale-95 transition-all"
            >
              创建世界书
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Render Folders */}
            {folders.map((folder: any) => {
              const booksInFolder = groupedBooks[folder.id] || [];
              const isExpanded = expandedFolders[folder.id] !== false; // Default to expanded

              return (
                <div key={folder.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2">
                    <div 
                      className="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity"
                      onClick={() => toggleFolderExpand(folder.id)}
                    >
                      {isExpanded ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
                      <Folder size={16} className="text-zinc-500" />
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{folder.name} ({booksInFolder.length})</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingFolderId(folder.id); setNewFolderName(folder.name); setIsCreatingFolder(true); }} className="text-zinc-400 hover:text-zinc-600"><Pencil size={12} /></button>
                      <button onClick={() => handleDeleteFolder(folder.id)} className="text-red-300 hover:text-red-500"><Delete size={12} /></button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-4 overflow-hidden"
                      >
                        {booksInFolder.length === 0 ? (
                          <div className="text-[10px] text-zinc-400 text-center py-2">空文件夹</div>
                        ) : (
                          booksInFolder.map((wb: any) => (
                            <WorldBookCard key={wb.id} wb={wb} toggleActive={toggleActive} onEdit={onEdit} deleteWorldBook={deleteWorldBook} />
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Render Unassigned Books */}
            {groupedBooks.unassigned.length > 0 && (
              <div className="flex flex-col gap-3">
                {folders.length > 0 && (
                  <div className="flex items-center gap-2 px-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">未分类 ({groupedBooks.unassigned.length})</span>
                  </div>
                )}
                {groupedBooks.unassigned.map((wb: any) => (
                  <WorldBookCard key={wb.id} wb={wb} toggleActive={toggleActive} onEdit={onEdit} deleteWorldBook={deleteWorldBook} />
                ))}
              </div>
            )}
            
            {/* Empty Search Result */}
            {filteredBooks.length === 0 && worldBooks.length > 0 && (
              <div className="text-center text-zinc-400 text-sm py-10">
                没有找到匹配的世界书
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Extracted Card Component for reuse
const WorldBookCard = ({ wb, toggleActive, onEdit, deleteWorldBook }: any) => (
  <GlassCard className={`p-4 flex flex-col gap-3 dark:bg-zinc-800/50 transition-colors border ${wb.isActive && wb.scope === 'global' ? 'border-zinc-800 dark:border-zinc-400 shadow-[0_0_15px_rgba(39,39,42,0.1)]' : 'border-zinc-200/50 dark:border-zinc-700/50'}`} opacity="0.8" blur="10px">
    <div className="flex justify-between items-start">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-zinc-800 dark:text-zinc-200 truncate text-[15px]">{wb.title}</h3>
          {wb.isActive && wb.scope === 'global' && (
            <span className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-200 shadow-sm" title="当前激活的全局世界书"></span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${wb.scope === 'global' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300' : 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-800'}`}>
            {wb.scope === 'global' ? '全局' : '局部'}
          </span>
          {wb.scope === 'local' && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">已绑定 {wb.boundPersonas.length} 角色</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
          <button 
          onClick={() => toggleActive(wb.id)}
          className={`w-10 h-5 rounded-full transition-colors relative ${wb.isActive ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-200 dark:bg-zinc-700'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white dark:bg-zinc-900 rounded-full transition-all ${wb.isActive ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
    </div>
    <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-700/50">
      <button 
        onClick={() => onEdit(wb)}
        className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full text-[10px] font-bold active:scale-95 transition-all flex items-center gap-1"
      >
        <Pencil size={12} />
        编辑
      </button>
      <button 
        onClick={() => deleteWorldBook(wb.id)}
        className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-400 hover:text-red-500 rounded-full text-[10px] font-bold active:scale-95 transition-all flex items-center gap-1"
      >
        <Delete size={12} />
        删除
      </button>
    </div>
  </GlassCard>
);

// Fallback FolderPlus icon component since lucide-react might not export it directly in older versions
const FolderPlus = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
    <line x1="12" y1="10" x2="12" y2="16"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
  </svg>
);

const WorldBookEditScreen = ({ onBack, time, initialData, onSave, phonePersonas, folders }: any) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [scope, setScope] = useState<'global' | 'local'>(initialData?.scope || 'global');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [boundPersonas, setBoundPersonas] = useState<string[]>(initialData?.boundPersonas || []);
  const [folderId, setFolderId] = useState<string>(initialData?.folderId || '');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入内容');
      return;
    }
    onSave({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      content: content.trim(),
      scope,
      isActive,
      boundPersonas: scope === 'local' ? boundPersonas : [],
      folderId: folderId || undefined
    });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setContent(prev => prev ? `${prev}\n\n${text}` : text);
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        setContent(prev => prev ? `${prev}\n\n${text}` : text);
      } else {
        alert('仅支持导入 .txt 或 .docx 文件');
      }
    } catch (err) {
      console.error('导入失败:', err);
      alert('解析文件失败，请确保文件格式正确。');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const togglePersona = (id: string) => {
    setBoundPersonas(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <motion.div 
      key="app-world-edit"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 bg-zinc-50 dark:bg-zinc-900 flex flex-col z-50 transition-colors"
    >
      <StatusBar time={time} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 dark:text-zinc-200" />
      
      <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 dark:text-zinc-500 active:text-zinc-600 dark:active:text-zinc-300">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">{initialData ? '编辑世界书' : '创建世界书'}</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Check size={14} />
          保存
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <GlassCard className="p-4 flex flex-col gap-4 dark:border-zinc-700 dark:bg-zinc-800/50" opacity="0.8" blur="10px">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-1">标题 (必填)</label>
            <input 
              type="text" 
              placeholder="例如：修仙世界观"
              className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 p-3 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 outline-none border border-transparent focus:border-zinc-300 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-1">生效范围</label>
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${scope === 'global' ? 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm' : 'text-zinc-400 dark:text-zinc-500'}`}
                onClick={() => setScope('global')}
              >
                全局生效
              </button>
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${scope === 'local' ? 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm' : 'text-zinc-400 dark:text-zinc-500'}`}
                onClick={() => setScope('local')}
              >
                局部生效
              </button>
            </div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 px-1 mt-1">
              {scope === 'global' ? '全局只能激活一个，对所有角色生效（除非角色绑定了局部世界书）。' : '仅对选择的特定角色生效。'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-1">所属文件夹</label>
            <select 
              className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 p-3 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 outline-none border border-transparent appearance-none"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            >
              <option value="">未分类</option>
              {folders.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center px-1 py-2 border-t border-zinc-100 dark:border-zinc-700/50">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">是否激活</span>
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-200 dark:bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white dark:bg-zinc-900 rounded-full transition-all ${isActive ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </GlassCard>

        {scope === 'local' && (
          <GlassCard className="p-4 flex flex-col gap-3 dark:border-zinc-700 dark:bg-zinc-800/50" opacity="0.8" blur="10px">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-1">选择绑定角色</label>
            {phonePersonas.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">暂无角色，请先在电话簿中添加。</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar">
                {phonePersonas.map((p: any) => (
                  <div 
                    key={p.id} 
                    onClick={() => togglePersona(p.id)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${boundPersonas.includes(p.id) ? 'bg-zinc-800 border-zinc-800 dark:bg-zinc-200 dark:border-zinc-200' : 'border-zinc-300 dark:border-zinc-600'}`}>
                      {boundPersonas.includes(p.id) && <Check size={12} className="text-white dark:text-zinc-900" />}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                      {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <User size={16} className="m-2 text-zinc-400" />}
                    </div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate">{p.chatName || p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        <GlassCard className="p-4 flex flex-col gap-2 flex-1 min-h-[400px] dark:border-zinc-700 dark:bg-zinc-800/50" opacity="0.8" blur="10px">
          <div className="flex justify-between items-center px-1 pb-2 border-b border-zinc-100 dark:border-zinc-700/50">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">世界观内容 (纯文本)</label>
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" 
                onChange={handleImportFile} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full text-[10px] font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                <FileUp size={12} />
                {isImporting ? '导入中...' : '导入文件'}
              </button>
            </div>
          </div>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 px-1">建议保持内容精简，过长会消耗大量 Token 且影响对话响应速度。支持导入 .txt 和 .docx 文件提取纯文本。</p>
          <textarea 
            placeholder="在此输入或粘贴世界书内容..."
            className="w-full h-full flex-1 bg-transparent p-2 text-sm text-zinc-700 dark:text-zinc-200 outline-none resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 leading-relaxed"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </GlassCard>
      </div>
    </motion.div>
  );
};

const SettingsScreen = ({ 
  apiConfig, 
  setApiConfig, 
  onBack, 
  time
}: any) => {
  const [tempConfig, setTempConfig] = useState(apiConfig);
  const [showKey, setShowKey] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = () => {
    setApiConfig(tempConfig);
    showToast('配置已保存', 'success');
  };

  const handleFetchModels = async () => {
    if (!tempConfig.baseUrl || !tempConfig.apiKey) {
      showToast('请先输入 API 地址和密钥', 'error');
      return;
    }
    setIsAiLoading(true);
    try {
      let baseUrl = tempConfig.baseUrl.trim().replace(/\/+$/, '');
      if (!/^https?:\/\//i.test(baseUrl)) {
        baseUrl = 'https://' + baseUrl;
      }
      if (baseUrl.endsWith('/chat/completions')) {
        baseUrl = baseUrl.replace('/chat/completions', '');
      }

      const url = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${tempConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const modelNames = data.data.map((m: any) => m.id);
        if (modelNames.length > 0) {
          const newSelectedModel = tempConfig.selectedModel || modelNames[0];
          setTempConfig((prev: any) => ({ ...prev, models: modelNames, selectedModel: newSelectedModel }));
          setApiConfig((prev: any) => ({ ...prev, models: modelNames, selectedModel: newSelectedModel }));
          showToast('模型列表获取成功', 'success');
        } else {
          showToast('未找到可用模型', 'error');
        }
      } else {
        showToast('返回数据格式不正确', 'error');
      }
    } catch (err: any) {
      console.error('Fetch models error:', err);
      let errorMsg = err.message || '未知错误';
      if (err.name === 'AbortError') {
         errorMsg = '请求超时(30s)，请检查网络或代理';
      } else if (errorMsg === 'Failed to fetch' || errorMsg.toLowerCase().includes('networkerror')) {
        errorMsg = '网络错误/跨域(CORS)限制，请使用支持CORS的中转API';
      }
      showToast(`获取失败: ${errorMsg}`, 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!tempConfig.baseUrl || !tempConfig.apiKey) {
      showToast('请先输入 API 地址和密钥', 'error');
      return;
    }
    setIsAiLoading(true);
    try {
      let baseUrl = tempConfig.baseUrl.trim().replace(/\/+$/, '');
      if (!/^https?:\/\//i.test(baseUrl)) {
        baseUrl = 'https://' + baseUrl;
      }
      if (baseUrl.endsWith('/chat/completions')) {
        baseUrl = baseUrl.replace('/chat/completions', '');
      }
      const url = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempConfig.apiKey}`,
        },
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        body: JSON.stringify({
          model: tempConfig.selectedModel || tempConfig.models?.[0] || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        showToast('连接测试成功！', 'success');
      } else {
        throw new Error('返回数据格式不正确');
      }
    } catch (err: any) {
      console.error('Test connection error:', err);
      let errorMsg = err.message || '未知错误';
      if (err.name === 'AbortError') {
         errorMsg = '请求超时(30s)，请检查网络或代理';
      } else if (errorMsg === 'Failed to fetch' || errorMsg.toLowerCase().includes('networkerror')) {
        errorMsg = '网络错误/跨域(CORS)限制';
      }
      showToast(`测试失败: ${errorMsg}`, 'error');
    } finally {
      setIsAiLoading(false);
    }
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
          <button onClick={onBack} className="text-zinc-400 active:text-zinc-600 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700">设置</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 h-[44px] bg-zinc-800 text-white rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Check size={14} />
          保存
        </button>
      </div>

      <div className="absolute top-[100px] left-0 right-0 z-50 px-6 pointer-events-none">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`w-full py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white text-center pointer-events-auto break-words ${toastType === 'success' ? 'bg-[#07C160]' : 'bg-red-500'}`}
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative">
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
              onClick={handleFetchModels}
              disabled={isAiLoading}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 active:scale-95 transition-all min-h-[44px]"
            >
              <RefreshCw size={12} className={isAiLoading ? "animate-spin" : ""} />
              获取模型列表
            </button>
          </div>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <select 
              className="w-full h-8 bg-transparent border-none outline-none text-sm text-zinc-700 appearance-none cursor-pointer"
              value={tempConfig.selectedModel || ''}
              onChange={(e) => setTempConfig((prev: any) => ({ ...prev, selectedModel: e.target.value }))}
            >
              {tempConfig.models && tempConfig.models.length > 0 ? (
                tempConfig.models.map((m: any) => <option key={m} value={m}>{m}</option>)
              ) : (
                <option value="">请先获取模型列表</option>
              )}
            </select>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">Temperature (创造性)</span>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-zinc-400" />
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1"
                className="flex-1 accent-zinc-600"
                value={tempConfig.temperature ?? 0.7}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              />
              <span className="text-sm font-bold text-zinc-600 w-10 text-right">{(tempConfig.temperature ?? 0.7).toFixed(1)}</span>
            </div>
            <p className="text-[9px] text-zinc-400 mt-2 px-1">值越高回复越有创造性，值越低回复越稳定。推荐 0.7</p>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">上下文消息条数</span>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className="text-zinc-400" />
              <input 
                type="range" 
                min="1" 
                max="50" 
                step="1"
                className="flex-1 accent-zinc-600"
                value={tempConfig.contextMessageCount ?? 10}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, contextMessageCount: parseInt(e.target.value) }))}
              />
              <span className="text-sm font-bold text-zinc-600 w-10 text-right">{tempConfig.contextMessageCount ?? 10}</span>
            </div>
            <p className="text-[9px] text-zinc-400 mt-2 px-1">每次调用API时读取的最近消息条数（系统消息不计入）。值越小越省Token，值越大上下文越完整。推荐 10</p>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">Max Tokens (最大回复长度)</span>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <Type size={18} className="text-zinc-400" />
              <input 
                type="number" 
                inputMode="numeric"
                min="100" 
                max="8192" 
                step="100"
                placeholder="2048"
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 placeholder:text-zinc-300"
                value={tempConfig.maxTokens ?? 2048}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, maxTokens: parseInt(e.target.value) || 2048 }))}
              />
            </div>
            <p className="text-[9px] text-zinc-400 mt-2 px-1">控制AI单次回复的最大长度。推荐 2048</p>
          </GlassCard>
        </div>

        <div className="flex justify-center mt-4">
          <button 
            onClick={handleTestConnection}
            disabled={isAiLoading}
            className="flex items-center justify-center gap-2 w-full max-w-[200px] h-[44px] bg-zinc-100 text-zinc-700 rounded-full text-sm font-bold active:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isAiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Wifi size={16} />}
            测试连接
          </button>
        </div>

        <div className="mt-auto pt-6">
          <p className="text-[10px] text-center text-zinc-300 leading-relaxed">
            配置完成后，点击右上角"保存"。未配置API时将使用模拟回复。
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
    return saved ? JSON.parse(saved) : { baseUrl: '', apiKey: '', selectedModel: '', models: [], temperature: 0.7, maxTokens: 2048, contextMessageCount: 10 };
  });

  // Chat State
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
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
  const [worldBooks, setWorldBooks] = useState<any[]>(() => {
    const saved = localStorage.getItem('aiphone_world_books');
    return saved ? JSON.parse(saved) : [];
  });
  const [worldBookFolders, setWorldBookFolders] = useState<WorldBookFolder[]>(() => {
    const saved = localStorage.getItem('aiphone_world_book_folders');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingWorldBook, setEditingWorldBook] = useState<any | null>(null);

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
    localStorage.setItem('aiphone_world_books', JSON.stringify(worldBooks));
  }, [worldBooks]);

  useEffect(() => {
    localStorage.setItem('aiphone_world_book_folders', JSON.stringify(worldBookFolders));
  }, [worldBookFolders]);

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

  const checkAndTriggerAutoSummary = async (chatId: string, currentHistory: any[]) => {
    const settings = chatSettings[chatId] || {};
    if (!settings.isAutoSummaryEnabled) return;
    
    const threshold = settings.autoSummaryThreshold || 30;
    const lastIndex = settings.lastSummaryMessageIndex || 0;
    
    if (currentHistory.length - lastIndex >= threshold) {
      const now = Date.now();
      const lastTime = lastSummaryTimeRef.current[chatId] || 0;
      if (now - lastTime < 30000) return;
      
      if (isSummarizingRef.current[chatId]) return;
      
      if (!apiConfig.baseUrl || !apiConfig.apiKey) return;

      isSummarizingRef.current[chatId] = true;
      setAutoSummaryStatus('正在总结记忆...');

      try {
        const historyText = currentHistory.map(m => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`).join('\n');
        const summaryPrompt = `请总结以下对话中用户与AI角色的互动，提取关键信息、角色关系、重要事件、用户偏好等。总结要简洁清晰，不超过200字。\n\n对话历史：\n${historyText}`;

        let baseUrl = apiConfig.baseUrl.trim().replace(/\/+$/, '');
        if (!/^https?:\/\//i.test(baseUrl)) baseUrl = 'https://' + baseUrl;
        if (baseUrl.endsWith('/chat/completions')) baseUrl = baseUrl.replace('/chat/completions', '');
        const url = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`,
          },
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal,
          body: JSON.stringify({
            model: apiConfig.selectedModel || 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: '你是一个对话总结助手，请根据用户提供的对话历史生成简洁的总结。' },
              { role: 'user', content: summaryPrompt }
            ],
            temperature: 0.3,
            max_tokens: 500
          })
        });
        clearTimeout(timeoutId);

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const summary = data.choices?.[0]?.message?.content;
        
        if (summary) {
          setChatSummaries(prev => ({ ...prev, [chatId]: summary }));
          setChatSettings(prev => ({
            ...prev,
            [chatId]: { ...prev[chatId], lastSummaryMessageIndex: currentHistory.length }
          }));
          lastSummaryTimeRef.current[chatId] = Date.now();
        }
      } catch (err) {
        console.error('Auto summary error:', err);
      } finally {
        isSummarizingRef.current[chatId] = false;
        setAutoSummaryStatus('');
      }
    }
  };

  const sendAiMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput.trim();
    const currentMessages = activeChatContact ? (chatHistories[activeChatContact.id] || []) : chatMessages;
    const newMessages = [...currentMessages, { role: 'user' as const, content: userMsg }];
    
    // Helper to append a reply message
    const appendReply = (msg: {role: 'user' | 'assistant', content: string}) => {
      if (activeChatContact) {
        setChatHistories(prev => ({
          ...prev,
          [activeChatContact.id]: [...(prev[activeChatContact.id] || []), msg]
        }));
      } else {
        setChatMessages(prev => [...prev, msg]);
      }
    };

    // Save user message
    if (activeChatContact) {
      setChatHistories(prev => ({
        ...prev,
        [activeChatContact.id]: newMessages
      }));
      checkAndTriggerAutoSummary(activeChatContact.id, newMessages);
    } else {
      setChatMessages(newMessages);
      checkAndTriggerAutoSummary('ai_assistant', newMessages);
    }
    setChatInput('');

    // Check if API config is valid; if not, use simulated reply
    const isApiValid = apiConfig.baseUrl && apiConfig.baseUrl.trim() !== '';
    if (!isApiValid) {
      setIsAiLoading(true);
      // Simulate a short delay for realism
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
      const simReply = generateSimulatedReply(activeChatContact, userMsg);
      appendReply({ role: 'assistant', content: simReply });
      setIsAiLoading(false);
      return;
    }

    setIsAiLoading(true);

    // Build system prompt using buildCharacterSystemPrompt for persona contacts
    let baseSystemPrompt = activeChatContact 
      ? buildCharacterSystemPrompt(activeChatContact) 
      : "你是一个乐于助人的AI助手。";

    let worldBookContent = '';
    if (activeChatContact) {
      const localWb = worldBooks.find(wb => wb.isActive && wb.scope === 'local' && wb.boundPersonas.includes(activeChatContact.id));
      if (localWb) {
        worldBookContent = localWb.content;
      } else {
        const globalWb = worldBooks.find(wb => wb.isActive && wb.scope === 'global');
        if (globalWb) {
          worldBookContent = globalWb.content;
        }
      }
    } else {
      const globalWb = worldBooks.find(wb => wb.isActive && wb.scope === 'global');
      if (globalWb) {
        worldBookContent = globalWb.content;
      }
    }

    const systemPrompt = worldBookContent 
      ? `【世界观设定】\n${worldBookContent}\n\n请严格遵循以上世界观设定，同时扮演好角色...\n\n${baseSystemPrompt}`
      : baseSystemPrompt;

    // Inject long-term memory summary if available
    const currentSummaryChatId = activeChatContact ? activeChatContact.id : 'ai_assistant';
    const summaryText = chatSummaries[currentSummaryChatId];
    const finalSystemPrompt = summaryText 
      ? `${systemPrompt}\n\n【长期记忆摘要】${summaryText}`
      : systemPrompt;

    // Limit context to last N messages (configurable)
    const contextMessages = newMessages.slice(-(apiConfig.contextMessageCount || 10));

    // Build headers
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiConfig.apiKey) {
      headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
    }

    try {
      let baseUrl = apiConfig.baseUrl.trim().replace(/\/+$/, '');
      
      // 自动补全 http/https
      if (!/^https?:\/\//i.test(baseUrl)) {
        baseUrl = 'https://' + baseUrl;
      }
      // 容错处理：如果用户直接输入了完整路径，去掉后缀以匹配统一逻辑
      if (baseUrl.endsWith('/chat/completions')) {
        baseUrl = baseUrl.replace('/chat/completions', '');
      }

      const url = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        body: JSON.stringify({
          model: apiConfig.selectedModel || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: finalSystemPrompt },
            ...contextMessages
          ],
          temperature: apiConfig.temperature ?? 0.7,
          max_tokens: apiConfig.maxTokens ?? 2048
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `请求失败 (${response.status})`);
      }

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        appendReply({ role: 'assistant', content: data.choices[0].message.content });
        const finalMessages = [...newMessages, { role: 'assistant' as const, content: data.choices[0].message.content }];
        if (activeChatContact) {
          checkAndTriggerAutoSummary(activeChatContact.id, finalMessages);
        } else {
          checkAndTriggerAutoSummary('ai_assistant', finalMessages);
        }
      } else {
        throw new Error('返回数据格式不正确，未找到回复内容。');
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      let errorMsg = err.message || '请检查配置';
      if (err.name === 'AbortError') {
         errorMsg = '请求超时(30s)，请检查网络或配置';
      } else if (errorMsg === 'Failed to fetch' || errorMsg.toLowerCase().includes('networkerror')) {
        errorMsg = '跨域拦截(CORS)或网络连接失败，请确认该API支持前端调用。';
      }
      
      // API call failed — fallback to simulated reply
      const simReply = generateSimulatedReply(activeChatContact, userMsg);
      appendReply({ role: 'assistant', content: `⚠️ API调用失败，已降级为模拟回复。\n\n${simReply}\n\n(错误: ${errorMsg})` });
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

  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [chatSummaries, setChatSummaries] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('aiphone_chat_summaries');
    return saved ? JSON.parse(saved) : {};
  });

  const isSummarizingRef = React.useRef<Record<string, boolean>>({});
  const lastSummaryTimeRef = React.useRef<Record<string, number>>({});
  const [autoSummaryStatus, setAutoSummaryStatus] = useState<string>('');

  const [chatSettings, setChatSettings] = useState<Record<string, { remark: string, background: string, isBlocked: boolean, isPinned: boolean, isAutoSummaryEnabled?: boolean, autoSummaryThreshold?: number, lastSummaryMessageIndex?: number }>>(() => {
    const saved = localStorage.getItem('aiphone_chat_settings');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('aiphone_chat_summaries', JSON.stringify(chatSummaries));
  }, [chatSummaries]);

  useEffect(() => {
    localStorage.setItem('aiphone_chat_settings', JSON.stringify(chatSettings));
  }, [chatSettings]);

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
                  <div className="app-icon-container flex justify-center"><AppIcon icon={BookOpen} label="世界书" onClick={() => setScreen('app-world')} isEditingLayout={isEditingLayout} customIcon={customIcons['world']} /></div>
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
                            {/* Build sorted chat list: AI assistant + contacts, pinned first */}
                            {(() => {
                              const aiAssistantItem = {
                                type: 'ai' as const,
                                id: 'ai_assistant',
                                isPinned: !!(chatSettings['ai_assistant']?.isPinned),
                              };
                              const contactItems = contacts.map(contact => ({
                                type: 'contact' as const,
                                id: contact.id,
                                contact,
                                isPinned: !!(chatSettings[contact.id]?.isPinned),
                              }));
                              const allItems = [aiAssistantItem, ...contactItems];
                              // Sort: pinned items first, maintain original order within each group
                              allItems.sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));

                              return allItems.map(item => {
                                if (item.type === 'ai') {
                                  const aiSettings = chatSettings['ai_assistant'] || { remark: '', background: '', isBlocked: false, isPinned: false };
                                  return (
                                    <div key="ai_assistant" onClick={() => {
                                      setActiveChatContact(null);
                                      setIsChatSettingsOpen(false);
                                      setScreen('ai-chat');
                                    }} className={aiSettings.isPinned ? 'bg-zinc-50/80' : ''}>
                                      <ChatListItem 
                                        name={aiSettings.remark || "AI 助手"} 
                                        msg={chatMessages.length > 0 ? chatMessages[chatMessages.length-1].content : "你好！有什么我可以帮你的吗？"} 
                                        time="10:24" 
                                        unread={0} 
                                      />
                                    </div>
                                  );
                                } else {
                                  const contact = item.contact!;
                                  const history = chatHistories[contact.id] || [];
                                  const lastMsg = history.length > 0 ? history[history.length - 1].content : "点击开始聊天";
                                  const contactSettings = chatSettings[contact.id] || { remark: '', background: '', isBlocked: false, isPinned: false };
                                  const displayName = contactSettings.remark || contact.chatName;
                                  return (
                                    <div key={contact.id} onClick={() => {
                                      setActiveChatContact(contact);
                                      setIsChatSettingsOpen(false);
                                      setScreen('ai-chat');
                                    }} className={contactSettings.isPinned ? 'bg-zinc-50/80' : ''}>
                                      <ChatListItem name={displayName} msg={lastMsg} time="09:15" avatar={contact.avatar} />
                                    </div>
                                  );
                                }
                              });
                            })()}
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

          {/* 7.8 World Book List */}
          {screen === 'app-world' && (
            <WorldBookListScreen 
              onBack={() => setScreen('home')}
              time={time}
              worldBooks={worldBooks}
              setWorldBooks={setWorldBooks}
              folders={worldBookFolders}
              setFolders={setWorldBookFolders}
              onEdit={(wb: any) => {
                setEditingWorldBook(wb);
                setScreen('app-world-edit');
              }}
              onAdd={() => {
                setEditingWorldBook(null);
                setScreen('app-world-edit');
              }}
            />
          )}

          {/* 7.9 World Book Edit */}
          {screen === 'app-world-edit' && (
            <WorldBookEditScreen 
              onBack={() => {
                setScreen('app-world');
                setEditingWorldBook(null);
              }}
              time={time}
              initialData={editingWorldBook}
              phonePersonas={phonePersonas}
              folders={worldBookFolders}
              onSave={(wb: any) => {
                setWorldBooks(prev => {
                  let next = [...prev];
                  const existingIndex = next.findIndex(item => item.id === wb.id);
                  if (existingIndex >= 0) {
                    next[existingIndex] = wb;
                  } else {
                    next.push(wb);
                  }
                  
                  // If saving an active global world book, deactivate other globals
                  if (wb.isActive && wb.scope === 'global') {
                    next = next.map(item => 
                      (item.id !== wb.id && item.scope === 'global') ? { ...item, isActive: false } : item
                    );
                  }
                  return next;
                });
                setScreen('app-world');
                setEditingWorldBook(null);
              }}
            />
          )}

        </AnimatePresence>

        {/* 8. AI Chat Screen - 放在 AnimatePresence 外部避免白屏 */}
        {screen === 'ai-chat' && (() => {
          const currentChatId = activeChatContact ? activeChatContact.id : 'ai_assistant';
          const currentChatSettings = chatSettings[currentChatId] || { remark: '', background: '', isBlocked: false };
          const displayChatName = currentChatSettings.remark || (activeChatContact ? activeChatContact.chatName : 'AI 助手');

          return (
          <div className="absolute inset-0 bg-white flex flex-col z-50">
            <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-zinc-100">
              <button onClick={() => {
                setScreen('app-chat');
                setActiveChatContact(null);
              }} className="text-zinc-400">
                ← 返回
              </button>
              <h2 className="text-[16px] font-bold text-zinc-800">
                {displayChatName}
              </h2>
              <button onClick={() => setIsChatSettingsOpen(true)} className="text-zinc-500 hover:text-[#07C160] active:text-[#07C160] transition-colors">
                <SlidersHorizontal size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div 
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-zinc-50 relative"
              style={{ background: currentChatSettings.background || undefined }}
            >
              <AnimatePresence>
                {autoSummaryStatus && isSummarizingRef.current[currentChatId] && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-zinc-800/80 backdrop-blur text-white rounded-full text-[10px] font-bold shadow-lg flex items-center gap-2"
                  >
                    <Sparkles size={12} className="animate-pulse text-yellow-300" />
                    {autoSummaryStatus}
                  </motion.div>
                )}
              </AnimatePresence>
              {(activeChatContact ? (chatHistories[activeChatContact.id] || []) : chatMessages).map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-white text-zinc-700 rounded-tl-none shadow'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAiLoading && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl">正在输入...</div></div>}
              {(activeChatContact ? (chatHistories[activeChatContact.id] || []).length : chatMessages.length) === 0 && (
                <div className="text-center text-zinc-400 py-20">暂无消息，开始聊天吧</div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-zinc-100 pb-10">
              {currentChatSettings.isBlocked ? (
                <div className="flex items-center justify-center p-4 bg-zinc-50 rounded-2xl text-zinc-400 text-sm border border-zinc-100">
                  您已被拉黑
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    placeholder="输入消息..."
                    className="flex-1 bg-zinc-50 p-4 rounded-2xl text-sm outline-none"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                  />
                  <button 
                    onClick={sendAiMessage}
                    disabled={isAiLoading || !chatInput.trim()}
                    className="w-12 h-12 bg-[#07C160] text-white rounded-2xl flex items-center justify-center disabled:opacity-50"
                  >
                    发送
                  </button>
                </div>
              )}
            </div>

            {isChatSettingsOpen && (() => {
              const bgInputRef = React.createRef<HTMLInputElement>();
              return (
              <div className="absolute inset-0 z-50 bg-zinc-50 flex flex-col">
                {/* Full-screen settings top bar */}
                <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-zinc-100">
                  <button onClick={() => setIsChatSettingsOpen(false)} className="text-zinc-500 text-sm font-bold active:text-zinc-800 transition-colors">
                    取消
                  </button>
                  <h3 className="text-[16px] font-bold text-zinc-800">聊天设置</h3>
                  <button 
                    onClick={() => setIsChatSettingsOpen(false)}
                    className="flex items-center gap-1 px-4 py-1.5 bg-zinc-800 text-white rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
                  >
                    <Check size={14} />
                    保存
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                  {/* Remark */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">备注名</span>
                    <div className="bg-white rounded-2xl border border-zinc-100 p-4">
                      <input
                        type="text"
                        className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-300"
                        placeholder="添加备注名"
                        value={currentChatSettings.remark}
                        onChange={e => {
                          setChatSettings(prev => ({
                            ...prev,
                            [currentChatId]: { ...currentChatSettings, remark: e.target.value }
                          }));
                        }}
                      />
                    </div>
                  </div>

                  {/* Background */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">聊天背景</span>
                    
                    {/* Background preview */}
                    <div 
                      className="w-full h-24 rounded-2xl border border-zinc-100 overflow-hidden flex items-center justify-center"
                      style={{ 
                        background: currentChatSettings.background || '#fafafa',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!currentChatSettings.background && <span className="text-xs text-zinc-400">当前背景预览</span>}
                    </div>

                    {/* Color presets */}
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                      {[
                        { id: 'default', color: '' },
                        { id: 'bg1', color: '#F2F2F2' },
                        { id: 'bg2', color: '#E5F2FA' },
                        { id: 'bg3', color: '#F0F4E8' },
                        { id: 'bg4', color: '#FFF3E0' },
                        { id: 'bg5', color: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
                        { id: 'bg6', color: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)' },
                      ].map(bg => (
                        <button
                          key={bg.id}
                          className={`w-12 h-12 rounded-xl flex-shrink-0 border-2 transition-all ${currentChatSettings.background === bg.color ? 'border-[#07C160] scale-110 shadow-md' : 'border-zinc-200/50'}`}
                          style={{ background: bg.color || '#fafafa' }}
                          onClick={() => {
                            setChatSettings(prev => ({
                              ...prev,
                              [currentChatId]: { ...currentChatSettings, background: bg.color }
                            }));
                          }}
                        >
                          {!bg.color && <span className="text-[10px] text-zinc-400 flex items-center justify-center h-full">默认</span>}
                        </button>
                      ))}
                    </div>

                    {/* Upload image button */}
                    <input 
                      type="file" 
                      ref={bgInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const dataUrl = reader.result as string;
                            setChatSettings(prev => ({
                              ...prev,
                              [currentChatId]: { ...currentChatSettings, background: `url(${dataUrl}) center/cover no-repeat` }
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button 
                      onClick={() => bgInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 w-full bg-white p-4 rounded-2xl border border-zinc-100 text-zinc-600 text-sm font-bold active:bg-zinc-50 transition-colors"
                    >
                      <Upload size={16} strokeWidth={1.5} />
                      从相册选择背景图片
                    </button>
                  </div>

                  {/* Pin Toggle */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">聊天管理</span>
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-800">置顶聊天</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">置顶后将显示在消息列表最上方</span>
                      </div>
                      <button 
                        onClick={() => {
                          setChatSettings(prev => ({
                            ...prev,
                            [currentChatId]: { ...currentChatSettings, isPinned: !currentChatSettings.isPinned }
                          }));
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative ${currentChatSettings.isPinned ? 'bg-[#07C160]' : 'bg-zinc-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${currentChatSettings.isPinned ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Long-term Memory Summary */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">长期记忆摘要</span>
                      {chatSummaries[currentChatId] && (
                        <button 
                          onClick={() => {
                            if (window.confirm('确定要清除当前的记忆总结吗？')) {
                              setChatSummaries(prev => {
                                const next = { ...prev };
                                delete next[currentChatId];
                                return next;
                              });
                            }
                          }}
                          className="text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
                        >
                          <Delete size={12} />
                          清除总结
                        </button>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-100 p-4">
                      <textarea
                        rows={4}
                        className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-300 resize-none leading-relaxed"
                        placeholder="在此输入聊天总结/长期记忆摘要，发送消息时会自动注入系统消息中..."
                        value={chatSummaries[currentChatId] || ''}
                        onChange={e => {
                          setChatSummaries(prev => ({
                            ...prev,
                            [currentChatId]: e.target.value
                          }));
                        }}
                      />
                      {chatSummaries[currentChatId] && (
                        <div className="flex justify-end mt-2 pt-2 border-t border-zinc-50">
                          <button 
                            onClick={() => {
                              alert('修改已保存');
                            }}
                            className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold hover:bg-zinc-200 transition-colors"
                          >
                            保存修改
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-800">开启自动总结</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">累积新消息后自动生成</span>
                      </div>
                      <button 
                        onClick={() => {
                          setChatSettings(prev => ({
                            ...prev,
                            [currentChatId]: { 
                              ...currentChatSettings, 
                              isAutoSummaryEnabled: !currentChatSettings.isAutoSummaryEnabled,
                              autoSummaryThreshold: currentChatSettings.autoSummaryThreshold || 30
                            }
                          }));
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative ${currentChatSettings.isAutoSummaryEnabled ? 'bg-[#07C160]' : 'bg-zinc-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${currentChatSettings.isAutoSummaryEnabled ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>

                    {currentChatSettings.isAutoSummaryEnabled && (
                      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-100">
                        <span className="text-sm font-bold text-zinc-800">自动总结阈值(条)</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="10" 
                            max="200" 
                            className="w-16 text-center bg-zinc-50 rounded-lg p-1 text-sm outline-none border border-transparent focus:border-zinc-300 transition-colors"
                            value={currentChatSettings.autoSummaryThreshold || 30}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 30;
                              setChatSettings(prev => ({
                                ...prev,
                                [currentChatId]: { ...currentChatSettings, autoSummaryThreshold: val }
                              }));
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={async () => {
                        const history = currentChatId === 'ai_assistant' ? chatMessages : (chatHistories[currentChatId] || []);
                        if (history.length === 0) {
                          alert('没有可总结的消息');
                          return;
                        }
                        if (!apiConfig.baseUrl || !apiConfig.apiKey) {
                          alert('总结失败，请先在设置中配置API');
                          return;
                        }
                        
                        const historyText = history.map(m => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`).join('\n');
                        const summaryPrompt = `请总结以下对话中用户与AI角色的互动，提取关键信息、角色关系、重要事件、用户偏好等。总结要简洁清晰，不超过200字。\n\n对话历史：\n${historyText}`;

                        try {
                          let baseUrl = apiConfig.baseUrl.trim().replace(/\/+$/, '');
                          if (!/^https?:\/\//i.test(baseUrl)) baseUrl = 'https://' + baseUrl;
                          if (baseUrl.endsWith('/chat/completions')) baseUrl = baseUrl.replace('/chat/completions', '');
                          const url = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

                          const controller = new AbortController();
                          const timeoutId = setTimeout(() => controller.abort(), 30000);

                          const resp = await fetch(url, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${apiConfig.apiKey}`,
                            },
                            mode: 'cors',
                            credentials: 'omit',
                            signal: controller.signal,
                            body: JSON.stringify({
                              model: apiConfig.selectedModel || 'gpt-3.5-turbo',
                              messages: [
                                { role: 'system', content: '你是一个对话总结助手，请根据用户提供的对话历史生成简洁的总结。' },
                                { role: 'user', content: summaryPrompt }
                              ],
                              temperature: 0.3,
                              max_tokens: 500
                            })
                          });
                          clearTimeout(timeoutId);
                          
                          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                          const data = await resp.json();
                          const summary = data.choices?.[0]?.message?.content;
                          if (summary) {
                            setChatSummaries(prev => ({ ...prev, [currentChatId]: summary }));
                            alert('总结已生成');
                          } else {
                            throw new Error('返回数据中无总结内容');
                          }
                        } catch (err: any) {
                          console.error('Generate summary error:', err);
                          alert('总结失败，请检查API配置');
                        }
                      }}
                      className="flex items-center justify-center gap-2 w-full bg-zinc-800 text-white p-3 rounded-2xl text-sm font-bold active:scale-[0.98] transition-all shadow-sm"
                    >
                      <Sparkles size={16} />
                      生成记忆总结
                    </button>
                    <p className="text-[9px] text-zinc-400 px-1">该摘要会作为系统消息的一部分发送给AI，帮助AI了解之前的对话内容。留空则不注入。点击上方按钮可调用AI自动生成总结（将覆盖现有内容）。</p>
                  </div>

                  {/* Block Toggle */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">隐私</span>
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-800">加入黑名单</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">拉黑后将无法发送消息</span>
                      </div>
                      <button 
                        onClick={() => {
                          setChatSettings(prev => ({
                            ...prev,
                            [currentChatId]: { ...currentChatSettings, isBlocked: !currentChatSettings.isBlocked }
                          }));
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative ${currentChatSettings.isBlocked ? 'bg-[#07C160]' : 'bg-zinc-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${currentChatSettings.isBlocked ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="text-[10px] font-bold text-red-400 tracking-widest uppercase px-1">危险操作</span>
                    <button 
                      onClick={() => {
                        if (window.confirm(`确定要清空与 ${displayChatName} 的聊天记录吗？此操作不可撤销。`)) {
                          if (currentChatId === 'ai_assistant') {
                            setChatMessages([]);
                          } else {
                            setChatHistories(prev => ({ ...prev, [currentChatId]: [] }));
                          }
                          setIsChatSettingsOpen(false);
                        }
                      }}
                      className="w-full bg-white text-red-500 font-bold p-4 rounded-2xl border border-red-100 active:bg-red-50 transition-colors"
                    >
                      清空聊天记录
                    </button>
                  </div>
                </div>
              </div>
              );
            })()}
          </div>
          );
        })()}
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
