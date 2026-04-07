import React, { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, User, UserPlus, AlertCircle } from 'lucide-react';
import { renderInPhoneContainer } from '../utils/portal';
import type { Persona, ApiConfig } from '../types';

// --- ErrorBoundary for AddFriendModal ---
interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AddFriendErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AddFriendModal] ErrorBoundary caught error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] w-full max-w-[340px] flex flex-col overflow-hidden shadow-2xl p-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                出现了一点问题
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                添加好友时遇到错误，请重试
              </span>
              <button
                onClick={this.reset}
                className="mt-2 px-6 py-2 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-sm font-bold active:scale-95 transition-all"
              >
                关闭并重试
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  phonePersonas: Persona[];
  contacts: Persona[];
  apiConfig: ApiConfig;
  onAddContact: (persona: Persona) => void;
  onAddNewPersona: (persona: Persona) => void;
}

function normalizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  if (url.endsWith('/chat/completions')) url = url.replace(/\/chat\/completions$/, '');
  return url;
}

function generateChatId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function generatePersonaId(): string {
  return `persona_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

async function generatePersonaByAI(
  accountName: string,
  apiConfig: ApiConfig
): Promise<Persona | null> {
  if (!apiConfig.baseUrl || !apiConfig.apiKey) {
    // Fallback: generate a simple random persona without AI
    return generateFallbackPersona(accountName);
  }

  const prompt = `请根据以下账号名生成一个随机人设，账号名：${accountName}。
【重要】这个人设是用户通过搜索账号随机添加的陌生人。因此，该角色应该具备以下特点：
- 初次接触时，对用户（陌生人）的主动添加感到自然、但保持适度警惕或疑惑。
- 聊天初始语气可以是礼貌但略带距离感，或者好奇问“我们认识吗？”“你怎么知道我的？”等。
- 不要表现得太热情或主动，也不要不理不睬，保持真实社交中的陌生人反应。
- 后续关系发展由聊天过程中的好感度决定，但初始状态应该是陌生人关系。

返回严格的 JSON 格式（不要包含任何其他文字或 markdown 标记），字段包括：
{
  "name": "姓名（中文名）",
  "gender": "男或女",
  "age": "年龄数字字符串",
  "occupation": "职业",
  "personality": "性格描述（20字以内）",
  "background": "背景故事（50字以内）"
}`;

  try {
    const url = `${normalizeBaseUrl(apiConfig.baseUrl)}/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

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
          {
            role: 'system',
            content: '你是一个角色生成器，必须只输出要求的JSON格式，不要输出其他任何内容。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 500,
        stream: false,
      }),
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) throw new Error('Empty response');

    // Try to extract JSON from the response
    let parsed: any;
    try {
      // Try direct parse first
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Cannot parse JSON');
      }
    }

    if (!parsed.name) throw new Error('Missing name field');

    const chatId = generateChatId();
    const id = generatePersonaId();

    return {
      id,
      name: parsed.name,
      gender: parsed.gender || '未知',
      chatName: parsed.name,
      chatId,
      avatar: null,
      height: '',
      weight: '',
      age: String(parsed.age || ''),
      occupation: parsed.occupation || '',
      location: '',
      personality: parsed.personality || '',
      bio: parsed.background || '',
    };
  } catch (err) {
    console.error('AI persona generation failed:', err);
    // Fallback to simple generation
    try {
      return generateFallbackPersona(accountName);
    } catch (fallbackErr) {
      console.error('Fallback persona generation also failed:', fallbackErr);
      return null;
    }
  }
}

function generateFallbackPersona(accountName: string): Persona {
  const names = ['林晓', '陈宇', '王芳', '张明', '李思', '赵阳', '孙婷', '周博', '吴悦', '刘洋'];
  const genders = ['男', '女'];
  const occupations = ['学生', '程序员', '设计师', '教师', '医生', '作家', '摄影师', '自由职业者'];
  const personalities = ['开朗活泼', '温柔体贴', '理性冷静', '热情大方', '沉稳内敛', '幽默风趣'];

  const name = accountName.length <= 4 ? accountName : names[Math.floor(Math.random() * names.length)];
  const gender = genders[Math.floor(Math.random() * genders.length)];
  const age = String(18 + Math.floor(Math.random() * 20));
  const occupation = occupations[Math.floor(Math.random() * occupations.length)];
  const personality = personalities[Math.floor(Math.random() * personalities.length)];

  return {
    id: generatePersonaId(),
    name,
    gender,
    chatName: name,
    chatId: generateChatId(),
    avatar: null,
    height: '',
    weight: '',
    age,
    occupation,
    location: '',
    personality,
    bio: `一个${personality}的${occupation}`,
  };
}

function AddFriendModalInner({
  isOpen,
  onClose,
  phonePersonas,
  contacts,
  apiConfig,
  onAddContact,
  onAddNewPersona,
}: AddFriendModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    contact?: Persona;
    isExisting?: boolean;
    error?: string;
  } | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Reset all internal state when modal closes (isOpen changes to false)
  useEffect(() => {
    if (!isOpen) {
      // Use a small delay to allow exit animation to complete before resetting state
      const timer = setTimeout(() => {
        resetState();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const resetState = () => {
    setQuery('');
    setSearchResult(null);
    setIsSearching(false);
    setAddSuccess(false);
    setAddError(null);
  };

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchResult(null);
    setAddSuccess(false);
    setAddError(null);

    try {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));

      // 1. Local search (match name or chatId)
      const existing = phonePersonas.find(
        (p) =>
          p.name === trimmed ||
          p.chatName === trimmed ||
          p.chatId === trimmed
      );
      if (existing) {
        setSearchResult({ found: true, contact: existing, isExisting: true });
        setIsSearching(false);
        return;
      }

      // 2. Random probability (60%) to "find" the account
      const shouldExist = Math.random() < 0.6;
      if (!shouldExist) {
        setSearchResult({ found: false, error: '用户不存在' });
        setIsSearching(false);
        return;
      }

      // 3. AI generate new persona
      const newPersona = await generatePersonaByAI(trimmed, apiConfig);
      if (!newPersona) {
        setSearchResult({ found: false, error: '生成失败，请重试' });
      } else {
        setSearchResult({ found: true, contact: newPersona, isExisting: false });
      }
    } catch (err) {
      console.error('[AddFriendModal] Search error:', err);
      setSearchResult({ found: false, error: '搜索失败，请重试' });
    } finally {
      // Always ensure isSearching is set to false, no matter what happens
      setIsSearching(false);
    }
  };

  const handleAdd = () => {
    if (!searchResult?.contact) return;

    try {
      const persona = searchResult.contact;
      const isAlreadyContact = contacts.some((c) => c.id === persona.id);

      if (isAlreadyContact) {
        setAddSuccess(true);
        setAddError(null);
        setTimeout(() => {
          handleClose();
        }, 800);
        return;
      }

      // If it's a new persona (not in phonePersonas), save it first
      if (!searchResult.isExisting) {
        onAddNewPersona(persona);
      }

      // Add to contacts
      onAddContact(persona);
      setAddSuccess(true);
      setAddError(null);

      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err) {
      console.error('[AddFriendModal] Add contact error:', err);
      setAddError('添加失败，请重试');
      setAddSuccess(false);
    }
  };

  const handleClose = () => {
    onClose();
    // resetState will be triggered by the useEffect watching isOpen
  };

  const isAlreadyContact = searchResult?.contact
    ? contacts.some((c) => c.id === searchResult.contact!.id)
    : false;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white dark:bg-[#1c1c1e] rounded-[24px] w-full max-w-[340px] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[15px] font-bold text-zinc-800 dark:text-zinc-100">
                添加好友
              </span>
              <button
                onClick={handleClose}
                className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Area */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isSearching) handleSearch();
                    }}
                    placeholder="请输入账号/昵称"
                    className="w-full bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 pr-10 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 outline-none border border-transparent focus:border-zinc-300 dark:focus:border-zinc-600 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    autoFocus
                  />
                  <Search
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!query.trim() || isSearching}
                  className="px-4 py-2.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-sm font-bold disabled:opacity-40 active:scale-95 transition-all shrink-0"
                >
                  搜索
                </button>
              </div>
            </div>

            {/* Results Area */}
            <div className="px-5 pb-5 min-h-[120px] flex flex-col">
              <AnimatePresence mode="wait">
                {/* Loading State */}
                {isSearching && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center py-8 gap-3"
                  >
                    <Loader2
                      size={28}
                      className="animate-spin text-zinc-400 dark:text-zinc-500"
                    />
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      搜索中...
                    </span>
                  </motion.div>
                )}

                {/* Success Toast */}
                {addSuccess && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex-1 flex flex-col items-center justify-center py-8 gap-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <UserPlus
                        size={24}
                        className="text-zinc-600 dark:text-zinc-400"
                      />
                    </div>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      添加成功！
                    </span>
                  </motion.div>
                )}

                {/* Add Error */}
                {!isSearching && !addSuccess && addError && (
                  <motion.div
                    key="add-error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center py-8 gap-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                      <AlertCircle
                        size={24}
                        className="text-red-500"
                      />
                    </div>
                    <span className="text-sm text-red-500 dark:text-red-400 font-medium">
                      {addError}
                    </span>
                    <button
                      onClick={() => setAddError(null)}
                      className="text-xs text-zinc-500 dark:text-zinc-400 underline mt-1"
                    >
                      返回重试
                    </button>
                  </motion.div>
                )}

                {/* Error / Not Found */}
                {!isSearching &&
                  !addSuccess &&
                  !addError &&
                  searchResult &&
                  !searchResult.found && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center py-8 gap-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <AlertCircle
                          size={24}
                          className="text-zinc-400 dark:text-zinc-500"
                        />
                      </div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                        {searchResult.error}
                      </span>
                    </motion.div>
                  )}

                {/* Found Contact Card */}
                {!isSearching &&
                  !addSuccess &&
                  !addError &&
                  searchResult?.found &&
                  searchResult.contact && (
                    <motion.div
                      key="found"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-1"
                    >
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400 dark:text-zinc-500 overflow-hidden shrink-0">
                          {searchResult.contact.avatar ? (
                            <img
                              src={searchResult.contact.avatar}
                              alt={searchResult.contact.chatName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={24} strokeWidth={1.5} />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <span className="block text-[14px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {searchResult.contact.chatName ||
                              searchResult.contact.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {searchResult.contact.occupation && (
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {searchResult.contact.occupation}
                              </span>
                            )}
                            {searchResult.contact.occupation &&
                              searchResult.contact.personality && (
                                <span className="text-zinc-300 dark:text-zinc-600">
                                  ·
                                </span>
                              )}
                            {searchResult.contact.personality && (
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                                {searchResult.contact.personality}
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            ID: {searchResult.contact.chatId}
                          </span>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={handleAdd}
                          disabled={isAlreadyContact}
                          className={`ml-2 shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                            isAlreadyContact
                              ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500'
                              : 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 active:scale-95 shadow-sm'
                          }`}
                        >
                          {isAlreadyContact ? '已添加' : '添加'}
                        </button>
                      </div>
                    </motion.div>
                  )}

                {/* Initial empty state */}
                {!isSearching && !searchResult && !addSuccess && !addError && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center py-8 gap-2"
                  >
                    <Search
                      size={32}
                      className="text-zinc-200 dark:text-zinc-700"
                    />
                    <span className="text-[11px] text-zinc-300 dark:text-zinc-600 font-medium">
                      输入账号或昵称搜索用户
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return isOpen ? renderInPhoneContainer(modalContent) : null;
}

// Exported component: wraps the inner modal with an ErrorBoundary
export function AddFriendModal(props: AddFriendModalProps) {
  const [boundaryKey, setBoundaryKey] = useState(0);

  const handleErrorReset = () => {
    setBoundaryKey((k) => k + 1);
    props.onClose();
  };

  // Reset ErrorBoundary when modal opens
  useEffect(() => {
    if (props.isOpen) {
      setBoundaryKey((k) => k + 1);
    }
  }, [props.isOpen]);

  return (
    <AddFriendErrorBoundary key={boundaryKey} onReset={handleErrorReset}>
      <AddFriendModalInner {...props} />
    </AddFriendErrorBoundary>
  );
}
