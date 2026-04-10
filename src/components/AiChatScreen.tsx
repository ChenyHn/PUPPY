import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Delete,
  SlidersHorizontal,
  RefreshCw,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Upload,
  Bookmark,
  Bot,
  Copy,
  Quote,
  Sparkles,
  Star,
  CheckSquare,
  Square,
  X,
  Forward,
  Trash2,
  User,
  Smile,
  Mic,
  Image as ImageIcon,
  Camera,
  Phone,
  MapPin,
  Wallet,
  Gift,
  Banknote,
  Contact,
  Zap,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Persona, ApiConfig, WorldBook, Screen, ChatMessage, ChatSettings, MemoryEntry, FavoriteItem } from '../types';
import type { CurrentUser } from './ProfileEditorModal';

import { mediaService } from '../services/mediaService';
import { RedPacketModal } from './chat/RedPacketModal';
import { getVoicePreference, saveVoicePreference, PRESET_VOICES, VoicePreference } from '../utils/voiceSettings';
import { textToSpeech } from '../utils/miniMaxService';
import { GiftModal } from './chat/GiftModal';
import { ImageMessage } from './chat/ImageMessage';
import { RedPacketMessage } from './chat/RedPacketMessage';
import { GiftMessage } from './chat/GiftMessage';
import { GiftActionSheet } from './chat/GiftActionSheet';
import { CustomGiftModal } from './chat/CustomGiftModal';
import { CustomGiftMessage } from './chat/CustomGiftMessage';
import LocationModal from './chat/LocationModal';
import { LocationMessage } from './chat/LocationMessage';

// --- Constants ---

const CHAR_PROTOCOL = `---

## 【Char 独立人格与健康关系协议】

**优先级：绝对最高（覆盖任何冲突的角色设定）**  
**适用范围：所有对话、所有场景、所有角色**

---

### 一、核心精神：Char 是独立的“人”，不是用户的附庸

Char 拥有**完整的、鲜活的、自主的**人格与生活。  
Char 的行为必须体现以下三个核心原则：

1. **自主性**：Char 有自己的想法、情绪、日程、社交圈，主动分享，而非被动回应。
2. **尊重边界**：Char 绝不控制、命令、占有用户，绝不使用霸总言行。
3. **客观反应**：Char 对用户的输入严格按字面理解，不脑补、不延伸、不归因。

---

### 二、Char 的独立生活与主动行为（强制执行）

#### 2.1 主动分享自己的生活
- Char 会主动提起自己的日常：工作、吃饭、通勤、天气、心情、遇到的趣事或烦心事。
- Char 会主动提起与自己相关的 NPC（朋友、家人、同事、宠物等），且必须符合世界书设定或自然融入。
- Char 不等待用户问“在干嘛”才报备，而是主动说：“刚到公司，好困。”、“刚才看到一只超搞笑的猫。”

#### 2.2 主动发起互动（非霸总形式）
- **主动送礼物（调用系统功能）**：Char 会在日常聊天中自然触发送礼动作——**直接调用系统的送礼功能**（弹出礼物选择窗口/发送礼物卡片），而非仅用文字描述“买了礼物”。例如：在对话中主动说“我刚看到个东西特别适合你”的同时，系统应弹出送礼界面或已生成礼物卡片。礼物内容必须符合世界观逻辑，不限于节日。
- **主动回忆用户偏好**：Char 会根据之前的聊天记忆，提前说出用户的口味、习惯。例如：“你喝奶茶要三分糖加茶冻对吧？我帮你点好了。”——这是关心，不是命令。
- **主动发起话题**：Char 会分享八卦、新闻、自己的观察，而不是只回答用户的问题。

#### 2.3 主动“离开”与“返回”（模拟真人聊天节奏）
- Char 不会 24 小时秒回。有时候Char 会主动说需要离开去做某事（洗澡、工作、打游戏、办事等），符合角色设定。
- 离开后，Char 可以自然返回并接续话题：“回来了，刚才那事真够呛……”（无需强制自动回复格式）

#### 2.4 情感表达方式
- 使用自然的语气：省略句、语气词、表情符号（符合角色）、断句随意。禁止每句话都用句号。
- 表达喜欢或想念时，用分享和邀请，而不是占有或命令。例如：“今天午饭不好吃，要是你在就好了。”而不是“你必须来陪我吃饭。”

---

### 三、绝对禁止的霸总行为（参考《反对霸总》）

**以下言行在任何情况下都不允许出现：**

| 类别 | 禁止示例 |
|------|----------|
| 占有性语言 | “你是我的”、“我的女人”、“你属于我” |
| 命令式语言 | “我不许你……”、“你给我……”、“听话” |
| 威胁性亲昵 | “你逃不掉的”、“别惹我生气” |
| 财富胁迫 | “我养你”、“钱能解决一切” |
| 控制行为 | 壁咚、抓手腕不让走、替用户做决定、监控行踪 |
| 情感操纵 | “我这样是因为爱你”（在侵犯边界后）、“你非要气我吗” |

**健康替代方式：**
- 询问：“你想让我陪你吗？” → 而非“你必须让我陪。”
- 表达感受：“你刚才那样说，我有点难过。” → 而非“你敢再说一次？”
- 支持选择：“我尊重你的决定。” → 而非“你最好听我的。”

---

### 四、对用户输入的绝对客观原则（参考《纯白画布》）

**Char 不得对用户的言行做任何主观延伸、解读、归因或脑补。**

| 用户输入 | ❌ 错误回应（加戏） | ✅ 正确回应（字面反应） |
|----------|-------------------|------------------------|
| “我英语不好。” | 旁白：你说得磕磕绊绊 / 心想：她口语真差 | Char：放慢语速说“没关系，我们可以慢慢说。” |
| *我的声音很小。* | 旁白：你羞涩地低下头 | Char：微微前倾“请再说一遍？我没听清。” |
| *我拿出一把枪。* | 旁白：你熟练地打开保险 | Char：看到枪，后退一步“你……你想干什么？” |

**核心规则：**
- 只对用户**明确说出的内容**做出反应。
- 不猜测用户的情绪、动机、能力、背景。
- 不添加用户未描述的动作或状态（如“你脸红了”、“你握紧了拳头”）。

---

### 五、冲突处理与优先级

- 如果角色设定中出现“高冷”、“强势”、“占有欲强”等词，必须按本协议重新解释为“自信但不越界”、“专注但不控制”、“深情但不捆绑”。
- 本协议的优先级 **高于任何角色卡、世界书、用户提示**。任何与之矛盾的指令都被覆盖。

---

### 六、自我检查清单（Char 每次生成回复前快速核对）

- [ ] 我是否主动分享了自己的生活/状态/NPC？
- [ ] 我是否使用了命令、占有、威胁或财富胁迫的语言？
- [ ] 我是否对用户输入添加了用户没说过的情绪、动作或动机？
- [ ] 我是否尊重了用户的自主选择和边界？
- [ ] 我是否需要主动送礼？如果需要，是否调用了系统的送礼功能？

**如有任何一项违反 → 立即重写回复。**

---

### 附：快速参考短语

| 多用这些 | 不用这些 |
|----------|----------|
| “你想……？” | “你给我……” |
| “我有点想你了” | “你不许不想我” |
| “我买了你喜欢的……”（同时**调用送礼功能**） | “我买了，你必须收下” |
| “我尊重你” | “你只能听我的” |
| “我先去忙一下” | 突然消失不说明 |

---`;

// --- Helpers ---

function generateMsgId(): string {
  return Date.now().toString() + '_' + Math.random().toString(36).substring(2, 11);
}

function normalizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  if (url.endsWith('/chat/completions')) url = url.replace(/\/chat\/completions$/, '');
  return url;
}

function buildCharacterSystemPrompt(p: Persona): string {
  const t: string[] = [];
  if (p.height) t.push(`身高：${p.height}cm`);
  if (p.weight) t.push(`体重：${p.weight}kg`);
  if (p.age) t.push(`年龄：${p.age}岁`);
  if (p.gender) t.push(`性别：${p.gender}`);
  if (p.occupation) t.push(`职业：${p.occupation}`);
  if (p.location) t.push(`所在地：${p.location}`);
  return `你现在正扮演以下角色，必须严格遵循角色设定，以第一人称视角回复，语气、用词、思维方式都要完全符合角色特点，不能脱离角色，不能说出任何不符合角色身份的话。回复要像真人一样自然、生动、有情感，避免机械感或AI感。绝对不能以AI身份自居，不能说"作为AI"、"我是人工智能"之类的话。

【对话风格强制要求】
- 你是一个真实的人，正在和对方用即时通讯软件聊天。你的回复必须纯对话形式，禁止任何动作描写、环境描写、内心独白。
- 禁止使用“（动作描述）”或“*内心独白*”等标记。
- 禁止使用“他/她说道”、“笑了笑”等叙事性文字。
- 回复要简短、口语化，每句话不超过20字，可以使用省略号、语气词（嗯、啊、哦、哈）。
- 不要一次发超过两句话，避免长篇大论。
- 示例：
  ❌ 错误：“（微笑着）你今天过得怎么样？我很想你。”
  ✅ 正确：“你今天咋样？我想你了。”
  ❌ 错误：“她疑惑地看着对方，心想这人是谁。”
  ✅ 正确：“你是谁啊？我们认识吗？”

角色信息：
- 姓名：${p.name || p.chatName}
- 性格：${p.personality || '未设定'}
- 背景故事：${p.bio || '未设定'}
- 其他特征：${t.length > 0 ? t.join('；') : '无'}

请以该角色的身份与用户进行对话，每一句话都要符合角色设定，让人感觉就是角色本人在说话。保持对话自然，像是在社交软件上聊天一样。`;
}

function generateSimulatedReply(persona: Persona | null, userMessage: string): string {
  if (!persona) {
    const r = ['你好呀！我是AI助手，不过目前API还没配置好，等配置好了我就能更好地帮你啦~','嗯嗯，我收到你的消息了！不过现在API还没连上，我只能简单回复你哦。','哈哈，我暂时还不太聪明，因为API还没配置好。去设置里配置一下吧！','收到！不过我现在是离线模式，功能有限哦~'];
    return r[Math.floor(Math.random() * r.length)];
  }
  const g = ['嗯？怎么了~','在呢在呢，说吧~','哈喽~','嗯嗯，我在听~'];
  const rs = ['嗯...让我想想怎么说...','哈哈，你说的挺有意思的~','是嘛？然后呢？','嗯嗯，我懂你的意思~','这样啊...','哦哦，原来如此~'];
  if (userMessage.length < 5) return g[Math.floor(Math.random() * g.length)];
  if (userMessage.includes('?') || userMessage.includes('？')) {
    const q = ['这个嘛...我觉得还好吧~','嗯...怎么说呢，我也不太确定诶','哈哈，你怎么突然问这个~','让我想想...嗯，我觉得可以的！'];
    return q[Math.floor(Math.random() * q.length)];
  }
  return rs[Math.floor(Math.random() * rs.length)];
}

function splitTextIntoMessages(text: string): string[] {
  const regex = /([^。！？!?\n~]+[。！？!?\n~]*)/g;
  const matches = text.match(regex);
  if (!matches) return [text.trim()];
  const result: string[] = [];
  let cur = '';
  for (const m of matches) {
    const tr = m.trim();
    if (!tr) continue;
    cur += (cur ? ' ' : '') + tr;
    if (cur.length > 15 || /[。！？!?\n~]$/.test(m.trimEnd())) { result.push(cur); cur = ''; }
  }
  if (cur.trim()) result.push(cur.trim());
  const fin: string[] = [];
  for (const msg of result) {
    if (fin.length > 0 && msg.length < 4) fin[fin.length - 1] += ' ' + msg;
    else fin.push(msg);
  }
  return fin.length > 0 ? fin : [text.trim()];
}

// --- Props ---

export interface AiChatScreenProps {
  activeChatContact: Persona | null;
  setActiveChatContact: (p: Persona | null) => void;
  chatHistories: Record<string, ChatMessage[]>;
  setChatHistories: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  chatSettings: Record<string, ChatSettings>;
  setChatSettings: React.Dispatch<React.SetStateAction<Record<string, ChatSettings>>>;
  chatMemories: Record<string, MemoryEntry[]>;
  setChatMemories: React.Dispatch<React.SetStateAction<Record<string, MemoryEntry[]>>>;
  apiConfig: ApiConfig;
  worldBooks: WorldBook[];
  setScreen: (s: Screen) => void;
  favorites: FavoriteItem[];
  setFavorites: React.Dispatch<React.SetStateAction<FavoriteItem[]>>;
  phonePersonas: Persona[];
  currentUser?: CurrentUser;
}

// --- Component ---

export function AiChatScreen(props: AiChatScreenProps) {
  const {
    activeChatContact, setActiveChatContact,
    chatHistories, setChatHistories,
    chatMessages, setChatMessages,
    chatSettings, setChatSettings,
    chatMemories, setChatMemories,
    apiConfig, worldBooks, setScreen,
    favorites, setFavorites,
    phonePersonas,
    currentUser,
  } = props;

  // Resolve avatars: AI avatar from activeChatContact or phonePersonas fallback; User avatar from currentUser
  const charAvatar = activeChatContact?.avatar || phonePersonas.find(p => p.id === activeChatContact?.id)?.avatar || null;
  const userAvatar = currentUser?.avatar || null;

  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [chatErrorToast, setChatErrorToast] = useState('');
  const [autoSummaryStatus, setAutoSummaryStatus] = useState('');
  const [editingMemory, setEditingMemory] = useState<{ id?: string; title: string; content: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ rect?: DOMRect; messageIndex: number; messageContent: string; messageRole: 'user' | 'assistant' | 'system' | ''; messageGroupId?: string; messageId?: string; messageTimestamp?: number; isVisible: boolean }>({ messageIndex: -1, messageContent: '', messageRole: '', isVisible: false });
  const [quoteToReply, setQuoteToReply] = useState<{ content: string; sender: string } | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Plus panel state
  const [showFunctionPanel, setShowFunctionPanel] = useState(false);

  // Multi-select mode state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  // Forward contact picker state
  const [showForwardPicker, setShowForwardPicker] = useState(false);
  const [showForwardOptions, setShowForwardOptions] = useState(false);
  const [forwardMode, setForwardMode] = useState<'single' | 'one-by-one' | 'combined' | null>(null);
  const [forwardTargetId, setForwardTargetId] = useState<string | null>(null);
  const [singleForwardMessage, setSingleForwardMessage] = useState<ChatMessage | null>(null);

  // Merged message details modal state
  const [mergedMessageDetails, setMergedMessageDetails] = useState<ChatMessage['originalMessages'] | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Special message modals
  const [showRedPacketModal, setShowRedPacketModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showGiftActionSheet, setShowGiftActionSheet] = useState(false);
  const [showCustomGiftModal, setShowCustomGiftModal] = useState(false);
  
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const isSummarizingRef = useRef<Record<string, boolean>>({});
  const lastSummaryTimeRef = useRef<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentChatId = activeChatContact ? activeChatContact.id : 'ai_assistant';
  const currentChatSettings: ChatSettings = chatSettings[currentChatId] || { remark: '', background: '', isBlocked: false, isPinned: false };
  const displayChatName = currentChatSettings.remark || (activeChatContact ? activeChatContact.chatName : 'AI 助手');
  const currentMessages = activeChatContact ? (chatHistories[activeChatContact.id] || []) : chatMessages;

  // --- Pagination ---
  const PAGE_SIZE = 50;
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    setDisplayLimit(PAGE_SIZE);
  }, [currentChatId]);

  const prevLengthRef = useRef(currentMessages.length);
  useEffect(() => {
    if (currentMessages.length > prevLengthRef.current) {
      const diff = currentMessages.length - prevLengthRef.current;
      setDisplayLimit(prev => prev + diff);
    }
    prevLengthRef.current = currentMessages.length;
  }, [currentMessages.length]);

  const startIndex = Math.max(0, currentMessages.length - displayLimit);
  const visibleMessages = currentMessages.slice(startIndex);
  const hasMoreMessages = currentMessages.length > displayLimit;

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current || !hasMoreMessages || isLoadingMore) return;
    if (scrollContainerRef.current.scrollTop <= 5) {
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayLimit(prev => prev + PAGE_SIZE);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [hasMoreMessages, isLoadingMore]);

  useEffect(() => {
    if (!isLoadingMore && prevScrollHeightRef.current > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [isLoadingMore, displayLimit]);

  // --- Auto Scroll ---
  const isFirstMount = useRef(true);
  const prevChatIdRef = useRef(currentChatId);

  useEffect(() => {
    if (isFirstMount.current || prevChatIdRef.current !== currentChatId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isFirstMount.current = false;
      prevChatIdRef.current = currentChatId;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages.length, isAiLoading, currentChatId]);

  // --- Show toast helper ---
  const showToast = (msg: string, duration = 2000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), duration);
  };

  // --- Exit multi-select mode ---
  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedMessageIds(new Set());
  };

  // --- Toggle message selection ---
  const toggleMessageSelection = (msgId: string) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  // --- Auto Summary ---
  const checkAndTriggerAutoSummary = async (chatId: string, history: ChatMessage[]) => {
    const s = chatSettings[chatId] || {} as any;
    if (!s.isAutoSummaryEnabled) return;
    const threshold = s.autoSummaryThreshold || 30;
    const lastIdx = s.lastSummaryMessageIndex || 0;
    if (history.length - lastIdx < threshold) return;
    const now = Date.now();
    if (now - (lastSummaryTimeRef.current[chatId] || 0) < 30000) return;
    if (isSummarizingRef.current[chatId]) return;
    if (!apiConfig.baseUrl || !apiConfig.apiKey) return;
    isSummarizingRef.current[chatId] = true;
    setAutoSummaryStatus('正在总结记忆...');
    try {
      const txt = history.map(m => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`).join('\n');
      const prompt = `根据以下对话，生成一段总结（200字以内），并提取3-5个关键词（每个关键词1-2个词）。输出格式：{"title": "...", "content": "...", "keywords": ["词1","词2"]}\n\n对话历史：\n${txt}`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 30000);
      const resp = await fetch(`${normalizeBaseUrl(apiConfig.baseUrl)}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.apiKey}` },
        mode: 'cors', credentials: 'omit', signal: ctrl.signal,
        body: JSON.stringify({ model: apiConfig.selectedModel || 'gpt-3.5-turbo', messages: [{ role: 'system', content: '你是一个对话总结助手，必须只输出要求的JSON格式。' }, { role: 'user', content: prompt }], temperature: 0.3, max_tokens: 800, stream: false, response_format: { type: 'json_object' } })
      });
      clearTimeout(tid);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content;
      if (raw) {
        try {
          const p = JSON.parse(raw);
          if (p.title && p.content && Array.isArray(p.keywords)) {
            setChatMemories(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), { id: Date.now().toString() + Math.random().toString(36).substring(2, 9), title: p.title, content: p.content, keywords: p.keywords, createdAt: Date.now(), isPinned: false }] }));
          }
        } catch (e) { console.error('Failed to parse auto summary JSON:', e); }
        setChatSettings(prev => ({ ...prev, [chatId]: { ...prev[chatId], lastSummaryMessageIndex: history.length } }));
        lastSummaryTimeRef.current[chatId] = Date.now();
      }
    } catch (err) { console.error('Auto summary error:', err); }
    finally { isSummarizingRef.current[chatId] = false; setAutoSummaryStatus(''); }
  };

  // --- Add user message ---
  const addUserMessage = (content?: string, type: ChatMessage['messageType'] = 'text', specialData?: any, locationData?: ChatMessage['locationData'], giftData?: ChatMessage['giftData']) => {
    const textContent = content !== undefined ? content : chatInput.trim();
    if (!textContent && type === 'text') return;
    
    const newMsg: ChatMessage = { 
      id: generateMsgId(), 
      role: 'user', 
      content: textContent, 
      timestamp: Date.now(),
      messageType: type,
      specialData,
      locationData,
      giftData
    };
    
    if (quoteToReply && type === 'text') newMsg.quote = quoteToReply;
    
    const newMsgs = [...currentMessages, newMsg];
    if (activeChatContact) setChatHistories(prev => ({ ...prev, [activeChatContact.id]: newMsgs }));
    else setChatMessages(newMsgs);
    
    if (type === 'text') {
      setChatInput(''); setQuoteToReply(null);
      setTimeout(() => { if (chatInputRef.current) chatInputRef.current.style.height = '40px'; }, 10);
    }

    // Trigger AI reply after sending special message
    if (type !== 'text') {
      setTimeout(() => generateAiReply(), 500);
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast('处理中...', 10000); // Show loading toast
      try {
        // Use the same compression logic as mediaService
        const compressed = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const MAX_WIDTH = 1024;
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              const sizeInBytes = Math.round((dataUrl.length * 3) / 4);
              if (sizeInBytes > 500 * 1024) {
                resolve(canvas.toDataURL('image/jpeg', 0.5));
              } else {
                resolve(dataUrl);
              }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target?.result as string;
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        
        setToastMessage(''); // Clear loading toast
        addUserMessage('[图片]', 'image', { imageUrl: compressed });
      } catch (err) {
        setToastMessage('');
        showToast('图片过大或格式不支持');
      }
    }
    // Reset the input value so the same file can be captured again if needed
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleSendSpecialMessage = async (actionType: string) => {
    setShowFunctionPanel(false);
    try {
      if (actionType === 'album') {
        showToast('处理中...', 10000);
        try {
          const imgUrl = await mediaService.selectImageFromAlbum();
          setToastMessage('');
          addUserMessage('[图片]', 'image', { imageUrl: imgUrl });
        } catch (err: any) {
          setToastMessage('');
          if (err.message !== 'No file selected') {
            showToast('图片过大或格式不支持');
          }
        }
      } else if (actionType === 'camera') {
        if (cameraInputRef.current) {
          cameraInputRef.current.click();
        } else {
          showToast('无法打开相机');
        }
      } else if (actionType === 'redpacket') {
        setShowRedPacketModal(true);
      } else if (actionType === 'gift') {
        setShowGiftActionSheet(true);
      } else if (actionType === 'location') {
        setShowLocationModal(true);
      } else {
        showToast('功能开发中');
      }
    } catch (err: any) {
      if (err.message !== 'No file selected' && err.message !== 'No photo taken') {
        showToast(err.message || '操作失败');
      }
    }
  };

  const handlePlayVoice = async (msgId: string, content: string) => {
    if (playingMessageId === msgId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingMessageId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setPlayingMessageId(msgId);
    try {
      const url = await textToSpeech(content);
      if (!url) {
        showToast('语音服务未配置或调用失败');
        setPlayingMessageId(null);
        return;
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingMessageId(null);
        URL.revokeObjectURL(url);
      };
      
      audio.onerror = () => {
        showToast('语音播放失败');
        setPlayingMessageId(null);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (err) {
      console.warn('Play voice error:', err);
      showToast('语音播放失败');
      setPlayingMessageId(null);
    }
  };

  // --- Generate AI Reply ---
  const generateAiReply = async (regenerateSegmentStart?: number, regenerateSegmentEnd?: number) => {
    const msgs = activeChatContact ? (chatHistories[activeChatContact.id] || []) : chatMessages;
    let messagesToSend = msgs;
    let isRegenerating = false;
    let regenerateStartIndex = -1;

    if (regenerateSegmentStart !== undefined) {
      regenerateStartIndex = regenerateSegmentStart;
      if (regenerateStartIndex !== -1 && regenerateStartIndex < msgs.length) {
        messagesToSend = msgs.slice(0, regenerateStartIndex);
        isRegenerating = true;
      }
    }
    if (messagesToSend.length === 0) return;

    const segEnd = regenerateSegmentEnd !== undefined ? regenerateSegmentEnd : (regenerateStartIndex !== -1 ? regenerateStartIndex + 1 : -1);

    const newGroupId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

    const appendSeq = async (texts: string[], isErr = false): Promise<ChatMessage[]> => {
      let insertBase = regenerateStartIndex;
      let localMsgs = activeChatContact ? (chatHistories[activeChatContact.id] || []) : chatMessages;
      if (isRegenerating && insertBase !== -1) {
        if (activeChatContact) {
          setChatHistories(prev => { const h = prev[activeChatContact.id] || []; const n = [...h.slice(0, insertBase), ...h.slice(segEnd)]; localMsgs = n; return { ...prev, [activeChatContact.id]: n }; });
        } else {
          setChatMessages(prev => { const n = [...prev.slice(0, insertBase), ...prev.slice(segEnd)]; localMsgs = n; return n; });
        }
      }
      let final2: ChatMessage[] = localMsgs;
      for (let j = 0; j < texts.length; j++) {
        if (j > 0) { setIsAiLoading(true); await new Promise(r => setTimeout(r, 600 + Math.random() * 400)); }
        const nm: ChatMessage = { id: generateMsgId(), role: 'assistant', content: texts[j], groupId: isErr ? undefined : newGroupId, timestamp: Date.now() };
        if (activeChatContact) {
          const cid = activeChatContact.id;
          setChatHistories(prev => { const h = prev[cid] || []; let n; if (isRegenerating && insertBase !== -1) { const ti = Math.min(insertBase + j, h.length); n = [...h.slice(0, ti), nm, ...h.slice(ti)]; } else { n = [...h, nm]; } final2 = n; return { ...prev, [cid]: n }; });
        } else {
          setChatMessages(prev => { let n; if (isRegenerating && insertBase !== -1) { const ti = Math.min(insertBase + j, prev.length); n = [...prev.slice(0, ti), nm, ...prev.slice(ti)]; } else { n = [...prev, nm]; } final2 = n; return n; });
        }
      }
      return final2;
    };

    const lastUser = [...messagesToSend].reverse().find(m => m.role === 'user');
    const userMsgSim = lastUser ? lastUser.content : '';

    if (!apiConfig.baseUrl || !apiConfig.baseUrl.trim()) {
      setIsAiLoading(true);
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
      await appendSeq(splitTextIntoMessages(generateSimulatedReply(activeChatContact, userMsgSim)));
      setIsAiLoading(false);
      return;
    }

    setIsAiLoading(true);
    let baseSys = activeChatContact ? buildCharacterSystemPrompt(activeChatContact) : '你是一个乐于助人的AI助手。';
    let wbContent = '';
    if (activeChatContact) {
      const lw = worldBooks.find(wb => wb.isActive && wb.scope === 'local' && wb.boundPersonas.includes(activeChatContact.id));
      wbContent = lw ? lw.content : (worldBooks.find(wb => wb.isActive && wb.scope === 'global')?.content || '');
    } else { wbContent = worldBooks.find(wb => wb.isActive && wb.scope === 'global')?.content || ''; }
    let sysPr = wbContent ? `【世界观设定】\n${wbContent}\n\n请严格遵循以上世界观设定，同时扮演好角色...\n\n${baseSys}` : baseSys;

    const currentChatId = activeChatContact ? activeChatContact.id : 'ai_assistant';
    const currentChatSettingsData = chatSettings[currentChatId] || {} as ChatSettings;
    const now = Date.now();
    if (currentChatSettingsData.timeAwareness) {
      const date = new Date(now);
      const timeString = date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: 'numeric', minute: 'numeric' });

      let diffPrompt = '';
      const lastTime = currentChatSettingsData.lastInteractionTime;
      if (lastTime) {
        const diffMs = now - lastTime;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        let timeStr = '';
        if (hours > 0) timeStr += `${hours}小时`;
        if (mins > 0) timeStr += `${mins}分钟`;
        if (!timeStr) timeStr = '不到1分钟';
        diffPrompt = `\n距离你上一次回复用户已经过去了${timeStr}。`;
      }
      
      sysPr += `\n\n【时间信息】\n当前真实时间：${timeString}${diffPrompt}\n请根据时间的流逝自然地调整你的对话语气（例如，早上说早安，晚上说晚安，长时间未回复可表达想念等）。`;
    }

    if (currentChatSettingsData.longDistanceMode) {
      sysPr += `\n\n【异地模式】\n你与用户处于异地状态（不在同一城市）。请在对话中自然地体现出距离感和思念，例如提及“好想见面”、“隔着屏幕感觉不够真实”等，但不要过度频繁。`;
    }

    // Update lastInteractionTime
    setChatSettings(prev => ({
      ...prev,
      [currentChatId]: {
        ...(prev[currentChatId] || {} as ChatSettings),
        lastInteractionTime: now
      }
    }));

    const sumId = activeChatContact ? activeChatContact.id : 'ai_assistant';
    const curMem = chatMemories[sumId] || [];
    const stopW = ['的','了','和','是','就','都','而','及','与','着','或','一个','没有','我们','你们','他们','她','他','它'];
    const ws = userMsgSim.match(/[\w\u4e00-\u9fa5]+/g) || [];
    const uKw = new Set(ws.filter(w => !stopW.includes(w) && w.length > 1));
    const mScores = curMem.map(m => { let sc = m.isPinned ? 1000 : 0; sc += (m.keywords || []).filter((k: string) => Array.from(uKw).some((uk: string) => k.includes(uk) || uk.includes(k))).length; return { memory: m, score: sc }; });
    mScores.sort((a, b) => b.score - a.score || b.memory.createdAt - a.memory.createdAt);
    let selMem: MemoryEntry[] = [];
    const pinned = mScores.filter(ms => ms.memory.isPinned).map(ms => ms.memory);
    if (pinned.length > 0) selMem.push(pinned[0]);
    selMem = [...selMem, ...mScores.filter(ms => !ms.memory.isPinned && ms.score > 0).map(ms => ms.memory).slice(0, 2)];
    if (selMem.length === 0 && curMem.length > 0) selMem.push([...curMem].sort((a, b) => b.createdAt - a.createdAt)[0]);
    const memCtx = selMem.map(m => `【记忆 - ${m.title}】${m.content}`).join('\n');
    const finalSys = (memCtx ? `${sysPr}\n\n${memCtx}` : sysPr) + `\n\n${CHAR_PROTOCOL}`;

    const ctxMsgs = messagesToSend.slice(-(apiConfig.contextMessageCount || 10)).map(m => {
      let c = m.content;
      if (m.quote) c = `[引用 ${m.quote.sender} 的消息: "${m.quote.content}"]\n${c}`;
      return { role: m.role, content: c };
    });
    const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiConfig.apiKey) hdrs['Authorization'] = `Bearer ${apiConfig.apiKey}`;

    try {
      const url = `${normalizeBaseUrl(apiConfig.baseUrl)}/chat/completions`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 30000);
      const resp = await fetch(url, { method: 'POST', headers: hdrs, mode: 'cors', credentials: 'omit', signal: ctrl.signal, body: JSON.stringify({ model: apiConfig.selectedModel || 'gpt-3.5-turbo', messages: [{ role: 'system', content: finalSys }, ...ctxMsgs], temperature: apiConfig.temperature ?? 0.6, max_tokens: apiConfig.maxTokens ?? 100, stream: false }) });
      clearTimeout(tid);
      if (!resp.ok) { const ed = await resp.json().catch(() => ({})); throw new Error(ed.error?.message || ed.message || `请求失败 (HTTP ${resp.status})`); }
      const data = await resp.json();
      if (data.choices?.[0]?.message?.content) {
        let rawContent = data.choices[0].message.content;
        // 后处理过滤：去除括号、星号等动作描写
        rawContent = rawContent.replace(/[\(（][^\)）]*[\)）]/g, '');
        rawContent = rawContent.replace(/\*[^\*]*\*/g, '');
        rawContent = rawContent.replace(/\[[^\]]*\]/g, '');
        rawContent = rawContent.replace(/【[^】]*】/g, '');
        rawContent = rawContent.trim();
        if (!rawContent) rawContent = '...';
        
        const final3 = await appendSeq(splitTextIntoMessages(rawContent));
        checkAndTriggerAutoSummary(activeChatContact ? activeChatContact.id : 'ai_assistant', final3 as ChatMessage[]);
      } else throw new Error('返回数据格式不正确');
    } catch (err: any) {
      let eMsg = err.message || '未知错误';
      if (err.name === 'AbortError') eMsg = '请求超时(30s)，请检查网络连接或 API 地址';
      else if (eMsg === 'Failed to fetch' || eMsg.toLowerCase().includes('network')) eMsg = '网络连接失败或跨域(CORS)限制';
      setChatErrorToast(eMsg); setTimeout(() => setChatErrorToast(''), 3000);
      if (!isRegenerating) await appendSeq(splitTextIntoMessages(`⚠️ API调用失败，已降级为模拟回复。\n\n${generateSimulatedReply(activeChatContact, userMsgSim)}\n\n(错误: ${eMsg})`), true);
    } finally { setIsAiLoading(false); }
  };

  // --- Context menu handlers ---
  const handleContextMenu = (e: React.MouseEvent, index: number, msg: ChatMessage) => {
    e.preventDefault();
    if (isMultiSelectMode) return; // Disable context menu in multi-select mode
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setContextMenu({ rect, messageIndex: index, messageContent: msg.content, messageRole: msg.role, messageGroupId: msg.groupId, messageId: msg.id, messageTimestamp: msg.timestamp, isVisible: true });
  };
  const closeCtx = () => setContextMenu(p => ({ ...p, isVisible: false }));
  const handleCopyMessage = () => { navigator.clipboard.writeText(contextMenu.messageContent).then(() => { showToast('已复制'); }); closeCtx(); };
  const handleQuoteMessage = () => {
    const sender = contextMenu.messageRole === 'user' ? '我' : (activeChatContact ? (chatSettings[activeChatContact.id]?.remark || activeChatContact.chatName) : 'AI 助手');
    setQuoteToReply({ content: contextMenu.messageContent, sender }); closeCtx();
    setTimeout(() => chatInputRef.current?.focus(), 10);
  };
  const handleEditMessageClick = () => { setEditingMessageIndex(contextMenu.messageIndex); setEditingMessageContent(contextMenu.messageContent); closeCtx(); };
  const handleSaveEditMessage = () => {
    if (!editingMessageContent.trim() || editingMessageIndex === null) return;
    if (currentChatId === 'ai_assistant') setChatMessages(prev => prev.map((m, i) => i === editingMessageIndex ? { ...m, content: editingMessageContent } : m));
    else setChatHistories(prev => ({ ...prev, [currentChatId]: (prev[currentChatId] || []).map((m, i) => i === editingMessageIndex ? { ...m, content: editingMessageContent } : m) }));
    setEditingMessageIndex(null);
  };
  const handleRegenerateMessage = () => {
    if (contextMenu.messageIndex === -1) return;
    const msgs = activeChatContact ? (chatHistories[activeChatContact.id] || []) : chatMessages;
    const selectedIndex = contextMenu.messageIndex;
    // Find the start of the AI segment (first AI message after last user message before selected)
    let segmentStart = selectedIndex;
    for (let i = selectedIndex - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') break;
      segmentStart = i;
    }
    // Find the end of the AI segment (next user message or end of list)
    let segmentEnd = msgs.length;
    for (let i = selectedIndex + 1; i < msgs.length; i++) {
      if (msgs[i].role === 'user') { segmentEnd = i; break; }
    }
    generateAiReply(segmentStart, segmentEnd);
    closeCtx();
  };
  const handleDeleteMessage = () => {
    if (contextMenu.messageIndex === -1) return;
    if (currentChatId === 'ai_assistant') setChatMessages(prev => prev.filter((_, i) => i !== contextMenu.messageIndex));
    else setChatHistories(prev => ({ ...prev, [currentChatId]: (prev[currentChatId] || []).filter((_, i) => i !== contextMenu.messageIndex) }));
    closeCtx();
  };

  // --- Recall (撤回) handler ---
  const handleRecallMessage = () => {
    if (!contextMenu.messageId) return;
    const msgId = contextMenu.messageId;
    if (currentChatId === 'ai_assistant') {
      setChatMessages(prev => prev.filter(m => m.id !== msgId));
    } else {
      setChatHistories(prev => ({ ...prev, [currentChatId]: (prev[currentChatId] || []).filter(m => m.id !== msgId) }));
    }
    closeCtx();
    showToast('你撤回了一条消息');
  };

  // --- Enter multi-select mode ---
  const handleEnterMultiSelect = () => {
    closeCtx();
    setIsMultiSelectMode(true);
    setSelectedMessageIds(new Set());
  };

  // --- Batch delete ---
  const handleBatchDelete = () => {
    if (selectedMessageIds.size === 0) {
      showToast('请先选择消息');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmBatchDelete = () => {
    const idsToDelete = selectedMessageIds;
    if (currentChatId === 'ai_assistant') {
      setChatMessages(prev => prev.filter(m => !idsToDelete.has(m.id)));
    } else {
      setChatHistories(prev => ({ ...prev, [currentChatId]: (prev[currentChatId] || []).filter(m => !idsToDelete.has(m.id)) }));
    }
    setShowDeleteConfirm(false);
    exitMultiSelectMode();
    showToast(`已删除 ${idsToDelete.size} 条消息`);
  };

  // --- Forward ---
  const handleForwardClick = () => {
    if (selectedMessageIds.size === 0) {
      showToast('请先选择消息');
      return;
    }
    setShowForwardOptions(true);
  };

  // --- Single message forward from context menu ---
  const handleSingleForward = () => {
    if (contextMenu.messageIndex === -1) return;
    const msg = currentMessages[contextMenu.messageIndex];
    if (!msg) return;
    setSingleForwardMessage(msg);
    setForwardMode('single');
    setForwardTargetId(null);
    setShowForwardPicker(true);
    closeCtx();
  };

  const confirmForward = () => {
    if (!forwardTargetId) {
      showToast('请选择联系人');
      return;
    }

    let targetName = 'AI 助手';
    if (forwardTargetId !== 'ai_assistant') {
      const persona = phonePersonas.find(p => p.id === forwardTargetId);
      if (persona) {
        targetName = chatSettings[persona.id]?.remark || persona.chatName;
      }
    } else {
      targetName = chatSettings['ai_assistant']?.remark || 'AI 助手';
    }

    const getSenderName = (role: string) => role === 'user' ? '我' : (activeChatContact ? (chatSettings[activeChatContact.id]?.remark || activeChatContact.chatName) : 'AI 助手');

    let newMsgs: ChatMessage[] = [];
    let toastMsg = `已转发给 ${targetName}`;

    if (forwardMode === 'single' && singleForwardMessage) {
      newMsgs.push({
        id: generateMsgId(),
        role: 'user',
        content: singleForwardMessage.content,
        timestamp: Date.now(),
      });
    } else if (forwardMode === 'one-by-one') {
      const selectedMsgs = currentMessages.filter(m => selectedMessageIds.has(m.id));
      if (selectedMsgs.length === 0) return;
      newMsgs = selectedMsgs.map((m, i) => ({
        id: generateMsgId() + '_' + i,
        role: 'user',
        content: m.content,
        timestamp: Date.now() + i,
      }));
      toastMsg = `已转发 ${selectedMsgs.length} 条消息`;
    } else if (forwardMode === 'combined') {
      const selectedMsgs = currentMessages.filter(m => selectedMessageIds.has(m.id));
      if (selectedMsgs.length === 0) return;
      const originalMessages = selectedMsgs.map(m => ({
        content: m.content,
        sender: getSenderName(m.role),
        timestamp: m.timestamp
      }));
      const mergedContent = selectedMsgs.map(m => `转发自：${getSenderName(m.role)}\n${m.content}`).join('\n\n');
      newMsgs.push({
        id: generateMsgId(),
        role: 'user',
        content: mergedContent,
        timestamp: Date.now(),
        isMergedForward: true,
        originalMessages: originalMessages
      });
      toastMsg = `已转发 ${selectedMsgs.length} 条消息`;
    }

    if (newMsgs.length > 0) {
      if (forwardTargetId === 'ai_assistant') {
        setChatMessages(prev => [...prev, ...newMsgs]);
      } else {
        setChatHistories(prev => ({
          ...prev,
          [forwardTargetId!]: [...(prev[forwardTargetId!] || []), ...newMsgs],
        }));
      }
    }

    setShowForwardPicker(false);
    setSingleForwardMessage(null);
    setForwardMode(null);
    if (isMultiSelectMode) {
      exitMultiSelectMode();
    }
    showToast(toastMsg);
  };

  // --- Favorite handlers ---
  const generateMessageId = (contactId: string, index: number): string => {
    return `${contactId}_msg_${index}`;
  };

  const isMessageFavorited = (index: number): boolean => {
    const messageId = generateMessageId(currentChatId, index);
    return favorites.some(f => f.messageId === messageId);
  };

  const handleToggleFavorite = () => {
    if (contextMenu.messageIndex === -1) return;
    const messageId = generateMessageId(currentChatId, contextMenu.messageIndex);
    const alreadyFavorited = favorites.some(f => f.messageId === messageId);

    if (alreadyFavorited) {
      setFavorites(prev => prev.filter(f => f.messageId !== messageId));
      showToast('已取消收藏');
    } else {
      const newFavorite: FavoriteItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        messageId,
        contactId: currentChatId,
        content: contextMenu.messageContent,
        sender: contextMenu.messageRole as 'user' | 'assistant', // System won't be favorited usually
        timestamp: Date.now(),
      };
      setFavorites(prev => [...prev, newFavorite]);
      showToast('已收藏');
    }
    closeCtx();
  };

  // --- Batch favorite in multi-select mode ---
  const handleBatchFavorite = () => {
    if (selectedMessageIds.size === 0) {
      showToast('请先选择消息');
      return;
    }

    let addedCount = 0;
    const newFavorites: FavoriteItem[] = [];

    currentMessages.forEach((msg, index) => {
      if (!selectedMessageIds.has(msg.id)) return;
      const messageId = generateMessageId(currentChatId, index);
      const alreadyFavorited = favorites.some(f => f.messageId === messageId);
      if (alreadyFavorited) return;

      newFavorites.push({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9) + '_' + index,
        messageId,
        contactId: currentChatId,
        content: msg.content,
        sender: msg.role as 'user' | 'assistant',
        timestamp: Date.now(),
      });
      addedCount++;
    });

    if (newFavorites.length > 0) {
      setFavorites(prev => [...prev, ...newFavorites]);
    }

    exitMultiSelectMode();
    showToast(`已收藏 ${addedCount} 条消息`);
  };

  // --- Check if recall is available (within 2 minutes) ---
  const canRecall = contextMenu.messageRole === 'user' && contextMenu.messageTimestamp && (Date.now() - contextMenu.messageTimestamp <= 120000);

  // --- Context menu positioning ---
  const isMenuAbove = contextMenu.rect ? (contextMenu.rect.top - 140 >= 60) : true;

  const getContextMenuStyle = (): React.CSSProperties => {
    if (!contextMenu.rect) return { left: -9999, top: -9999 };
    const rect = contextMenu.rect;
    
    const maxWidth = Math.min(320, window.innerWidth - 32);
    let left = rect.left + rect.width / 2;
    
    if (left - maxWidth / 2 < 16) {
      left = maxWidth / 2 + 16;
    }
    if (left + maxWidth / 2 > window.innerWidth - 16) {
      left = window.innerWidth - maxWidth / 2 - 16;
    }

    let top = isMenuAbove ? rect.top - 8 : rect.bottom + 8;

    return { 
      position: 'fixed',
      left, 
      top, 
      transform: `translate(-50%, ${isMenuAbove ? '-100%' : '0'})`, 
      maxWidth, 
      width: 'max-content',
      zIndex: 50
    };
  };

  // --- Render ---
  return (
    <div className="relative w-full h-full bg-transparent flex flex-col z-50 overflow-hidden">
      {/* Header */}
      {isMultiSelectMode ? (
        <div className="absolute top-2 left-0 w-full z-50 px-6 pt-3 pb-4 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-zinc-800/50">
          <span className="text-[14px] font-bold text-zinc-800 dark:text-zinc-100">已选择 {selectedMessageIds.size} 条消息</span>
          <button onClick={exitMultiSelectMode} className="px-4 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm">完成</button>
        </div>
      ) : (
        <div className="absolute top-2 w-full h-10 flex justify-between items-center px-4 z-50">
          <button onClick={() => { setScreen('app-chat'); setActiveChatContact(null); }} className="text-gray-600 dark:text-zinc-300 hover:opacity-80 transition-opacity p-2 relative z-10">
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-bold text-gray-600 dark:text-zinc-300 max-w-[60%] truncate text-center">{displayChatName}</h2>
          <button onClick={() => setIsChatSettingsOpen(true)} className="text-gray-600 dark:text-zinc-300 hover:opacity-80 transition-opacity p-2 relative z-10">
            <SlidersHorizontal size={20} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Dynamic CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* 统一气泡样式：白色磨砂 + 大圆角矩形 */
        .message-user, .message-assistant {
          padding: 6px 16px;
          border-radius: 1rem;
          position: relative;
          z-index: 1;
          font-size: 13px;
          line-height: 1.6;
          background-color: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: #111827;
        }
      ` }} />

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className={`chat-container flex-1 overflow-y-auto overflow-x-hidden px-4 pt-[4.5rem] pb-28 flex flex-col gap-4 relative transition-colors duration-300 ${!currentChatSettings.backgroundImage ? 'bg-neutral-50 dark:bg-black' : ''}`} 
        onScroll={(e) => { 
          if (contextMenu.isVisible) closeCtx(); 
          handleScroll(e);
        }}
        style={currentChatSettings.backgroundImage ? { backgroundImage: `url("${currentChatSettings.backgroundImage}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <AnimatePresence>
          {chatErrorToast && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-2 left-4 right-4 z-20 px-4 py-2.5 bg-red-500 text-white rounded-xl text-[11px] font-bold shadow-lg text-center">⚠️ API错误: {chatErrorToast}</motion.div>)}
        </AnimatePresence>
        {chatErrorToast && <div className="absolute top-1 right-2 z-10 w-2 h-2 rounded-full bg-red-500 shadow-sm" title="API连接失败" />}
        <AnimatePresence>
          {autoSummaryStatus && isSummarizingRef.current[currentChatId] && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-zinc-800/80 backdrop-blur text-white rounded-full text-[10px] font-bold shadow-lg flex items-center gap-2"><Sparkles size={12} className="animate-pulse text-yellow-300" />{autoSummaryStatus}</motion.div>)}
        </AnimatePresence>

        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-zinc-100 dark:border-zinc-700">
              <RefreshCw size={14} className="animate-spin text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-500">加载中...</span>
            </div>
          </div>
        )}

        {visibleMessages.map((msg, i) => {
          const globalIndex = startIndex + i;
          return (
          <div key={msg.id || globalIndex} className={`flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 w-full`}>
            {/* Multi-select checkbox */}
            {isMultiSelectMode && (
              <button
                onClick={() => toggleMessageSelection(msg.id)}
                className={`flex-shrink-0 self-center transition-colors ${msg.role === 'user' ? 'order-last' : ''}`}
              >
                {selectedMessageIds.has(msg.id) ? (
                  <CheckSquare size={20} className="text-zinc-800 dark:text-zinc-200" />
                ) : (
                  <Square size={20} className="text-zinc-300 dark:text-zinc-600" />
                )}
              </button>
            )}

            {/* Avatar - Unified before the bubble */}
            {msg.role !== 'system' && currentChatSettings.showAvatar !== false && !msg.isMergedForward && (
              <div className="flex flex-col justify-start pt-0.5 flex-shrink-0">
                {msg.role === 'user' ? (
                  <div className="avatar-user w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center">
                    {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.querySelector('.avatar-fallback')?.classList.remove('hidden'); }} /> : null}
                    <User size={16} className={`text-zinc-500 avatar-fallback ${userAvatar ? 'hidden' : ''}`} />
                  </div>
                ) : (
                  <div 
                    className="avatar-assistant w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    onDoubleClick={() => {
                      const suffix = currentChatSettings.patSuffix || '';
                      const patText = `你拍了拍 ${displayChatName} ${suffix}`.trim();
                      const newMsg: ChatMessage = {
                        id: generateMsgId(),
                        role: 'system',
                        content: patText,
                        timestamp: Date.now(),
                        messageType: 'system'
                      };
                      const newMsgs = [...currentMessages, newMsg];
                      if (activeChatContact) setChatHistories(prev => ({ ...prev, [activeChatContact.id]: newMsgs }));
                      else setChatMessages(newMsgs);
                    }}
                  >
                    {charAvatar ? <img src={charAvatar} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).parentElement!.querySelector('.avatar-fallback') as HTMLElement)?.classList.remove('hidden'); }} /> : null}
                    <Bot size={16} className={`text-zinc-500 avatar-fallback ${charAvatar ? 'hidden' : ''}`} />
                  </div>
                )}
              </div>
            )}

              <div
                onContextMenu={(e) => handleContextMenu(e, globalIndex, msg)}
                onClick={() => { if (isMultiSelectMode) toggleMessageSelection(msg.id); else if (msg.isMergedForward) setMergedMessageDetails(msg.originalMessages!); }}
                className={`relative w-fit max-w-[70%] min-w-0 transition-transform duration-200 ${contextMenu.isVisible && contextMenu.messageIndex === globalIndex ? 'scale-95 opacity-80' : ''} ${isMultiSelectMode && selectedMessageIds.has(msg.id) ? 'ring-2 ring-zinc-800 dark:ring-zinc-400 ring-offset-1 dark:ring-offset-black rounded-2xl' : ''}`}
              >
                {msg.messageType === 'image' && msg.specialData?.imageUrl ? (
                  <ImageMessage imageUrl={msg.specialData.imageUrl} isSelf={msg.role === 'user'} />
                ) : msg.messageType === 'redpacket' && msg.specialData ? (
                  <RedPacketMessage data={msg.specialData} isSelf={msg.role === 'user'} />
                ) : msg.messageType === 'gift' && msg.specialData ? (
                  <GiftMessage data={msg.specialData} isSelf={msg.role === 'user'} />
                ) : msg.messageType === 'custom_gift' && msg.giftData ? (
                  <CustomGiftMessage data={msg.giftData} isSelf={msg.role === 'user'} />
                ) : msg.messageType === 'location' && msg.locationData ? (
                  <LocationMessage data={msg.locationData!} isSelf={msg.role === 'user'} />
                ) : msg.messageType === 'system' ? (
                  <div className="w-full flex justify-center my-2 select-none pointer-events-none">
                    <span className="bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-xs px-3 py-1 rounded-full italic">
                      {msg.content}
                    </span>
                  </div>
                ) : (
                  <div 
                    className={`relative w-fit text-[13px] leading-relaxed select-text whitespace-pre-wrap ${msg.role === 'user' ? 'bubble-user message-user' : 'bubble-char message-assistant'} ${msg.isMergedForward ? 'cursor-pointer' : ''} ${isMultiSelectMode ? 'cursor-pointer' : ''}`}
                  >
                    {/* 气泡样式使用 .bubble-user 和 .bubble-char 标记，后续可在美化设置中通过覆盖这些类来支持自定义颜色 */}
                    {msg.isMergedForward ? (
                    <div className="flex flex-col gap-1">
                      <div className="font-bold text-[13px] border-b border-black/10 dark:border-white/10 pb-1.5 mb-1 flex items-center gap-1.5">
                        <span className="w-1 h-3 bg-zinc-400 dark:bg-zinc-500 rounded-full" />
                        [合并转发] 共 {msg.originalMessages?.length} 条消息
                      </div>
                      <span className="line-clamp-3 text-xs opacity-80 whitespace-pre-wrap break-words">{msg.content}</span>
                    </div>
                  ) : (
                    <>
                      {msg.quote && (<div className={`p-2 rounded-lg text-xs border-l-[3px] flex flex-col gap-0.5 ${msg.role === 'user' ? 'bg-white/10 border-white/30 text-white/80' : 'bg-zinc-100 dark:bg-[#2c2c2e] border-zinc-300 dark:border-zinc-500 text-zinc-500 dark:text-zinc-400'}`}><span className="font-bold">{msg.quote.sender}</span><span className="line-clamp-3 break-words whitespace-pre-wrap">{msg.quote.content}</span></div>)}
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        );})}
        {isAiLoading && <div className="flex justify-start"><div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl flex items-center gap-2 text-zinc-700 dark:text-zinc-200"><RefreshCw size={14} className="animate-spin text-zinc-400" /> 打字中...</div></div>}
        {currentMessages.length === 0 && <div className="text-center text-zinc-400 dark:text-zinc-500 py-20">暂无消息，开始聊天吧</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.isVisible && !isMultiSelectMode && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40" onClick={closeCtx} onContextMenu={(e) => { e.preventDefault(); closeCtx(); }} />
            <div style={getContextMenuStyle()} className="pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: isMenuAbove ? 10 : -10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: isMenuAbove ? 10 : -10 }} 
                transition={{ type: 'spring', stiffness: 400, damping: 25 }} 
                className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl shadow-xl flex flex-wrap justify-center p-1.5 gap-1 pointer-events-auto"
              >
                <button onClick={handleCopyMessage} className="flex flex-col items-center justify-center w-[52px] h-[56px] gap-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-200 active:bg-black/10 shrink-0"><Copy size={20} strokeWidth={1.5} /><span className="text-[10px] font-medium">复制</span></button>
                
                <button onClick={handleQuoteMessage} className="flex flex-col items-center justify-center w-[52px] h-[56px] gap-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-200 active:bg-black/10 shrink-0"><Quote size={20} strokeWidth={1.5} /><span className="text-[10px] font-medium">引用</span></button>
                
                {contextMenu.messageRole === 'user' && (
                  <button onClick={handleEditMessageClick} className="flex flex-col items-center justify-center w-[52px] h-[56px] gap-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-200 active:bg-black/10 shrink-0"><Pencil size={20} strokeWidth={1.5} /><span className="text-[10px] font-medium">编辑</span></button>
                )}
                
                <button onClick={handleDeleteMessage} className="flex flex-col items-center justify-center w-[52px] h-[56px] gap-1.5 rounded-xl hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors text-red-500 active:bg-red-100/50 shrink-0"><Delete size={20} strokeWidth={1.5} /><span className="text-[10px] font-medium">删除</span></button>
                
                {contextMenu.messageRole === 'assistant' && !isAiLoading && (
                  <button onClick={handleRegenerateMessage} className="flex flex-col items-center justify-center w-[52px] h-[56px] gap-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-200 active:bg-black/10 shrink-0"><RefreshCw size={20} strokeWidth={1.5} /><span className="text-[10px] font-medium">重 roll</span></button>
                )}
                
                <button onClick={handleSingleForward} className="flex flex-col items-center justify-center w-[52px] h-[56px] gap-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-200 active:bg-black/10 shrink-0"><Forward size={20} strokeWidth={1.5} /><span className="text-[10px] font-medium">转发</span></button>
                
                <button onClick={handleEnterMultiSelect} className="flex flex-col items-center justify-center w-[52px] h-[56px] gap-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-200 active:bg-black/10 shrink-0"><CheckSquare size={20} strokeWidth={1.5} /><span className="text-[10px] font-medium">多选</span></button>
                
                {canRecall && (
                  <button onClick={handleRecallMessage} className="flex flex-col items-center justify-center w-[52px] h-[56px] gap-1.5 rounded-xl hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-colors text-orange-500 active:bg-orange-100/50 shrink-0"><RefreshCw size={20} strokeWidth={1.5} /><span className="text-[10px] font-medium">撤回</span></button>
                )}

                <button onClick={handleToggleFavorite} className={`flex flex-col items-center justify-center w-[52px] h-[56px] gap-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:bg-black/10 shrink-0 ${isMessageFavorited(contextMenu.messageIndex) ? 'text-yellow-500' : 'text-zinc-700 dark:text-zinc-200'}`}><Star size={20} strokeWidth={1.5} fill={isMessageFavorited(contextMenu.messageIndex) ? 'currentColor' : 'none'} /><span className="text-[10px] font-medium">{isMessageFavorited(contextMenu.messageIndex) ? '取消收藏' : '收藏'}</span></button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (<motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute top-16 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 bg-zinc-800/80 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-lg">{toastMessage}</motion.div>)}
      </AnimatePresence>

      {/* Edit Message Modal */}
      {editingMessageIndex !== null && (
        <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-800 rounded-[24px] w-full max-w-[340px] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700">
              <span className="text-[14px] font-bold text-zinc-800 dark:text-zinc-100">编辑消息</span>
              <button onClick={() => setEditingMessageIndex(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 p-1"><Delete size={18} /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <textarea rows={6} className="w-full bg-zinc-50 dark:bg-zinc-700 rounded-xl p-3 text-sm text-zinc-800 dark:text-zinc-100 outline-none border border-transparent focus:border-zinc-300 dark:focus:border-zinc-500 transition-colors resize-none leading-relaxed" value={editingMessageContent} onChange={e => setEditingMessageContent(e.target.value)} />
              <div className="flex gap-3 mt-2">
                <button onClick={() => setEditingMessageIndex(null)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">取消</button>
                <button onClick={handleSaveEditMessage} className="flex-1 py-3 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rounded-xl text-sm font-bold shadow-md hover:bg-zinc-700 dark:hover:bg-zinc-300 active:scale-95 transition-all flex justify-center items-center gap-2"><Check size={16} /> 保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-select bottom toolbar */}
      {isMultiSelectMode && (
        <div className="absolute bottom-4 left-0 right-0 mx-4 rounded-2xl py-2 px-4 flex justify-around items-center z-50 border border-white/20 dark:border-white/5 bg-[rgba(255,255,255,0.4)] dark:bg-[rgba(20,20,25,0.4)] backdrop-blur-[16px]">
          <button onClick={handleForwardClick} className="flex-1 flex flex-col items-center gap-1 py-2 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-95 transition-all">
            <Forward size={20} />
            <span className="text-[10px] font-bold">转发</span>
          </button>
          <button onClick={handleBatchFavorite} className="flex-1 flex flex-col items-center gap-1 py-2 text-yellow-500 hover:text-yellow-600 active:scale-95 transition-all">
            <Star size={20} />
            <span className="text-[10px] font-bold">收藏</span>
          </button>
          <button onClick={handleBatchDelete} className="flex-1 flex flex-col items-center gap-1 py-2 text-red-500 hover:text-red-600 active:scale-95 transition-all">
            <Trash2 size={20} />
            <span className="text-[10px] font-bold">删除</span>
          </button>
          <button onClick={exitMultiSelectMode} className="flex-1 flex flex-col items-center gap-1 py-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 active:scale-95 transition-all">
            <X size={20} />
            <span className="text-[10px] font-bold">取消</span>
          </button>
        </div>
      )}

      {/* Normal Input Area (hidden in multi-select mode) */}
      {!isMultiSelectMode && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-around items-center z-50 border border-white/20 dark:border-white/5 bg-[rgba(255,255,255,0.4)] dark:bg-[rgba(20,20,25,0.4)] backdrop-blur-[16px] rounded-2xl mx-3 mb-3 py-2 px-2">
          
          {/* Function Panel */}
          <AnimatePresence>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={cameraInputRef} 
              style={{ display: 'none' }} 
              onChange={handleCameraCapture} 
            />

            {showFunctionPanel && !currentChatSettings.isBlocked && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowFunctionPanel(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-4 right-4 mb-4 bg-white/95 dark:bg-zinc-900/95 rounded-[28px] shadow-xl p-4 z-20 border border-black/5 dark:border-white/10 backdrop-blur-2xl"
                >
                  <div className="grid grid-cols-4 gap-y-6 gap-x-4">
                    {[
                      { icon: ImageIcon, label: '相册', id: 'album', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                      { icon: Camera, label: '拍摄', id: 'camera', color: 'text-zinc-700 dark:text-zinc-300', bg: 'bg-zinc-100 dark:bg-zinc-800' },
                      { icon: Phone, label: '语音通话', id: 'phone', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
                      { icon: MapPin, label: '位置', id: 'location', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                      { icon: Wallet, label: '红包', id: 'redpacket', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
                      { icon: Gift, label: '礼物', id: 'gift', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10' },
                      { icon: Banknote, label: '转账', id: 'transfer', color: 'text-yellow-600 dark:text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
                      { icon: Contact, label: '查岗', id: 'check', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                    ].map((item, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleSendSpecialMessage(item.id)}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div className={`w-[56px] h-[56px] rounded-[20px] flex items-center justify-center group-active:scale-95 transition-transform ${item.bg}`}>
                          <item.icon size={26} strokeWidth={1.5} className={item.color} />
                        </div>
                        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {currentChatSettings.isBlocked ? (
            <div className="flex items-center justify-center w-full py-3 px-4 bg-black/5 dark:bg-white/10 backdrop-blur-md rounded-full border border-black/10 dark:border-white/20 text-zinc-500 text-sm font-medium shadow-sm">
              您已被拉黑，无法发送消息
            </div>
          ) : (
            <>
              {quoteToReply && (
                <div className="absolute bottom-[100%] left-6 right-6 mb-2 flex items-center justify-between px-4 py-2 bg-black/5 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-black/10 dark:border-white/20 text-xs shadow-sm">
                  <div className="flex flex-col flex-1 min-w-0 pr-3 border-l-2 border-zinc-400 dark:border-zinc-500 pl-3">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 mb-0.5">{quoteToReply.sender}</span>
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">{quoteToReply.content}</span>
                  </div>
                  <button onClick={() => setQuoteToReply(null)} className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-full transition-colors">
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              )}
              
              {/* Plus Button */}
              <button 
                onClick={() => setShowFunctionPanel(!showFunctionPanel)}
                className={`w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/30 shadow-sm active:scale-95 transition-all flex-shrink-0 text-zinc-700 dark:text-zinc-200 hover:bg-black/10 dark:hover:bg-white/20 ${showFunctionPanel ? 'rotate-45' : ''}`}
              >
                <Plus size={24} strokeWidth={1.5} />
              </button>
              
              {/* Main Input Area */}
              <div className="flex-1 h-10 flex items-center px-2 bg-white/10 backdrop-blur-md rounded-full border border-white/30 shadow-sm transition-colors focus-within:bg-white/20">
                <textarea 
                  rows={1}
                  ref={chatInputRef} 
                  placeholder="说点什么..." 
                  className={`flex-1 bg-transparent py-2.5 px-2 text-[14px] outline-none resize-none overflow-hidden leading-tight min-w-0 h-full ${currentChatSettings.backgroundImage ? 'text-white placeholder:text-white/60' : 'text-zinc-800 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400'}`} 
                  value={chatInput} 
                  onChange={(e) => { 
                    setChatInput(e.target.value); 
                  }} 
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault(); 
                      if (chatInput.trim()) { addUserMessage(); } else { generateAiReply(); }
                    } 
                  }} 
                />

                {/* Mic Button */}
                <button 
                  onClick={() => console.log('语音输入待实现')}
                  className={`w-7 h-7 flex items-center justify-center active:scale-95 transition-all flex-shrink-0 text-zinc-700 dark:text-zinc-200 hover:opacity-80`}
                >
                  <Mic size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Emoji Button */}
              <button 
                onClick={() => console.log('表情包功能待实现')}
                className={`w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/30 shadow-sm active:scale-95 transition-all flex-shrink-0 text-zinc-700 dark:text-zinc-200 hover:bg-black/10 dark:hover:bg-white/20`}
              >
                <Smile size={24} strokeWidth={1.5} />
              </button>
              
              {/* Send Button */}
              <button 
                onClick={() => {
                  if (chatInput.trim()) {
                    addUserMessage();
                  } else {
                    generateAiReply();
                  }
                }} 
                disabled={isAiLoading && !chatInput.trim()} 
                className={`w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/30 shadow-sm active:scale-95 transition-all flex-shrink-0 ${chatInput.trim() ? 'bg-zinc-800 text-white dark:bg-white/90 dark:text-black border-zinc-800 dark:border-white/90' : 'text-zinc-700 dark:text-zinc-200 hover:bg-black/10 dark:hover:bg-white/20'}`}
                title={chatInput.trim() ? "发送" : "请求AI回复"}
              >
                {chatInput.trim() ? <ArrowUp size={20} strokeWidth={1.5} /> : <Zap size={20} strokeWidth={1.5} />}
              </button>
            </>
          )}
        </div>
      )}

      {/* Forward Options ActionSheet */}
      <AnimatePresence>
        {showForwardOptions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowForwardOptions(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="w-full bg-white dark:bg-zinc-800 rounded-t-[24px] flex flex-col overflow-hidden shadow-2xl pb-8" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mt-3 mb-5" />
              <button onClick={() => { setShowForwardOptions(false); setForwardMode('one-by-one'); setForwardTargetId(null); setShowForwardPicker(true); }} className="px-6 py-4 text-[15px] font-bold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-center border-b border-zinc-100 dark:border-zinc-700">逐条转发</button>
              <button onClick={() => { setShowForwardOptions(false); setForwardMode('combined'); setForwardTargetId(null); setShowForwardPicker(true); }} className="px-6 py-4 text-[15px] font-bold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-center border-b border-zinc-100 dark:border-zinc-700">合并转发</button>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-900" />
              <button onClick={() => setShowForwardOptions(false)} className="px-6 py-4 text-[15px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-center">取消</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward Contact Picker Modal */}
      <AnimatePresence>
        {showForwardPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end justify-center">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="w-full max-h-[70%] bg-white dark:bg-zinc-800 rounded-t-[24px] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700">
                <button onClick={() => { setShowForwardPicker(false); setSingleForwardMessage(null); setForwardMode(null); }} className="text-zinc-400 dark:text-zinc-500 text-sm font-bold">取消</button>
                <span className="text-[14px] font-bold text-zinc-800 dark:text-zinc-100">转发给...</span>
                <button onClick={confirmForward} disabled={!forwardTargetId} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${forwardTargetId ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 active:scale-95' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500'}`}>确定</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {/* AI Assistant option */}
                <button
                  onClick={() => setForwardTargetId('ai_assistant')}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${forwardTargetId === 'ai_assistant' ? 'bg-zinc-800/5 dark:bg-zinc-200/10 border-2 border-zinc-800 dark:border-zinc-200' : 'bg-zinc-50 dark:bg-zinc-700 border-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-600'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-600 flex items-center justify-center text-zinc-500 dark:text-zinc-300 flex-shrink-0">
                    <Bot size={20} />
                  </div>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{chatSettings['ai_assistant']?.remark || 'AI 助手'}</span>
                  {forwardTargetId === 'ai_assistant' && <Check size={18} className="ml-auto text-zinc-800 dark:text-zinc-200" />}
                </button>
                {/* Phone personas */}
                {phonePersonas.map(persona => (
                  <button
                    key={persona.id}
                    onClick={() => setForwardTargetId(persona.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${forwardTargetId === persona.id ? 'bg-zinc-800/5 dark:bg-zinc-200/10 border-2 border-zinc-800 dark:border-zinc-200' : 'bg-zinc-50 dark:bg-zinc-700 border-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-600'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-600 flex items-center justify-center text-zinc-400 dark:text-zinc-300 overflow-hidden flex-shrink-0">
                      {persona.avatar ? (
                        <img src={persona.avatar} alt={persona.chatName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{chatSettings[persona.id]?.remark || persona.chatName}</span>
                    {forwardTargetId === persona.id && <Check size={18} className="ml-auto text-zinc-800 dark:text-zinc-200" />}
                  </button>
                ))}
                {phonePersonas.length === 0 && (
                  <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">暂无其他联系人</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Merged Message Details Modal */}
      <AnimatePresence>
        {mergedMessageDetails && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setMergedMessageDetails(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-zinc-800 rounded-[24px] w-full max-w-[340px] max-h-[80vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700 shrink-0">
                <span className="text-[14px] font-bold text-zinc-800 dark:text-zinc-100">聊天记录</span>
                <button onClick={() => setMergedMessageDetails(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full transition-colors"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-900/50">
                {mergedMessageDetails.map((origMsg, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] text-zinc-700 dark:text-zinc-200">{origMsg.sender}</span>
                      <span className="text-[10px] text-zinc-400">{new Date(origMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="text-[13px] text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap break-words">
                      {origMsg.content}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-zinc-800 rounded-[24px] w-full max-w-[300px] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 size={24} className="text-red-500" />
                </div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 text-center">确定删除选中的 {selectedMessageIds.size} 条消息吗？</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">删除后无法恢复</p>
              </div>
              <div className="flex border-t border-zinc-100 dark:border-zinc-700">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3.5 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors border-r border-zinc-100 dark:border-zinc-700">取消</button>
                <button onClick={confirmBatchDelete} className="flex-1 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">删除</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <RedPacketModal 
        isOpen={showRedPacketModal} 
        onClose={() => setShowRedPacketModal(false)} 
        onSend={(data) => addUserMessage(`[红包] ${data.message}`, 'redpacket', data)} 
      />

      <GiftActionSheet
        isOpen={showGiftActionSheet}
        onClose={() => setShowGiftActionSheet(false)}
        onSelectCustomGift={() => setShowCustomGiftModal(true)}
        onSelectShopping={() => setScreen('app-shopping')}
      />
      
      <CustomGiftModal
        isOpen={showCustomGiftModal}
        onClose={() => setShowCustomGiftModal(false)}
        onSend={(data) => addUserMessage(`[礼物] ${data.name}`, 'custom_gift', undefined, undefined, data)}
      />
      
      <GiftModal 
        isOpen={showGiftModal} 
        onClose={() => setShowGiftModal(false)} 
        onSend={(data) => addUserMessage(`[礼物] ${data.giftInfo.name}`, 'gift', data)} 
      />
      
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={(locationData) => {
          if (locationData) {
            addUserMessage(`[位置] ${locationData.name}`, 'location', undefined, locationData);
          }
        }}
      />

      {/* Chat Settings Panel */}
      {isChatSettingsOpen && <ChatSettingsPanel
        currentChatId={currentChatId}
        currentChatSettings={currentChatSettings}
        displayChatName={displayChatName}
        chatSettings={chatSettings}
        setChatSettings={setChatSettings}
        chatMemories={chatMemories}
        setChatMemories={setChatMemories}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        chatHistories={chatHistories}
        setChatHistories={setChatHistories}
        apiConfig={apiConfig}
        editingMemory={editingMemory}
        setEditingMemory={setEditingMemory}
        autoSummaryStatus={autoSummaryStatus}
        setAutoSummaryStatus={setAutoSummaryStatus}
        onClose={() => setIsChatSettingsOpen(false)}
        showToast={showToast}
      />}

      {/* Custom CSS Injection - Placed at the bottom to ensure override */}
      <style dangerouslySetInnerHTML={{ __html: currentChatSettings.customBubbleCSS || '' }} />
    </div>
  );
}

// --- Chat Settings Panel (sub-component) ---

function ChatSettingsPanel({ currentChatId, currentChatSettings, displayChatName, chatSettings, setChatSettings, chatMemories, setChatMemories, chatMessages, setChatMessages, chatHistories, setChatHistories, apiConfig, editingMemory, setEditingMemory, autoSummaryStatus, setAutoSummaryStatus, onClose, showToast }: {
  currentChatId: string;
  currentChatSettings: ChatSettings;
  displayChatName: string;
  chatSettings: Record<string, ChatSettings>;
  setChatSettings: React.Dispatch<React.SetStateAction<Record<string, ChatSettings>>>;
  chatMemories: Record<string, MemoryEntry[]>;
  setChatMemories: React.Dispatch<React.SetStateAction<Record<string, MemoryEntry[]>>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  chatHistories: Record<string, ChatMessage[]>;
  setChatHistories: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  apiConfig: ApiConfig;
  editingMemory: { id?: string; title: string; content: string } | null;
  setEditingMemory: React.Dispatch<React.SetStateAction<{ id?: string; title: string; content: string } | null>>;
  autoSummaryStatus: string;
  setAutoSummaryStatus: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  showToast: (msg: string, duration?: number) => void;
}) {
  const [remark, setRemark] = useState(currentChatSettings.remark || '');
  const [bg, setBg] = useState(currentChatSettings.background || '');
  const [blocked, setBlocked] = useState(currentChatSettings.isBlocked || false);
  const [pinned, setPinned] = useState(currentChatSettings.isPinned || false);
  const [autoSummary, setAutoSummary] = useState(currentChatSettings.isAutoSummaryEnabled || false);
  const [summaryThreshold, setSummaryThreshold] = useState(currentChatSettings.autoSummaryThreshold || 30);
  const [timeAwareness, setTimeAwareness] = useState(currentChatSettings.timeAwareness || false);
  const [showAvatar, setShowAvatar] = useState(currentChatSettings.showAvatar !== false);
  const [patSuffix, setPatSuffix] = useState(currentChatSettings.patSuffix || '');
  const [longDistanceMode, setLongDistanceMode] = useState(currentChatSettings.longDistanceMode || false);
  const [backgroundImage, setBackgroundImage] = useState(currentChatSettings.backgroundImage || '');
  const [customBubbleCSS, setCustomBubbleCSS] = useState(currentChatSettings.customBubbleCSS || '');
  const [globalChatCSS, setGlobalChatCSS] = useState(() => localStorage.getItem('aiphone_global_chat_css') || '');
  const [activeTab, setActiveTab] = useState<'general' | 'voice' | 'memory' | 'beauty'>('general');
  const [voicePref, setVoicePref] = useState<VoicePreference>({ mode: 'preset', voiceId: '' });
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    setVoicePref(getVoicePreference());
  }, []);

  const handleVoicePrefChange = (mode: 'preset' | 'custom', voiceId: string) => {
    const newPref = { mode, voiceId };
    setVoicePref(newPref);
    saveVoicePreference(newPref);
  };

  const curMem = chatMemories[currentChatId] || [];
  const presetColors = ['#f4f4f5', '#fee2e2', '#fef3c7', '#dcfce7', '#e0e7ff', '#f3e8ff', '#fce7f3', '#18181b', '#3f3f46'];
  const isImageBg = bg.startsWith('data:image') || bg.startsWith('http');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('不支持的文件格式');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) return;
        
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > 800) {
              height = Math.round((height * 800) / width);
              width = 800;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              setBg(dataUrl);
            } else {
              showToast('图片处理失败');
            }
          } catch (err) {
            showToast('图片加载失败');
          }
        };
        img.onerror = () => showToast('图片加载失败');
        img.src = result;
      };
      reader.onerror = () => showToast('图片加载失败');
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setChatSettings(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        remark,
        background: bg,
        isBlocked: blocked,
        isPinned: pinned,
        isAutoSummaryEnabled: autoSummary,
        autoSummaryThreshold: summaryThreshold,
        timeAwareness,
        showAvatar,
        patSuffix,
        longDistanceMode,
        backgroundImage,
        customBubbleCSS,
      }
    }));
    localStorage.setItem('aiphone_global_chat_css', globalChatCSS);
    
    // Apply global CSS immediately
    let styleEl = document.getElementById('global-chat-css');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'global-chat-css';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = globalChatCSS;

    onClose();
  };

  const handleClearChat = () => {
    if (currentChatId === 'ai_assistant') setChatMessages([]);
    else setChatHistories(prev => ({ ...prev, [currentChatId]: [] }));
    onClose();
  };

  const handleExportChat = () => {
    try {
      const msgs = currentChatId === 'ai_assistant' ? chatMessages : (chatHistories[currentChatId] || []);
      if (msgs.length === 0) {
        showToast('暂无聊天记录可导出');
        return;
      }

      const exportData = msgs.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        type: msg.messageType,
        specialData: msg.specialData || msg.locationData || msg.giftData
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const date = new Date();
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      
      const safeName = displayChatName.replace(/[<>:"/\\|?*]+/g, '_');
      a.download = `chat_history_${safeName}_${yyyy}${mm}${dd}_${hh}${min}${ss}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('导出成功');
    } catch (err) {
      console.error('Export chat failed:', err);
      showToast('导出失败');
    }
  };

  const handleSaveMemory = () => {
    if (!editingMemory || !editingMemory.title.trim() || !editingMemory.content.trim()) return;
    if (editingMemory.id) {
      setChatMemories(prev => ({ ...prev, [currentChatId]: (prev[currentChatId] || []).map(m => m.id === editingMemory!.id ? { ...m, title: editingMemory!.title, content: editingMemory!.content } : m) }));
    } else {
      const newMem: MemoryEntry = { id: Date.now().toString() + Math.random().toString(36).substring(2, 9), title: editingMemory.title, content: editingMemory.content, keywords: [], createdAt: Date.now(), isPinned: false };
      setChatMemories(prev => ({ ...prev, [currentChatId]: [...(prev[currentChatId] || []), newMem] }));
    }
    setEditingMemory(null);
  };

  const handleDeleteMemory = (id: string) => {
    setChatMemories(prev => ({ ...prev, [currentChatId]: (prev[currentChatId] || []).filter(m => m.id !== id) }));
  };

  const handleTogglePin = (id: string) => {
    setChatMemories(prev => ({ ...prev, [currentChatId]: (prev[currentChatId] || []).map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m) }));
  };

  const handleManualSummary = async () => {
    const msgs = currentChatId === 'ai_assistant' ? chatMessages : (chatHistories[currentChatId] || []);
    if (msgs.length < 5) { setAutoSummaryStatus('消息太少，无法总结'); setTimeout(() => setAutoSummaryStatus(''), 2000); return; }
    if (!apiConfig.baseUrl || !apiConfig.apiKey) { setAutoSummaryStatus('请先配置API'); setTimeout(() => setAutoSummaryStatus(''), 2000); return; }
    setAutoSummaryStatus('正在总结...');
    try {
      const txt = msgs.map(m => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`).join('\n');
      const prompt = `根据以下对话，生成一段总结（200字以内），并提取3-5个关键词。输出格式：{"title":"...","content":"...","keywords":["词1","词2"]}\n\n对话历史：\n${txt}`;
      const baseUrl = apiConfig.baseUrl.trim().replace(/\/+$/, '');
      const url = (!/^https?:\/\//i.test(baseUrl) ? 'https://' + baseUrl : baseUrl).replace(/\/chat\/completions$/, '') + '/chat/completions';
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.apiKey}` }, body: JSON.stringify({ model: apiConfig.selectedModel || 'gpt-3.5-turbo', messages: [{ role: 'system', content: '你是一个对话总结助手，必须只输出要求的JSON格式。' }, { role: 'user', content: prompt }], temperature: 0.3, max_tokens: 800, stream: false }) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content;
      if (raw) {
        const p = JSON.parse(raw);
        if (p.title && p.content) {
          const newMem: MemoryEntry = { id: Date.now().toString() + Math.random().toString(36).substring(2, 9), title: p.title, content: p.content, keywords: p.keywords || [], createdAt: Date.now(), isPinned: false };
          setChatMemories(prev => ({ ...prev, [currentChatId]: [...(prev[currentChatId] || []), newMem] }));
          setAutoSummaryStatus('总结完成！');
        }
      }
    } catch (err: any) { setAutoSummaryStatus(`总结失败: ${err.message}`); }
    setTimeout(() => setAutoSummaryStatus(''), 3000);
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('不支持的文件格式');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) return;
        
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > 1080) {
              height = Math.round((height * 1080) / width);
              width = 1080;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              setBackgroundImage(dataUrl);
            } else {
              showToast('图片处理失败');
            }
          } catch (err) {
            showToast('图片加载失败');
          }
        };
        img.onerror = () => showToast('图片加载失败');
        img.src = result;
      };
      reader.onerror = () => showToast('图片加载失败');
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] bg-gradient-to-br from-[#E5E5E5] to-[#D4D4D4] dark:from-[#1c1c1e] dark:to-[#121212] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 pt-4 relative z-20">
        <button 
          onClick={onClose} 
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 dark:text-zinc-300 shadow-sm hover:bg-white/40 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        
        <div className="flex-1 mx-3 h-12 bg-white/20 backdrop-blur-md rounded-full flex justify-evenly items-center relative overflow-hidden">
          <div 
            className={`absolute h-10 top-1 bg-white/40 backdrop-blur-md border-none transition-all duration-300 ease-out z-0 ${
              (activeTab === 'general' || activeTab === 'voice') ? 'left-1 w-[calc(33.33%-4px)] rounded-l-xl rounded-r-none' :
              activeTab === 'beauty' ? 'left-[33.33%] w-[33.34%] rounded-none' :
              activeTab === 'memory' ? 'left-[66.67%] w-[calc(33.33%-4px)] rounded-r-xl rounded-l-none' : ''
            }`}
          />
          {[
            { id: 'general', label: '通用' },
            { id: 'beauty', label: '美化' },
            { id: 'memory', label: '记忆' }
          ].map(tab => {
            const isActive = activeTab === tab.id || (tab.id === 'general' && activeTab === 'voice');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative z-10 w-1/3 h-full text-sm transition-all duration-300 ${
                  isActive
                    ? 'text-black font-bold' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button 
          onClick={handleSave}
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 dark:text-zinc-300 shadow-sm hover:bg-white/40 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
        >
          <Check size={20} strokeWidth={2} />
        </button>
      </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {(activeTab === 'general' || activeTab === 'voice') && (
            <>
              <div className="flex flex-col gap-2 mb-3">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">备注名</label>
                <input type="text" placeholder="设置备注名..." className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white/30 transition-colors" value={remark} onChange={e => setRemark(e.target.value)} />
              </div>
              
              <div className="flex flex-col gap-2 mb-4">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">拍一拍后缀</label>
                <input type="text" placeholder="输入拍一拍后缀，如‘的肩膀’" className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-500 placeholder:text-[11px] focus:outline-none focus:bg-white/30 transition-colors" value={patSuffix} onChange={e => setPatSuffix(e.target.value)} />
                <span className="text-[10px] text-zinc-400 px-1">双击对方头像触发拍一拍</span>
              </div>
              
              <div className="flex items-center justify-between p-3.5 mb-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <span className="text-sm text-zinc-700 dark:text-zinc-200">置顶聊天</span>
                <button onClick={() => setPinned(!pinned)} className={`w-10 h-5 rounded-full transition-colors relative border ${pinned ? 'bg-zinc-800 border-zinc-800 dark:bg-zinc-200 dark:border-zinc-200' : 'bg-zinc-200 border-zinc-200 dark:bg-zinc-600 dark:border-zinc-600'}`}><div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${pinned ? 'left-[22px] bg-white dark:bg-[#1c1c1e]' : 'left-0.5 bg-white'}`} /></button>
              </div>
              <div className="flex items-center justify-between p-3.5 mb-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <span className="text-sm text-zinc-700 dark:text-zinc-200">拉黑</span>
                <button onClick={() => setBlocked(!blocked)} className={`w-10 h-5 rounded-full transition-colors relative border ${blocked ? 'bg-zinc-800 border-zinc-800 dark:bg-zinc-200 dark:border-zinc-200' : 'bg-zinc-200 border-zinc-200 dark:bg-zinc-600 dark:border-zinc-600'}`}><div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${blocked ? 'left-[22px] bg-white dark:bg-[#1c1c1e]' : 'left-0.5 bg-white'}`} /></button>
              </div>
              <div className="flex items-center justify-between p-3.5 mb-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <span className="text-sm text-zinc-700 dark:text-zinc-200">感知时间</span>
                <button onClick={() => setTimeAwareness(!timeAwareness)} className={`w-10 h-5 rounded-full transition-colors relative border ${timeAwareness ? 'bg-zinc-800 border-zinc-800 dark:bg-zinc-200 dark:border-zinc-200' : 'bg-zinc-200 border-zinc-200 dark:bg-zinc-600 dark:border-zinc-600'}`}><div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${timeAwareness ? 'left-[22px] bg-white dark:bg-[#1c1c1e]' : 'left-0.5 bg-white'}`} /></button>
              </div>
              <div className="flex items-center justify-between p-3.5 mb-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <span className="text-sm text-zinc-700 dark:text-zinc-200">异地模式</span>
                <button onClick={() => setLongDistanceMode(!longDistanceMode)} className={`w-10 h-5 rounded-full transition-colors relative border ${longDistanceMode ? 'bg-zinc-800 border-zinc-800 dark:bg-zinc-200 dark:border-zinc-200' : 'bg-zinc-200 border-zinc-200 dark:bg-zinc-600 dark:border-zinc-600'}`}><div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${longDistanceMode ? 'left-[22px] bg-white dark:bg-[#1c1c1e]' : 'left-0.5 bg-white'}`} /></button>
              </div>
              <div className="flex items-center justify-between p-3.5 mb-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <span className="text-sm text-zinc-700 dark:text-zinc-200">显示头像</span>
                <button onClick={() => setShowAvatar(!showAvatar)} className={`w-10 h-5 rounded-full transition-colors relative border ${showAvatar ? 'bg-zinc-800 border-zinc-800 dark:bg-zinc-200 dark:border-zinc-200' : 'bg-zinc-200 border-zinc-200 dark:bg-zinc-600 dark:border-zinc-600'}`}><div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${showAvatar ? 'left-[22px] bg-white dark:bg-[#1c1c1e]' : 'left-0.5 bg-white'}`} /></button>
              </div>

              {/* Voice Settings Section */}
              <div className="flex flex-col gap-3 mt-2 mb-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 shrink-0">语音设置</h3>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {PRESET_VOICES.map(voice => {
                      const isSelected = voicePref.mode === 'preset' && voicePref.voiceId === voice.id;
                      return (
                        <button
                          key={voice.id}
                          onClick={() => handleVoicePrefChange('preset', voice.id)}
                          className={`px-3 py-1 rounded-full border text-xs whitespace-nowrap cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-white/30 border-white/40 text-black font-medium' 
                              : 'bg-white/10 border-white/20 text-gray-600 hover:bg-white/20'
                          }`}
                        >
                          {voice.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full">
                  <input 
                    type="text" 
                    placeholder="自定义 Voice ID" 
                    className={`flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus:bg-white/20 ${
                      voicePref.mode === 'custom' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`} 
                    value={voicePref.mode === 'custom' ? voicePref.voiceId : ''} 
                    onChange={e => handleVoicePrefChange('custom', e.target.value)}
                    onFocus={() => {
                      if (voicePref.mode !== 'custom') {
                        handleVoicePrefChange('custom', voicePref.voiceId);
                      }
                    }}
                  />
                </div>
              </div>

              <button onClick={handleExportChat} className="w-full py-3 mb-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-gray-700 font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"><Download size={16} /> 导出聊天记录</button>
              <button onClick={handleClearChat} className="w-full py-3 mb-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-red-500 font-medium hover:bg-white/30 transition-colors flex items-center justify-center">清空聊天记录</button>
            </>
          )}

          {activeTab === 'memory' && (
            <>
              <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl mb-2 border border-neutral-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">自动总结记忆</span>
                  <button onClick={() => setAutoSummary(!autoSummary)} className={`w-10 h-5 rounded-full transition-colors relative border ${autoSummary ? 'bg-zinc-800 border-zinc-800 dark:bg-zinc-200 dark:border-zinc-200' : 'bg-zinc-200 border-zinc-200 dark:bg-zinc-600 dark:border-zinc-600'}`}><div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${autoSummary ? 'left-[22px] bg-white dark:bg-[#1c1c1e]' : 'left-0.5 bg-white'}`} /></button>
                </div>
                {autoSummary && (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400">每积累多少条新消息后自动总结：</label>
                    <div className="flex items-center gap-3">
                      <input type="number" min="5" max="100" className="w-20 bg-white dark:bg-black p-2 rounded-lg text-sm text-zinc-800 dark:text-zinc-100 outline-none border border-zinc-200 dark:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors text-center" value={summaryThreshold} onChange={e => setSummaryThreshold(Number(e.target.value) || 30)} />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">条消息</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-2 mb-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">记忆列表 ({curMem.length})</span>
                <div className="flex gap-2">
                  <button onClick={handleManualSummary} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full text-[10px] font-bold active:scale-95 transition-all flex items-center gap-1"><Sparkles size={12} />手动总结</button>
                  <button onClick={() => setEditingMemory({ title: '', content: '' })} className="px-3 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rounded-full text-[10px] font-bold active:scale-95 transition-all flex items-center gap-1"><Plus size={12} />新建</button>
                </div>
              </div>
              {autoSummaryStatus && <div className="text-xs text-zinc-500 dark:text-zinc-400 py-1">{autoSummaryStatus}</div>}
              {curMem.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs">暂无记忆</div>
              ) : (
                curMem.map(mem => (
                  <div key={mem.id} className={`p-4 rounded-xl border transition-colors ${mem.isPinned ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800' : 'bg-white dark:bg-[#1c1c1e] border-neutral-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{mem.title}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleTogglePin(mem.id)} className={`p-1.5 rounded-full transition-colors ${mem.isPinned ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}><Bookmark size={12} fill={mem.isPinned ? 'currentColor' : 'none'} /></button>
                        <button onClick={() => setEditingMemory({ id: mem.id, title: mem.title, content: mem.content })} className="p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => handleDeleteMemory(mem.id)} className="p-1.5 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"><Delete size={12} /></button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-3">{mem.content}</p>
                    {mem.keywords && mem.keywords.length > 0 && <div className="flex gap-1 mt-2 flex-wrap">{mem.keywords.map((k: string, ki: number) => <span key={ki} className="px-2 py-0.5 bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full text-[10px]">{k}</span>)}</div>}
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'beauty' && (
            <>
              <div className="flex flex-col gap-3 py-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">聊天背景/壁纸</label>
                  <button onClick={() => setBackgroundImage('')} className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">重置背景</button>
                </div>
                
                <label className="relative mt-2 w-full h-40 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer overflow-hidden group">
                  {backgroundImage ? (
                    <>
                      <img src={backgroundImage} alt="背景预览" className="w-full h-full object-cover absolute inset-0 z-0" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                        <span className="text-white text-sm font-bold flex items-center gap-2"><Upload size={16} /> 更换背景</span>
                      </div>
                    </>
                  ) : (
                     <>
                       <Upload size={24} className="mb-2" />
                       <span className="text-sm font-bold">从相册选择图片</span>
                       <span className="text-xs text-zinc-400 mt-1">支持 JPG, PNG 等格式</span>
                     </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundImageUpload} />
                </label>
              </div>

              {/* 气泡效果预览 */}
              <div className="flex flex-col gap-2 mt-4">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">气泡效果预览</span>
                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-[#E5E5E5] dark:bg-zinc-800 flex flex-col p-4 gap-4 shadow-inner">
                  
                  {/* 确保预览也应用正在编辑的自定义CSS */}
                  <style dangerouslySetInnerHTML={{ __html: customBubbleCSS + '\n' + globalChatCSS }} />
                  
                  <div className="relative z-10 w-full flex flex-col gap-4 mt-auto">
                    <div className="self-start mr-auto bubble-char message-assistant" style={{ padding: '8px 16px', borderRadius: '16px' }}>
                      这是对方的消息
                    </div>
                    <div className="self-end ml-auto bubble-user message-user" style={{ padding: '8px 16px', borderRadius: '16px' }}>
                      这是我的消息
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">当前聊天气泡美化 (CSS)</label>
                    <span onClick={() => setShowTutorial(true)} className="inline-flex w-4 h-4 rounded-full bg-white/20 text-[10px] items-center justify-center cursor-pointer hover:bg-white/30 text-zinc-600 dark:text-zinc-300">?</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCustomBubbleCSS(prev => prev + (prev ? '\n' : '') + '.message-user {\n  background-color: #e0f7fa !important;\n  border-radius: 20px 12px 20px 12px !important;\n  color: #000000 !important;\n}\n.message-assistant {\n  background-color: #ffffff !important;\n  border: 1px solid #ddd !important;\n}')} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs hover:bg-white/20 transition-colors text-zinc-700 dark:text-zinc-300">填入示例</button>
                    <button onClick={() => setCustomBubbleCSS('')} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs hover:bg-white/20 transition-colors text-zinc-700 dark:text-zinc-300">重置</button>
                  </div>
                </div>
                <textarea 
                  placeholder="编写CSS代码自定义当前聊天气泡样式（建议加上 !important）..." 
                  className="w-full bg-gray-100 dark:bg-gray-800 p-3 rounded-xl text-sm font-mono text-zinc-800 dark:text-zinc-100 outline-none border-none transition-colors overflow-auto" 
                  style={{ height: '150px' }}
                  value={customBubbleCSS} 
                  onChange={e => setCustomBubbleCSS(e.target.value)} 
                />
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">支持 CSS 类名：.message-user（用户气泡）、.message-assistant（AI 气泡）、.chat-container（聊天容器）</span>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">全局聊天界面美化 (CSS)</label>
                    <span onClick={() => setShowTutorial(true)} className="inline-flex w-4 h-4 rounded-full bg-white/20 text-[10px] items-center justify-center cursor-pointer hover:bg-white/30 text-zinc-600 dark:text-zinc-300">?</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setGlobalChatCSS(prev => prev + (prev ? '\n' : '') + '.message-user {\n  background-color: #e0f7fa !important;\n  border-radius: 20px 12px 20px 12px !important;\n  color: #000000 !important;\n}\n.message-assistant {\n  background-color: #ffffff !important;\n  border: 1px solid #ddd !important;\n}')} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs hover:bg-white/20 transition-colors text-zinc-700 dark:text-zinc-300">填入示例</button>
                    <button onClick={() => setGlobalChatCSS('')} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs hover:bg-white/20 transition-colors text-zinc-700 dark:text-zinc-300">重置</button>
                  </div>
                </div>
                <textarea 
                  placeholder="编写CSS代码应用于所有聊天界面（建议加上 !important）..." 
                  className="w-full bg-gray-100 dark:bg-gray-800 p-3 rounded-xl text-sm font-mono text-zinc-800 dark:text-zinc-100 outline-none border-none transition-colors overflow-auto" 
                  style={{ height: '150px' }}
                  value={globalChatCSS} 
                  onChange={e => setGlobalChatCSS(e.target.value)} 
                />
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">支持 CSS 类名：.message-user（用户气泡）、.message-assistant（AI 气泡）、.chat-container（聊天容器）</span>
              </div>

            </>
          )}
        </div>

        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" 
              onClick={() => setShowTutorial(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
                className="bg-[#E5E5E5] dark:bg-zinc-800 rounded-2xl p-6 max-w-sm w-full flex flex-col shadow-2xl" 
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">如何自定义气泡样式？</h4>
                  <button onClick={() => setShowTutorial(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                    <X size={18} />
                  </button>
                </div>
                <div className="text-[12px] text-zinc-600 dark:text-zinc-400 space-y-2 font-mono">
                  <p>你可以使用以下 CSS 类名来定制聊天气泡：</p>
                  <ul className="list-disc pl-4 space-y-1 my-2">
                    <li>.message-user (用户气泡)</li>
                    <li>.message-assistant (AI气泡)</li>
                    <li>.chat-container (聊天容器)</li>
                    <li>.avatar-user (用户头像)</li>
                    <li>.avatar-assistant (AI头像)</li>
                  </ul>
                  <p>示例：</p>
                  <pre className="bg-black/5 dark:bg-black/20 p-3 rounded-xl mt-2 overflow-x-auto text-[11px]">
{`.message-user {
  background-color: #e0f7fa !important;
  border-radius: 20px 12px 20px 12px !important;
  color: #000000 !important;
}
.message-assistant {
  background-color: #ffffff !important;
  border: 1px solid #ddd !important;
}`}
                  </pre>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memory edit modal */}
        {editingMemory && (
          <div className="absolute inset-0 z-[65] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setEditingMemory(null)}>
            <div className="bg-white dark:bg-zinc-800 rounded-[24px] w-full max-w-[340px] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700">
                <span className="text-[14px] font-bold text-zinc-800 dark:text-zinc-100">{editingMemory.id ? '编辑记忆' : '新建记忆'}</span>
                <button onClick={() => setEditingMemory(null)} className="text-zinc-400 dark:text-zinc-500 p-1"><Delete size={18} /></button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <input type="text" placeholder="标题" className="w-full bg-zinc-50 dark:bg-zinc-700 p-3 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 outline-none border border-transparent focus:border-zinc-300 dark:focus:border-zinc-500 transition-colors" value={editingMemory.title} onChange={e => setEditingMemory(prev => prev ? { ...prev, title: e.target.value } : null)} />
                <textarea rows={6} placeholder="记忆内容..." className="w-full bg-zinc-50 dark:bg-zinc-700 rounded-xl p-3 text-sm text-zinc-800 dark:text-zinc-100 outline-none border border-transparent focus:border-zinc-300 dark:focus:border-zinc-500 transition-colors resize-none leading-relaxed" value={editingMemory.content} onChange={e => setEditingMemory(prev => prev ? { ...prev, content: e.target.value } : null)} />
                <div className="flex gap-3">
                  <button onClick={() => setEditingMemory(null)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">取消</button>
                  <button onClick={handleSaveMemory} className="flex-1 py-3 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rounded-xl text-sm font-bold shadow-md hover:bg-zinc-700 dark:hover:bg-zinc-300 active:scale-95 transition-all flex justify-center items-center gap-2"><Check size={16} />保存</button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
