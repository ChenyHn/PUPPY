import { NPCGameState, GameEvent, PresetOption } from '../types/npcGame';
import { ApiConfig } from '../types';

const STORAGE_KEY = 'npc_game_state';
const SAVES_KEY = 'npc_game_saves';

export interface NPCGameSaveSlot {
  id: string;
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

  saveToSlot(state: NPCGameState) {
    try {
      const saves = this.getAllSaves();
      const newSave: NPCGameSaveSlot = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        state: JSON.parse(JSON.stringify(state)), // 深拷贝
      };
      saves.unshift(newSave);
      // 限制最多 5 个存档
      if (saves.length > 5) saves.length = 5;
      localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
    } catch (e) {
      console.error('Failed to save NPC game to slot:', e);
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

  async callAI(apiConfig: ApiConfig, prompt: string, isJson: boolean = true): Promise<any> {
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
      temperature: 0.7,
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

    const prompt = `你是一个恋爱游戏设定生成器。在游戏中，AI角色是“攻略者（玩家）”，而用户扮演的是“路人NPC”。
根据用户提供的背景、人设和主角名字，生成攻略者的设定，并设计符合该背景的自定义数值（如信任度、警惕值等）。
    背景: "${background}"
    用户扮演的NPC名字: "${userName}"
    用户扮演的NPC性别: "${gender}"
    NPC人设/身份: "${userPersona || '普通路人'}"${charContext}
    
    请返回严格的JSON格式：
    {
      "charName": "攻略者名字",
      "personality": "简短的性格描述",
      "goal": "他/她为什么想要攻略玩家，具体的目的",
      "strategy": "他/她当前的攻略策略是什么",
      "statsSchema": [
        { "name": "自定义数值名称1（如：信任度）", "initialValue": 0 },
        { "name": "自定义数值名称2（如：警觉度）", "initialValue": 0 }
      ],
      "initialEvent": {
        "description": "玩家正在做什么（一小段描述，仅限玩家自己的行动，不要有Char出现）",
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

  async generateNextEvent(apiConfig: ApiConfig, state: NPCGameState, userAction?: string, userReactionText?: string, customInput?: string): Promise<GameEvent> {
    const historySummary = state.eventHistory.slice(-5).join('; ');
    const customStatsStr = state.statsSchema ? state.statsSchema.map(s => `${s.name}: ${(state.user.customStats || {})[s.name] || 0}`).join(', ') : '';
    
    let prompt = `你是一个恋爱冒险游戏的编剧。特别注意身份反转：AI是带有“玩家”心态的【攻略者】“${state.char.name}”（性格：${state.char.personality}，目标：${state.char.goal}），而用户扮演的是不知情的【路人NPC】“${state.user.name}”。
背景设定：${state.background}
当前事件类型：${state.lastEventType}
当前好感度：${state.user.affection}/100，当前黑化值：${state.user.darkening}/100。
自定义数值：${customStatsStr}
近期历史事件：${historySummary || '无'}。`;

    if (customInput) {
      prompt += `\n用户进行了自定义行动：“${customInput}”。请根据当前状态，生成接下来的事件。如果用户是在日常行动中推进剧情，可以决定是否触发与攻略者的【互动事件】（interaction）或者继续【日常事件】（daily）。如果是互动事件，请给出因用户行动导致的数值变化（好感度、黑化值等）。`;
    } else if (userAction) {
      prompt += `\n现在，路人NPC刚刚进行了日常行动：“${userAction}”。请决定接下来是继续【日常事件】还是触发【互动事件】。`;
    } else if (userReactionText) {
      prompt += `\n在之前的互动中，路人NPC对攻略者的反应是：“${userReactionText}”。请决定接下来是继续【互动事件】还是结束互动回到【日常事件】。`;
    }

    prompt += `
你必须根据剧情合理决定返回的新事件类型（type），并在JSON中指明："type": "daily" 或 "type": "interaction"。

如果决定生成【互动事件】（interaction）：
请描述攻略者观察到了路人NPC的行为并采取了行动。必须区分旁白、攻略者的对话、内心思考。
返回格式示例：
{
  "type": "interaction",
  "description": "旁白描述当前场景和环境",
  "charAction": "攻略者的具体行动和对话内容",
  "charThought": "攻略者的内心思考（体现出玩家心态）",
  ${customInput ? `"result": { "affectionDelta": 整数, "darkeningDelta": 整数 },` : ''}
  "choices": [
    { "text": "反应选项1", "affectionDelta": 整数, "darkeningDelta": 整数 }
  ]
}

如果决定生成【日常事件】（daily）：
请描述路人NPC独自一人的日常行动（攻略者不出现）。
返回格式示例：
{
  "type": "daily",
  "description": "路人NPC当前的日常情景旁白描述",
  "dailyChoices": ["去图书馆", "去吃饭", "随便走走"]
}

注意：无论如何，都必须返回严格的JSON格式！`;

    const aiResponse = await this.callAI(apiConfig, prompt, true);
    
    const newEvent: GameEvent = {
      id: Date.now().toString(),
      type: aiResponse.type === 'interaction' ? 'interaction' : 'daily',
      description: aiResponse.description || aiResponse.narration || '发生了一些事情...',
      charAction: aiResponse.charAction || aiResponse.charDialogue,
      charThought: aiResponse.charThought,
      choices: aiResponse.choices,
      dailyChoices: aiResponse.dailyChoices || ['随便走走', '发呆', '回家'],
      result: aiResponse.result, // 从自定义输入的直接结果中获取数值变化
    };

    return newEvent;
  },
  
  async useSpecialReset(apiConfig: ApiConfig, state: NPCGameState): Promise<GameEvent> {
    const prompt = `你是一个恋爱冒险游戏的编剧。这是攻略者“${state.char.name}”使用了【攻略道具/氪金改命】。
背景设定：${state.background}
当前好感度：${state.user.affection}/100，当前黑化值：${state.user.darkening}/100。

请生成一个极其突兀、打破常规的【特殊互动事件】（例如突然强制壁咚、送极度贵重的礼物、直接表白等），这个事件会强行大幅改变好感度或黑化值。
请体现出攻略者作为“玩家”使用了道具作弊的感觉。
必须区分旁白、对话和内心思考。
必须返回严格的JSON格式：
{
  "type": "special",
  "description": "场景突变的描述",
  "charAction": "攻略者极其出格的行动/对话",
  "charThought": "攻略者的内心思考（例如：用了这个SR级别道具，好感度总该满了吧！）",
  "choices": [
    { "text": "顺从/接受", "affectionDelta": 20, "darkeningDelta": -5 },
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

  async generatePresetOptions(apiConfig: ApiConfig, state: NPCGameState, eventType: 'daily' | 'interaction' = 'interaction'): Promise<PresetOption[]> {
    const customStatsStr = state.statsSchema ? state.statsSchema.map(s => `${s.name}: ${(state.user.customStats || {})[s.name] || 0}`).join(', ') : '';
    const historySummary = state.eventHistory.slice(-3).join('; ');

    const prompt = `你是一个恋爱冒险游戏的选项生成器。
当前游戏背景：${state.background}
用户角色（NPC）：${state.user.name}
攻略者（Char）：${state.char.name}，性格：${state.char.personality}
当前好感度：${state.user.affection}/100
当前黑化值：${state.user.darkening}/100
自定义数值：${customStatsStr}
近期事件：${historySummary || '无'}
当前事件类型：${eventType === 'daily' ? '日常事件（daily）' : '互动事件（interaction）'}

请根据当前事件类型生成 3 个可能的用户行动或反应选项。
- 如果事件类型是“互动事件（interaction）”，每个选项需要包含文字和好感度变化值（-10~10）。体现不同态度（如积极、消极、中立）。
- 如果事件类型是“日常事件（daily）”，每个选项只需要文字，好感度变化值统一为 0（日常行为不影响好感度）。

返回 JSON 数组，格式：[{"text": "选项文字", "affectionDelta": 数字}]（日常时 affectionDelta 始终为 0）
只返回 JSON 数组，不要有其他文字。`;

    try {
      const response = await this.callAI(apiConfig, prompt, true);
      if (Array.isArray(response) && response.length > 0) {
        return response.slice(0, 3).map((item: any) => ({
          text: item.text || '未知选项',
          affectionDelta: eventType === 'daily' ? 0 : (typeof item.affectionDelta === 'number' ? Math.max(-10, Math.min(10, item.affectionDelta)) : 0),
        }));
      }
      // If response is an object with an array property
      const arr = response.options || response.choices || response.reactions;
      if (Array.isArray(arr)) {
        return arr.slice(0, 3).map((item: any) => ({
          text: item.text || '未知选项',
          affectionDelta: eventType === 'daily' ? 0 : (typeof item.affectionDelta === 'number' ? Math.max(-10, Math.min(10, item.affectionDelta)) : 0),
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
    玩家NPC：“${state.user.name}”
    攻略者：“${state.char.name}”
    最终好感度：${state.user.affection}/100
    最终黑化值：${state.user.darkening}/100
    背景：${state.background}
    历史事件摘要：${state.eventHistory.slice(-10).join('; ')}
    
    请根据最终的好感度和黑化值，生成一段结局文本（300字左右）。
    如果好感度极高，则是完美攻略结局。
    如果黑化值极高，则是病娇/囚禁结局。
    如果是其他情况结束，则生成平淡或者令人遗憾的结局。
    请直接返回结局文本内容。`;

    return await this.callAI(apiConfig, prompt, false);
  }
};
