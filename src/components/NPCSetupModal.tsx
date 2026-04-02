import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { ApiConfig, Persona } from '../types';
import { npcGameService } from '../utils/npcGameService';
import { NPCGameState } from '../types/npcGame';

interface NPCSetupModalProps {
  onClose: () => void;
  onGameStart: (state: NPCGameState) => void;
  apiConfig: ApiConfig;
}

const DEFAULT_PRESETS = [
  { name: '校园日常', description: '平凡的高中生活，你是一个普通的学生，新学期开学第一天发生了一些小事。' },
  { name: '职场风云', description: '你在一家竞争激烈的互联网公司做实习生，每天为了转正而努力工作。' },
  { name: '仙侠门派', description: '新一届外门弟子刚刚入门，你资质平平，只想安稳度日。' },
  { name: '轻奇幻世界', description: '在这个人类与亚人混居的城市里，你在街角开着一家不起眼的咖啡馆。' },
];

export function NPCSetupModal({ onClose, onGameStart, apiConfig }: NPCSetupModalProps) {
  const [userName, setUserName] = useState('');
  const [userPersona, setUserPersona] = useState('');
  const [background, setBackground] = useState('');
  const [gender, setGender] = useState('女');
  const [isCustomBg, setIsCustomBg] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPresetIdx, setGeneratingPresetIdx] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [presets, setPresets] = useState<{name: string, description: string}[]>(DEFAULT_PRESETS);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [presetNotice, setPresetNotice] = useState('');
  
  const [contacts, setContacts] = useState<Persona[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>('');

  const loadPresets = async () => {
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      setPresetNotice('请先配置API以生成预设');
      return;
    }
    setIsLoadingPresets(true);
    setPresetNotice('');
    try {
      const newPresets = await npcGameService.generatePresetBackgrounds(apiConfig);
      setPresets(newPresets);
    } catch (e) {
      setPresetNotice('网络问题，使用默认预设');
      setTimeout(() => setPresetNotice(''), 3000);
    } finally {
      setIsLoadingPresets(false);
    }
  };

  useEffect(() => {
    if (apiConfig.baseUrl && apiConfig.apiKey) {
      loadPresets();
    }
    try {
      const savedPersonas = localStorage.getItem('aiphone_phone_personas');
      if (savedPersonas) {
        setContacts(JSON.parse(savedPersonas));
      }
    } catch (e) {
      console.error('Failed to load contacts for NPC game', e);
    }
  }, []);

  const handleStart = async (bgOverride?: string) => {
    const finalBg = bgOverride || background;
    
    if (!userName.trim()) {
      setError('请输入你的名字');
      return;
    }
    if (!finalBg.trim()) {
      setError('请选择或输入世界背景');
      return;
    }
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      setError('请先在设置中配置API');
      return;
    }

    setIsGenerating(true);
    setError('');

    let selectedCharObj;
    if (selectedCharId) {
      const contact = contacts.find(c => c.id === selectedCharId);
      if (contact) {
        selectedCharObj = {
          id: contact.id,
          name: contact.name,
          personality: contact.personality || contact.bio
        };
      }
    }

    try {
      const initialState = await npcGameService.startNewGame(apiConfig, finalBg, userName, gender, userPersona, selectedCharObj);
      onGameStart(initialState);
    } catch (err: any) {
      setError(err.message || '生成游戏失败');
      setIsGenerating(false);
      setGeneratingPresetIdx(null);
    }
  };

  const handlePresetClick = async (preset: {name: string, description: string}, index: number) => {
    if (isGenerating) return;
    setBackground(preset.description);
    setGeneratingPresetIdx(index);
    handleStart(preset.description);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-[90vw] max-w-[400px] flex flex-col p-0"
        style={{ borderRadius: '6px' }}
      >
        {/* 顶部左右扁平夹子 */}
        <div
          className="absolute z-20 bg-stone-300 dark:bg-stone-600"
          style={{
            top: '-8px',
            left: '28px',
            width: '32px',
            height: '14px',
            borderRadius: '3px 3px 0 0',
            clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
          }}
        />
        <div
          className="absolute z-20 bg-stone-300 dark:bg-stone-600"
          style={{
            top: '-8px',
            right: '28px',
            width: '32px',
            height: '14px',
            borderRadius: '3px 3px 0 0',
            clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
          }}
        />

        {/* 档案单背景 */}
        <div
          className="rounded-md flex flex-col"
          style={{
            background: 'var(--dossier-bg, #faf8f5)',
            boxShadow: 'none',
            border: 'none',
          }}
        >
          {/* 用 CSS 变量支持深色模式 */}
          <style>{`
            .dark [style*="--dossier-bg"] {
              --dossier-bg: #2a2a2e !important;
            }
            :root {
              --dossier-bg: #faf8f5;
            }
          `}</style>

          {/* 可滚动内容区 */}
          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-5 flex flex-col gap-4" style={{ maxHeight: '70vh' }}>
            {/* 标题栏与关闭按钮 */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-wide">
                设定你的角色 (被攻略的NPC)
              </span>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full transition-colors"
                disabled={isGenerating}
              >
                <X size={18} />
              </button>
            </div>

            {/* 性别选择器 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">你的性别</label>
              <div className="flex gap-2">
                {['男', '女', '其他'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    disabled={isGenerating}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border-none ${
                      gender === g
                        ? 'bg-gray-700 dark:bg-gray-400 text-white dark:text-gray-900'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-sm rounded-lg font-medium">
                {error}
              </div>
            )}

            {/* 选择攻略者 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">选择攻略者 (可选)</label>
              <select
                value={selectedCharId}
                onChange={(e) => setSelectedCharId(e.target.value)}
                className="w-full bg-white/60 dark:bg-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 outline-none transition-colors appearance-none border border-gray-200 dark:border-gray-600"
                disabled={isGenerating}
              >
                <option value="">-- 由AI随机生成 --</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 你的名字 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">你的名字 (NPC角色)</label>
              <input
                type="text"
                placeholder="例如：路人甲、李雷..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-white/60 dark:bg-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 outline-none transition-colors border border-gray-200 dark:border-gray-600"
                disabled={isGenerating}
              />
            </div>

            {/* 世界背景 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">世界背景</label>
                <button
                  onClick={() => setIsCustomBg(!isCustomBg)}
                  className="text-xs text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  disabled={isGenerating}
                >
                  {isCustomBg ? '选择预设' : '自定义背景'}
                </button>
              </div>

              {isCustomBg ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    placeholder="描述你想要的世界观背景..."
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="w-full h-24 bg-white/60 dark:bg-gray-700/60 rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 outline-none transition-colors resize-none border border-gray-200 dark:border-gray-600"
                    disabled={isGenerating}
                  />
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">你的NPC人设 (可选)</label>
                  <textarea
                    placeholder="例如：性格胆小、普通职员、相貌平平..."
                    value={userPersona}
                    onChange={(e) => setUserPersona(e.target.value)}
                    className="w-full h-16 bg-white/60 dark:bg-gray-700/60 rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 outline-none transition-colors resize-none border border-gray-200 dark:border-gray-600"
                    disabled={isGenerating}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-0">
                  {isLoadingPresets ? (
                    <div className="flex flex-col">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 border-b border-dashed border-gray-300 dark:border-gray-600 animate-pulse bg-gray-100/50 dark:bg-gray-700/30" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {presets.map((preset, index) => (
                        <div
                          key={index}
                          onClick={() => handlePresetClick(preset, index)}
                          className={`flex items-center justify-between px-3 py-3 cursor-pointer transition-all group ${
                            index < presets.length - 1 ? 'border-b border-dashed border-gray-300 dark:border-gray-600' : ''
                          } ${
                            isGenerating && generatingPresetIdx === index
                              ? 'bg-gray-100 dark:bg-gray-700/50'
                              : 'hover:bg-gray-100/60 dark:hover:bg-gray-700/30'
                          } ${isGenerating ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0 mr-3">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                              {preset.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {preset.description}
                            </span>
                          </div>
                          <div className="shrink-0 flex items-center">
                            {isGenerating && generatingPresetIdx === index ? (
                              <Loader2 className="animate-spin w-4 h-4 text-gray-400 dark:text-gray-500" />
                            ) : (
                              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{presetNotice}</span>
                    <button
                      onClick={loadPresets}
                      disabled={isLoadingPresets || isGenerating}
                      className="flex items-center gap-1 text-xs px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={isLoadingPresets ? 'animate-spin' : ''} />
                      换一批
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 自定义背景模式下的底部按钮 */}
            {isCustomBg && (
              <div className="mt-2 shrink-0">
                <button
                  onClick={() => handleStart()}
                  disabled={isGenerating}
                  className={`w-full py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-all border-none ${
                    isGenerating
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:scale-[0.98] active:scale-95 font-semibold'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span>正在生成世界观...</span>
                    </>
                  ) : (
                    '开始游戏'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
