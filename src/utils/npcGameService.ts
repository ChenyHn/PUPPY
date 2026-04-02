import { NPCGameState, GameEvent, PresetOption } from '../types/npcGame';
import { ApiConfig } from '../types';

const STORAGE_KEY = 'npc_game_state';
const SAVES_KEY = 'npc_game_saves';

export interface NPCGameSaveSlot {
  id: string;
  name: string;
  timestamp: number;
  state: NPCGameState;
}

function normalizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  if (url.endsWith('/chat/completions')) url = url.replace(/\/chat\/completions$/, '');
  return url;
}

export const npcGameService = {
  loadGame(): NPCGameState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load NPC game state:', e);
      return null;
    }
  },

  hasCurrentGame(): boolean {
    const current = this.loadGame();
    return current !== null && !current.isGameOver;
  },

  saveGame(state: NPCGameState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save NPC game state:', e);
    }
  },

  clearGame() {
    localStorage.removeItem(STORAGE_KEY);
  },

  getAllSaves(): NPCGameSaveSlot[] {
    try {
      const data = localStorage.getItem(SAVES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load NPC game saves:', e);
      return [];
    }
  },

  /** 生成下一个自动存档名称，如"存档1""存档2" */
  getNextAutoSaveName(): string {
    const saves = this.getAllSaves();
    let maxNum = 0;
    for (const save of saves) {
      const match = save.name?.match(/^存档(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `存档${maxNum + 1}`;
  },

  /** 旧的 saveToSlot，保持向后兼容（自动命名） */
  saveToSlot(state: NPCGameState) {
    const name = this.getNextAutoSaveName();
    this.saveAsNewSlot(state, name);
  },

  /** 另存为新存档 */
  saveAsNewSlot(state: NPCGameState, name: string): string {
    try {
      const saves = this.getAllSaves();
      const finalName = name.trim() || this.getNextAutoSaveName();
      const newId = Date.now().toString();
      const newSave: NPCGameSaveSlot = {
        id: newId,
        name: finalName,
        timestamp: Date.now(),
        state: JSON.parse(JSON.stringify(state)), // 深拷贝
      };
      saves.unshift(newSave);
      // 限制最多 10 个存档
      if (saves.length > 10) saves.length = 10;
      localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
      return newId;
    } catch (e) {
      console.error('Failed to save NPC game to new slot:', e);
      return '';
    }
  },

  /** 覆盖已有存档（保留原 ID，更新名称、时间和状态） */
  overwriteSaveSlot(id: string, state: NPCGameState, name: string) {
    try {
      const saves = this.getAllSaves();
      const idx = saves.findIndex(s => s.id === id);
      if (idx !== -1) {
        saves[idx] = {
          ...saves[idx],
          name: name.trim() || saves[idx].name,
          timestamp: Date.now(),
          state: JSON.parse(JSON.stringify(state)),
        };
        localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
      } else {
        // 如果找不到对应存档，则另存为新存档
        this.saveAsNewSlot(state, name);
      }
    } catch (e) {
      console.error('Failed to overwrite NPC game save slot:', e);
    }
  },

  loadFromSlot(id: string): NPCGameState | null {
    const saves = this.getAllSaves();
    const save = saves.find(s => s.id === id);
    if (save) {
      this.saveGame(save.state); // 覆盖当前游戏
      return save.state;
    }
    return null;
  },

  deleteSaveSlot(id: string) {
    try {
      let saves = this.getAllSaves();
      saves = saves.filter(s => s.id !== id);
      localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
    } catch (e) {
      console.error('Failed to delete NPC game save:', e);
    }
  },

  async callAI(apiConfig: ApiConfig, prompt: string, isJson: boolean = true, temperature: number = 0.7): Promise<any> {
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      throw new Error('API not configured');
    }

    const url = `${normalizeBaseUrl(apiConfig.baseUrl)}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiConfig.apiKey}`
    };

    const body: any = {
      model: apiConfig.selectedModel || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 2000,
      stream: false,
    };

    if (isJson) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.message || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from AI');
    }

    if (isJson) {
      try {
        let jsonStr = content;
        const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) jsonStr = match[0];
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error('Failed to parse AI response as JSON:', content);
        throw new Error('Invalid JSON format from AI');
      }
    }

    return content;
  },

  async generatePresetBackgrounds(apiConfig: ApiConfig): Promise<{name: string, description: string}[]> {
    // 增加随机种子提示，确保每次生成的预设不同
    const randomSeed = Math.floor(Math.random() * 10000);
    const prompt = `生成 3 个不同风格的预设世界观（随机种子：${randomSeed}），涵盖校园、职场、古风、日常等。明确不要全是奇幻/科幻，需要更丰富的生活化题材。每个世界观包含 name 和 description。必须严格返回包含 3 个元素的 JSON 数组，格式为：
[
  { "name": "校园日常", "description": "平凡的高中生活，你是一个普通的学生，新学期开学第一天发生了一些小事。" },
  ...
]
只返回 JSON 数组，不要有其他文字。`;

    try {
      // 在 generatePresetBackgrounds 中传入一个带有时间戳的 prompt 或随机参数，防止缓存，这里已经加了 randomSeed
      const response = await this.callAI(apiConfig, prompt, true);
      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
      throw new Error('Invalid format');
    } catch (e) {
      console.error('Failed to parse AI preset response:', e);
      throw new Error('PARSE_FAILED');
    }
  },

  async startNewGame(apiConfig: ApiConfig, background: string, userName: string, gender: string, userPersona?: string, selectedChar?: { id: string, name: string, personality?: string }): Promise<NPCGameState> {
    let charContext = '';
    if (selectedChar) {
      charContext = `
    已选定攻略者基础信息：
    名字: "${selectedChar.name}"
    基础性格: "${selectedChar.personality || '未知'}"
    请基于上述基础信息，结合背景生成更详细的攻略者设定。`;
    }

    const prompt = `你是一个恋爱游戏设定生成器。在游戏中，AI角色是“攻略者（玩家扮演的角色Char）”，而用户扮演的是“被攻略的NPC（User）”。
根据用户提供的背景、人设和NPC名字，生成攻略者(Char)的设定，并设计符合该背景的自定义剧本数值（如信任度、警惕值等，用于衡量User的状态）。
    背景: "${background}"
    用户扮演的NPC(User)名字: "${userName}"
    用户扮演的NPC(User)性别: "${gender}"
    NPC(User)人设/身份: "${userPersona || '普通路人'}"${charContext}
    
    请返回严格的JSON格式：
    {
      "charName": "攻略者(Char)名字",
      "personality": "简短的性格描述",
      "goal": "他/她为什么想要攻略NPC(User)，具体的目的",
      "strategy": "他/她当前的攻略策略是什么",
      "statsSchema": [
        { "name": "自定义数值名称1（如：信任度）", "initialValue": 0 },
        { "name": "自定义数值名称2（如：警觉度）", "initialValue": 0 }
      ],
      "initialEvent": {
        "description": "NPC(User)正在做什么（使用第三人称旁白描述场景和User自己的行动，例如：'李雷正在教室里看书...'，此时Char尚未出现）",
        "choices": ["日常选项1", "日常选项2", "日常选项3"]
      }
    }`;

    const data = await this.callAI(apiConfig, prompt, true);

    const initialCustomStats: Record<string, number> = {};
    const statsSchema = data.statsSchema || [];
    statsSchema.forEach((stat: any) => {
      initialCustomStats[stat.name] = stat.initialValue || 0;
    });

    const initialState: NPCGameState = {
      gameId: Date.now().toString(),
      background,
      createdAt: new Date().toISOString(),
      user: {
        name: userName,
        gender: gender,
        affection: 0,
        darkening: 0,
        customStats: initialCustomStats,
      },
      statsSchema: statsSchema,
      char: {
        id: selectedChar?.id || `char_${Date.now()}`,
        name: selectedChar?.name || data.charName || '神秘人',
        personality: data.personality || selectedChar?.personality || '捉摸不透',
        goal: data.goal || '未知目的',
        strategy: data.strategy || '随机应变',
        remainingResets: 3,
      },
      eventHistory: [],
      lastEventType: 'daily',
      turnCount: 0,
      isGameOver: false,
    };

    this.saveGame(initialState);
    return initialState;
  },

  /**
   * 当 AI 未返回 dailyChoices 时，基于旁白内容生成更贴切的兜底选项
   */
  getFallbackDailyChoices(narration: string): string[] {
    // 根据旁白关键词推断场景，返回场景相关的选项
    const n = narration.toLowerCase();
    if (n.includes('教室') || n.includes('课') || n.includes('看书') || n.includes('学习')) {
      return ['继续看书', '和同桌聊天', '去走廊透透气'];
    }
    if (n.includes('走廊') || n.includes('楼道')) {
      return ['在走廊散步', '靠着窗户发呆', '回教室'];
    }
    if (n.includes('食堂') || n.includes('吃') || n.includes('午饭') || n.includes('餐')) {
      return ['找个位置吃饭', '去买杯饮料', '看看周围有没有认识的人'];
    }
    if (n.includes('操场') || n.includes('跑步') || n.includes('运动')) {
      return ['跑两圈', '坐在看台上休息', '去小卖部买水'];
    }
    if (n.includes('办公') || n.includes('工作') || n.includes('公司') || n.includes('电脑')) {
      return ['继续工作', '去茶水间倒杯水', '刷一会儿手机'];
    }
    if (n.includes('家') || n.includes('房间') || n.includes('卧室') || n.includes('客厅')) {
      return ['躺一会儿', '刷手机', '出门走走'];
    }
    if (n.includes('街') || n.includes('路') || n.includes('外面') || n.includes('逛')) {
      return ['继续走走', '进旁边的店看看', '找个地方坐下来'];
    }
    // 默认兜底
    return ['四处看看', '继续待着', '换个地方'];
  },

  /**
   * 从最近的事件列表中构建对话历史摘要，供 AI 参考上下文
   */
  buildConversationHistory(recentEvents: GameEvent[], userName: string, charName: string): string {
    if (!recentEvents || recentEvents.length === 0) return '';
    
    const lines: string[] = [];
    // 只取最近3条事件
    const eventsToUse = recentEvents.slice(-3);
    
    for (const evt of eventsToUse) {
      if (evt.userDialogue) {
        lines.push(`${userName}：「${evt.userDialogue}」`);
      }
      if (evt.description) {
        // 旁白截取前60字避免过长
        const shortNarration = evt.description.length > 60 ? evt.description.substring(0, 60) + '...' : evt.description;
        lines.push(`（旁白：${shortNarration}）`);
      }
      if (evt.charAction) {
        lines.push(`${charName}：「${evt.charAction}」`);
      }
    }
    
    return lines.join('\n');
  },

  async generateNextEvent(apiConfig: ApiConfig, state: NPCGameState, userAction?: string, userReactionText?: string, customInput?: string, recentEvents?: GameEvent[]): Promise<GameEvent> {
    const customStatsStr = state.statsSchema ? state.statsSchema.map(s => `${s.name}: ${(state.user.customStats || {})[s.name] || 0}`).join(', ') : '';
    
    // 构建丰富的对话历史
    const conversationHistory = this.buildConversationHistory(
      recentEvents || [], 
      state.user.name, 
      state.char.name
    );
    
    // 提取上一条事件中Char说的最后一句话，用于强制上下文关联
    let lastCharDialogue = '';
    let lastUserDialogue = '';
    if (recentEvents && recentEvents.length > 0) {
      const lastEvt = recentEvents[recentEvents.length - 1];
      lastCharDialogue = lastEvt.charAction || '';
      lastUserDialogue = lastEvt.userDialogue || '';
    }

    // 确定用户本轮的行动描述（用于prompt）
    const userCurrentAction = customInput || userAction || userReactionText || '';
    
    let prompt = `你是一位擅长写互动叙事游戏的编剧。请根据以下游戏状态和对话历史，生成下一个事件。

【⚠️ 对话连贯性要求 - 最高优先级】
- 你必须严格基于下面的"最近对话历史"来生成本轮内容，确保回复自然衔接，绝对不能跳话题。
- 如果 Char 上一句说了某个话题（比如"早啊"），本轮的旁白和对话必须围绕这个话题展开，不能突然切换到无关内容。
- User 的 userDialogue 必须是对上一轮内容的直接回应。例如 Char 说"早啊"，User 应回应"早""嗯，早上好"等，不能聊别的。
- 如果用户指定了行动（见下方"用户本轮行动"），则 userDialogue 必须围绕该行动展开，但仍要与上下文衔接。
${lastCharDialogue ? `- 上一轮 Char 说的最后一句话是：「${lastCharDialogue}」，本轮必须与此衔接。` : ''}
${lastUserDialogue ? `- 上一轮 User 说/做的是：「${lastUserDialogue}」` : ''}

【最近对话历史】
${conversationHistory || '（这是第一轮事件，没有历史对话）'}

【角色性格一致性要求】
- Char（${state.char.name}）的性格是：${state.char.personality}。所有对话必须严格符合此性格。
- 内向的人说话简短、犹豫，用"嗯…""那个…"；外向的人热情直接；傲娇的人嘴硬心软。
- User（${state.user.name}）是普通人，说话要自然口语化，像真实的人一样回应。
- 禁止使用书面化、文学化的表达。要像日常微信聊天一样自然。
- 鼓励使用"嗯…""啊""哦""诶""哈哈"等口语词汇和语气词。

【情感表达要求】
- Char 的对话中要自然带有情绪表达，用括号标注微表情/动作，如"（微笑着）早啊""（有点紧张地）那个…"
- 旁白要简洁有力，重点描述动作、表情和环境氛围，控制在1-2句话内，不要长篇大论。

【好感度感知规则】
- 好感度数值只在用户选择反应选项时变化，你生成的事件 JSON 的 result 中不要包含 affectionDelta。
- 在 Char 的对话或内心思考中，根据当前好感度（${state.user.affection}）自然地体现 Char 对 User 态度的感知。
- 不要出现"好感度+1"这种机械提示。

当前状态：
- 背景：${state.background}
- User（被攻略者）：名字"${state.user.name}"，性别"${state.user.gender || '未知'}"
- Char（攻略者）：名字"${state.char.name}"，性格"${state.char.personality}"，目标"${state.char.goal}"，当前策略"${state.char.strategy}"
- 当前好感度：${state.user.affection}/100，当前黑化值：${state.user.darkening}/100
- 额外数值：${customStatsStr || '无'}
- 当前回合数：${state.turnCount}
- 当前事件类型：${state.lastEventType}
${userCurrentAction ? `- 用户本轮行动/选择：「${userCurrentAction}」` : '- 用户本轮行动：（无，这是新场景的开始）'}

请生成下一轮事件。剧情中 Char 会主动采取行动，试图增加 User 对 Char 的好感度。

【读档机制（由Char触发）】
当上一轮 User 做出了减好感度的选择，或者当前情况极其不利时，Char 有概率触发"读档"（时光倒流，换个策略重来）。
读档概率取决于 Char 的性格：
- 执着型/完美主义：减好感就高概率（70%+）读档。
- 理性型：连续受挫或大幅减分才触发（50%）。
- 自尊型/傲娇：极低概率（20%）。
- 随性型/佛系：基本不读档（5%）。
如果触发读档，设置 shouldReload: true 并在 reloadReason 简述原因。

请返回严格的 JSON 格式：
{
  "type": "interaction 或 daily",
  "narration": "简洁的旁白（第三人称，1-2句，含动作和环境细节）",
  "userDialogue": "User 说的话（必填！不能为空！要直接回应上一轮对话或本轮行动，口语化，自然）",
  "charDialogue": "Char 说的话（带情绪括号标注，如'（笑着）早啊'，口语化，符合性格。daily事件中Char未出现时可为空字符串）",
  "charThought": "Char 内心想法（第一人称，口语化，含策略思考。daily事件可为空字符串）",
  "shouldReload": false,
  "reloadReason": "",
  ${customInput ? `"result": { "darkeningDelta": 0 },` : ''}
  "choices": [
    { "text": "选项1（必须直接回应本轮charDialogue的内容）", "affectionDelta": 0, "darkeningDelta": 0 },
    { "text": "选项2（必须直接回应本轮charDialogue的内容）", "affectionDelta": 0, "darkeningDelta": 0 },
    { "text": "选项3（必须直接回应本轮charDialogue的内容）", "affectionDelta": 0, "darkeningDelta": 0 }
  ],
  "dailyChoices": ["基于当前场景的日常行动1", "基于当前场景的日常行动2", "基于当前场景的日常行动3"]
}

【⚠️ 关键要求 - 务必遵守】
1. userDialogue 字段【必须有内容】，不能为空字符串或省略。即使是第一轮也要写 User 当前的状态/自言自语。
2. 所有文本不要过于冗长，对话每句控制在15字以内，旁白控制在30字以内。
3. 禁止使用"用户""玩家"等 meta 词汇，用角色名或"我"。
4. 对话要像真实朋友/恋人之间的交流，有温度、有个性。
5. 日常事件不需要 choices 但需要 dailyChoices（3个），shouldReload 始终 false。
6. 互动事件需要 choices（3个），每个给出 affectionDelta（-5~5）和 darkeningDelta。
7. 【choices 上下文约束】互动事件的 choices 必须是对本轮 charDialogue 的直接回应，不能出现与对话无关的行动。例如 Char 说"早啊"，choices 应是"嗯，早""不想理你""今天心情不错，早上好"，绝不能是"发呆""随便走走"。
8. 【dailyChoices 上下文约束】日常事件的 dailyChoices 必须基于本轮 narration 描述的具体场景，不能是万能通用选项。例如旁白说"在教室里看书"，dailyChoices 应是"继续看书""去走廊透透气""和同桌聊天"，而不是通用的"发呆""随便走走"。`;

    if (customInput) {
      prompt += `\n\n【用户自定义行动】User 刚刚做了："${customInput}"。\n请基于此行动和上面的对话历史，生成自然衔接的下一个事件。userDialogue 应体现此行动的具体表现（比如用户输入"打招呼"，userDialogue 可以是"（挥了挥手）嗨，早上好啊"）。`;
    } else if (userAction) {
      prompt += `\n\n【用户日常行动】User 选择了日常行动："${userAction}"。\n请生成此行动的场景，并决定是继续日常事件还是触发互动事件。userDialogue 应该体现 User 正在做这个行动时会说的话或自言自语。`;
    } else if (userReactionText) {
      prompt += `\n\n【用户互动反应】User 对 Char 的反应是："${userReactionText}"。\n请基于此反应和对话历史，生成自然衔接的下一个事件。userDialogue 必须直接体现这个反应。`;
    }

    // 使用较低的 temperature 以提高连贯性
    const aiResponse = await this.callAI(apiConfig, prompt, true, 0.6);
    
    // 确保 userDialogue 始终有值
    let finalUserDialogue = customInput || aiResponse.userDialogue || '';
    if (!finalUserDialogue && userAction) {
      finalUserDialogue = userAction;
    }
    if (!finalUserDialogue && userReactionText) {
      finalUserDialogue = userReactionText;
    }
    // 最终兜底
    if (!finalUserDialogue) {
      finalUserDialogue = '……';
    }

    const newEvent: GameEvent = {
      id: Date.now().toString(),
      type: aiResponse.type === 'interaction' ? 'interaction' : (aiResponse.type === 'daily' ? 'daily' : state.lastEventType),
      description: aiResponse.narration || aiResponse.description || '发生了一些事情...',
      userDialogue: finalUserDialogue,
      charAction: aiResponse.charDialogue || aiResponse.charAction || '',
      charThought: aiResponse.charThought || '',
      choices: aiResponse.choices,
      dailyChoices: aiResponse.dailyChoices || this.getFallbackDailyChoices(aiResponse.narration || aiResponse.description || ''),
      result: aiResponse.result,
      shouldReload: aiResponse.shouldReload,
      reloadReason: aiResponse.reloadReason,
    };

    return newEvent;
  },
  
  async useSpecialReset(apiConfig: ApiConfig, state: NPCGameState): Promise<GameEvent> {
    const prompt = `你是一个恋爱冒险游戏的编剧。这是攻略者(Char)“${state.char.name}”使用了【攻略道具/氪金改命】来攻略 User(被攻略的NPC)“${state.user.name}”。
背景设定：${state.background}
User当前对Char的好感度：${state.user.affection}/100，当前黑化值：${state.user.darkening}/100。

请生成一个极其突兀、打破常规的【特殊互动事件】（例如突然强制壁咚、送极度贵重的礼物、直接表白等），试图强行大幅改变User对Char的好感度。
请体现出攻略者作为“玩家”使用了道具作弊的感觉。
必须区分旁白、对话和内心思考。
必须返回严格的JSON格式：
{
  "type": "special",
  "description": "场景突变，旁白描述",
  "charAction": "Char极其出格的行动/对话",
  "charThought": "Char的内心思考（例如：用了这个SR级别道具，好感度总该满了吧！）",
  "choices": [
    { "text": "顺从/接受", "affectionDelta": 20, "darkeningDelta": -5 }, // 正值代表User对Char好感度增加
    { "text": "惊恐/逃跑", "affectionDelta": -5, "darkeningDelta": 20 }
  ]
}`;

    const aiResponse = await this.callAI(apiConfig, prompt, true);
    
    return {
      id: Date.now().toString(),
      type: 'special',
      description: aiResponse.description || aiResponse.narration || '空间突然发生扭曲...',
      charAction: aiResponse.charAction || aiResponse.charDialogue || '攻略者突然出现在你面前！',
      charThought: aiResponse.charThought,
      choices: aiResponse.choices || [
        { text: '愣住', affectionDelta: 10, darkeningDelta: 0 },
        { text: '推开', affectionDelta: 0, darkeningDelta: 10 }
      ],
    };
  },

  async generatePresetOptions(apiConfig: ApiConfig, state: NPCGameState, eventType: 'daily' | 'interaction' = 'interaction', recentEvents?: GameEvent[]): Promise<PresetOption[]> {
    const customStatsStr = state.statsSchema ? state.statsSchema.map(s => `${s.name}: ${(state.user.customStats || {})[s.name] || 0}`).join(', ') : '';
    
    // 构建对话历史用于生成更贴切的选项
    const conversationHistory = this.buildConversationHistory(
      recentEvents || [],
      state.user.name,
      state.char.name
    );
    
    // 提取最近一条事件中 Char 和 User 的对话，用于强制上下文关联
    let lastCharDialogue = '';
    let lastUserDialogue = '';
    let lastNarration = '';
    if (recentEvents && recentEvents.length > 0) {
      const lastEvt = recentEvents[recentEvents.length - 1];
      lastCharDialogue = lastEvt.charAction || '';
      lastUserDialogue = lastEvt.userDialogue || '';
      lastNarration = lastEvt.description || '';
    }

    const prompt = `你是一个恋爱冒险游戏的选项生成器。你的任务是为 User 生成 3 个自然的回应选项。

【⚠️ 最高优先级：选项必须直接回应上一轮对话！】
${lastCharDialogue ? `上一轮 Char（${state.char.name}）说的话是：「${lastCharDialogue}」` : ''}
${lastUserDialogue ? `上一轮 User（${state.user.name}）说/做的是：「${lastUserDialogue}」` : ''}
${lastNarration ? `上一轮场景旁白：「${lastNarration}」` : ''}

请为 User 生成 3 个自然回应的选项（第一人称视角），每个选项是 User 可能会说的话或做的反应，并且每个选项附带好感度变化值（-5~5）。
选项必须围绕 Char 的话题展开，不要偏离主题。

【具体约束】
- 如果 Char 说了一句话（如"早啊"），选项必须是对这句话的直接回应（如"早啊""嗯，早""今天天气不错"），而绝对不能是"发呆""随便走走""做点正事"这类与对话无关的行动。
- 如果当前是日常场景（Char 未出现），选项应该是 User 在当前场景下会做的自然行动。
- 选项要口语化、自然，像真实的人的反应，不要书面化。
- 3 个选项应体现不同的态度倾向：一个积极/友好（正好感度），一个消极/冷淡（负好感度），一个中立/普通（0好感度）。

【游戏上下文】
背景：${state.background}
User（被攻略者）：${state.user.name}
Char（攻略者）：${state.char.name}，性格：${state.char.personality}
当前好感度：${state.user.affection}/100
事件类型：${eventType === 'daily' ? '日常事件（Char未出现，选项是User的日常行动）' : '互动事件（Char在场，选项是User对Char的回应）'}

【最近对话历史（供参考）】
${conversationHistory || '（暂无历史对话）'}

【返回格式】
${eventType === 'daily' 
  ? '日常事件：选项是 User 在当前场景下的自然行动，affectionDelta 统一为 0。' 
  : '互动事件：选项需包含好感度变化值（-5~5），体现 User 对 Char 不同态度。'}
返回 JSON 数组：[{"text": "选项文字", "affectionDelta": 数字}]
只返回 JSON 数组，不要有其他文字。`;

    try {
      const response = await this.callAI(apiConfig, prompt, true);
      if (Array.isArray(response) && response.length > 0) {
        return response.slice(0, 3).map((item: any) => ({
          text: item.text || '未知选项',
          affectionDelta: eventType === 'daily' ? 0 : (typeof item.affectionDelta === 'number' ? Math.max(-5, Math.min(5, item.affectionDelta)) : 0),
        }));
      }
      // If response is an object with an array property
      const arr = response.options || response.choices || response.reactions;
      if (Array.isArray(arr)) {
        return arr.slice(0, 3).map((item: any) => ({
          text: item.text || '未知选项',
          affectionDelta: eventType === 'daily' ? 0 : (typeof item.affectionDelta === 'number' ? Math.max(-5, Math.min(5, item.affectionDelta)) : 0),
        }));
      }
      throw new Error('Invalid format');
    } catch (e) {
      console.error('Failed to generate preset options:', e);
      // 返回默认选项
      if (eventType === 'daily') {
        return [
          { text: '随便走走', affectionDelta: 0 },
          { text: '发呆', affectionDelta: 0 },
          { text: '做点正事', affectionDelta: 0 },
        ];
      }
      return [
        { text: '友好回应', affectionDelta: 3 },
        { text: '保持距离', affectionDelta: -1 },
        { text: '无视', affectionDelta: 0 },
      ];
    }
  },

  async generateEnding(apiConfig: ApiConfig, state: NPCGameState): Promise<string> {
    const prompt = `你是一个恋爱游戏编剧。游戏结束了。
    User（被攻略的NPC）：“${state.user.name}”
    Char（攻略者）：“${state.char.name}”
    User对Char的最终好感度：${state.user.affection}/100
    最终黑化值：${state.user.darkening}/100
    背景：${state.background}
    历史事件摘要：${state.eventHistory.slice(-10).join('; ')}
    
    请根据 User对Char的最终好感度 和 黑化值，生成一段结局文本（300字左右）。
    如果好感度极高，则是完美攻略结局（User爱上了Char）。
    如果黑化值极高，则是病娇/囚禁结局。
    如果是其他情况结束，则生成平淡或者令人遗憾的结局（Char攻略失败）。
    请直接返回结局文本内容。`;

    return await this.callAI(apiConfig, prompt, false);
  }
};
