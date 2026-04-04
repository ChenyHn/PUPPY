import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, RefreshCw, LogOut, Send, Save, Image as ImageIcon, Plus, X, Minus, ImageOff } from 'lucide-react';
import { ApiConfig, Screen } from '../types';
import { NPCGameState, GameEvent, PresetOption, AffectionMilestone } from '../types/npcGame';
import { npcGameService, extractPartialEventFields } from '../utils/npcGameService';
import { NPCSetupModal } from '../components/NPCSetupModal';
import { NPCEvent } from '../components/NPCEvent';
import { NPCLoadSaveModal } from '../components/NPCLoadSaveModal';
import { NPCSaveNameModal } from '../components/NPCSaveNameModal';

interface HeartbeatNPCProps {
  apiConfig: ApiConfig;
  setScreen: (s: Screen) => void;
}

const WALLPAPER_KEY = 'npc_game_wallpaper';

/**
 * 去掉选项文本中可能包含的序号前缀，如 "1.", "2.", "3.", "1、", "1)", "1）" 等
 */
function stripNumberPrefix(text: string): string {
  return text.replace(/^\d+\s*[\.。、\)）:：]\s*/, '').trim();
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
    subtitle: string;
  } | null>(null);

  // 读档遮罩状态
  const [reloadOverlay, setReloadOverlay] = useState<{ charNote: string } | null>(null);

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
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isExitingAfterSave, setIsExitingAfterSave] = useState(false);

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
  }, [eventList, isGenerating, streamingEvent]);

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
          const newState = { ...gameState, user: { ...gameState.user, avatar: dataUrl } };
          setGameState(newState);
          npcGameService.saveGame(newState);
          npcGameService.saveToSlot(newState);
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
        const restoredEvents = loadedState.events;
        const lastEvent = restoredEvents[restoredEvents.length - 1];
        setCurrentEvent(lastEvent);
        setEventList(restoredEvents);
        setPresetOptions(extractPresetsFromEvent(lastEvent));
      } else if (loadedState.currentEvent) {
        console.warn('旧存档格式：仅包含最后一个事件，历史记录可能不完整。');
        setCurrentEvent(loadedState.currentEvent);
        const loadedEventList = [loadedState.currentEvent];
        setEventList(loadedEventList);
        setPresetOptions(extractPresetsFromEvent(loadedState.currentEvent));
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
        const restoredEvents = saved.events;
        const lastEvent = restoredEvents[restoredEvents.length - 1];
        setCurrentEvent(lastEvent);
        setEventList(restoredEvents);
        setPresetOptions(extractPresetsFromEvent(lastEvent));
      } else if (saved.currentEvent) {
        console.warn('旧存档格式：仅包含最后一个事件，历史记录可能不完整。');
        setCurrentEvent(saved.currentEvent);
        const resumedEventList = [saved.currentEvent];
        setEventList(resumedEventList);
        setPresetOptions(extractPresetsFromEvent(saved.currentEvent));
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
      const event = await npcGameService.generateNextEvent(
        apiConfig, state, undefined, undefined, undefined, [],
        handleStreamChunk,
      );
      setStreamingEvent(null);
      setCurrentEvent(event);
      const newEventList = [event];
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
   * 检查好感度是否达到某个节点（30/60/100），触发对应的全屏提示和特殊剧情
   * 返回 true 表示触发了节点事件（调用方应停止后续流程等待完成）
   */
  const checkAffectionMilestoneTrigger = async (
    state: NPCGameState,
    currentEventList: GameEvent[],
  ): Promise<boolean> => {
    const milestone = npcGameService.checkAffectionMilestones(state);
    if (!milestone) return false;

    // 构建全屏提示信息
    const overlayInfo: Record<AffectionMilestone['type'], { label: string; subtitle: string }> = {
      first_move: { label: '好感度 → 30', subtitle: 'Char第一次主动出击' },
      key_event: { label: '好感度 → 60', subtitle: '关键事件' },
      confession: { label: '好感度 → 100', subtitle: '攻略成功' },
    };

    const info = overlayInfo[milestone.type];

    // 标记节点为已触发
    let updatedState = npcGameService.markAffectionMilestoneTriggered(state, milestone.type);
    setGameState({ ...updatedState });
    npcGameService.saveGame(updatedState);

    // 显示全屏提示
    setAffectionMilestoneOverlay({
      value: milestone.value,
      type: milestone.type,
      label: info.label,
      subtitle: info.subtitle,
    });

    // 2秒后消失并生成特殊剧情
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAffectionMilestoneOverlay(null);

    // 生成好感度节点特殊剧情
    setIsGenerating(true);
    setStreamingEvent(null);
    try {
      const milestoneEvent = await npcGameService.generateAffectionMilestoneEvent(
        apiConfig, updatedState, milestone, currentEventList, handleStreamChunk,
      );
      setStreamingEvent(null);

      // 如果是表白节点（100），设置关系阶段为 together
      if (milestone.type === 'confession') {
        updatedState = { ...updatedState, relationshipStage: 'together' as const };
      }

      updatedState.currentEvent = milestoneEvent;
      const updatedList = [...currentEventList, milestoneEvent];
      updatedState.events = updatedList;

      setGameState({ ...updatedState });
      npcGameService.saveGame(updatedState);
      setCurrentEvent(milestoneEvent);
      setEventList(updatedList);
      setPresetOptions(extractPresetsFromEvent(milestoneEvent));
    } catch (e: any) {
      setError(e.message || '生成好感度节点剧情失败');
    } finally {
      setIsGenerating(false);
    }
    return true;
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

    if (customAffectionDelta !== undefined && customAffectionDelta !== 0 && currentEvent?.type !== 'daily') {
      newState.user.affection = Math.min(100, Math.max(0, newState.user.affection + customAffectionDelta));
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

    // ── 好感度节点检查（30/60/100）──
    const affectionMilestoneTriggered = await checkAffectionMilestoneTrigger(newState, eventList);
    if (affectionMilestoneTriggered) return;

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
    try {
      const nextEvent = await npcGameService.generateNextEvent(
        apiConfig, newState, undefined, undefined, customInput, eventsForHistory,
        handleStreamChunk,
        selectedPresetOption,
      );
      setStreamingEvent(null);

      if (nextEvent.shouldReload && customAffectionDelta !== undefined && customAffectionDelta < 0) {
        newState.user.affection = Math.min(100, Math.max(0, newState.user.affection - customAffectionDelta));
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

      // ── Char 读档判断（好感度变化后，生成下一轮剧情之前） ──
      if (customAffectionDelta !== undefined && customAffectionDelta !== 0) {
        try {
          const reloadJudgment = await npcGameService.judgeCharReload(apiConfig, newState);
          if (reloadJudgment.shouldReload) {
            const reloadResult = npcGameService.executeReload(newState, reloadJudgment.charNote);
            if (reloadResult) {
              // 显示读档遮罩动画
              setReloadOverlay({ charNote: reloadJudgment.charNote });

              // 1.5秒后自动消失并恢复状态
              await new Promise(resolve => setTimeout(resolve, 1500));
              setReloadOverlay(null);

              // 恢复游戏状态
              setGameState({ ...reloadResult.restoredState });
              npcGameService.saveGame(reloadResult.restoredState);
              setEventList(reloadResult.restoredEvents);

              // 设置 currentEvent 为分隔线前最后一个正常事件
              const normalEvents = reloadResult.restoredEvents.filter(
                e => !e.id.startsWith('reload_separator_')
              );
              if (normalEvents.length > 0) {
                const lastNormalEvent = normalEvents[normalEvents.length - 1];
                setCurrentEvent(lastNormalEvent);
                setPresetOptions(extractPresetsFromEvent(lastNormalEvent));
              }

              return; // 读档后不继续执行里程碑检查等
            }
          }
        } catch (reloadErr) {
          console.error('Char读档判断失败，继续正常流程:', reloadErr);
        }
      }

      // ── 里程碑触发检查 ──
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
        
        // 2秒后消失并生成特殊剧情
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
            console.error('里程碑特殊剧情生成失败:', err);
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
      setIsGenerating(false);
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
        updatedState.user.affection = Math.min(100, Math.max(0, updatedState.user.affection - lastActionContext.affectionDelta));
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
      setShowExitConfirmModal(true);
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
        {/* 历史事件区域 - 独立渲染，不受 isGenerating 影响 */}
        <MemoizedEventList eventList={eventList} charName={gameState.char.name} userAvatar={gameState.user.avatar} />

        {/* 生成中的区域 - 仅此区域随 isGenerating 变化 */}
        {isGenerating && (
          <div className="px-1 py-2">
            {streamingEvent ? (
              <motion.div
                key="streaming"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <NPCEvent event={streamingEvent} charName={gameState.char.name} userAvatar={gameState.user.avatar} />
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

      {/* ====== 读档遮罩动画 ====== */}
      <AnimatePresence>
        {reloadOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-[70] flex flex-col items-center justify-center"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center flex flex-col items-center gap-4"
            >
              <p className="text-white/80 text-base italic font-light tracking-wide max-w-[280px]">
                {reloadOverlay.charNote}
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="text-white/50 text-sm font-medium tracking-widest"
              >
                [ 正在读取存档... ]
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 好感度节点全屏通知 ====== */}
      <AnimatePresence>
        {affectionMilestoneOverlay && (
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
                {affectionMilestoneOverlay.label}
              </div>
              <div className="text-lg font-light text-white/60 tracking-[0.3em] mt-3">〕</div>
              <div className="mt-6 text-base text-white/80 font-medium tracking-wider">
                {affectionMilestoneOverlay.subtitle}
              </div>
            </motion.div>
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
