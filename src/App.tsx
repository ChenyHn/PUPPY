/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Upload,
  Bookmark,
  Bot,
  Copy,
  Quote,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { SettingsScreen } from './components/SettingsScreen';
import { AppearanceScreen } from './components/AppearanceScreen';
import { PersonaScreen } from './components/PersonaScreen';
import { PhoneListScreen } from './components/PhoneListScreen';
import { WorldBookListScreen } from './components/WorldBookListScreen';
import { WorldBookEditScreen } from './components/WorldBookEditScreen';
import { AiChatScreen } from './components/AiChatScreen';
import { FavoritesScreen } from './components/FavoritesScreen';
import { AddFriendModal } from './components/AddFriendModal';
import { ProfileEditorModal, type CurrentUser } from './components/ProfileEditorModal';
import { WalletActionsModal, type WalletData } from './components/WalletActionsModal';
import { HeartbeatNPC } from './screens/HeartbeatNPC';

import type { ChatMessage } from './types';

// --- Types ---
type Screen = 'splash' | 'lock' | 'password-setup' | 'password-unlock' | 'home' | 'app-chat' | 'app-settings' | 'ai-chat' | 'app-appearance' | 'app-persona' | 'app-phone-list' | 'app-world' | 'app-world-edit' | 'app-favorites' | 'app-heartbeat-npc';

interface FavoriteItem {
  id: string;
  messageId: string;
  contactId: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: number;
}
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

// --- Components ---

const GlassCard = ({ children, className = "", blur, opacity, darkOpacity, ...props }: { children: React.ReactNode, className?: string, blur?: string, opacity?: string, darkOpacity?: string, [key: string]: any }) => {
  // Use global frost intensity if available via CSS variables, otherwise fallback to defaults
  // The global CSS variables are set on the root wrapper
  return (
    <div 
      className={`glass-card shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px] border border-white/20 dark:border-white/10 ${className}`}
      style={{ 
        backdropFilter: blur ? `blur(${blur})` : 'var(--glass-blur, blur(40px))', 
        WebkitBackdropFilter: blur ? `blur(${blur})` : 'var(--glass-blur, blur(40px))',
        '--glass-opacity': opacity || 'var(--glass-base-opacity, 0.2)',
        '--glass-dark-opacity': darkOpacity || 'var(--glass-base-dark-opacity, 0.4)',
      } as React.CSSProperties}
      {...props}
    >
      <div className="glass-noise" />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

const StatusBar = ({ className = "", time }: { className?: string, time: string }) => (
  <div className={`flex justify-between items-center px-8 py-3 font-semibold text-[12px] text-zinc-800 dark:text-zinc-200 backdrop-blur-md ${className}`}>
    <span>{time}</span>
    <div className="flex items-center gap-2">
      <Signal size={14} strokeWidth={2} />
      <Wifi size={14} strokeWidth={2} />
      <Battery size={14} strokeWidth={2} className="rotate-90" />
    </div>
  </div>
);

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return { r, g, b };
};

const AppIcon = ({ 
  icon: Icon, 
  label, 
  onClick, 
  isEditingLayout, 
  customIcon, 
  iconStyleConfig,
  iconFrostIntensity = 60,
  isDragging = false,
}: { 
  icon: any, 
  label: string, 
  onClick?: () => void, 
  isEditingLayout?: boolean, 
  customIcon?: string, 
  iconStyleConfig?: any,
  iconFrostIntensity?: number,
  isDragging?: boolean,
}) => {
  // Default values if config is not enabled or missing
  const size = iconStyleConfig?.isEnabled ? iconStyleConfig.iconSize : 60;
  const radius = iconStyleConfig?.isEnabled ? iconStyleConfig.borderRadius : 20;
  const shadowIntensity = iconStyleConfig?.isEnabled ? iconStyleConfig.shadowIntensity : 0.05;
  
  // Shadow color support
  const shadowColorMode = iconStyleConfig?.isEnabled ? (iconStyleConfig.shadowColorMode || 'auto') : 'auto';
  const shadowLightColor = iconStyleConfig?.isEnabled ? (iconStyleConfig.shadowLightColor || '#4a4a4a') : '#4a4a4a';
  const shadowDarkColor = iconStyleConfig?.isEnabled ? (iconStyleConfig.shadowDarkColor || '#888888') : '#888888';
  
  // Determine shadow color based on mode (check class-based dark mode)
  const isDarkMode = document.documentElement.classList.contains('dark');
  let shadowColorHex: string;
  if (shadowColorMode === 'auto') {
    shadowColorHex = isDarkMode ? '#555555' : '#000000';
  } else {
    shadowColorHex = isDarkMode ? shadowDarkColor : shadowLightColor;
  }
  const shadowRgb = hexToRgb(shadowColorHex);
  
  const iconColorLight = iconStyleConfig?.isEnabled ? (iconStyleConfig.iconLightColor || '#27272a') : '#27272a';
  const iconColorDark = iconStyleConfig?.isEnabled ? (iconStyleConfig.iconDarkColor || '#f4f4f5') : '#f4f4f5';

  // Icon background uses iconStyleConfig settings (NOT componentBgOpacity which is for GlassCards)
  const blurPx = (iconFrostIntensity / 100) * 40;
  const iconBgOpacity = iconStyleConfig?.isEnabled ? iconStyleConfig.bgOpacity : 0.2;
  const bgLightHex = iconStyleConfig?.isEnabled ? (iconStyleConfig.bgLightColor || '#ffffff') : '#ffffff';
  const bgDarkHex = iconStyleConfig?.isEnabled ? (iconStyleConfig.bgDarkColor || '#18181b') : '#18181b';
  
  const lightRgb = hexToRgb(bgLightHex);
  const darkRgb = hexToRgb(bgDarkHex);
  const lightBgColor = iconBgOpacity === 0 ? 'transparent' : `rgba(${lightRgb.r}, ${lightRgb.g}, ${lightRgb.b}, ${iconBgOpacity})`;
  const darkBgColor = iconBgOpacity === 0 ? 'transparent' : `rgba(${darkRgb.r}, ${darkRgb.g}, ${darkRgb.b}, ${iconBgOpacity})`;

  // Wobble animation delay based on label for variation
  const wobbleDelay = (label?.charCodeAt(0) || 0) % 5 * 0.05;

  return (
    <motion.div 
      layout={isEditingLayout && !isDragging}
      animate={isEditingLayout ? { 
        rotate: [0, -1.5, 1.5, -1, 1, 0], 
        scale: isDragging ? 1.1 : 1.0 
      } : { rotate: 0, scale: 1 }}
      transition={isEditingLayout ? { 
        rotate: { repeat: Infinity, duration: 0.4, delay: wobbleDelay, ease: "easeInOut" },
        scale: { duration: 0.2 },
        layout: { type: "spring", stiffness: 300, damping: 25 }
      } : { duration: 0.2 }}
      className={`flex flex-col items-center gap-1.5 cursor-pointer relative select-none ${isDragging ? 'z-50' : ''}`}
      style={{ 
        touchAction: isEditingLayout ? 'none' : 'auto',
        opacity: isDragging ? 0.9 : 1,
      }}
      onClick={isEditingLayout ? undefined : onClick}
    >
      <div 
        className="app-icon-inner flex items-center justify-center overflow-hidden relative border border-white/20 dark:border-white/10"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${radius}px`,
          boxShadow: `0 4px 16px rgba(${shadowRgb.r},${shadowRgb.g},${shadowRgb.b},${shadowIntensity})`,
          backdropFilter: `blur(${blurPx}px)`,
          WebkitBackdropFilter: `blur(${blurPx}px)`,
          '--icon-light-bg': lightBgColor,
          '--icon-dark-bg': darkBgColor,
          '--icon-color-light': iconColorLight,
          '--icon-color-dark': iconColorDark,
        } as React.CSSProperties}
      >
        {customIcon ? (
          <img src={customIcon} alt={label} className="w-full h-full object-cover z-10 relative" />
        ) : (
          <Icon size={Math.max(20, size * 0.45)} strokeWidth={1.2} className="app-icon-icon z-10 relative" />
        )}
      </div>
      {label && <span className="text-[10px] text-zinc-800 dark:text-zinc-100 font-bold tracking-tight drop-shadow-sm mt-1">{label}</span>}
      {isEditingLayout && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-800 dark:bg-zinc-700 text-white rounded-full flex items-center justify-center shadow-lg z-20">
          <Plus size={12} className="rotate-45" />
        </div>
      )}
    </motion.div>
  );
};

// Define home screen app list
interface HomeAppItem {
  id: string;
  icon: any;
  label: string;
  screen?: string;
}

const DEFAULT_HOME_APPS: HomeAppItem[] = [
  { id: 'chat', icon: MessageCircle, label: '聊天', screen: 'app-chat' },
  { id: 'music', icon: Music, label: '音乐' },
  { id: 'notes', icon: FileText, label: '备忘录' },
  { id: 'photos', icon: ImageIcon, label: '相册' },
  { id: 'world', icon: BookOpen, label: '世界书', screen: 'app-world' },
  { id: 'settings', icon: Settings, label: '设置', screen: 'app-settings' },
  { id: 'appearance', icon: Palette, label: '外观', screen: 'app-appearance' },
  { id: 'heartbeat-npc', icon: Heart, label: '心动NPC', screen: 'app-heartbeat-npc' },
];

const DEFAULT_DOCK_APPS: HomeAppItem[] = [
  { id: 'dock-phone', icon: Phone, label: '', screen: 'app-phone-list' },
  { id: 'dock-chat', icon: MessageCircle, label: '', screen: 'app-chat' },
  { id: 'dock-browser', icon: Globe, label: '' },
  { id: 'dock-ai', icon: Sparkles, label: '' },
];

// Reorderable Grid Component
const ReorderableGrid = ({ 
  items, 
  onReorder, 
  isEditingLayout, 
  customIcons, 
  iconStyleConfig, 
  iconFrostIntensity, 
  onAppClick,
  gridRef 
}: {
  items: HomeAppItem[];
  onReorder: (newItems: HomeAppItem[]) => void;
  isEditingLayout: boolean;
  customIcons: Record<string, string>;
  iconStyleConfig: any;
  iconFrostIntensity: number;
  onAppClick: (screen?: string) => void;
  gridRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getGridPosition = (clientX: number, clientY: number): number | null => {
    if (!gridRef.current) return null;
    const gridRect = gridRef.current.getBoundingClientRect();
    const col = Math.floor((clientX - gridRect.left) / (gridRect.width / 4));
    const rows = Math.ceil(items.length / 4);
    const rowHeight = gridRect.height / Math.max(rows, 1);
    const row = Math.floor((clientY - gridRect.top) / rowHeight);
    const index = row * 4 + col;
    if (col < 0 || col >= 4 || row < 0 || index >= items.length || index < 0) return null;
    return index;
  };

  const handleDragStart = (index: number) => {
    if (!isEditingLayout) return;
    setDragIndex(index);
  };

  const handleDrag = (e: any, info: any, index: number) => {
    if (!isEditingLayout || dragIndex === null) return;
    const element = itemRefs.current[index];
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const newOverIndex = getGridPosition(centerX, centerY);
    if (newOverIndex !== null && newOverIndex !== overIndex) {
      setOverIndex(newOverIndex);
    }
  };

  const handleDragEnd = (index: number) => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const newItems = [...items];
      const [draggedItem] = newItems.splice(dragIndex, 1);
      newItems.splice(overIndex, 0, draggedItem);
      onReorder(newItems);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div ref={gridRef} className="flex-1 grid grid-cols-4 gap-y-6 px-6 py-6 content-start">
      {items.map((app, index) => {
        const iconId = app.id.replace('dock-', '');
        return (
          <motion.div 
            key={app.id}
            ref={(el: HTMLDivElement | null) => { itemRefs.current[index] = el; }}
            className="app-icon-container flex justify-center"
            drag={isEditingLayout}
            dragConstraints={gridRef}
            dragElastic={0.1}
            dragMomentum={false}
            dragSnapToOrigin={true}
            dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
            onDragStart={() => handleDragStart(index)}
            onDrag={(e, info) => handleDrag(e, info, index)}
            onDragEnd={() => handleDragEnd(index)}
            whileDrag={{ scale: 1.1, zIndex: 50 }}
            layout
            transition={{ layout: { type: "spring", stiffness: 300, damping: 25 } }}
          >
            <AppIcon 
              icon={app.icon} 
              label={app.label} 
              onClick={() => onAppClick(app.screen)} 
              isEditingLayout={isEditingLayout} 
              customIcon={customIcons[iconId]} 
              iconStyleConfig={iconStyleConfig} 
              iconFrostIntensity={iconFrostIntensity}
              isDragging={dragIndex === index}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

const ChatListItem = ({ name, msg, time, unread = 0, avatar }: any) => (
  <div className="flex items-center gap-4 p-4 hover:bg-neutral-100 dark:hover:bg-zinc-800/50 active:bg-neutral-200 dark:active:bg-zinc-800 transition-colors cursor-pointer border-b border-neutral-200 dark:border-zinc-800 last:border-b-0">
    <div className="w-[56px] h-[56px] rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 flex-shrink-0 overflow-hidden">
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <User size={28} strokeWidth={1.5} />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-0.5">
        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[14px]">{name}</span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{time}</span>
      </div>
      <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate font-medium">{msg}</p>
    </div>
    {unread > 0 && (
      <div className="w-5 h-5 bg-zinc-800 dark:bg-zinc-200 rounded-full flex items-center justify-center">
        <span className="text-[10px] text-white dark:text-zinc-800 font-bold">{unread}</span>
      </div>
    )}
  </div>
);

export default function App() {
  const [themeMode, setThemeMode] = useState<'system'|'light'|'dark'>(() => {
    return (localStorage.getItem('aiphone_theme_mode') as any) || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (mode: string) => {
      if (mode === 'dark') {
        root.classList.add('dark');
      } else if (mode === 'light') {
        root.classList.remove('dark');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    
    applyTheme(themeMode);
    localStorage.setItem('aiphone_theme_mode', themeMode);

    // 监听系统变化
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { 
      if (themeMode === 'system') applyTheme('system'); 
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [themeMode]);

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
  const [homeApps, setHomeApps] = useState<HomeAppItem[]>(() => {
    const saved = localStorage.getItem('aiphone_home_app_order');
    if (saved) {
      try {
        const savedOrder: string[] = JSON.parse(saved);
        // Reconstruct from saved order, keeping icon/label data from defaults
        const appMap = new Map(DEFAULT_HOME_APPS.map(a => [a.id, a]));
        const ordered = savedOrder.map(id => appMap.get(id)).filter(Boolean) as HomeAppItem[];
        // Add any new apps not in saved order
        DEFAULT_HOME_APPS.forEach(a => {
          if (!ordered.find(o => o.id === a.id)) ordered.push(a);
        });
        return ordered;
      } catch { return [...DEFAULT_HOME_APPS]; }
    }
    return [...DEFAULT_HOME_APPS];
  });
  const gridRef = useRef<HTMLDivElement>(null);
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

  // Helper to ensure messages have id and timestamp
  const migrateMessages = (msgs: any[]): any[] => {
    if (!Array.isArray(msgs)) return [];
    return msgs.map((m, i) => ({
      ...m,
      id: m.id || `migrated_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: m.timestamp || Date.now() - (msgs.length - i) * 1000,
    }));
  };

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showContactsMenu, setShowContactsMenu] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  // Home Screen Customization State
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem('aiphone_avatar'));
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => {
    const saved = localStorage.getItem('aiphone_current_user');
    if (saved) return JSON.parse(saved);
    return {
      avatar: localStorage.getItem('aiphone_avatar') || null,
      name: 'AI User',
      chatId: 'aiphone_001',
      gender: '',
      age: '',
      occupation: '',
      location: '',
      personality: '',
      background: ''
    };
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('aiphone_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Wallet State
  const [wallet, setWallet] = useState<WalletData>(() => {
    const saved = localStorage.getItem('aiphone_wallet');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        balance: parsed.balance || 0,
        transactions: parsed.transactions || []
      };
    }
    return {
      balance: 8888.00,
      transactions: []
    };
  });
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('aiphone_wallet', JSON.stringify(wallet));
  }, [wallet]);

  const [wallpaper, setWallpaper] = useState<string | null>(() => localStorage.getItem('aiphone_wallpaper'));
  const [motto, setMotto] = useState(() => localStorage.getItem('aiphone_motto') || '生活明朗，万物可爱');
  const [fontLink, setFontLink] = useState(() => localStorage.getItem('aiphone_font_link') || '');
  const [customIcons, setCustomIcons] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('aiphone_custom_icons');
    return saved ? JSON.parse(saved) : {};
  });
  const [iconStyleConfig, setIconStyleConfig] = useState<any>(() => {
    const saved = localStorage.getItem('aiphone_icon_style_config');
    return saved ? JSON.parse(saved) : {
      isEnabled: true,
      borderRadius: 20,
      iconSize: 60,
      bgOpacity: 0.2,
      bgLightColor: '#ffffff',
      bgDarkColor: '#000000',
      shadowIntensity: 0.05,
      iconLightColor: '#27272a',
      iconDarkColor: '#f4f4f5'
    };
  });
  const [frostIntensity, setFrostIntensity] = useState<number>(() => {
    const saved = localStorage.getItem('aiphone_frost_intensity');
    return saved !== null ? Number(saved) : 60;
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

  // 主屏幕图标组件样式状态
  const [iconFrostIntensity, setIconFrostIntensity] = useState<number>(() => {
    const saved = localStorage.getItem('iconFrostIntensity');
    return saved !== null ? Number(saved) : 60;
  });
  const [componentBgOpacity, setComponentBgOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('componentBgOpacity');
    return saved !== null ? Number(saved) : 0.3;
  });
  
  const [baseFontSize, setBaseFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('aiphone_font_size');
    return saved !== null ? Number(saved) : 16;
  });
  const [baseFontColor, setBaseFontColor] = useState<string>(() => {
    return localStorage.getItem('aiphone_font_color') || '';
  });

  // 监听 localStorage 变化以实现实时响应
  useEffect(() => {
    const handleStorageChange = () => {
      const savedIconFrost = localStorage.getItem('iconFrostIntensity');
      if (savedIconFrost !== null) {
        setIconFrostIntensity(Number(savedIconFrost));
      }
      
      const savedOpacity = localStorage.getItem('componentBgOpacity');
      if (savedOpacity !== null) {
        setComponentBgOpacity(Number(savedOpacity));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // 轮询以便在同一个标签页中获取本地存储的更新
    const interval = setInterval(handleStorageChange, 200);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
    localStorage.setItem('aiphone_icon_style_config', JSON.stringify(iconStyleConfig));
  }, [iconStyleConfig]);

  useEffect(() => {
    localStorage.setItem('aiphone_frost_intensity', frostIntensity.toString());
  }, [frostIntensity]);

  useEffect(() => {
    localStorage.setItem('iconFrostIntensity', iconFrostIntensity.toString());
  }, [iconFrostIntensity]);

  useEffect(() => {
    localStorage.setItem('aiphone_font_size', baseFontSize.toString());
    document.documentElement.style.setProperty('--base-font-size', `${baseFontSize}px`);
  }, [baseFontSize]);

  useEffect(() => {
    localStorage.setItem('aiphone_font_color', baseFontColor);
    if (baseFontColor) {
      document.documentElement.style.setProperty('--base-font-color', baseFontColor);
      document.documentElement.classList.add('custom-font-color');
    } else {
      document.documentElement.style.removeProperty('--base-font-color');
      document.documentElement.classList.remove('custom-font-color');
    }
  }, [baseFontColor]);

  useEffect(() => {
    localStorage.setItem('aiphone_home_app_order', JSON.stringify(homeApps.map(a => a.id)));
  }, [homeApps]);

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

  const compressImage = (file: File, maxWidth: number = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            reject(new Error('Canvas context not available'));
          }
        };
        img.onerror = () => reject(new Error('Image load failed'));
      };
      reader.onerror = () => reject(new Error('File read failed'));
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800);
        setAvatar(compressed);
        setCurrentUser(prev => ({ ...prev, avatar: compressed }));
      } catch (err) {
        console.error('Failed to process avatar:', err);
        alert('图片处理失败，请重试');
      }
    }
  };

  const handleWallpaperChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1024);
        setWallpaper(compressed);
      } catch (err) {
        console.error('Failed to process wallpaper:', err);
        setWallpaper(null);
        alert('图片加载失败，已恢复默认背景');
      }
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
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('aiphone_chat_histories');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate all histories
      const migrated: Record<string, any[]> = {};
      for (const [key, msgs] of Object.entries(parsed)) {
        migrated[key] = migrateMessages(msgs as any[]);
      }
      return migrated;
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('aiphone_chat_histories', JSON.stringify(chatHistories));
  }, [chatHistories]);

  const [chatMemories, setChatMemories] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem('aiphone_chat_memories');
    if (saved) return JSON.parse(saved);
    
    // Migration from old summaries
    const oldSummariesStr = localStorage.getItem('aiphone_chat_summaries');
    if (oldSummariesStr) {
      try {
        const oldSummaries = JSON.parse(oldSummariesStr);
        const migrated: Record<string, any[]> = {};
        for (const [chatId, text] of Object.entries(oldSummaries)) {
          if (typeof text === 'string' && text.trim()) {
            migrated[chatId] = [{
              id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
              title: '旧记忆',
              content: text,
              keywords: [],
              createdAt: Date.now(),
              isPinned: false
            }];
          }
        }
        localStorage.removeItem('aiphone_chat_summaries');
        return migrated;
      } catch (e) {}
    }
    return {};
  });


  const [chatSettings, setChatSettings] = useState<Record<string, { remark: string, background: string, isBlocked: boolean, isPinned: boolean, isAutoSummaryEnabled?: boolean, autoSummaryThreshold?: number, lastSummaryMessageIndex?: number }>>(() => {
    const saved = localStorage.getItem('aiphone_chat_settings');
    return saved ? JSON.parse(saved) : {};
  });

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem('aiphone_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [showFavoritesScreen, setShowFavoritesScreen] = useState(false);

  // Determine if we're past the auth flow
  const isPostAuth = !['splash', 'lock', 'password-setup', 'password-unlock'].includes(screen);









  useEffect(() => {
    localStorage.setItem('aiphone_chat_memories', JSON.stringify(chatMemories));
  }, [chatMemories]);

  useEffect(() => {
    localStorage.setItem('aiphone_chat_settings', JSON.stringify(chatSettings));
  }, [chatSettings]);

  useEffect(() => {
    localStorage.setItem('aiphone_favorites', JSON.stringify(favorites));
  }, [favorites]);

  return (
    <div 
    className="relative w-full h-full bg-zinc-50 dark:bg-black flex items-center justify-center overflow-hidden font-sans"
      style={{ 
        fontFamily: 'var(--custom-font-family, inherit)'
      }}
    >
      {/* Mobile Frame */}
      <div id="phone-container" className={`relative w-full h-full max-w-[390px] max-h-[844px] sm:h-[844px] sm:rounded-[44px] sm:border-[12px] sm:border-white dark:sm:border-zinc-800 sm:shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:sm:shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden ${wallpaper ? 'bg-black' : 'bg-zinc-100 dark:bg-black'}`}>
        
        <AnimatePresence mode="wait">
          {/* 1. Splash Screen */}
          {screen === 'splash' && (
            <motion.div 
              key="splash"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              transition={{ duration: 0 }}
              className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center gap-8"
              >
                <h1
                  className="text-5xl sm:text-6xl font-light tracking-wider text-zinc-800 dark:text-zinc-100"
                  style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
                >
                  puppy
                </h1>
                
                <div className="w-32 h-[2px] bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    className="h-full bg-zinc-800 dark:bg-zinc-200"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* 2. Lock Screen */}
          {screen === 'lock' && (
            <motion.div 
              key="lock"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              transition={{ duration: 0 }}
              className={`absolute inset-0 flex flex-col ${wallpaper ? 'bg-black' : 'bg-zinc-100 dark:bg-black'}`}
              onClick={() => {
                if (!isPasswordEnabled) {
                  setScreen('home');
                } else {
                  setScreen(password ? 'password-unlock' : 'password-setup');
                }
              }}
            >
              {wallpaper ? (
                <img 
                  src={wallpaper} 
                  alt="wallpaper" 
                  className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" 
                  onError={(e) => { 
                    (e.target as HTMLImageElement).style.display = 'none'; 
                    setWallpaper(null);
                    alert('图片加载失败，已恢复默认背景');
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200 dark:from-black dark:via-zinc-900 dark:to-black pointer-events-none transition-colors" />
              )}
              <StatusBar time={time} className={`z-10 ${wallpaper ? 'text-white' : 'bg-white/10 dark:bg-black/10 text-zinc-800 dark:text-zinc-200'}`} />
              
              <div className="flex-1 flex flex-col items-center justify-start pt-24 relative z-10">
                <span className={`text-[84px] font-thin tracking-tighter leading-none ${wallpaper ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>{time}</span>
                <span className={`text-sm font-medium mt-4 tracking-[0.2em] uppercase ${wallpaper ? 'text-white/80' : 'text-zinc-500 dark:text-zinc-400'}`}>{date}</span>
              </div>

              <div className="pb-14 flex justify-center z-10">
                <motion.div 
                  animate={{ y: [0, -8, 0] }} 
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className={`w-14 h-1 rounded-full ${wallpaper ? 'bg-white/50' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                  <span className={`text-[9px] font-bold tracking-[0.3em] uppercase ${wallpaper ? 'text-white/60' : 'text-zinc-400 dark:text-zinc-500'}`}>Slide to Unlock</span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* 3 & 4. Password Screen */}
          {(screen === 'password-setup' || screen === 'password-unlock') && (
            <motion.div 
              key="password"
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 1 }}
              transition={{ duration: 0 }}
              className="absolute inset-0 bg-white dark:bg-black flex flex-col items-center justify-center"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-zinc-50/50 dark:bg-black/50" />
              
              <GlassCard className="w-full max-w-[350px] flex flex-col items-center p-12" blur="40px" opacity="0.6">
                <div className="flex flex-col items-center mb-10">
                  <div className="text-zinc-600 dark:text-zinc-300 mb-6">
                    {screen === 'password-setup' ? <Lock size={40} strokeWidth={1} /> : <Unlock size={40} strokeWidth={1} />}
                  </div>
                  <h2 className="text-xl font-light text-zinc-600 dark:text-zinc-200 tracking-widest mb-2">
                    {screen === 'password-setup' ? (setupStep === 'first' ? '设置密码' : '确认密码') : '输入密码'}
                  </h2>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold tracking-widest uppercase">
                    {screen === 'password-setup' ? 'Security Configuration' : 'Identity Verification'}
                  </p>
                </div>

                <div className="flex gap-5 mb-6">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2.5 h-2.5 rounded-full border transition-all duration-400 ${
                        i < input.length 
                          ? 'bg-zinc-500 dark:bg-zinc-400 border-zinc-500 dark:border-zinc-400 scale-125 shadow-sm' 
                          : 'border-zinc-200 dark:border-zinc-700 bg-transparent'
                      } ${error ? 'border-red-400 dark:border-red-500 bg-red-400 dark:bg-red-500 animate-shake' : ''}`} 
                    />
                  ))}
                </div>

                <div className="h-6 text-[9px] font-bold text-red-400 dark:text-red-500 mb-6 tracking-[0.2em] uppercase">{error}</div>

                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0].map((num, i) => (
                    num === '' ? <div key={i} /> : (
                      <button 
                        key={i}
                        onClick={() => handleNumpad(num.toString())}
                        className="w-[74px] h-[74px] rounded-full border border-white dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-2xl flex flex-col items-center justify-center text-zinc-600 dark:text-zinc-200 text-2xl font-light active:bg-zinc-100 dark:active:bg-zinc-700 active:scale-90 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                      >
                        {num}
                        <span className="text-[7px] tracking-[0.3em] text-zinc-300 dark:text-zinc-500 font-bold uppercase mt-1">
                          {num === 2 ? 'ABC' : num === 3 ? 'DEF' : num === 4 ? 'GHI' : num === 5 ? 'JKL' : num === 6 ? 'MNO' : num === 7 ? 'PQRS' : num === 8 ? 'TUV' : num === 9 ? 'WXYZ' : ''}
                        </span>
                      </button>
                    )
                  ))}
                  <button 
                    onClick={handleDelete}
                    className="w-[74px] h-[74px] flex items-center justify-center text-zinc-400 dark:text-zinc-500 active:text-zinc-800 dark:active:text-zinc-300 active:scale-75 transition-all"
                  >
                    <Delete size={20} strokeWidth={1} />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== Layer 2: Home Screen (always rendered when past auth) ===== */}
        {isPostAuth && (
          <div 
            className={`absolute inset-0 flex flex-col ${wallpaper ? 'bg-black' : 'bg-zinc-100 dark:bg-zinc-900'}`}
              onContextMenu={(e) => e.preventDefault()}
            >
              {wallpaper ? (
                <>
                  <img 
                    src={wallpaper} 
                    alt="wallpaper" 
                    className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" 
                    onError={(e) => { 
                      (e.target as HTMLImageElement).style.display = 'none'; 
                      setWallpaper(null);
                      alert('图片加载失败，已恢复默认背景');
                    }}
                  />
                  {/* 用户自定义壁纸不再叠加深浅模式遮罩 */}
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 pointer-events-none transition-colors duration-300" />
              )}
              
              <input 
                type="file" 
                ref={wallpaperInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleWallpaperChange} 
              />

              <StatusBar time={time} className={`z-10 ${wallpaper ? 'text-white' : 'backdrop-blur-xl bg-white/20 dark:bg-black/20 text-zinc-800 dark:text-zinc-200'}`} />
              
              <div 
                className="flex-1 flex flex-col relative z-10"
                onDoubleClick={(e) => {
                  const target = e.target as HTMLElement;
                  const isInteractive = target.closest('button') || target.closest('input') || target.closest('.app-icon-container') || target.closest('.widget-container');
                  if (!isInteractive) {
                    if (isEditingLayout) {
                      setIsEditingLayout(false);
                    } else {
                      setIsEditingLayout(true);
                    }
                  }
                }}
                onClick={(e) => {
                  if (isEditingLayout) return; // Don't trigger wallpaper change in edit mode
                  const target = e.target as HTMLElement;
                  const isInteractive = target.closest('button') || target.closest('input') || target.closest('.app-icon-container') || target.closest('.widget-container');
                  if (!isInteractive) {
                    wallpaperInputRef.current?.click();
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
                  <GlassCard className="p-6">
                    <div className="flex flex-row items-center justify-between w-full">
                      {/* Time & Weather Section */}
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <span className="font-thin text-zinc-800 dark:text-white drop-shadow-sm tracking-tighter leading-none" style={{ fontSize: '48px' }}>{time}</span>
                        <span className="font-bold text-zinc-600 dark:text-zinc-200 drop-shadow-sm tracking-[0.3em] uppercase mt-2" style={{ fontSize: '9px' }}>{date}</span>
                        <div className="mt-4 pt-3 flex items-center gap-3">
                          <CloudSun className="text-zinc-500 dark:text-zinc-300 flex-shrink-0" size={16} strokeWidth={1} />
                          <div className="flex gap-2 items-center">
                            <span className="font-light text-zinc-700 dark:text-zinc-100 drop-shadow-sm whitespace-nowrap" style={{ fontSize: '20px' }}>22°</span>
                            <span className="font-bold text-zinc-500 dark:text-zinc-300 drop-shadow-sm tracking-[0.2em] uppercase whitespace-nowrap" style={{ fontSize: '8px' }}>Cloudy</span>
                          </div>
                        </div>
                      </div>

                      {/* Avatar & Motto Section */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-3">
                        <label className="cursor-pointer group relative">
                          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                          <div className="w-[96px] h-[96px] rounded-[32px] bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/20 flex items-center justify-center text-zinc-400 dark:text-zinc-300 overflow-hidden group-hover:bg-white/50 dark:group-hover:bg-black/40 transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                            {avatar ? (
                              <img src={avatar} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <CircleUserRound size={48} strokeWidth={1} />
                            )}
                          </div>
                          {isEditingLayout && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-300 shadow-sm">
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
                            className="w-full bg-transparent border-none outline-none text-zinc-600 dark:text-zinc-200 drop-shadow-sm text-center font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            placeholder="点击输入文案"
                          />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* App Grid - Reorderable */}
                <ReorderableGrid
                  items={homeApps}
                  onReorder={setHomeApps}
                  isEditingLayout={isEditingLayout}
                  customIcons={customIcons}
                  iconStyleConfig={iconStyleConfig}
                  iconFrostIntensity={iconFrostIntensity}
                  onAppClick={(screen) => { if (screen) setScreen(screen as Screen); }}
                  gridRef={gridRef}
                />

                {/* Page Indicator */}
                <div className="flex justify-center gap-2.5 py-4">
                  <div className="w-8 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
                  <div className="w-1.5 h-1 bg-zinc-100 dark:bg-zinc-700 rounded-full" />
                </div>

                {/* Dock */}
                <div className="mx-4 mb-2">
                  <GlassCard className="p-3 rounded-[32px]">
                    <div className="flex flex-row justify-around items-center">
                      {DEFAULT_DOCK_APPS.map(app => {
                        const iconId = app.id.replace('dock-', '');
                        return (
                          <div key={app.id} className="app-icon-container">
                            <AppIcon 
                              icon={app.icon} 
                              label="" 
                              onClick={() => { if (app.screen) setScreen(app.screen as Screen); }} 
                              isEditingLayout={isEditingLayout} 
                              customIcon={customIcons[iconId]} 
                              iconStyleConfig={iconStyleConfig} 
                              iconFrostIntensity={iconFrostIntensity} 
                            />
                          </div>
                        );
                      })}
                    </div>
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
                      className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-full text-xs font-bold text-zinc-500 dark:text-zinc-300 shadow-lg border border-white dark:border-zinc-700 active:scale-95 transition-all z-50"
                    >
                      完成
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Home Indicator */}
              <div className="w-32 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto my-4" />
              </div>
          </div>
        )}

        {/* ===== Layer 3: Overlay screens (slide on top of home) ===== */}
        <AnimatePresence>
          {/* 6. Chat App (Integrated Moments & Wallet) */}
          {screen === 'app-chat' && (
            <motion.div 
              key="app-chat"
              initial={{ y: 0 }}
              animate={{ y: 0 }}
              exit={{ y: 0 }}
              transition={{ duration: 0 }}
              className="absolute inset-0 bg-neutral-50 dark:bg-black flex flex-col z-50"
            >
              <StatusBar time={time} className="bg-white/80 dark:bg-black/80 text-black dark:text-zinc-200 backdrop-blur-md z-10" />
              
              {/* Top Nav */}
              <div className="px-6 py-4 flex justify-between items-center bg-white dark:bg-black border-none">
                <div className="w-10">
                  <button onClick={() => setScreen('home')} className="p-1.5 bg-white dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 active:text-zinc-800 dark:active:text-white transition-colors shadow-sm">
                    <LogOut size={18} strokeWidth={1.5} />
                  </button>
                </div>
                <h2 className="text-[16px] font-bold text-zinc-800 dark:text-zinc-100 flex-1 text-center">
                  {chatTab === 'messages' && '消息'}
                  {chatTab === 'contacts' && '通讯录'}
                  {chatTab === 'moments' && '朋友圈'}
                  {chatTab === 'me' && '个人中心'}
                </h2>
                <div className="flex gap-4 items-center w-10 justify-end relative">
                  {chatTab === 'messages' && <Plus size={20} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer" strokeWidth={1.5} />}
                  {chatTab === 'contacts' && (
                    <>
                      <button onClick={() => setShowContactsMenu(prev => !prev)}>
                        <Plus size={20} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer" strokeWidth={1.5} />
                      </button>
                      {showContactsMenu && (
                        <>
                          <div className="absolute inset-0 z-40" onClick={() => setShowContactsMenu(false)} />
                          <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50 overflow-hidden">
                            <button 
                              className="w-full px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-left cursor-not-allowed"
                              disabled
                            >
                              发起群聊
                            </button>
                            <div className="h-px bg-gray-100 dark:bg-gray-700" />
                            <button 
                              className="w-full px-4 py-3 text-sm text-gray-800 dark:text-gray-200 text-left hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
                              onClick={() => {
                                setShowContactsMenu(false);
                                setShowAddFriendModal(true);
                              }}
                            >
                              添加好友
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-black/50 backdrop-blur-2xl pb-20">
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
                                      setScreen('ai-chat');
                                    }} className={aiSettings.isPinned ? 'bg-zinc-50/80 dark:bg-zinc-900/50' : ''}>
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
                                      setScreen('ai-chat');
                                    }} className={contactSettings.isPinned ? 'bg-zinc-50/80 dark:bg-zinc-900/50' : ''}>
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
                      <div className="flex flex-col bg-neutral-50 dark:bg-black min-h-full">
                        {/* Section Header */}
                        <div className="px-5 pt-3 pb-1">
                          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider uppercase">联系人</span>
                        </div>

                        <div className="px-4 py-2 flex flex-col gap-3">
                          {/* Contact List */}
                          {contacts.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <Users size={36} strokeWidth={1} className="text-gray-300 dark:text-gray-600" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">暂无好友</p>
                                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">点击上方添加好友开始聊天</p>
                              </div>
                            </div>
                          ) : (
                            [...contacts].sort((a, b) => a.chatName.localeCompare(b.chatName, 'zh-Hans-CN')).map(contact => (
                              <div 
                                key={contact.id} 
                                onClick={() => {
                                  setActiveChatContact(contact);
                                  setScreen('ai-chat');
                                }}
                                className="bg-white dark:bg-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                    {contact.avatar ? (
                                      <img className="w-full h-full rounded-full object-cover" src={contact.avatar} alt={contact.chatName} />
                                    ) : (
                                      <User size={24} className="text-gray-400 dark:text-gray-500" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="block text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate">{contact.chatName}</span>
                                    <span className="block text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{contact.bio || contact.chatId}</span>
                                  </div>
                                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
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
                                  <h4 className="font-bold text-zinc-800 dark:text-zinc-100 mb-1" style={{ fontSize: '14px' }}>{contact.chatName}</h4>
                                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">极致纯白，通透如冰。这就是我们追求的未来感设计语言。#纯白 #毛玻璃 #UI设计</p>
                                  <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="aspect-square bg-white/20 backdrop-blur-sm rounded-lg border border-white/20" />
                                    <div className="aspect-square bg-white/10 backdrop-blur-sm rounded-lg border border-white/10" />
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">2小时前</span>
                                    <div className="flex gap-4">
                                      <Heart size={18} className="text-zinc-400 dark:text-zinc-500 hover:text-red-400 transition-colors cursor-pointer" />
                                      <MessageSquare size={18} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer" />
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
                      <div className="flex flex-col gap-6 p-6 bg-white dark:bg-black min-h-full">
                        <div 
                          className="flex items-center justify-between p-4 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md rounded-2xl active:bg-white/60 dark:active:bg-zinc-700/60 transition-colors border border-white/40 dark:border-zinc-700 shadow-none cursor-pointer"
                          onClick={() => setShowProfileModal(true)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-[64px] h-[64px] rounded-full bg-white/60 dark:bg-zinc-700/60 backdrop-blur-md border border-white/60 dark:border-zinc-600 flex items-center justify-center text-zinc-400 dark:text-zinc-500 flex-shrink-0 overflow-hidden shadow-sm">
                              {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : <CircleUserRound size={32} strokeWidth={1} />}
                            </div>
                            <div className="flex flex-col justify-center">
                              <h3 className="font-bold text-zinc-800 dark:text-zinc-100" style={{ fontSize: '18px' }}>{currentUser.name}</h3>
                              <p className="text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-widest" style={{ fontSize: '10px' }}>ID: {currentUser.chatId}</p>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-zinc-400 dark:text-zinc-500" />
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md rounded-2xl active:bg-white/60 dark:active:bg-zinc-700/60 transition-colors border border-white/40 dark:border-zinc-700 shadow-none cursor-pointer" onClick={() => setShowWalletModal(true)}>
                            <div className="flex items-center gap-4">
                              <Wallet size={20} className="text-zinc-600 dark:text-zinc-300" strokeWidth={1.5} />
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">钱包</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">¥ {wallet.balance.toFixed(2)}</span>
                              <ChevronRight size={16} className="text-zinc-400 dark:text-zinc-500" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md rounded-2xl active:bg-white/60 dark:active:bg-zinc-700/60 transition-colors border border-white/40 dark:border-zinc-700 shadow-none">
                            <div className="flex items-center gap-4">
                              <CreditCard size={20} className="text-zinc-600 dark:text-zinc-300" strokeWidth={1.5} />
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">卡包</span>
                            </div>
                            <ChevronRight size={16} className="text-zinc-400 dark:text-zinc-500" />
                          </div>
                          <div 
                            className="flex items-center justify-between p-4 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md rounded-2xl active:bg-white/60 dark:active:bg-zinc-700/60 transition-colors border border-white/40 dark:border-zinc-700 shadow-none cursor-pointer"
                            onClick={() => setShowFavoritesScreen(true)}
                          >
                            <div className="flex items-center gap-4">
                              <Star size={20} className="text-zinc-600 dark:text-zinc-300" strokeWidth={1.5} />
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">我的收藏</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {favorites.length > 0 && (
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">{favorites.length} 条</span>
                              )}
                              <ChevronRight size={16} className="text-zinc-400 dark:text-zinc-500" />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md rounded-2xl active:bg-white/60 dark:active:bg-zinc-700/60 transition-colors border border-white/40 dark:border-zinc-700 shadow-none">
                            <div className="flex items-center gap-4">
                              <ShieldCheck size={20} className="text-zinc-600 dark:text-zinc-300" strokeWidth={1.5} />
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">支付安全</span>
                            </div>
                            <ChevronRight size={16} className="text-zinc-400 dark:text-zinc-500" />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md rounded-2xl active:bg-white/60 dark:active:bg-zinc-700/60 transition-colors border border-white/40 dark:border-zinc-700 shadow-none">
                            <div className="flex items-center gap-4">
                              <Settings size={20} className="text-zinc-600 dark:text-zinc-300" strokeWidth={1.5} />
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">设置</span>
                            </div>
                            <ChevronRight size={16} className="text-zinc-400 dark:text-zinc-500" />
                          </div>
                        </div>

                        <button 
                          onClick={() => setScreen('home')}
                          className="mt-4 p-4 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md rounded-2xl text-zinc-500 dark:text-zinc-400 font-bold text-sm active:bg-white/60 dark:active:bg-zinc-700/60 transition-colors flex items-center justify-center gap-2 border border-white/40 dark:border-zinc-700 shadow-none"
                        >
                          <LogOut size={18} />
                          退出应用
                        </button>
                      </div>
                    )}
              </div>

              {/* Bottom Tab Bar */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-xl py-1 px-4 flex justify-around items-center z-50">
                <button onClick={() => setChatTab('messages')} className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${chatTab === 'messages' ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                  <MessageSquare size={20} strokeWidth={chatTab === 'messages' ? 2 : 1.5} />
                  <span className="text-[9px] font-bold">消息</span>
                </button>
                <button onClick={() => setChatTab('contacts')} className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${chatTab === 'contacts' ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                  <Users size={20} strokeWidth={chatTab === 'contacts' ? 2 : 1.5} />
                  <span className="text-[9px] font-bold">通讯录</span>
                </button>
                <button onClick={() => setChatTab('moments')} className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${chatTab === 'moments' ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                  <Camera size={20} strokeWidth={chatTab === 'moments' ? 2 : 1.5} />
                  <span className="text-[9px] font-bold">朋友圈</span>
                </button>
                <button onClick={() => setChatTab('me')} className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${chatTab === 'me' ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                  <User size={20} strokeWidth={chatTab === 'me' ? 2 : 1.5} />
                  <span className="text-[9px] font-bold">我</span>
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
              password={password}
              setPassword={setPassword}
              wallpaper={wallpaper}
              setWallpaper={setWallpaper}
              fontLink={fontLink}
              setFontLink={setFontLink}
              customIcons={customIcons}
              setCustomIcons={setCustomIcons}
              iconStyleConfig={iconStyleConfig}
              setIconStyleConfig={setIconStyleConfig}
              iconFrostIntensity={iconFrostIntensity}
              setIconFrostIntensity={setIconFrostIntensity}
              frostIntensity={frostIntensity}
              setFrostIntensity={setFrostIntensity}
              componentBgOpacity={componentBgOpacity}
              setComponentBgOpacity={setComponentBgOpacity}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              baseFontSize={baseFontSize}
              setBaseFontSize={setBaseFontSize}
              baseFontColor={baseFontColor}
              setBaseFontColor={setBaseFontColor}
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

          {/* 8. AI Chat Screen */}
          {screen === 'ai-chat' && (
            <motion.div
              key="ai-chat"
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: 0 }}
              transition={{ duration: 0 }}
              className="absolute inset-0 z-50"
            >
              <AiChatScreen
            activeChatContact={activeChatContact}
            setActiveChatContact={setActiveChatContact}
            chatHistories={chatHistories}
            setChatHistories={setChatHistories}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            chatSettings={chatSettings}
            setChatSettings={setChatSettings}
            chatMemories={chatMemories}
            setChatMemories={setChatMemories}
            apiConfig={apiConfig}
            worldBooks={worldBooks}
            setScreen={setScreen}
            favorites={favorites}
            setFavorites={setFavorites}
                phonePersonas={phonePersonas}
              />
            </motion.div>
          )}

          {/* 9. Heartbeat NPC Screen */}
          {screen === 'app-heartbeat-npc' && (
            <motion.div
              key="app-heartbeat-npc"
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: 0 }}
              transition={{ duration: 0 }}
              className="absolute inset-0 z-50"
            >
              <HeartbeatNPC 
                apiConfig={apiConfig}
                setScreen={setScreen}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Friend Modal */}
        <AddFriendModal
          isOpen={showAddFriendModal}
          onClose={() => setShowAddFriendModal(false)}
          phonePersonas={phonePersonas}
          contacts={contacts}
          apiConfig={apiConfig}
          onAddContact={(persona) => {
            setContacts(prev => {
              if (prev.some(c => c.id === persona.id)) return prev;
              return [...prev, persona];
            });
          }}
          onAddNewPersona={(persona) => {
            setPhonePersonas(prev => {
              if (prev.some(p => p.id === persona.id)) return prev;
              return [...prev, persona];
            });
          }}
        />

        {/* Favorites Screen */}
        {showFavoritesScreen && (
          <FavoritesScreen
            favorites={favorites}
            setFavorites={setFavorites}
            contacts={contacts}
            chatSettings={chatSettings}
            onBack={() => setShowFavoritesScreen(false)}
            onJumpToChat={(contactId, messageId) => {
              setShowFavoritesScreen(false);
              if (contactId === 'ai_assistant') {
                setActiveChatContact(null);
              } else {
                const contact = contacts.find(c => c.id === contactId);
                if (contact) {
                  setActiveChatContact(contact);
                } else {
                  // Contact no longer exists, just close
                  return;
                }
              }
              setScreen('ai-chat');
            }}
          />
        )}

        {/* Profile Editor Modal */}
        <ProfileEditorModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          currentUser={currentUser}
          onSave={(user) => {
            setCurrentUser(user);
            if (user.avatar !== avatar) {
              setAvatar(user.avatar);
            }
          }}
        />

        {/* Wallet Actions Modal */}
        <WalletActionsModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          wallet={wallet}
          setWallet={setWallet}
          phonePersonas={phonePersonas}
          apiConfig={apiConfig}
        />
      </div>

      {/* 预留自定义 CSS 接口 */}
      <style id="aiphone-custom-css">
        {localStorage.getItem('aiphone_custom_css') || ''}
      </style>

      <style>{`
        html {
          font-size: var(--base-font-size, 16px) !important;
        }
        html.custom-font-color * {
          color: var(--base-font-color) !important;
        }
        :root {
          --custom-font-family: inherit;
          --frost-intensity: ${frostIntensity};
          --glass-blur-px: calc(var(--frost-intensity) / 100 * 40px);
          --glass-blur: blur(var(--glass-blur-px));
          /* Calculate opacity: higher frost intensity -> lower opacity for better noise visibility */
          --glass-base-opacity: ${componentBgOpacity};
          --glass-base-dark-opacity: ${componentBgOpacity};
          /* Noise opacity maps from 0 to 0.15 based on intensity */
          --noise-opacity: calc(var(--frost-intensity) / 100 * 0.15);
        }
        * {
          font-family: var(--custom-font-family) !important;
        }
        .glass-card {
          position: relative;
          background-color: rgba(255, 255, 255, var(--glass-opacity, 0.2));
          overflow: hidden;
        }
        .glass-noise {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: var(--noise-opacity);
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }
        @media (prefers-color-scheme: dark) {
          .glass-noise {
            opacity: calc(var(--noise-opacity) * 1.5);
            mix-blend-mode: screen;
            filter: invert(1) brightness(0.8);
          }
        }
        .dark .glass-noise {
          opacity: calc(var(--noise-opacity) * 1.5);
          mix-blend-mode: screen;
          filter: invert(1) brightness(0.8);
        }
        .app-icon-inner {
          background-color: var(--icon-light-bg);
        }
        .app-icon-icon {
          color: var(--icon-color-light);
        }
        @media (prefers-color-scheme: dark) {
          .glass-card {
            background-color: rgba(0, 0, 0, var(--glass-dark-opacity, 0.4));
          }
          .app-icon-inner {
            background-color: var(--icon-dark-bg);
          }
          .app-icon-icon {
            color: var(--icon-color-dark);
          }
        }
        .dark .glass-card {
          background-color: rgba(0, 0, 0, var(--glass-dark-opacity, 0.4));
        }
        .dark .app-icon-inner {
          background-color: var(--icon-dark-bg);
        }
        .dark .app-icon-icon {
          color: var(--icon-color-dark);
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
