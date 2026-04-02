import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, RefreshCw, LogOut, Send, Save, Image as ImageIcon, Plus, X, Minus, ImageOff } from 'lucide-react';
import { ApiConfig, Screen } from '../types';
import { NPCGameState, GameEvent, PresetOption } from '../types/npcGame';
import { npcGameService } from '../utils/npcGameService';
import { NPCSetupModal } from '../components/NPCSetupModal';
import { NPCEvent } from '../components/NPCEvent';
import { NPCLoadSaveModal } from '../components/NPCLoadSaveModal';
import { NPCSaveNameModal } from '../components/NPCSaveNameModal';

interface HeartbeatNPCProps {
  apiConfig: ApiConfig;
  setScreen: (s: Screen) => void;
}

const WALLPAPER_KEY = 'npc_game_wallpaper';

export function HeartbeatNPC({ apiConfig, setScreen }: HeartbeatNPCProps) {
  const [gameState, setGameState] = useState<NPCGameState | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [eventList, setEventList] = useState<GameEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [error, setError] = useState('');
  const [customInputText, setCustomInputText] = useState('');

  // 好感度增减控件
  const [affectionDelta, setAffectionDelta] = useState(0);

  // 底部加号菜单
  const [showQuickActions, setShowQuickActions] = useState(false);

  // AI 生成的预设选项
  const [presetOptions, setPresetOptions] = useState<PresetOption[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);

  // 壁纸状态
  const [wallpaper, setWallpaper] = useState<string | null>(() => localStorage.getItem(WALLPAPER_KEY));
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  // 头像上传
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 存档相关状态
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSaveNameModal, setShowSaveNameModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [currentSaveSlotId, setCurrentSaveSlotId] = useState<string | null>(null);
  const [currentSaveName, setCurrentSaveName] = useState<string>('');

  const eventContainerRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // 初始化检查是否存在存档
  useEffect(() => {
    const hasCurrent = npcGameService.hasCurrentGame();
    const saves = npcGameService.getAllSaves();

    if (hasCurrent) {
      setShowLoadModal(true);
    } else if (saves.length > 0) {
      setShowLoadModal(true);
    } else {
      setShowSetup(true);
    }
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (eventContainerRef.current) {
      eventContainerRef.current.scrollTop = eventContainerRef.current.scrollHeight;
    }
  }, [eventList, isGenerating]);

  // 点击外部关闭加号菜单
  useEffect(() => {
    if (!showQuickActions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node)) {
        setShowQuickActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showQuickActions]);

  // 每次新事件生成后，异步加载 AI 预设选项（传入 recentEvents 以保持上下文）
  const loadPresetOptions = useCallback(async (state: NPCGameState, currentEventList?: GameEvent[]) => {
    if (!state || state.isGameOver) return;
    setIsLoadingPresets(true);
    try {
      const eventType = state.currentEvent?.type === 'daily' ? 'daily' : 'interaction';
      const options = await npcGameService.generatePresetOptions(apiConfig, state, eventType, currentEventList);
      setPresetOptions(options);
    } catch (e) {
      console.error('Failed to load preset options:', e);
      const isDaily = state.currentEvent?.type === 'daily';
      setPresetOptions(isDaily ? [
        { text: '随便走走', affectionDelta: 0 },
        { text: '发呆', affectionDelta: 0 },
        { text: '做点正事', affectionDelta: 0 },
      ] : [
        { text: '友好回应', affectionDelta: 3 },
        { text: '保持距离', affectionDelta: -1 },
        { text: '无视', affectionDelta: 0 },
      ]);
    } finally {
      setIsLoadingPresets(false);
    }
  }, [apiConfig]);

  // 壁纸处理
  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const maxW = 1024;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setWallpaper(dataUrl);
          localStorage.setItem(WALLPAPER_KEY, dataUrl);
        }
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 头像处理
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gameState) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const maxW = 512;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const newState = { ...gameState, user: { ...gameState.user, avatar: dataUrl } };
          setGameState(newState);
          npcGameService.saveGame(newState);
          npcGameService.saveToSlot(newState); // Also update the current slot if any
        }
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 加载存档
  const handleLoadGame = (saveId: string) => {
    const saves = npcGameService.getAllSaves();
    const targetSave = saves.find(s => s.id === saveId);
    const loadedState = npcGameService.loadFromSlot(saveId);
    if (loadedState) {
      setGameState(loadedState);
      setCurrentSaveSlotId(saveId);
      setCurrentSaveName(targetSave?.name || '');
      setShowLoadModal(false);
      if (loadedState.events && loadedState.events.length > 0) {
        // 新存档：恢复完整事件列表
        const restoredEvents = loadedState.events;
        setCurrentEvent(restoredEvents[restoredEvents.length - 1]);
        setEventList(restoredEvents);
        loadPresetOptions(loadedState, restoredEvents);
      } else if (loadedState.currentEvent) {
        // 旧存档兼容：只有单个 currentEvent，没有 events 数组
        console.warn('旧存档格式：仅包含最后一个事件，历史记录可能不完整。');
        setCurrentEvent(loadedState.currentEvent);
        const loadedEventList = [loadedState.currentEvent];
        setEventList(loadedEventList);
        loadPresetOptions(loadedState, loadedEventList);
      } else if (!loadedState.isGameOver) {
        generateInitialEvent(loadedState);
      }
    }
  };

  const handleReadyForNewGame = () => {
    npcGameService.clearGame();
    setShowLoadModal(false);
    setShowSetup(true);
  };

  const handleResumeCurrentGame = () => {
    const saved = npcGameService.loadGame();
    if (saved && !saved.isGameOver) {
      setGameState(saved);
      setShowLoadModal(false);
      if (saved.events && saved.events.length > 0) {
        // 新存档：恢复完整事件列表
        const restoredEvents = saved.events;
        setCurrentEvent(restoredEvents[restoredEvents.length - 1]);
        setEventList(restoredEvents);
        loadPresetOptions(saved, restoredEvents);
      } else if (saved.currentEvent) {
        // 旧存档兼容：只有单个 currentEvent
        console.warn('旧存档格式：仅包含最后一个事件，历史记录可能不完整。');
        setCurrentEvent(saved.currentEvent);
        const resumedEventList = [saved.currentEvent];
        setEventList(resumedEventList);
        loadPresetOptions(saved, resumedEventList);
      } else {
        generateInitialEvent(saved);
      }
    } else {
      setShowSetup(true);
      setShowLoadModal(false);
    }
  };

  const handleOverwriteSave = (name: string) => {
    if (gameState && currentSaveSlotId) {
      const stateToSave = { ...gameState, currentEvent, events: eventList };
      npcGameService.overwriteSaveSlot(currentSaveSlotId, stateToSave, name);
      npcGameService.saveGame(stateToSave);
      setCurrentSaveName(name);
      setShowSaveNameModal(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    }
  };

  const handleSaveAsNew = (name: string) => {
    if (gameState) {
      const stateToSave = { ...gameState, currentEvent, events: eventList };
      const newId = npcGameService.saveAsNewSlot(stateToSave, name);
      npcGameService.saveGame(stateToSave);
      if (newId) {
        setCurrentSaveSlotId(newId);
        setCurrentSaveName(name);
      }
      setShowSaveNameModal(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    }
  };

  const generateInitialEvent = async (state: NPCGameState) => {
    if (state.isGameOver) return;
    setIsGenerating(true);
    setError('');
    try {
      // 初始事件没有历史，传空数组
      const event = await npcGameService.generateNextEvent(apiConfig, state, undefined, undefined, undefined, []);
      setCurrentEvent(event);
      const newEventList = [event];
      setEventList(newEventList);
      const newState = { ...state, currentEvent: event, events: newEventList };
      setGameState(newState);
      npcGameService.saveGame(newState);
      // 生成预设选项，传入当前事件列表
      loadPresetOptions(newState, newEventList);
    } catch (e: any) {
      setError(e.message || '生成剧情失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGameStart = (newState: NPCGameState) => {
    setGameState(newState);
    setShowSetup(false);
    // 新游戏不自动保存到存档，用户可手动保存
    setCurrentSaveSlotId(null);
    setCurrentSaveName('');
    generateInitialEvent(newState);
  };

  const checkGameOver = async (state: NPCGameState) => {
    if (state.user.affection >= 100 || state.user.darkening >= 100) {
      setIsGenerating(true);
      try {
        const endingText = await npcGameService.generateEnding(apiConfig, state);
        const finalState = { ...state, isGameOver: true, ending: endingText };
        setGameState(finalState);
        npcGameService.saveGame(finalState);
        setShowGameOver(true);
      } catch (e: any) {
        setError(e.message || '生成结局失败');
      } finally {
        setIsGenerating(false);
      }
      return true;
    }
    return false;
  };

  const updateStateAndGenerateNext = async (newState: NPCGameState, customInput?: string, customAffectionDelta?: number) => {
    if (!newState) return;

    newState.turnCount += 1;

    // 应用自定义好感度变化，只有非日常事件或者显式传入的值才应用
    if (customAffectionDelta !== undefined && customAffectionDelta !== 0 && currentEvent?.type !== 'daily') {
      newState.user.affection = Math.min(100, Math.max(0, newState.user.affection + customAffectionDelta));
    }

    // 存储更丰富的事件历史（包含实际对话内容，供 AI 参考）
    if (currentEvent) {
      const charLine = currentEvent.charAction ? ` | Char说：${currentEvent.charAction.substring(0, 30)}` : '';
      const userLine = customInput ? ` | User做/说：${customInput.substring(0, 30)}` : '';
      const narrationLine = currentEvent.description ? ` | 旁白：${currentEvent.description.substring(0, 40)}` : '';
      const historyText = `[${currentEvent.type}]${narrationLine}${userLine}${charLine}`;
      newState.eventHistory.push(historyText);
      // 限制历史记录长度，避免过大
      if (newState.eventHistory.length > 20) {
        newState.eventHistory = newState.eventHistory.slice(-15);
      }
      newState.lastEventType = currentEvent.type;
    }

    setGameState({ ...newState });
    npcGameService.saveGame(newState);

    const isOver = await checkGameOver(newState);
    if (isOver) return;

    // 立即显示用户的发言/行动（临时事件），让用户看到自己的输入
    let currentList = [...eventList];
    if (customInput) {
      const userBubbleEvent: GameEvent = {
        id: `user_${Date.now()}`,
        type: currentEvent?.type || 'daily',
        description: '',
        userDialogue: customInput,
      };
      currentList = [...currentList, userBubbleEvent];
      setEventList(currentList);
    }

    setIsGenerating(true);
    setError('');
    setPresetOptions([]);
    try {
      // 传入当前事件列表（不含临时用户气泡）作为对话历史
      const eventsForHistory = eventList; // 使用添加用户气泡前的列表
      const nextEvent = await npcGameService.generateNextEvent(apiConfig, newState, undefined, undefined, customInput, eventsForHistory);

      if (nextEvent.shouldReload && customAffectionDelta !== undefined && customAffectionDelta < 0) {
        // 触发读档，回滚之前的好感度扣除
        newState.user.affection = Math.min(100, Math.max(0, newState.user.affection - customAffectionDelta));
        newState.eventHistory.push(`[系统] 攻略者触发了读档，好感度恢复。`);
      }

      if (customInput && nextEvent.result) {
        const resultDelta = nextEvent.result;
        newState.user.darkening = Math.min(100, Math.max(0, newState.user.darkening + (resultDelta.darkeningDelta || 0)));
        if (resultDelta.customStatsDelta && newState.user.customStats) {
          Object.keys(resultDelta.customStatsDelta).forEach(key => {
            if (newState.user.customStats![key] !== undefined) {
              newState.user.customStats![key] += resultDelta.customStatsDelta![key];
            }
          });
        }
      }

      newState.currentEvent = nextEvent;
      
      // 构建最新的完整事件列表并同步保存到 state
      const updatedList = eventList.filter(e => !e.id.startsWith('user_'));
      updatedList.push(nextEvent);
      newState.events = updatedList;
      
      setGameState({ ...newState });
      npcGameService.saveGame(newState);
      setCurrentEvent(nextEvent);
      
      // 如果之前添加了用户气泡，替换掉临时气泡并加上完整的 AI 事件
      if (customInput) {
        // 移除临时用户气泡（最后一个以 user_ 开头的），替换为完整事件
        setEventList(prev => {
          const withoutBubble = prev.filter(e => !e.id.startsWith('user_'));
          return [...withoutBubble, nextEvent];
        });
      } else {
        setEventList(prev => [...prev, nextEvent]);
      }

      // 生成新的预设选项，传入包含新事件的列表
      loadPresetOptions(newState, updatedList);
    } catch (e: any) {
      // 如果出错，移除临时用户气泡
      if (customInput) {
        setEventList(prev => prev.filter(e => !e.id.startsWith('user_')));
      }
      setError(e.message || '生成下一步失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gameState || isGenerating || !customInputText.trim()) return;
    const text = customInputText.trim();
    const delta = affectionDelta;
    setCustomInputText('');
    setAffectionDelta(0);
    setShowQuickActions(false);
    updateStateAndGenerateNext(gameState, text, delta);
  };

  const handlePresetOptionSelect = (option: PresetOption) => {
    if (!gameState || isGenerating) return;
    setShowQuickActions(false);
    setAffectionDelta(0);
    updateStateAndGenerateNext(gameState, option.text, option.affectionDelta);
  };

  const handleRestart = () => {
    npcGameService.clearGame();
    setGameState(null);
    setCurrentEvent(null);
    setEventList([]);
    setShowGameOver(false);
    setPresetOptions([]);
    setAffectionDelta(0);
    setShowSetup(true);
  };

  const handleExit = () => {
    setScreen('home');
  };

  // 好感度控件增减
  const adjustAffectionDelta = (amount: number) => {
    setAffectionDelta(prev => Math.max(-5, Math.min(5, prev + amount)));
  };

  // 显示存档选择模态框
  if (showLoadModal) {
    return (
      <div className="absolute inset-0 z-40 bg-neutral-50 dark:bg-black">
        <NPCLoadSaveModal
          onClose={handleExit}
          onLoadGame={handleLoadGame}
          onNewGame={handleReadyForNewGame}
          onResumeCurrent={npcGameService.hasCurrentGame() ? handleResumeCurrentGame : undefined}
        />
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="absolute inset-0 bg-neutral-50 dark:bg-black z-40">
        <NPCSetupModal onClose={handleExit} onGameStart={handleGameStart} apiConfig={apiConfig} />
      </div>
    );
  }

  if (!gameState) return null;

  // 构建所有数值列表
  const allStats: { name: string; value: number; color: string }[] = [
    { name: '好感度', value: gameState.user.affection, color: gameState.user.affection > 0 ? 'text-pink-400' : gameState.user.affection < 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-200' },
    ...(gameState.statsSchema?.filter(stat => !stat.name.includes('好感')).map(stat => ({
      name: stat.name,
      value: gameState.user.customStats?.[stat.name] ?? stat.initialValue,
      color: 'text-zinc-700 dark:text-zinc-200',
    })) || []),
  ];

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col z-40 overflow-hidden">
      {/* 隐藏的壁纸文件选择器 */}
      <input
        ref={wallpaperInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleWallpaperChange}
      />

      {/* 背景层：壁纸或默认 */}
      {wallpaper ? (
        <img
          src={wallpaper}
          alt="bg"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          onError={() => { setWallpaper(null); localStorage.removeItem(WALLPAPER_KEY); }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-black dark:to-zinc-900 pointer-events-none" />
      )}

      {/* 毛玻璃叠加层（当有壁纸时增加一层半透明遮罩以确保可读性） */}
      {wallpaper && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 pointer-events-none" />
      )}

      {/* ====== 顶部毛玻璃卡片 ====== */}
      <div className="relative z-10 flex justify-center mt-10 shrink-0 overflow-visible">
        <div
          className="top-card relative w-[90%] max-h-[22vh] min-h-[120px] rounded-2xl overflow-visible"
        >
          <div className="rounded-2xl px-3 pt-8 pb-6">
            {/* 顶部操作栏 */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={handleExit}
                className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={16} />
                <span className="text-[11px] font-medium">返回</span>
              </button>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {gameState.user.name} · 第{gameState.turnCount}回合
                </span>
                <button
                  onClick={() => wallpaperInputRef.current?.click()}
                  className="p-1 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                  title="自定义壁纸"
                >
                  <ImageIcon size={14} />
                </button>
                {wallpaper && (
                  <button
                    onClick={() => { setWallpaper(null); localStorage.removeItem(WALLPAPER_KEY); }}
                    className="p-1 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    title="清除壁纸"
                  >
                    <ImageOff size={14} />
                  </button>
                )}
                {!showGameOver && (
                  <button
                    onClick={() => setShowSaveNameModal(true)}
                    className="p-1 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                    title="保存进度"
                  >
                    <Save size={14} />
                  </button>
                )}
                <button
                  onClick={handleRestart}
                  className="p-1 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
                  title="重置游戏"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>

            {/* 数值水平紧凑显示 */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
              {allStats.map((stat, idx) => (
                <span key={idx} className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  {stat.name}: <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 头像悬浮在卡片上方 */}
        {/* 头像悬浮在卡片上方 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div 
            className="w-14 h-14 rounded-full bg-white/60 dark:bg-zinc-700/60 flex items-center justify-center overflow-hidden backdrop-blur-sm cursor-pointer hover:ring-2 hover:ring-white/50 transition-all shadow-lg group"
            onClick={() => avatarInputRef.current?.click()}
            title="更换头像"
          >
            {gameState.user.avatar ? (
              <img src={gameState.user.avatar} alt="avatar" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
            ) : (
              <span className="text-xl font-bold text-zinc-500 dark:text-zinc-300 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors">
                {gameState.user.name.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ====== 错误提示 ====== */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-50 mx-6 mt-2 px-4 py-2.5 bg-red-500/90 backdrop-blur-md text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
            <button onClick={() => updateStateAndGenerateNext(gameState)} className="px-2 py-1 bg-white/20 rounded-lg active:scale-95">
              重试
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 保存命名模态框 ====== */}
      <AnimatePresence>
        {showSaveNameModal && (
          <NPCSaveNameModal
            onClose={() => setShowSaveNameModal(false)}
            onOverwrite={handleOverwriteSave}
            onSaveAsNew={handleSaveAsNew}
            defaultName={currentSaveName || npcGameService.getNextAutoSaveName()}
            canOverwrite={!!currentSaveSlotId}
            currentSaveSlotId={currentSaveSlotId}
          />
        )}
      </AnimatePresence>

      {/* ====== 保存成功 Toast ====== */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-28 left-1/2 z-50 px-5 py-2.5 bg-zinc-800/90 dark:bg-zinc-200/90 text-white dark:text-zinc-900 backdrop-blur-md rounded-full text-sm font-medium shadow-lg flex items-center gap-2"
          >
            <Save size={16} />
            <span>已保存</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 事件内容区 ====== */}
      <div
        ref={eventContainerRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-20 relative z-[1] flex flex-col gap-4"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)'
        }}
      >
        <AnimatePresence>
          {eventList.map((evt) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-1 py-2"
            >
              <NPCEvent event={evt} charName={gameState.char.name} />
            </motion.div>
          ))}
          {isGenerating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 px-4 py-2 self-start bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-2xl mx-1"
            >
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-xs font-medium">命运的齿轮正在转动...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ====== 底部毛玻璃悬浮输入条 ====== */}
      <div className="relative z-10 mx-3 mb-3 shrink-0" ref={quickActionsRef}>
        {/* 加号菜单弹出层 - AI生成的预设选项 */}
        <AnimatePresence>
          {showQuickActions && !showGameOver && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-2 left-0 w-[280px] flex flex-col gap-1.5"
            >
              {isLoadingPresets ? (
                <div className="bg-white/60 dark:bg-black/50 backdrop-blur-xl rounded-2xl px-4 py-3 text-sm text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>生成选项中...</span>
                </div>
              ) : (
                presetOptions.map((option, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handlePresetOptionSelect(option)}
                    disabled={isGenerating}
                    className="bg-white/60 dark:bg-black/50 backdrop-blur-xl rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-all hover:bg-white/80 dark:hover:bg-black/70 disabled:opacity-40 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 flex-1">
                      {option.text}
                    </span>
                    {currentEvent?.type !== 'daily' && (
                      <span className={`text-xs font-bold shrink-0 ${
                        option.affectionDelta > 0 ? 'text-rose-500' :
                        option.affectionDelta < 0 ? 'text-blue-500' :
                        'text-zinc-400'
                      }`}>
                        {option.affectionDelta > 0 ? `+${option.affectionDelta}` : option.affectionDelta === 0 ? '0' : option.affectionDelta}
                        <span className="text-[10px] ml-0.5">❤</span>
                      </span>
                    )}
                  </motion.button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white/60 dark:bg-black/50 backdrop-blur-xl rounded-2xl">
          {!showGameOver ? (
            <form onSubmit={handleCustomInputSubmit} className="flex items-center gap-1.5 p-2">
              {/* 加号按钮 (日常和互动事件都可用) */}
              <button
                type="button"
                onClick={() => setShowQuickActions(!showQuickActions)}
                disabled={isGenerating || !currentEvent}
                className={`p-2.5 rounded-2xl transition-all active:scale-95 disabled:opacity-40 shrink-0 ${
                  showQuickActions
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-white/10'
                }`}
                title="快捷选项"
              >
                {showQuickActions ? <X size={16} /> : <Plus size={16} />}
              </button>

              {/* 输入框 */}
              <input
                type="text"
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                placeholder={currentEvent?.type === 'daily' ? "我(NPC)的行动..." : "我(NPC)的反应..."}
                disabled={isGenerating || !currentEvent}
                className="flex-1 min-w-0 bg-transparent rounded-2xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border-none disabled:opacity-40"
              />

              {/* 好感度增减控件 (仅互动事件显示) */}
              {currentEvent?.type !== 'daily' && (
                <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-2xl px-1 py-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => adjustAffectionDelta(-1)}
                    disabled={affectionDelta <= -5 || isGenerating || !currentEvent}
                    className="p-1 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors active:scale-90"
                  >
                    <Minus size={12} />
                  </button>
                  <span className={`text-xs font-bold min-w-[24px] text-center tabular-nums ${
                    affectionDelta > 0 ? 'text-rose-500' :
                    affectionDelta < 0 ? 'text-blue-500' :
                    'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {affectionDelta > 0 ? `+${affectionDelta}` : affectionDelta}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustAffectionDelta(1)}
                    disabled={affectionDelta >= 5 || isGenerating || !currentEvent}
                    className="p-1 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors active:scale-90"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              )}

              {/* 发送按钮 */}
              <button
                type="submit"
                disabled={!customInputText.trim() || isGenerating || !currentEvent}
                className="p-2.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-2xl disabled:opacity-30 transition-all active:scale-95 shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          ) : (
            <div className="py-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
              游戏已结束
            </div>
          )}
        </div>
      </div>

      {/* ====== 结局画面 ====== */}
      <AnimatePresence>
        {showGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-md flex flex-col gap-6"
            >
              <h1 className="text-3xl font-black text-white tracking-widest">
                {gameState.user.affection >= 100 ? (
                  <span className="text-zinc-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">TRUE LOVE END</span>
                ) : gameState.user.darkening >= 100 ? (
                  <span className="text-zinc-400 drop-shadow-[0_0_15px_rgba(161,161,170,0.5)]">BAD END</span>
                ) : (
                  <span className="text-zinc-300">NORMAL END</span>
                )}
              </h1>

              <div className="text-sm text-zinc-300 leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/10 text-left whitespace-pre-wrap">
                {gameState.ending || '故事结束了。'}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleRestart}
                  className="flex-1 py-4 bg-white text-black rounded-full font-bold hover:bg-zinc-200 active:scale-95 transition-all"
                >
                  重新开始
                </button>
                <button
                  onClick={handleExit}
                  className="px-6 py-4 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 active:scale-95 transition-all"
                >
                  返回桌面
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
