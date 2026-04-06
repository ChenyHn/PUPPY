import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, RefreshCw, LogOut, Send, Save, Image as ImageIcon, Plus, X, Minus, ImageOff } from 'lucide-react';
import { ApiConfig, Screen } from '../types';
import { NPCGameState, GameEvent, PresetOption, AffectionMilestone, RewardOption } from '../types/npcGame';
import { npcGameService, extractPartialEventFields } from '../utils/npcGameService';
import { NPCSetupModal } from '../components/NPCSetupModal';
import { NPCEvent } from '../components/NPCEvent';
import { NPCLoadSaveModal } from '../components/NPCLoadSaveModal';
import { NPCSaveNameModal } from '../components/NPCSaveNameModal';
import heartbeatBg from '../assets/heartbeat-bg.png.png';
import heartbeatHeart1 from '../assets/heartbeat-heart1.png.png';
import heartbeatHeart2 from '../assets/heartbeat-heart2.png.png';
import heartbeatHeart3 from '../assets/heartbeat-heart3.png.png';

interface HeartbeatNPCProps {
  apiConfig: ApiConfig;
  setScreen: (s: Screen) => void;
}

const WALLPAPER_KEY = 'npc_game_wallpaper';
const AVATAR_KEY = 'npc_game_user_avatar';

/**
 * 去掉选项文本中可能包含的序号前缀，如 "1.", "2.", "3.", "1、", "1)", "1）" 等
 */
function stripNumberPrefix(text: string): string {
  return text.replace(/^\d+\s*[\.。、\)）:：]\s*/, '').trim();
}

/**
 * 根据好感度节点值返回对应的描述文案
 */
function getAffectionMilestoneText(value: number): string {
  switch (value) {
    case 15: return '你开始留意TA了';
    case 30: return 'TA的某句话让你多想了一秒';
    case 45: return '你发现自己有点期待TA出现';
    case 60: return '你已经不完全是在配合TA了';
    case 75: return '你有点说不清自己的感觉了';
    case 90: return '你快输了';
    case 100: return '沦陷';
    default: return '';
  }
}

/**
 * 从事件的 choices / dailyChoices 中直接提取预设选项，
 * 无需再发起第二次 API 请求。
 */
function extractPresetsFromEvent(event: GameEvent): PresetOption[] {
  if (event.type === 'daily') {
    // 日常事件：使用 dailyChoices（string[]），好感度变化为 0
    if (event.dailyChoices && event.dailyChoices.length > 0) {
      return event.dailyChoices.slice(0, 3).map(text => ({ text: stripNumberPrefix(text), affectionDelta: 0 }));
    }
    return [
      { text: '随便走走', affectionDelta: 0 },
      { text: '发呆', affectionDelta: 0 },
      { text: '做点正事', affectionDelta: 0 },
    ];
  }

  // 互动 / 特殊事件：使用 choices（含 affectionDelta）
  if (event.choices && event.choices.length > 0) {
    return event.choices.slice(0, 3).map(c => ({
      text: stripNumberPrefix(c.text || '未知选项'),
      affectionDelta: typeof c.affectionDelta === 'number' ? Math.max(-5, Math.min(5, c.affectionDelta)) : 0,
    }));
  }
  return [
    { text: '友好回应', affectionDelta: 3 },
    { text: '保持距离', affectionDelta: -1 },
    { text: '无视', affectionDelta: 0 },
  ];
}

/**
 * 历史事件列表 - 使用 React.memo 独立渲染，
 * 不受 isGenerating / streamingEvent 等状态变化影响，避免画面抖动。
 */
const MemoizedEventList = React.memo(function MemoizedEventList({
  eventList,
  charName,
  userAvatar,
}: {
  eventList: GameEvent[];
  charName: string;
  userAvatar?: string;
}) {
  return (
    <>
      {eventList.map((evt) => (
        <motion.div
          key={evt.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-1 py-2"
          layout={false}
        >
          <NPCEvent event={evt} charName={charName} userAvatar={userAvatar} />
        </motion.div>
      ))}
    </>
  );
}, (prev, next) => {
  // 只在事件列表长度或最后一个事件ID变化时重渲染
  if (prev.eventList.length !== next.eventList.length) return false;
  if (prev.charName !== next.charName) return false;
  if (prev.userAvatar !== next.userAvatar) return false;
  if (prev.eventList.length > 0 && next.eventList.length > 0) {
    const prevLast = prev.eventList[prev.eventList.length - 1];
    const nextLast = next.eventList[next.eventList.length - 1];
    if (prevLast.id !== nextLast.id) return false;
    // 检查最后一个事件内容是否变化（用户气泡可能会被替换）
    if (prevLast.description !== nextLast.description) return false;
    if (prevLast.userDialogue !== nextLast.userDialogue) return false;
  }
  return true;
});

const floatStyle1: React.CSSProperties = {
  animation: 'floatHeart1 4s ease-in-out infinite 0s',
};
const floatStyle2: React.CSSProperties = {
  animation: 'floatHeart2 4s ease-in-out infinite 1.2s',
};
const floatStyle3: React.CSSProperties = {
  animation: 'floatHeart3 4s ease-in-out infinite 2.4s',
};

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

  // 预设选项（现在直接从事件中提取，不再单独请求）
  const [presetOptions, setPresetOptions] = useState<PresetOption[]>([]);

  // 防重复提交：选项处理中锁定
  const [isProcessingOption, setIsProcessingOption] = useState(false);

  // 上一次用户操作上下文（用于 API 失败后重试）
  const [lastActionContext, setLastActionContext] = useState<{
    type: 'initial' | 'next';
    customInput?: string;
    affectionDelta?: number;
    selectedPresetOption?: { text: string; affectionDelta: number } | null;
    stateSnapshot: NPCGameState;
    eventsSnapshot: GameEvent[];
    hadUserBubble: boolean;
  } | null>(null);

  // 流式输出：边生成边显示的临时事件
  const [streamingEvent, setStreamingEvent] = useState<GameEvent | null>(null);

  // 里程碑触发状态
  const [milestoneOverlay, setMilestoneOverlay] = useState<{ statName: string; value: number; eventName: string } | null>(null);
  const [isGeneratingMilestone, setIsGeneratingMilestone] = useState(false);

  // 好感度节点触发状态
  const [affectionMilestoneOverlay, setAffectionMilestoneOverlay] = useState<{
    value: number;
    type: AffectionMilestone['type'];
    label: string;
  } | null>(null);

  // 奖励面板状态
  const [showRewardPromptBar, setShowRewardPromptBar] = useState(false); // 提示条
  const [showRewardPanel, setShowRewardPanel] = useState(false); // 展开面板
  const [rewardOptions, setRewardOptions] = useState<RewardOption[]>([]);
  const [rewardCustomInput, setRewardCustomInput] = useState('');
  const [isLoadingReward, setIsLoadingReward] = useState(false);
  const [pendingRewardMilestoneValue, setPendingRewardMilestoneValue] = useState<number>(0);
  const [pendingRewardEventList, setPendingRewardEventList] = useState<GameEvent[]>([]);

  // 好感度节点提示条（事件流底部，用户主动点击后才进入遮罩）
  const [showMilestonePromptBar, setShowMilestonePromptBar] = useState(false);
  const [pendingMilestoneData, setPendingMilestoneData] = useState<{
    milestones: AffectionMilestone[];
    state: NPCGameState;
    eventList: GameEvent[];
  } | null>(null);

  // 奖励后继续剧情提示
  const [showRewardContinueBar, setShowRewardContinueBar] = useState(false);

  // 中断恢复提示
  const [showInterruptRecoveryToast, setShowInterruptRecoveryToast] = useState(false);

  // 重新生成确认弹窗
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  // 豁免权提示弹窗
  const [showImmunityConfirm, setShowImmunityConfirm] = useState(false);
  const [immunityMessage, setImmunityMessage] = useState('');
  const [pendingAffectionAction, setPendingAffectionAction] = useState<{
    state: NPCGameState;
    customInput?: string;
    delta: number;
    selectedPresetOption?: { text: string; affectionDelta: number } | null;
  } | null>(null);

  // 读档遮罩状态
  const [reloadOverlay, setReloadOverlay] = useState<{ charNote: string } | null>(null);

  // 壁纸状态
  const [wallpaper, setWallpaper] = useState<string | null>(() => localStorage.getItem(WALLPAPER_KEY));
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  // 头像独立存储（不随剧情状态重渲染而丢失）
  const [userAvatar, setUserAvatar] = useState<string | undefined>(() => {
    try { return localStorage.getItem(AVATAR_KEY) || undefined; } catch { return undefined; }
  });

  // 头像上传
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 存档相关状态
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSaveNameModal, setShowSaveNameModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [currentSaveSlotId, setCurrentSaveSlotId] = useState<string | null>(null);
  const [currentSaveName, setCurrentSaveName] = useState<string>('');
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isExitingAfterSave, setIsExitingAfterSave] = useState(false);

  const eventContainerRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // 智能滚动状态
  const isNearBottomRef = useRef(true);
  const [showNewContentIndicator, setShowNewContentIndicator] = useState(false);

  // 注入 floatHeart 关键帧动画到 DOM
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes floatHeart1 {
        0%   { transform: translateX(0px); }
        50%  { transform: translateX(-16px); }
        100% { transform: translateX(0px); }
      }
      @keyframes floatHeart2 {
        0%   { transform: translateY(0px); }
        50%  { transform: translateY(-20px); }
        100% { transform: translateY(0px); }
      }
      @keyframes floatHeart3 {
        0%   { transform: translateY(0px); }
        50%  { transform: translateY(-20px); }
        100% { transform: translateY(0px); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

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

  // 智能自动滚动：仅当用户在底部区域时才自动滚动
  useEffect(() => {
    if (eventContainerRef.current) {
      if (isNearBottomRef.current) {
        eventContainerRef.current.scrollTop = eventContainerRef.current.scrollHeight;
        setShowNewContentIndicator(false);
      } else {
        // 用户正在查看历史内容，不强制跳转，显示新内容提示
        setShowNewContentIndicator(true);
      }
    }
  }, [eventList, isGenerating, streamingEvent]);

  // 滚动事件监听：检测用户是否在底部区域
  const handleScrollEvent = useCallback(() => {
    if (eventContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = eventContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      isNearBottomRef.current = distanceFromBottom < 80;
      if (isNearBottomRef.current) {
        setShowNewContentIndicator(false);
      }
    }
  }, []);

  // 点击"新内容↓"按钮，滚动到底部
  const scrollToBottom = useCallback(() => {
    if (eventContainerRef.current) {
      eventContainerRef.current.scrollTop = eventContainerRef.current.scrollHeight;
      isNearBottomRef.current = true;
      setShowNewContentIndicator(false);
    }
  }, []);

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
          // 头像独立存储到 localStorage，避免状态更新导致丢失
          setUserAvatar(dataUrl);
          try { localStorage.setItem(AVATAR_KEY, dataUrl); } catch {}
          const newState = { ...gameState, user: { ...gameState.user, avatar: dataUrl } };
          setGameState(newState);
          npcGameService.saveGame(newState);
        }
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── 流式回调：从 AI 累积文本中提取字段，实时更新临时事件 ──
  const handleStreamChunk = useCallback((accumulatedText: string) => {
    const fields = extractPartialEventFields(accumulatedText);
    setStreamingEvent({
      id: 'streaming',
      type: (fields.type === 'daily' ? 'daily' : 'interaction') as GameEvent['type'],
      description: fields.narration || '',
      userDialogue: fields.userDialogue || '',
      charAction: fields.charDialogue || '',
      charThought: fields.charThought || '',
      shouldReload: fields.shouldReload === 'true',
      reloadReason: fields.reloadReason || '',
    });
  }, []);

  // 加载存档（豁免权不随读档恢复，全局保留）
  const handleLoadGame = (saveId: string) => {
    const saves = npcGameService.getAllSaves();
    const targetSave = saves.find(s => s.id === saveId);
    const loadedState = npcGameService.loadFromSlot(saveId);
    if (loadedState) {
      // ── 中断恢复检查 ──
      const { recovered, state: checkedState } = npcGameService.checkAndRecoverInterrupt(loadedState);
      if (recovered) {
        setShowInterruptRecoveryToast(true);
        setTimeout(() => setShowInterruptRecoveryToast(false), 3000);
      }
      // 保留当前游戏的 immunityCount（如果有的话）
      const currentImmunity = gameState?.immunityCount ?? 0;
      const loadedImmunity = checkedState.immunityCount ?? 0;
      const preservedImmunity = Math.max(currentImmunity, loadedImmunity);
      checkedState.immunityCount = preservedImmunity;
      setGameState(checkedState);
      // 同步头像到独立存储
      if (loadedState.user.avatar) {
        setUserAvatar(loadedState.user.avatar);
        try { localStorage.setItem(AVATAR_KEY, loadedState.user.avatar); } catch {}
      }
      setCurrentSaveSlotId(saveId);
      setCurrentSaveName(targetSave?.name || '');
      setShowLoadModal(false);
      if (checkedState.events && checkedState.events.length > 0) {
        const restoredEvents = checkedState.events;
        const lastEvent = restoredEvents[restoredEvents.length - 1];
        setCurrentEvent(lastEvent);
        setEventList(restoredEvents);
        setPresetOptions(extractPresetsFromEvent(lastEvent));
      } else if (checkedState.currentEvent) {
        console.warn('旧存档格式：仅包含最后一个事件，历史记录可能不完整。');
        setCurrentEvent(checkedState.currentEvent);
        const loadedEventList = [checkedState.currentEvent];
        setEventList(loadedEventList);
        setPresetOptions(extractPresetsFromEvent(checkedState.currentEvent));
      } else if (!checkedState.isGameOver) {
        generateInitialEvent(checkedState);
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
      // ── 中断恢复检查 ──
      const { recovered, state: checkedState } = npcGameService.checkAndRecoverInterrupt(saved);
      if (recovered) {
        setShowInterruptRecoveryToast(true);
        setTimeout(() => setShowInterruptRecoveryToast(false), 3000);
      }
      // 保留豁免权（全局保留，不随读档恢复）
      const currentImmunity = gameState?.immunityCount ?? 0;
      const savedImmunity = checkedState.immunityCount ?? 0;
      checkedState.immunityCount = Math.max(currentImmunity, savedImmunity);
      setGameState(checkedState);
      // 同步头像到独立存储
      if (checkedState.user.avatar) {
        setUserAvatar(checkedState.user.avatar);
        try { localStorage.setItem(AVATAR_KEY, checkedState.user.avatar); } catch {}
      }
      setShowLoadModal(false);
      if (checkedState.events && checkedState.events.length > 0) {
        const restoredEvents = checkedState.events;
        const lastEvent = restoredEvents[restoredEvents.length - 1];
        setCurrentEvent(lastEvent);
        setEventList(restoredEvents);
        setPresetOptions(extractPresetsFromEvent(lastEvent));
      } else if (checkedState.currentEvent) {
        console.warn('旧存档格式：仅包含最后一个事件，历史记录可能不完整。');
        setCurrentEvent(checkedState.currentEvent);
        const resumedEventList = [checkedState.currentEvent];
        setEventList(resumedEventList);
        setPresetOptions(extractPresetsFromEvent(checkedState.currentEvent));
      } else {
        generateInitialEvent(checkedState);
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
      if (isExitingAfterSave) {
        setTimeout(() => {
          setShowSaveToast(false);
          handleExit();
        }, 1000);
      } else {
        setTimeout(() => setShowSaveToast(false), 2000);
      }
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
      if (isExitingAfterSave) {
        setTimeout(() => {
          setShowSaveToast(false);
          handleExit();
        }, 1000);
      } else {
        setTimeout(() => setShowSaveToast(false), 2000);
      }
    }
  };

  const generateInitialEvent = async (state: NPCGameState) => {
    if (state.isGameOver) return;
    setIsGenerating(true);
    setError('');
    setStreamingEvent(null);
    // 保存重试上下文
    setLastActionContext({
      type: 'initial',
      stateSnapshot: { ...state },
      eventsSnapshot: [],
      hadUserBubble: false,
    });
    try {
      // ── 开局背景旁白：第一轮生成50-80字开场旁白 ──
      let openingEventList: GameEvent[] = [];
      try {
        const openingNarration = await npcGameService.generateOpeningNarration(apiConfig, state);
        if (openingNarration && openingNarration !== '故事即将开始...') {
          const openingEvent: GameEvent = {
            id: `opening_${Date.now()}`,
            type: 'daily',
            description: openingNarration,
            userDialogue: '',
            charAction: '',
            charThought: '',
          };
          openingEventList = [openingEvent];
          setEventList(openingEventList);
        }
      } catch (openingErr) {
        console.warn('开局旁白生成失败，继续正常流程:', openingErr);
      }

      const event = await npcGameService.generateNextEvent(
        apiConfig, state, undefined, undefined, undefined, openingEventList,
        handleStreamChunk,
      );
      setStreamingEvent(null);
      setCurrentEvent(event);
      const newEventList = [...openingEventList, event];
      setEventList(newEventList);
      const newState = { ...state, currentEvent: event, events: newEventList };
      setGameState(newState);
      npcGameService.saveGame(newState);
      // 直接从事件提取预设选项，无需额外 API 调用
      setPresetOptions(extractPresetsFromEvent(event));
      setLastActionContext(null); // 成功后清除重试上下文
    } catch (e: any) {
      setStreamingEvent(null);
      setError('生成失败，点击重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGameStart = (newState: NPCGameState) => {
    setGameState(newState);
    setShowSetup(false);
    setCurrentSaveSlotId(null);
    setCurrentSaveName('');
    generateInitialEvent(newState);
  };

  /**
   * 检测好感度是否跨越了节点（15/30/45/60/75/90/100），
   * 仅做检测并存储待处理数据 + 显示提示条，不阻塞正常剧情流程。
   * 返回 true 表示检测到节点（提示条已显示）。
   */
  const detectAndQueueAffectionMilestones = (
    state: NPCGameState,
    currentEventList: GameEvent[],
    oldAff: number,
  ): boolean => {
    console.log('=== 节点检测被调用 ===', '旧好感度:', oldAff, '新好感度:', state.user.affection);
    const crossedMilestones = npcGameService.checkAffectionMilestones(state, oldAff);
    if (crossedMilestones.length === 0) {
      const updated = npcGameService.updatePeakAffection(state);
      if (updated.peakAffection !== state.peakAffection) {
        setGameState({ ...updated });
        npcGameService.saveGame(updated);
      }
      return false;
    }

    console.log('=== 跨越的节点 ===', crossedMilestones.map(m => m.value));

    // 标记所有跨越的节点为已触发
    let updatedState = state;
    for (const milestone of crossedMilestones) {
      updatedState = npcGameService.markAffectionMilestoneTriggered(updatedState, milestone.value);
    }
    setGameState({ ...updatedState });
    npcGameService.saveGame(updatedState);

    // 存储待处理的节点数据，等用户主动点击
    setPendingMilestoneData({
      milestones: crossedMilestones,
      state: updatedState,
      eventList: currentEventList,
    });

    // 在事件流底部显示提示条
    setShowMilestonePromptBar(true);

    return true;
  };

  /**
   * 用户点击「✦ 好感度达到新节点，点击查看」提示条
   * → 显示节点遮罩 UI
   */
  const handleMilestonePromptBarClick = () => {
    if (!pendingMilestoneData) return;
    setShowMilestonePromptBar(false);

    const firstMilestone = pendingMilestoneData.milestones[0];
    setAffectionMilestoneOverlay({
      value: firstMilestone.value,
      type: firstMilestone.type,
      label: `好感度 ♡ ${firstMilestone.value} ♡`,
    });
  };

  /**
   * 用户点击遮罩底部「查看小剧场 ♡」按钮
   * → 关闭遮罩，依次生成所有跨越节点的小剧场
   */
  const handleMilestoneOverlayButtonClick = async () => {
    setAffectionMilestoneOverlay(null);

    if (!pendingMilestoneData) return;

    const { milestones, state, eventList: currentEventList } = pendingMilestoneData;
    let updatedState = state;
    let updatedList = currentEventList;

    for (const milestone of milestones) {
      // 生成小剧场
      setIsGenerating(true);
      setStreamingEvent(null);
      try {
        const milestoneEvent = await npcGameService.generateAffectionNodeEvent(
          apiConfig, updatedState, milestone, updatedList, handleStreamChunk,
        );
        setStreamingEvent(null);

        if (milestone.type === 'confession') {
          updatedState = { ...updatedState, relationshipStage: 'together' as const };
        }

        updatedState.currentEvent = milestoneEvent;
        updatedList = [...updatedList, milestoneEvent];
        updatedState.events = updatedList;

        setGameState({ ...updatedState });
        npcGameService.saveGame(updatedState);
        setCurrentEvent(milestoneEvent);
        setEventList(updatedList);

        // 小剧场内容插入后，立即自动加载预设选项
        setPresetOptions(extractPresetsFromEvent(milestoneEvent));

        // 好感度100表白节点：不弹奖励面板，显示特殊标识
        if (milestone.type === 'confession') {
          // 设置 relationshipStage 为 together
          updatedState = { ...updatedState, relationshipStage: 'together' as const };
          setGameState({ ...updatedState });
          npcGameService.saveGame(updatedState);

          // 在事件流底部添加「命运已定」分隔线事件
          const fateEvent: GameEvent = {
            id: `fate_sealed_${Date.now()}`,
            type: 'special',
            description: '__FATE_SEALED__',
            userDialogue: '',
            charAction: '',
            charThought: '',
          };
          updatedList = [...updatedList, fateEvent];
          updatedState.events = updatedList;
          setEventList(updatedList);
          npcGameService.saveGame(updatedState);
          // 不弹奖励面板，直接结束
        } else {
          const isLastMilestone = milestone === milestones[milestones.length - 1];
          if (isLastMilestone) {
            setPendingRewardMilestoneValue(milestone.value);
            setPendingRewardEventList(updatedList);
            setShowRewardPromptBar(true);
            setIsLoadingReward(true);
            npcGameService.generateRewardOptions(apiConfig, updatedState, milestone.value)
              .then(options => setRewardOptions(options))
              .catch(() => setRewardOptions([
                { text: '递给他一杯热饮' },
                { text: '帮他整理桌上的东西' },
              ]))
              .finally(() => setIsLoadingReward(false));
          }
        }
      } catch (e: any) {
        setError(e.message || '生成好感度节点剧情失败');
        break;
      } finally {
        setIsGenerating(false);
      }
    }

    setPendingMilestoneData(null);
  };

  /**
   * 处理用户选择奖励（预设/自定义/什么都不给/豁免权）
   */
  const handleRewardSelect = async (rewardText: string | null, isImmunity: boolean = false) => {
    setShowRewardPanel(false);
    setShowRewardPromptBar(false);
    setRewardOptions([]);
    setRewardCustomInput('');

    if (!gameState) return;

    // 豁免权
    if (isImmunity) {
      const newState = { ...gameState, immunityCount: (gameState.immunityCount || 0) + 1, justGotImmunity: true };
      setGameState(newState);
      npcGameService.saveGame(newState);
      const immunityEvent: GameEvent = {
        id: `immunity_${Date.now()}`,
        type: 'special',
        description: '',
        userDialogue: '',
        charAction: '',
        charThought: '',
      };
      const updatedList = [...pendingRewardEventList, immunityEvent];
      setEventList(updatedList);
      newState.events = updatedList;
      npcGameService.saveGame(newState);
      // 奖励面板关闭后，立即自动加载预设选项
      const lastMeaningfulEvt = pendingRewardEventList[pendingRewardEventList.length - 1];
      if (lastMeaningfulEvt) setPresetOptions(extractPresetsFromEvent(lastMeaningfulEvt));
      setShowRewardContinueBar(true);
      return;
    }

    // 「什么都不给」- 不生成反应，显示继续剧情提示
    if (rewardText === null) {
      // 奖励面板关闭后，立即自动加载预设选项
      if (currentEvent) setPresetOptions(extractPresetsFromEvent(currentEvent));
      setShowRewardContinueBar(true);
      return;
    }

    // 生成Char收到奖励的反应
    setIsGenerating(true);
    setStreamingEvent(null);
    try {
      const reactionEvent = await npcGameService.generateRewardReaction(
        apiConfig,
        gameState,
        rewardText,
        pendingRewardMilestoneValue,
        pendingRewardEventList,
        handleStreamChunk,
      );
      setStreamingEvent(null);

      const updatedList = [...pendingRewardEventList, reactionEvent];
      const updatedState = {
        ...gameState,
        currentEvent: reactionEvent,
        events: updatedList,
      };

      setGameState(updatedState);
      npcGameService.saveGame(updatedState);
      setCurrentEvent(reactionEvent);
      setEventList(updatedList);
      // 奖励面板关闭后，立即自动加载预设选项
      setPresetOptions(extractPresetsFromEvent(reactionEvent));
      setShowRewardContinueBar(true);
    } catch (e: any) {
      setError(e.message || '生成奖励反应失败');
      // 恢复选项
      if (currentEvent) {
        setPresetOptions(extractPresetsFromEvent(currentEvent));
      }
    } finally {
      setIsGenerating(false);
      setPendingRewardMilestoneValue(0);
      setPendingRewardEventList([]);
    }
  };

  /**
   * 用户手动选择结束游戏
   */
  const handleManualEndGame = async () => {
    if (!gameState || isGenerating) return;
    setIsGenerating(true);
    setError('');
    try {
      const endingText = await npcGameService.generateEnding(apiConfig, gameState);
      const finalState = { ...gameState, isGameOver: true, ending: endingText };
      setGameState(finalState);
      npcGameService.saveGame(finalState);
      setShowGameOver(true);
    } catch (e: any) {
      setError(e.message || '生成结局失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStateAndGenerateNext = async (
    inputState: NPCGameState,
    customInput?: string,
    customAffectionDelta?: number,
    selectedPresetOption?: { text: string; affectionDelta: number } | null,
  ) => {
    if (!inputState) return;

    // 创建深拷贝，避免直接修改React state导致UI不更新
    let newState: NPCGameState = JSON.parse(JSON.stringify(inputState));

    newState.turnCount += 1;

    // 在好感度更新前记录旧值（供节点跨越检测使用）
    // 必须使用原始 inputState 的好感度，确保是更新前的值
    const oldAffection = inputState.user.affection;

    // 跟踪豁免权是否在本轮生效
    let immunityUsedThisRound = false;
    // 跟踪好感度变化信息（用于传入AI prompt）
    let affectionChangeInfo: { before: number; after: number; delta: number } | null = null;

    if (customAffectionDelta !== undefined && customAffectionDelta !== 0 && currentEvent?.type !== 'daily') {
      // ── 豁免权检查：好感度下降时，如果有豁免权则消耗一次并跳过扣减 ──
      if (customAffectionDelta < 0 && (newState.immunityCount ?? 0) > 0) {
        const remaining = (newState.immunityCount ?? 0) - 1;
        newState.immunityCount = remaining;
        setImmunityMessage(`他似乎察觉到了什么，这次没有扣除好感度\n（豁免权已使用，剩余：${remaining}次）`);
        setShowImmunityConfirm(true);
        immunityUsedThisRound = true;
        // 不修改好感度，跳过 affectionDelta 应用
        customAffectionDelta = 0;
      } else {
        newState.user.affection = Math.min(100, Math.max(-100, newState.user.affection + customAffectionDelta));
        // 记录好感度变化信息
        affectionChangeInfo = {
          before: oldAffection,
          after: newState.user.affection,
          delta: customAffectionDelta,
        };
      }
      const newAffection = newState.user.affection;
      console.log('好感度变化:', '新值:', newAffection);
      console.log('=== 好感度更新 ===', '旧值:', oldAffection, '新值:', newAffection);
      console.log('=== 当前节点列表 ===', newState.affectionMilestones);
      // 记录好感度变化
      newState = npcGameService.recordAffectionChange(newState, customAffectionDelta);
    }

    // ── 自动存档检查 ──
    newState = npcGameService.checkAndCreateAutoSave(newState, eventList);

    if (currentEvent) {
      const charLine = currentEvent.charAction ? ` | Char说：${currentEvent.charAction.substring(0, 30)}` : '';
      const userLine = customInput ? ` | User做/说：${customInput.substring(0, 30)}` : '';
      const narrationLine = currentEvent.description ? ` | 旁白：${currentEvent.description.substring(0, 40)}` : '';
      const historyText = `[${currentEvent.type}]${narrationLine}${userLine}${charLine}`;
      newState.eventHistory.push(historyText);
      if (newState.eventHistory.length > 20) {
        newState.eventHistory = newState.eventHistory.slice(-15);
      }
      newState.lastEventType = currentEvent.type;
    }

    // 立即更新UI：好感度和数值变化在此处反映
    // 使用深拷贝确保中间状态不受后续 newState 突变影响，保证 React 重渲染
    setGameState(JSON.parse(JSON.stringify(newState)));
    npcGameService.saveGame(newState);

    // ══════ 读档判断 ══════
    if (customAffectionDelta !== undefined && customAffectionDelta !== 0) {
      try {
        const reloadJudgment = await npcGameService.judgeCharReload(apiConfig, newState, false);
        if (reloadJudgment.shouldReload) {
          const reloadResult = npcGameService.executeReload(newState, reloadJudgment.charNote);
          if (reloadResult) {
            // 显示读档遮罩动画
            setReloadOverlay({ charNote: reloadJudgment.charNote });
            await new Promise(resolve => setTimeout(resolve, 5000));
            setReloadOverlay(null);

            // 恢复游戏状态
            setGameState({ ...reloadResult.restoredState });
            npcGameService.saveGame(reloadResult.restoredState);
            setEventList(reloadResult.restoredEvents);

            const normalEvents = reloadResult.restoredEvents.filter(
              e => !e.id.startsWith('reload_separator_')
            );
            if (normalEvents.length > 0) {
              const lastNormalEvent = normalEvents[normalEvents.length - 1];
              setCurrentEvent(lastNormalEvent);
              setPresetOptions(extractPresetsFromEvent(lastNormalEvent));
            }
            setIsGenerating(false);
            setIsProcessingOption(false);
            return; // 读档后直接返回，不生成本轮对话
          }
        }
      } catch (reloadErr) {
        console.error('Char读档判断失败，继续正常流程:', reloadErr);
      }
    }

    // 立即显示用户的发言/行动（临时气泡）
    let hadUserBubble = false;
    if (customInput) {
      const userBubbleEvent: GameEvent = {
        id: `user_${Date.now()}`,
        type: currentEvent?.type || 'daily',
        description: '',
        userDialogue: customInput,
      };
      setEventList(prev => [...prev, userBubbleEvent]);
      hadUserBubble = true;
    }

    // 保存重试上下文（在修改 state 之后、API 调用之前）
    const eventsForHistory = [...eventList]; // 使用添加用户气泡前的列表
    setLastActionContext({
      type: 'next',
      customInput,
      affectionDelta: customAffectionDelta,
      selectedPresetOption: selectedPresetOption || null,
      stateSnapshot: JSON.parse(JSON.stringify(newState)),
      eventsSnapshot: eventsForHistory,
      hadUserBubble,
    });

    setIsGenerating(true);
    setError('');
    setPresetOptions([]);
    setStreamingEvent(null);

    // ── 标记生成开始（中断恢复用） ──
    newState = npcGameService.markGenerationStart(newState);
    setGameState(JSON.parse(JSON.stringify(newState)));

    try {
      const nextEvent = await npcGameService.generateNextEvent(
        apiConfig, newState, undefined, undefined, customInput, eventsForHistory,
        handleStreamChunk,
        selectedPresetOption,
        affectionChangeInfo,
        immunityUsedThisRound,
      );
      setStreamingEvent(null);

      if (nextEvent.shouldReload && customAffectionDelta !== undefined && customAffectionDelta < 0) {
        newState.user.affection = Math.min(100, Math.max(-100, newState.user.affection - customAffectionDelta));
        newState.eventHistory.push(`[系统] 攻略者触发了读档，好感度恢复。`);
      }

      if (nextEvent.result) {
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

      const updatedList = eventList.filter(e => !e.id.startsWith('user_'));
      updatedList.push(nextEvent);
      newState.events = updatedList;

      setGameState({ ...newState });
      npcGameService.saveGame(newState);
      setCurrentEvent(nextEvent);

      if (hadUserBubble) {
        setEventList(prev => {
          const withoutBubble = prev.filter(e => !e.id.startsWith('user_'));
          return [...withoutBubble, nextEvent];
        });
      } else {
        setEventList(prev => [...prev, nextEvent]);
      }

      // 直接从事件中提取预设选项（合并调用，无需第二次 API 请求）
      setPresetOptions(extractPresetsFromEvent(nextEvent));
      setLastActionContext(null); // 成功后清除重试上下文

      // ── 好感度节点检测（在事件生成之后，不阻塞剧情） ──
      if (customAffectionDelta !== undefined && customAffectionDelta !== 0) {
        const finalEventList = hadUserBubble
          ? [...eventList.filter(e => !e.id.startsWith('user_')), nextEvent]
          : [...eventList, nextEvent];
        detectAndQueueAffectionMilestones(newState, finalEventList, oldAffection);
      }

      // ── 里程碑触发检查（读档判断已移至生成对话之前） ──
      const milestone = npcGameService.checkMilestones(newState);
      if (milestone) {
        // 标记已触发
        const updatedSchema = [...(newState.statsSchema || [])];
        if (updatedSchema[milestone.schemaIndex]?.milestones?.[milestone.milestoneIndex]) {
          updatedSchema[milestone.schemaIndex].milestones[milestone.milestoneIndex].triggered = true;
        }
        newState.statsSchema = updatedSchema;
        setGameState({ ...newState });
        npcGameService.saveGame(newState);

        // 显示里程碑全屏通知
        setMilestoneOverlay({ statName: milestone.statName, value: milestone.value, eventName: milestone.eventName });
        
        // 2秒后消失并生成小剧场
        setTimeout(async () => {
          setMilestoneOverlay(null);
          setIsGeneratingMilestone(true);
          setStreamingEvent(null);
          try {
            const milestoneEvent = await npcGameService.generateMilestoneEvent(
              apiConfig, newState, milestone.statName, milestone.value, milestone.eventName,
              updatedList, handleStreamChunk,
            );
            setStreamingEvent(null);
            setIsGeneratingMilestone(false);
            setCurrentEvent(milestoneEvent);
            const listWithMilestone = [...updatedList, milestoneEvent];
            newState.events = listWithMilestone;
            setEventList(listWithMilestone);
            setGameState({ ...newState });
            npcGameService.saveGame(newState);
            setPresetOptions(extractPresetsFromEvent(milestoneEvent));
          } catch (err) {
            console.error('里程碑小剧场生成失败:', err);
            setIsGeneratingMilestone(false);
            setStreamingEvent(null);
          }
        }, 2000);
      }
    } catch (e: any) {
      setStreamingEvent(null);
      if (hadUserBubble) {
        setEventList(prev => prev.filter(e => !e.id.startsWith('user_')));
      }
      setError('生成失败，点击重试');
    } finally {
      // ── 标记生成结束（中断恢复用） ──
      setGameState(prev => {
        if (prev) {
          const ended = npcGameService.markGenerationEnd(prev);
          return { ...ended };
        }
        return prev;
      });
      setIsGenerating(false);
      setIsProcessingOption(false);
    }
  };

  /**
   * 重试上一次失败的 API 调用（不重复修改 state，只重新请求 AI）
   */
  const retryLastAction = async () => {
    if (!lastActionContext) return;

    const { type, customInput, selectedPresetOption, stateSnapshot, eventsSnapshot, hadUserBubble } = lastActionContext;

    setError('');
    setStreamingEvent(null);

    if (type === 'initial') {
      // 重试初始事件生成
      setIsGenerating(true);
      try {
        const event = await npcGameService.generateNextEvent(
          apiConfig, stateSnapshot, undefined, undefined, undefined, [],
          handleStreamChunk,
        );
        setStreamingEvent(null);
        setCurrentEvent(event);
        const newEventList = [event];
        setEventList(newEventList);
        const newState = { ...stateSnapshot, currentEvent: event, events: newEventList };
        setGameState(newState);
        npcGameService.saveGame(newState);
        setPresetOptions(extractPresetsFromEvent(event));
        setLastActionContext(null);
      } catch (e: any) {
        setStreamingEvent(null);
        setError('生成失败，点击重试');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // 重试下一事件生成
    // 重新显示用户气泡
    if (hadUserBubble && customInput) {
      const userBubbleEvent: GameEvent = {
        id: `user_${Date.now()}`,
        type: currentEvent?.type || 'daily',
        description: '',
        userDialogue: customInput,
      };
      setEventList(prev => {
        const withoutOldBubble = prev.filter(e => !e.id.startsWith('user_'));
        return [...withoutOldBubble, userBubbleEvent];
      });
    }

    setIsGenerating(true);
    setPresetOptions([]);
    try {
      const nextEvent = await npcGameService.generateNextEvent(
        apiConfig, stateSnapshot, undefined, undefined, customInput, eventsSnapshot,
        handleStreamChunk,
        selectedPresetOption,
      );
      setStreamingEvent(null);

      const updatedState = JSON.parse(JSON.stringify(stateSnapshot)) as NPCGameState;

      if (nextEvent.shouldReload && lastActionContext.affectionDelta !== undefined && lastActionContext.affectionDelta < 0) {
      updatedState.user.affection = Math.min(100, Math.max(-100, updatedState.user.affection - lastActionContext.affectionDelta));
        updatedState.eventHistory.push(`[系统] 攻略者触发了读档，好感度恢复。`);
      }

      if (nextEvent.result) {
        const resultDelta = nextEvent.result;
        updatedState.user.darkening = Math.min(100, Math.max(0, updatedState.user.darkening + (resultDelta.darkeningDelta || 0)));
        if (resultDelta.customStatsDelta && updatedState.user.customStats) {
          Object.keys(resultDelta.customStatsDelta).forEach(key => {
            if (updatedState.user.customStats![key] !== undefined) {
              updatedState.user.customStats![key] += resultDelta.customStatsDelta![key];
            }
          });
        }
      }

      updatedState.currentEvent = nextEvent;

      const updatedList = eventsSnapshot.filter(e => !e.id.startsWith('user_'));
      updatedList.push(nextEvent);
      updatedState.events = updatedList;

      setGameState(updatedState);
      npcGameService.saveGame(updatedState);
      setCurrentEvent(nextEvent);

      setEventList(() => {
        const withoutBubble = eventsSnapshot.filter(e => !e.id.startsWith('user_'));
        return [...withoutBubble, nextEvent];
      });

      setPresetOptions(extractPresetsFromEvent(nextEvent));
      setLastActionContext(null);
    } catch (e: any) {
      setStreamingEvent(null);
      if (hadUserBubble) {
        setEventList(prev => prev.filter(e => !e.id.startsWith('user_')));
      }
      setError('生成失败，点击重试');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 重新生成最后一条 char 回应：
   * 清除最后一条事件，使用相同上下文重新调用 AI
   */
  const handleRegenerate = async () => {
    if (!gameState || isGenerating || eventList.length === 0) return;

    // 找到最后一条非用户气泡事件
    const lastEvent = eventList[eventList.length - 1];
    if (!lastEvent || lastEvent.id.startsWith('user_') || lastEvent.id.startsWith('reload_separator_')) return;

    // 如果有保存的上下文（上次操作），优先使用
    if (lastActionContext) {
      // 移除最后一条事件，恢复到之前的状态
      setEventList(lastActionContext.eventsSnapshot);
      setCurrentEvent(
        lastActionContext.eventsSnapshot.length > 0
          ? lastActionContext.eventsSnapshot[lastActionContext.eventsSnapshot.length - 1]
          : null,
      );
      // 重新调用
      retryLastAction();
      return;
    }

    // 没有 lastActionContext 时，从当前状态重建上下文
    const prevEventList = eventList.slice(0, -1);
    const prevLastEvent = prevEventList.length > 0 ? prevEventList[prevEventList.length - 1] : null;

    // 提取上一次用户输入（从被移除的事件中）
    const lastUserInput = lastEvent.userDialogue || '';

    // 提取上一次选中的预设选项信息
    const hadUserBubble = !!lastUserInput;

    // 恢复事件列表（移除最后一条）
    setEventList(prevEventList);
    setCurrentEvent(prevLastEvent);

    // 构建重试上下文
    const retryContext = {
      type: 'next' as const,
      customInput: lastUserInput || undefined,
      affectionDelta: 0,
      selectedPresetOption: null,
      stateSnapshot: JSON.parse(JSON.stringify(gameState)),
      eventsSnapshot: prevEventList,
      hadUserBubble,
    };
    setLastActionContext(retryContext);

    // 重新显示用户气泡（如果有）
    if (hadUserBubble && lastUserInput) {
      const userBubbleEvent: GameEvent = {
        id: `user_${Date.now()}`,
        type: prevLastEvent?.type || 'daily',
        description: '',
        userDialogue: lastUserInput,
      };
      setEventList(prev => [...prev, userBubbleEvent]);
    }

    // 调用 AI 重新生成（过滤掉小剧场/milestone事件，避免以小剧场内容作为上下文）
    const filteredPrevEventList = prevEventList.filter(e => e.type !== 'milestone');
    setIsGenerating(true);
    setError('');
    setPresetOptions([]);
    setStreamingEvent(null);
    try {
      const nextEvent = await npcGameService.generateNextEvent(
        apiConfig,
        retryContext.stateSnapshot,
        undefined,
        undefined,
        lastUserInput || undefined,
        filteredPrevEventList,
        handleStreamChunk,
        null,
      );
      setStreamingEvent(null);

      const updatedState = JSON.parse(JSON.stringify(retryContext.stateSnapshot)) as NPCGameState;
      updatedState.currentEvent = nextEvent;

      const updatedList = prevEventList.filter(e => !e.id.startsWith('user_'));
      updatedList.push(nextEvent);
      updatedState.events = updatedList;

      setGameState(updatedState);
      npcGameService.saveGame(updatedState);
      setCurrentEvent(nextEvent);

      setEventList(() => {
        const withoutBubble = prevEventList.filter(e => !e.id.startsWith('user_'));
        return [...withoutBubble, nextEvent];
      });

      setPresetOptions(extractPresetsFromEvent(nextEvent));
      setLastActionContext(null);
    } catch (e: any) {
      setStreamingEvent(null);
      if (hadUserBubble) {
        setEventList(prev => prev.filter(e => !e.id.startsWith('user_')));
      }
      setError('重新生成失败，点击重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gameState || isGenerating || isProcessingOption || !customInputText.trim()) return;
    // 立即同步显示 loading 状态，不等待任何异步操作
    setIsGenerating(true);
    setStreamingEvent(null);
    setIsProcessingOption(true);
    // 关闭继续剧情提示条
    setShowRewardContinueBar(false);
    const text = customInputText.trim();
    const delta = affectionDelta;
    setCustomInputText('');
    setAffectionDelta(0);
    setShowQuickActions(false);
    updateStateAndGenerateNext(gameState, text, delta);
  };

  const handlePresetOptionSelect = (option: PresetOption) => {
    if (!gameState || isGenerating || isProcessingOption) return;
    // 立即同步显示 loading 状态，不等待任何异步操作
    setIsGenerating(true);
    setStreamingEvent(null);
    setIsProcessingOption(true);
    // 关闭继续剧情提示条
    setShowRewardContinueBar(false);
    setShowQuickActions(false);
    setAffectionDelta(0);
    // 去掉可能残留的序号前缀，确保发出去的文本干净
    const cleanText = stripNumberPrefix(option.text);
    // 传入选中的预设选项，以便重试时保持方向一致
    updateStateAndGenerateNext(gameState, cleanText, option.affectionDelta, { text: cleanText, affectionDelta: option.affectionDelta });
  };

  const handleRestart = () => {
    npcGameService.clearGame();
    setGameState(null);
    setCurrentEvent(null);
    setEventList([]);
    setShowGameOver(false);
    setPresetOptions([]);
    setAffectionDelta(0);
    setStreamingEvent(null);
    setShowSetup(true);
  };

  const handleExit = () => {
    setScreen('home');
  };

  const handleBackClick = () => {
    if (gameState && eventList.length > 0 && !showGameOver) {
      // 检查是否已存在与当前轮数和好感度完全一致的手动存档
      const saves = npcGameService.getAllSaves();
      const hasMatchingSave = saves.some(s =>
        s.state.turnCount === gameState.turnCount &&
        s.state.user.affection === gameState.user.affection
      );
      if (hasMatchingSave) {
        // 已存在匹配的存档，直接退出不弹窗
        handleExit();
      } else {
        setShowExitConfirmModal(true);
      }
    } else {
      handleExit();
    }
  };

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
      {/* floatHeart keyframes */}
      <style>{`
        @keyframes floatHeart1 {
          0%   { transform: translateX(0px); }
          50%  { transform: translateX(-16px); }
          100% { transform: translateX(0px); }
        }
        @keyframes floatHeart2 {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes floatHeart3 {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .regen-btn {
          color: rgba(140,155,175,0.6);
          border: 1px solid rgba(140,155,175,0.3);
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .regen-btn:hover {
          color: rgba(140,155,175,0.9);
          border-color: rgba(140,155,175,0.6);
        }
      `}</style>
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

      {/* 毛玻璃叠加层 */}
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
                onClick={handleBackClick}
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
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
            ) : (
              <span className="text-xl font-bold text-zinc-500 dark:text-zinc-300 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors">
                {gameState.user.name.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ====== 退出确认模态框 ====== */}
      <AnimatePresence>
        {showExitConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                <LogOut size={24} className="text-zinc-700 dark:text-zinc-300" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">确认退出</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6">
                是否在退出前保存当前进度？
              </p>
              <div className="flex flex-col w-full gap-2">
                <button
                  onClick={() => {
                    setShowExitConfirmModal(false);
                    setIsExitingAfterSave(true);
                    setShowSaveNameModal(true);
                  }}
                  className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold active:scale-[0.98] transition-transform"
                >
                  保存并退出
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirmModal(false);
                    handleExit();
                  }}
                  className="w-full py-3 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 font-bold active:scale-[0.98] transition-transform"
                >
                  直接退出
                </button>
                <button
                  onClick={() => setShowExitConfirmModal(false)}
                  className="w-full py-3 rounded-xl bg-transparent text-zinc-500 dark:text-zinc-400 font-bold hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 active:scale-[0.98] transition-all"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 错误提示 ====== */}
      <AnimatePresence>
        {error && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-50 mx-6 mt-2 px-4 py-3 bg-red-500/90 backdrop-blur-md text-white rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertTriangle size={14} className="shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <button
              onClick={() => {
                if (lastActionContext) {
                  retryLastAction();
                } else {
                  // 兜底：如果没有保存的上下文，尝试重新生成初始事件
                  if (gameState) generateInitialEvent(gameState);
                }
              }}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>重试</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 保存命名模态框 ====== */}
      <AnimatePresence>
        {showSaveNameModal && (
          <NPCSaveNameModal
            onClose={() => {
              setShowSaveNameModal(false);
              setIsExitingAfterSave(false);
            }}
            onOverwrite={handleOverwriteSave}
            onSaveAsNew={handleSaveAsNew}
            defaultName={currentSaveName || npcGameService.getNextAutoSaveName()}
            canOverwrite={!!currentSaveSlotId}
            currentSaveSlotId={currentSaveSlotId}
          />
        )}
      </AnimatePresence>

      {/* ====== 中断恢复提示 Toast ====== */}
      <AnimatePresence>
        {showInterruptRecoveryToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-20 left-1/2 z-50 px-5 py-2.5 bg-zinc-500/80 text-zinc-200 backdrop-blur-md rounded-full text-xs font-normal shadow-lg"
          >
            上次游戏被中断，已恢复到中断前状态
          </motion.div>
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
        onScroll={handleScrollEvent}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-20 relative z-[1] flex flex-col gap-4"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)'
        }}
      >
        {/* 历史事件区域 - 独立渲染，不受 isGenerating 影响 */}
        <MemoizedEventList eventList={eventList} charName={gameState.char.name} userAvatar={userAvatar} />

        {/* 重新生成按钮 - 显示文字，点击弹出确认提示 */}
        {!isGenerating && !showGameOver && eventList.length > 0 && (() => {
          const lastNormalIdx = (() => {
            for (let i = eventList.length - 1; i >= 0; i--) {
              const e = eventList[i];
              if (!e.id.startsWith('user_') && !e.id.startsWith('reload_separator_') && !e.id.startsWith('opening_') && e.type !== 'milestone') {
                return i;
              }
            }
            return -1;
          })();
          const lastEvt = eventList[eventList.length - 1];
          const isLastNormal = lastNormalIdx >= 0 && lastNormalIdx === eventList.length - 1;
          const showRegen = isLastNormal && lastEvt && lastEvt.type !== 'milestone';
          return showRegen ? (
            <div className="flex justify-end -mt-3 mb-0 pr-2 relative">
              {/* 确认重新生成弹窗 */}
              <AnimatePresence>
                {showRegenConfirm && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute bottom-full mb-2 right-0 px-4 py-3 rounded-2xl shadow-lg flex flex-col items-center gap-2.5 z-10"
                    style={{
                      background: 'rgba(255,255,255,0.82)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      border: '1px solid rgba(255,255,255,0.5)',
                      minWidth: '140px',
                    }}
                  >
                    <span className="text-xs font-medium whitespace-nowrap" style={{ color: '#8C9BAF' }}>确认重新生成？</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowRegenConfirm(false); handleRegenerate(); }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-medium active:scale-95 transition-transform"
                        style={{ backgroundColor: '#8C9BAF', color: '#fff' }}
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setShowRegenConfirm(false)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-medium active:scale-95 transition-transform"
                        style={{ backgroundColor: '#8C9BAF', color: '#fff' }}
                      >
                        取消
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setShowRegenConfirm(prev => !prev)}
                className="regen-btn flex items-center gap-1"
                title="重新生成"
                style={{ background: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '8px' }}
              >
                <RefreshCw size={13} />
                <span className="text-xs">重新生成</span>
              </button>
            </div>
          ) : null;
        })()}

        {/* 生成中的区域 - 仅此区域随 isGenerating 变化 */}
        {isGenerating && (
          <div className="px-1 py-2">
            {streamingEvent ? (
              <motion.div
                key="streaming"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <NPCEvent event={streamingEvent} charName={gameState.char.name} userAvatar={userAvatar} />
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 px-4 py-2 self-start bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-2xl mx-1"
              >
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-xs font-medium">命运的齿轮正在转动...</span>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* ====== 新内容提示按钮 ====== */}
      <AnimatePresence>
        {showNewContentIndicator && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-zinc-800/80 dark:bg-zinc-200/80 text-white dark:text-zinc-900 text-xs font-medium rounded-full backdrop-blur-md shadow-lg active:scale-95 transition-transform"
          >
            新内容 ↓
          </motion.button>
        )}
      </AnimatePresence>

      {/* ====== 底部毛玻璃悬浮输入条 ====== */}
      <div className="relative z-10 mx-3 mb-3 shrink-0" ref={quickActionsRef}>
        {/* 加号菜单弹出层 - 预设选项 */}
        <AnimatePresence>
          {showQuickActions && !showGameOver && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-2 left-0 w-[280px] flex flex-col gap-1.5"
            >
              {presetOptions.length === 0 ? (
                <div className="bg-white/60 dark:bg-black/50 backdrop-blur-xl rounded-2xl px-4 py-3 text-sm text-zinc-400 dark:text-zinc-500">
                  暂无选项
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
                    disabled={isGenerating || isProcessingOption}
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
              {/* 加号按钮 */}
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
                disabled={!customInputText.trim() || isGenerating || isProcessingOption || !currentEvent}
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

      {/* ====== 豁免权使用提示弹窗 ====== */}
      <AnimatePresence>
        {showImmunityConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[65] flex items-center justify-center"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.35)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[280px] rounded-[24px] p-6 text-center shadow-2xl"
              style={{ background: 'linear-gradient(180deg, #fffdf5 0%, #fef9e7 100%)' }}
            >
              <span className="text-3xl mb-3 block">🛡</span>
              <p className="text-sm font-medium leading-relaxed whitespace-pre-line" style={{ color: '#6b5a2e' }}>
                {immunityMessage}
              </p>
              <button
                onClick={() => setShowImmunityConfirm(false)}
                className="mt-5 px-8 py-2.5 rounded-full text-sm font-medium active:scale-95 transition-transform"
                style={{ backgroundColor: '#d4a54a', color: '#fff' }}
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 读档遮罩动画 ====== */}
      <AnimatePresence>
        {reloadOverlay && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: [1, 0.2, 0.8, 0.15, 0.6, 0],
            }}
            transition={{ duration: 0.01 }}
            className="absolute inset-0 z-[70] flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.96)' }}
          >
            {/* 主内容区域 */}
            <div className="text-center flex flex-col items-center gap-0 relative w-full max-w-[320px]">
              {/* 第一行：charNote 内心独白 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-[13px] italic font-light tracking-wide leading-relaxed max-w-[280px] mb-6"
                style={{ color: 'rgba(220,220,220,0.85)' }}
              >
                {reloadOverlay.charNote}
              </motion.p>

              {/* 暗红色扫描线 */}
              <motion.div
                initial={{ scaleX: 0, opacity: 1 }}
                animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
                transition={{ delay: 0.7, duration: 0.8, times: [0, 0.7, 1], ease: 'easeInOut' }}
                className="w-full mb-6"
                style={{
                  height: '1px',
                  backgroundColor: '#8B0000',
                  transformOrigin: 'left center',
                }}
              />

              {/* 第二行：R E L O A D */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.3 }}
                className="text-[15px] font-medium mb-5"
                style={{ color: 'rgba(255,255,255,0.95)', letterSpacing: '0.6em' }}
              >
                R E L O A D
              </motion.p>

              {/* 第三行：存档读取中 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0.5, 1] }}
                transition={{ delay: 1.4, duration: 1.2 }}
                className="text-[11px] font-medium"
                style={{ color: '#8B0000', letterSpacing: '0.15em' }}
              >
                存档读取中 ◈
              </motion.p>
            </div>

            {/* 右下角：时间倒流 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ delay: 1.8, duration: 0.4 }}
              className="absolute bottom-6 right-6 text-[10px] font-normal"
              style={{ color: 'rgba(100,100,100,0.6)' }}
            >
              时间倒流
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 好感度节点全屏通知（图片背景 + 浮动爱心 + 逐行淡入文字） ====== */}
      <AnimatePresence>
        {affectionMilestoneOverlay && (
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              zIndex: 9999,
            }}
          >
            {/* 背景图层 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${heartbeatBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />

            {/* 爱心图层1 */}
            <img
              src={heartbeatHeart1}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                ...floatStyle1,
              }}
            />

            {/* 爱心图层2 */}
            <img
              src={heartbeatHeart2}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                ...floatStyle2,
              }}
            />

            {/* 爱心图层3 */}
            <img
              src={heartbeatHeart3}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                ...floatStyle3,
              }}
            />

            {/* 文字内容层 */}
            <div style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '12px',
            }}>
              {/* 第一行：HEARTBEAT */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                  color: '#f0a1ab',
                  fontSize: '11px',
                  fontWeight: 300,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase' as const,
                }}
              >
                HEARTBEAT
              </motion.p>

              {/* 第二行：节点描述文案 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                style={{
                  color: '#f0a1ab',
                  fontSize: '18px',
                  fontWeight: 400,
                }}
              >
                {getAffectionMilestoneText(affectionMilestoneOverlay.value)}
              </motion.p>

              {/* 第三行：好感度 ♡ 数值 ♡ */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                style={{
                  color: '#f0a1ab',
                  fontSize: '28px',
                  fontWeight: 300,
                  letterSpacing: '0.05em',
                }}
              >
                好感度 ♡ {affectionMilestoneOverlay.value} ♡
              </motion.p>

              {/* 底部按钮：查看小剧场 */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                onClick={handleMilestoneOverlayButtonClick}
                style={{
                  marginTop: '32px',
                  padding: '12px 36px',
                  backgroundColor: '#ffffff',
                  color: '#f0a1ab',
                  fontSize: '15px',
                  fontWeight: 500,
                  borderRadius: '24px',
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                  boxShadow: '0 4px 20px rgba(240,161,171,0.25)',
                }}
              >
                查看小剧场 ♡
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 奖励提示条（事件流底部） ====== */}
      <AnimatePresence>
        {showRewardPromptBar && !showRewardPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-0 right-0 z-[55] flex justify-center px-4"
          >
            <button
              onClick={() => setShowRewardPanel(true)}
              className="px-6 py-3 rounded-full text-sm font-medium active:scale-95 transition-all shadow-lg"
              style={{ backgroundColor: 'rgba(255,240,245,0.95)', color: '#d4627a' }}
            >
              ✦ 要给他一点奖励吗？
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 奖励面板（展开后） ====== */}
      <AnimatePresence>
        {showRewardPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[55] flex items-end justify-center pb-6 px-4"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.25)' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowRewardPanel(false); } }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-[24px] p-5 shadow-2xl border-0 relative overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #fff5f7 100%)',
                boxShadow: '0 0 40px rgba(212,98,122,0.12), 0 8px 32px rgba(0,0,0,0.08)',
              }}
            >
              {/* 边缘粉色光晕 */}
              <div className="absolute inset-0 rounded-[24px] pointer-events-none" style={{
                boxShadow: 'inset 0 0 30px rgba(212,98,122,0.08)',
              }} />

              {/* 标题 */}
              <p className="text-center text-base font-light tracking-wider mb-4" style={{ color: '#d4627a' }}>
                送给他
              </p>

              {isLoadingReward ? (
                <div className="flex items-center justify-center py-8 gap-2" style={{ color: '#d4627a' }}>
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-sm font-light">正在准备...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 relative z-10">
                  {/* 第一个：豁免权（金色特殊） */}
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => handleRewardSelect(null, true)}
                    disabled={isGenerating}
                    className="w-full text-left px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-40 flex items-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, #fffdf5 0%, #fef9e7 100%)',
                      border: '1.5px solid',
                      borderImage: 'linear-gradient(135deg, #d4a54a, #e8c76a, #d4a54a) 1',
                      borderRadius: '16px',
                      borderImageSlice: 1,
                    }}
                  >
                    <span className="text-xl shrink-0" style={{ color: '#c9952a' }}>🛡</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#6b5a2e' }}>好感度下降豁免权 × 1</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#c9952a' }}>下次好感下降时可抵消一次</p>
                    </div>
                  </motion.button>

                  {/* 第二、三个：AI生成的剧情类奖励 */}
                  {rewardOptions.map((option, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.06 }}
                      onClick={() => handleRewardSelect(option.text)}
                      disabled={isGenerating}
                      className="w-full text-left px-4 py-3 bg-white rounded-2xl active:scale-[0.98] transition-all disabled:opacity-40 flex items-center gap-3"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                    >
                      <span className="text-base shrink-0" style={{ color: '#d4627a' }}>♡</span>
                      <span className="text-sm font-medium" style={{ color: '#4a4a4a' }}>{option.text}</span>
                    </motion.button>
                  ))}

                  {/* 第四个：自定义输入 */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={rewardCustomInput}
                      onChange={(e) => setRewardCustomInput(e.target.value)}
                      placeholder="描述一个你能做的举动，剧情将据此推进"
                      disabled={isGenerating}
                      className="flex-1 min-w-0 px-4 py-3 rounded-2xl text-sm outline-none border-0 transition-colors disabled:opacity-40"
                      style={{
                        backgroundColor: 'rgba(255,240,245,0.6)',
                        color: '#4a4a4a',
                        fontWeight: 300,
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && rewardCustomInput.trim()) handleRewardSelect(rewardCustomInput.trim()); }}
                    />
                    {rewardCustomInput.trim() && (
                      <button
                        onClick={() => handleRewardSelect(rewardCustomInput.trim())}
                        disabled={isGenerating}
                        className="px-4 py-3 rounded-2xl text-sm font-medium active:scale-95 transition-transform disabled:opacity-40 shrink-0"
                        style={{ backgroundColor: '#d4627a', color: '#fff' }}
                      >
                        确定
                      </button>
                    )}
                  </motion.div>

                  {/* 什么都不给 */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    onClick={() => handleRewardSelect(null)}
                    disabled={isGenerating}
                    className="w-full text-center py-2 text-[12px] font-normal active:scale-[0.98] transition-all disabled:opacity-40 mt-1"
                    style={{ color: '#aaa' }}
                  >
                    什么都不给
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 好感度节点提示条（事件流底部） ====== */}
      <AnimatePresence>
        {showMilestonePromptBar && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-0 right-0 z-[55] flex justify-center px-4"
          >
            <button
              onClick={handleMilestonePromptBarClick}
              className="px-6 py-3 rounded-full text-sm font-medium active:scale-95 transition-all shadow-lg"
              style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.5)',
                color: '#f0a1ab',
              }}
            >
              ✦ 好感度达到新节点，点击查看
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 奖励后继续剧情提示条（纯提示，不可点击，文档流内占位） ====== */}
      <AnimatePresence>
        {showRewardContinueBar && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{ position: 'relative', zIndex: 1 }}
            className="flex justify-center px-4 py-2"
          >
            <div
              className="px-6 py-3 rounded-full text-sm font-medium shadow-lg"
              style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.5)',
                color: '#f0a1ab',
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              ✦ 请继续推动剧情
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 里程碑触发全屏通知 ====== */}
      <AnimatePresence>
        {milestoneOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[60] flex items-center justify-center"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
              className="text-center"
            >
              <div className="text-lg font-light text-white/60 tracking-[0.3em] mb-3">〔</div>
              <div className="text-2xl font-bold text-white tracking-widest mb-2">
                {milestoneOverlay.statName} → {milestoneOverlay.value}
              </div>
              <div className="text-lg font-light text-white/60 tracking-[0.3em] mt-3">〕</div>
              <div className="mt-6 text-base text-white/80 font-medium tracking-wider">
                触发事件：{milestoneOverlay.eventName}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                {gameState.relationshipStage === 'together' ? (
                  <span className="text-zinc-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">TRUE LOVE END</span>
                ) : gameState.user.affection >= 70 ? (
                  <span className="text-zinc-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">SWEET END</span>
                ) : gameState.user.affection >= 30 ? (
                  <span className="text-zinc-300">NORMAL END</span>
                ) : (
                  <span className="text-zinc-400">OPEN END</span>
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
