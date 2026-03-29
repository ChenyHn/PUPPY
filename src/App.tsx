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

import { SettingsScreen } from './components/SettingsScreen';

/**
 * Normalize a user-entered Base URL:
 * - Trim whitespace and trailing slashes
 * - Auto-prepend https:// if no protocol
 * - Strip trailing /chat/completions if user pasted a full endpoint
 */
function normalizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  if (url.endsWith('/chat/completions')) {
    url = url.replace(/\/chat\/completions$/, '');
  }
  return url;
}
import { AppearanceScreen } from './components/AppearanceScreen';
import { PersonaScreen } from './components/PersonaScreen';
import { PhoneListScreen } from './components/PhoneListScreen';
import { WorldBookListScreen } from './components/WorldBookListScreen';
import { WorldBookEditScreen } from './components/WorldBookEditScreen';

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
  const [chatErrorToast, setChatErrorToast] = useState<string>('');

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

        const summaryBaseUrl = normalizeBaseUrl(apiConfig.baseUrl);
        const url = `${summaryBaseUrl}/chat/completions`;

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
            max_tokens: 500,
            stream: false
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
      const baseUrl = normalizeBaseUrl(apiConfig.baseUrl);
      const url = `${baseUrl}/chat/completions`;
      
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
          max_tokens: apiConfig.maxTokens ?? 2048,
          stream: false
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const backendMsg = errorData.error?.message || errorData.message || '';
        throw new Error(backendMsg || `请求失败 (HTTP ${response.status})`);
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
        throw new Error('返回数据格式不正确，未找到 choices[0].message.content');
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      let errorMsg = err.message || '未知错误，请检查配置';
      if (err.name === 'AbortError') {
        errorMsg = '请求超时(30s)，请检查网络连接或 API 地址';
      } else if (errorMsg === 'Failed to fetch' || errorMsg.toLowerCase().includes('networkerror') || errorMsg.toLowerCase().includes('network')) {
        errorMsg = '网络连接失败或跨域(CORS)限制，请使用支持 CORS 的中转 API';
      }
      
      // Show error toast in chat UI (3s auto-dismiss)
      setChatErrorToast(errorMsg);
      setTimeout(() => setChatErrorToast(''), 3000);
      
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
              {/* Network/API error toast & status indicator */}
              <AnimatePresence>
                {chatErrorToast && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-2 left-4 right-4 z-20 px-4 py-2.5 bg-red-500 text-white rounded-xl text-[11px] font-bold shadow-lg text-center"
                  >
                    ⚠️ API错误: {chatErrorToast}
                  </motion.div>
                )}
              </AnimatePresence>
              {chatErrorToast && (
                <div className="absolute top-1 right-2 z-10 w-2 h-2 rounded-full bg-red-500 shadow-sm" title="API连接失败" />
              )}
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
                    className="flex-1 bg-zinc-50 p-4 rounded-2xl text-sm outline-none border border-zinc-200 focus:border-zinc-400 transition-colors"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                  />
                  <button 
                    onClick={sendAiMessage}
                    disabled={isAiLoading || !chatInput.trim()}
                    className="w-12 h-12 bg-[#333333] text-white rounded-2xl flex items-center justify-center disabled:opacity-50 active:bg-[#555555] hover:bg-[#444444] active:scale-95 transition-all dark:bg-zinc-300 dark:text-zinc-900 dark:hover:bg-zinc-400 dark:active:bg-zinc-500"
                  >
                    <Send size={18} />
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
                          const manualBaseUrl = normalizeBaseUrl(apiConfig.baseUrl);
                          const url = `${manualBaseUrl}/chat/completions`;

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
                              max_tokens: 500,
                              stream: false
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
