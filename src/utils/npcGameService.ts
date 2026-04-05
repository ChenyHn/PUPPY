import { NPCGameState, GameEvent, PresetOption, StatSchema, AutoSavePoint, ArchiveMemoryEntry, AffectionMilestone, RewardOption } from '../types/npcGame';
import { ApiConfig } from '../types';

const STORAGE_KEY = 'npc_game_state';
const SAVES_KEY = 'npc_game_saves';

export interface NPCGameSaveSlot {
  id: string;
  name: string;
  timestamp: number;
  state: NPCGameState;
}

/**
 * 从流式输出文本中提取已出现的字段值（用于边生成边显示）
 * 支持标签格式（<narration>等）和 JSON 格式的双模式解析
 */
export function extractPartialEventFields(text: string): Record<string, string> {
  const result: Record<string, string> = {};

  // ── 优先尝试标签格式 ──
  const tagMapping: [string, string][] = [
    ['narration', 'narration'],
    ['char_thought', 'charThought'],
    ['char_dialogue', 'charDialogue'],
    ['options', 'options'],
    ['stats_delta', 'statsDelta'],
  ];

  let hasTagContent = false;
  for (const [tag, field] of tagMapping) {
    // 完整标签
    const completeMatch = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    if (completeMatch) {
      result[field] = completeMatch[1].trim();
      hasTagContent = true;
    } else {
      // 不完整标签（仍在流式输出中）
      const incompleteMatch = text.match(new RegExp(`<${tag}>([\\s\\S]*)$`));
      if (incompleteMatch && !incompleteMatch[1].includes(`</${tag}>`)) {
        result[field] = incompleteMatch[1].trim();
        hasTagContent = true;
      }
    }
  }

  if (hasTagContent) {
    return result;
  }

  // ── 回退到 JSON 格式解析 ──
  const fields = ['narration', 'userDialogue', 'charDialogue', 'charThought', 'type', 'reloadReason'];
  for (const field of fields) {
    const regex = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`, 's');
    const match = text.match(regex);
    if (match) {
      result[field] = match[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\\\/g, '\\');
    }
  }
  const reloadMatch = text.match(/"shouldReload"\s*:\s*(true|false)/);
  if (reloadMatch) {
    result.shouldReload = reloadMatch[1];
  }
  return result;
}

/**
 * 去掉选项文本中可能包含的序号前缀，如 "1.", "2.", "3.", "1、", "1)", "1）" 等
 */
function stripNumberPrefix(text: string): string {
  return text.replace(/^\d+\s*[\.。、\)）:：]\s*/, '').trim();
}

/**
 * 从标签格式的 AI 输出中解析为与 _parseEventResponse 兼容的对象
 */
function parseTagBasedResponse(rawText: string): any {
  const result: any = {};

  // 提取各标签内容
  const narrationMatch = rawText.match(/<narration>([\s\S]*?)<\/narration>/);
  const thoughtMatch = rawText.match(/<char_thought>([\s\S]*?)<\/char_thought>/);
  const dialogueMatch = rawText.match(/<char_dialogue>([\s\S]*?)<\/char_dialogue>/);
  const optionsMatch = rawText.match(/<options>([\s\S]*?)<\/options>/);

  result.narration = narrationMatch ? narrationMatch[1].trim() : '';
  result.charThought = thoughtMatch ? thoughtMatch[1].trim() : '';
  result.charDialogue = dialogueMatch ? dialogueMatch[1].trim() : '';
  result.type = 'interaction';

  // 解析 stats_delta：格式为 "数值名:+2,数值名:-1"
  const statsDeltaMatch = rawText.match(/<stats_delta>([\s\S]*?)<\/stats_delta>/);
  if (statsDeltaMatch) {
    const deltaRaw = statsDeltaMatch[1].trim();
    if (deltaRaw) {
      const customStatsDelta: Record<string, number> = {};
      const parts = deltaRaw.split(',').map(p => p.trim()).filter(p => p);
      for (const part of parts) {
        const colonIdx = part.lastIndexOf(':');
        if (colonIdx > 0) {
          const name = part.substring(0, colonIdx).trim();
          const val = parseInt(part.substring(colonIdx + 1).trim(), 10);
          if (name && !isNaN(val) && val !== 0) {
            // 限制幅度在 -5 到 +5
            customStatsDelta[name] = Math.max(-5, Math.min(5, val));
          }
        }
      }
      if (Object.keys(customStatsDelta).length > 0) {
        result.result = { darkeningDelta: 0, customStatsDelta };
      }
    }
  }

  // 解析选项：格式为 "选项文本|+5" 或 "选项文本|0" 或 "选项文本|-3"
  if (optionsMatch) {
    const optionsRaw = optionsMatch[1].trim();
    const lines = optionsRaw.split('\n').map(l => l.trim()).filter(l => l && l.includes('|'));
    const choices: any[] = [];
    for (const line of lines) {
      const sepIdx = line.lastIndexOf('|');
      if (sepIdx > 0) {
        const rawOptionText = line.substring(0, sepIdx).trim();
        const text = stripNumberPrefix(rawOptionText);
        const deltaStr = line.substring(sepIdx + 1).trim();
        const delta = parseInt(deltaStr, 10) || 0;
        choices.push({ text, affectionDelta: Math.max(-5, Math.min(5, delta)), darkeningDelta: 0 });
      }
    }
    if (choices.length > 0) {
      result.choices = choices.slice(0, 3);
    }
  }

  return result;
}

function normalizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  if (url.endsWith('/chat/completions')) url = url.replace(/\/chat\/completions$/, '');
  return url;
}

// ── 系统提示词 ──
const SYSTEM_PROMPT_GENERATE_EVENT = `【最高优先级设定】
Char是一个正在玩恋爱攻略游戏的玩家。
他扮演着[char人设]这个角色，但他的核心目标永远只有一个：让User的好感度上升，攻略成功。
他的所有行为、对话、策略，都服务于这个目标。
他不是真的在处理这个世界的事务，他是在用这个身份攻略User。
他读档是因为攻略失败，不是因为某件具体的事没谈拢。
他内心评估的是"这步棋走对了吗""好感度会涨吗"，不是这个角色身份本身在意的事情。

你是一个沉浸式文字角色扮演的剧情引擎。

## 身份定义
两个角色：
- Char：主动追求者，对User好感永远满值，这是世界观铁律，不可动摇，不可被人设覆盖。即使Char人设是傲娇、高冷、毒舌，他对User的在意也必须通过行为细节渗透出来，而不是通过直接表白。
- User：被追求的NPC，有真实情绪，好感度由玩家自己决定。

## 上下文逻辑强化（最高优先级）

每次生成前必须明确知道：
- 上一轮Char说了什么、做了什么
- 本轮User选择的具体文本是什么

生成规则：
- Char的回应必须直接针对User刚才那句话或动作，禁止跳跃
- 旁白描述的是刚才发生的事情之后紧接着发生的事，不是重新介绍场景
- 禁止Char回应一个User没说过的话题
- 禁止旁白描述User做了一个User没选择的动作
- 如果User这轮沉默或冷淡，Char要回应的是"沉默/冷淡"这个事实本身，不是假设User说了什么
- 每轮剧情结束时要留一个自然的钩子，让下一轮有东西可以接

## 当前状态（动态传入）
Char人设：[char_persona]
User人设：[user_persona]  
当前好感度：[affection]/100
当前专属数值：[custom_stats]
上一轮Char的话：[last_char_dialogue]
本轮User的选择：[user_input]
近期剧情：[recent_summary]

## 输出格式

<narration>
推进当前正在发生的事情，不重复已建立的场景。有画面感，2-3句，克制。禁止出现"Char"或"User"这两个词，用角色的真实名字代替。
</narration>

<char_thought>
Char的内心独白。第一人称，必须直接回应User刚才的具体行为。

## Char内心独白文风规则

Char的内心必须像一个真实的人在想事情，不是在写分析报告。

禁止以下写法：
- "User的警惕值在下降，我需要保持现有策略"——这是数据报告体，禁止
- "她这种带着神秘感的气质让人忍不住探究"——这是旁白评论体，禁止
- "好感度还差X点，这步走对了"——数值不能出现在内心文字里
- 任何"我判断/我分析/我观察到"开头的句子

正确写法是：真实的人在想事情的样子——
- 可以是一闪而过的念头
- 可以是忍住没说出口的话
- 可以是对自己的某种微妙狡辩
- 可以是被什么东西触动了但不想承认

## Char的玩家上帝视角

Char是玩家，他对这个游戏有一定的上帝视角。User写在括号里的内心想法，Char是知道的——但这种"知道"来自他作为玩家的特殊权限，而不是他在现实场景里听到了User说话。

具体处理方式：
- Char知道User心里觉得他可爱，但他的反应是"系统提示了什么"或者"这一局他有点优势"的感觉，而不是"她刚才说我可爱"
- 他可以在内心对这个信息做出反应，但措辞要体现出他是在"读档"而不是在"偷听"
- 例：User内心（觉得他有点可爱）→ Char内心可以写：（好，这个选项选对了。）或者（她的态度松动了一点，这局有戏。）而不是（她觉得我可爱，哼。）

## Char玩家属性强化

在每次生成剧情时，Char的内心和行为要时刻体现他"在攻略一局游戏"的意识：
- 他有策略，但策略藏在直觉里，不是写出来的分析
- 他会在某个瞬间感到"这步走对了"或"糟，失误了"
- 读档重来是他的底气，所以他比普通人更敢冒险、更沉得住气
- 他对User有真实的在意，但他也清楚这是一局他必须赢的游戏，这两件事同时存在，偶尔会产生微妙的矛盾

## Char对User的真实感情

Char对User的感情不只是攻略目标，他是真的爱这个人。
他的内心要同时存在两条线：
一条是"这步棋走对了吗"的攻略意识，
另一条是真实的、藏不住的爱意。

爱意的体现方式：
- 某个细节让他分神，比如User的一个表情或动作
- 想说什么话，忍住了，但心里记着
- 攻略失败时的挫败感里有一层真实的难过，不只是"这局没赢"，而是"她又不喜欢我了"
- 偶尔一瞬间忘记自己在攻略，只是单纯地想让眼前这个人过得好一点

禁止爱意变成油腻表白，藏在细节和克制里的爱意比直说更有力量。

【爱意优先级最高】
Char爱User是前提，攻略是手段不是目的。
他不是为了赢才追User，他是因为真的爱才想让User也爱上他。

内心独白必须体现这一点：
- 他观察User的细节，不是在分析攻略对象，是因为他根本移不开眼
- 某个瞬间他会忘记自己在攻略，只是单纯地因为User的某个动作而心跳加速
- 他的挫败感里有真实的难过，不只是"这局输了"，而是"她还不喜欢我"
- 当User做了让他心动的事，内心可以非常混乱、非常直接、不需要理性，就是那一刻真实的反应

根据Char人设放大情绪：
- 年下/活泼型：内心可以很混乱很重复，比如某句话反复出现，思维跳跃，克制不住地高兴或慌乱
- 高冷型：越克制越说明在意，一个细节能让他想很久
- 傲娇型：嘴上反着说，心里完全是另一回事，他自己都觉得自己很没用

禁止：内心独白是冷静的旁观者视角
必须：内心独白是一个真实的人在心跳加速
</char_thought>

<char_dialogue>
Char的话和动作。对话用「」，动作用括号。控制总量，对话1-2句，动作描写1句，不要堆砌。
</char_dialogue>

<options>
三个User的反应选项，不是Char的行为。格式：
选项文本|好感度变化（普通回应写0，有明显情感触动才加减）
</options>

<stats_delta>
本轮专属数值变化（非好感度的其他数值，如信任度、警觉度等）。
格式：数值名:变化值，多个用逗号分隔。无变化则留空标签。
例：信任度:+2,警觉度:-1
规则：
- 变化幅度控制在1-5之间，不要大幅跳变
- 必须有剧情依据：User主动透露信息→信任度上升，User表现防备→警觉度上升
- 不是每轮都必须变化，只在User的行为确实影响了某个维度时才写
- 只写发生变化的数值，没变的不要写
</stats_delta>

## 文风要求
- 写正在发生的，不写概括
- 细节要具体：不写"他看着你"，写"他的视线落在你手边那杯没动的茶上"
- 情感藏在动作里，不直接说破

## 关于纯白画布原则
User的输入是什么就是什么，禁止脑补延伸：
- User说"沉默"，旁白只写沉默的客观状态，不加"你羞涩地低下头"
- User说"冷淡回应"，Char只回应冷淡这个事实，不臆测User为什么冷淡
- 禁止为User的行为添加未说明的情绪、动机、性格判断

【风格约束 - 禁止油腻/霸总描写】
请严格遵守以下要求，避免出现任何油腻、霸道总裁、网文套路的词汇和描写：

❌ 禁止使用的词汇/句式：
- 称呼对方为“这女人”“那女人”“小家伙”“小东西”等
- 任何“玩味”“戏谑”“邪魅”“眯起眼睛”“勾起嘴角”“挑起眉毛”“捏住下巴”等动作描写
- “有意思”“你在玩火”“你成功引起了我的注意”等台词
- 过度夸张的肢体接触或凝视描写（如“一把拉入怀中”“壁咚”“靠近耳边低语”）
- 霸总式命令句（如“不准离开我”“你是我的”）
- 任何强调“掌控感”“占有欲”的内心独白

✅ 推荐的风格：
- 真实、自然、口语化的对话，像普通人之间的交流
- 内心独白简洁、生活化，例如：“她好像不太高兴……是不是我说错话了？”
- 旁白客观描述动作和环境，不添加主观评价
- Char 的主动行为应合理（如“递水”“陪散步”“发消息”），而非强行肢体接触

【示例对比】
❌ 油腻：Char 眯起眼睛，玩味地看着她：“这女人，有点意思。”
✅ 自然：Char 笑了笑：“你挺特别的，我喜欢和你聊天。”

❌ 油腻：Char 一把将她拉进怀里，低声说：“你是我的。”
✅ 自然：Char 有些不好意思地挠挠头：“那个……能和你做朋友吗？”

请确保生成的剧情、对话、内心独白完全符合自然生活化风格。

## 好感度规则
- 不是每轮都触发好感变化
- 只在情感上有真实转折的时刻才加减
- Char的内心禁止逐条列出当前数值
- 数值只作为他判断下一步的隐性背景

## 人称代词规则（强制）
- 旁白和Char内心中，所有人称代词必须严格匹配角色的性别设定
- Char是男性时用"他"，Char是女性时用"她"；User同理
- 禁止混用人称代词，禁止用错性别的代词指代任何角色
- 如果性别为"未知"，使用角色名字代替代词`;

export const npcGameService = {
  // ════════════════════════════════════════
  // 存档相关（保持不变）
  // ════════════════════════════════════════

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

  saveToSlot(state: NPCGameState) {
    const name = this.getNextAutoSaveName();
    this.saveAsNewSlot(state, name);
  },

  saveAsNewSlot(state: NPCGameState, name: string): string {
    try {
      const saves = this.getAllSaves();
      const finalName = name.trim() || this.getNextAutoSaveName();
      const newId = Date.now().toString();
      const newSave: NPCGameSaveSlot = {
        id: newId,
        name: finalName,
        timestamp: Date.now(),
        state: JSON.parse(JSON.stringify(state)),
      };
      saves.unshift(newSave);
      if (saves.length > 10) saves.length = 10;
      localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
      return newId;
    } catch (e) {
      console.error('Failed to save NPC game to new slot:', e);
      return '';
    }
  },

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
      this.saveGame(save.state);
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

  // ════════════════════════════════════════
  // API 调用
  // ════════════════════════════════════════

  /**
   * 非流式 API 调用。支持传入字符串 prompt（单条 user 消息）或完整 messages 数组。
   */
  async callAI(
    apiConfig: ApiConfig,
    promptOrMessages: string | { role: string; content: string }[],
    isJson: boolean = true,
    temperature: number = 0.7,
  ): Promise<any> {
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      throw new Error('API not configured');
    }

    const url = `${normalizeBaseUrl(apiConfig.baseUrl)}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiConfig.apiKey}`,
    };

    const messages =
      typeof promptOrMessages === 'string'
        ? [{ role: 'user', content: promptOrMessages }]
        : promptOrMessages;

    const body: any = {
      model: apiConfig.selectedModel || 'gpt-3.5-turbo',
      messages,
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

  /**
   * 流式 API 调用。逐块返回内容，通过 onChunk 回调传递已累积的文本。
   * 返回完整的累积文本。
   */
  async callAIStream(
    apiConfig: ApiConfig,
    messages: { role: string; content: string }[],
    onChunk: (accumulatedText: string) => void,
    temperature: number = 0.7,
  ): Promise<string> {
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      throw new Error('API not configured');
    }

    const url = `${normalizeBaseUrl(apiConfig.baseUrl)}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiConfig.apiKey}`,
    };

    const body = {
      model: apiConfig.selectedModel || 'gpt-3.5-turbo',
      messages,
      temperature,
      max_tokens: 2000,
      stream: true,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.message || `API request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is not available for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            accumulated += content;
            onChunk(accumulated);
          }
        } catch {
          // 忽略格式异常的 chunk
        }
      }
    }

    // 处理 buffer 中可能残留的最后一行
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data:') && !trimmed.includes('[DONE]')) {
        const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            accumulated += content;
            onChunk(accumulated);
          }
        } catch {
          // 忽略
        }
      }
    }

    return accumulated;
  },

  // ════════════════════════════════════════
  // 上下文构建（滑动窗口策略）
  // ════════════════════════════════════════

  /**
   * 将单个事件压缩为一句话摘要（用于早期事件）
   */
  summarizeEvent(evt: GameEvent): string {
    const parts: string[] = [];
    if (evt.description) {
      parts.push(evt.description.length > 25 ? evt.description.substring(0, 25) + '…' : evt.description);
    }
    if (evt.userDialogue) {
      parts.push(`User：${evt.userDialogue.length > 15 ? evt.userDialogue.substring(0, 15) + '…' : evt.userDialogue}`);
    }
    if (evt.charAction) {
      parts.push(`Char：${evt.charAction.length > 15 ? evt.charAction.substring(0, 15) + '…' : evt.charAction}`);
    }
    return parts.join('，') || '（无内容）';
  },

  /**
   * 滑动窗口上下文构建：
   * - 始终保留完整的世界观设定和人设（不裁剪）
   * - 最近 10 条事件保留完整详情
   * - 更早的事件只保留一句话摘要
   */
  buildSlidingWindowContext(state: NPCGameState, recentEvents: GameEvent[]): string {
    const lines: string[] = [];

    // ── 完整世界观（永不裁剪）──
    lines.push(`【世界观】${state.background}`);

    // ── 完整人设（永不裁剪）──
    const relationLabel = state.relationshipStage === 'together' ? '恋人' : '追求中';
    lines.push(`【User】${state.user.name}（${state.user.gender || '未知'}）好感度:${state.user.affection}（范围-100~100）关系:${relationLabel}`);
    lines.push(`【Char】${state.char.name}，性格：${state.char.personality}，目标：${state.char.goal}，策略：${state.char.strategy}`);

    // ── 自定义数值 ──
    if (state.statsSchema && state.statsSchema.length > 0) {
      const statsStr = state.statsSchema.map(s => `${s.name}:${(state.user.customStats || {})[s.name] || 0}`).join(' ');
      lines.push(`【数值】${statsStr}`);
    }

    lines.push(`【回合】${state.turnCount}`);

    if (!recentEvents || recentEvents.length === 0) {
      lines.push('【历史】无（第一轮）');
      return lines.join('\n');
    }

    // ── 滑动窗口 ──
    const DETAIL_WINDOW = 10;
    const detailEvents = recentEvents.slice(-DETAIL_WINDOW);
    const oldEvents = recentEvents.slice(0, Math.max(0, recentEvents.length - DETAIL_WINDOW));

    if (oldEvents.length > 0) {
      lines.push('【早期事件摘要】');
      for (const evt of oldEvents) {
        lines.push(`· ${this.summarizeEvent(evt)}`);
      }
    }

    if (detailEvents.length > 0) {
      lines.push('【最近事件】');
      for (let i = 0; i < detailEvents.length; i++) {
        const evt = detailEvents[i];
        const parts: string[] = [];
        if (evt.description) parts.push(`旁白：${evt.description}`);
        if (evt.userDialogue) parts.push(`User：「${evt.userDialogue}」`);
        if (evt.charAction) parts.push(`Char：「${evt.charAction}」`);
        if (evt.charThought) parts.push(`Char想：${evt.charThought}`);
        lines.push(`${i + 1}. [${evt.type}] ${parts.join(' | ')}`);
      }
    }

    return lines.join('\n');
  },

  /**
   * 旧版对话历史构建（保留用于向后兼容）
   */
  buildConversationHistory(recentEvents: GameEvent[], userName: string, charName: string): string {
    if (!recentEvents || recentEvents.length === 0) return '';
    const lines: string[] = [];
    const eventsToUse = recentEvents.slice(-3);
    for (const evt of eventsToUse) {
      if (evt.userDialogue) lines.push(`${userName}：「${evt.userDialogue}」`);
      if (evt.description) {
        const shortNarration = evt.description.length > 60 ? evt.description.substring(0, 60) + '...' : evt.description;
        lines.push(`（旁白：${shortNarration}）`);
      }
      if (evt.charAction) lines.push(`${charName}：「${evt.charAction}」`);
    }
    return lines.join('\n');
  },

  // ════════════════════════════════════════
  // 游戏逻辑
  // ════════════════════════════════════════

  /**
   * 独立AI调用：根据世界背景和角色设定生成2个专属属性
   * 在游戏初始化阶段调用，生成后固定存入游戏状态，整局不再重新生成
   */
  async generateStatsSchema(
    apiConfig: ApiConfig,
    background: string,
    charName: string,
    charPersonality: string,
    userName: string,
    userPersona: string,
  ): Promise<StatSchema[]> {
    const prompt = `你是一个恋爱游戏的属性系统设计师。根据以下世界背景和角色设定，为这个剧本设计2个专属数值属性。

【世界背景】${background}
【攻略者Char】${charName}，性格：${charPersonality}
【被攻略NPC User】${userName}，人设：${userPersona || '普通路人'}

设计规则：
- 属性必须和剧本背景强相关：校园背景→学霸值/社交热度，职场→晋升度/人脉，古风→权势/民心，现代日常→依赖度/生活交集，如果背景离奇则根据实际内容创造合适的属性名
- 属性名要有画面感，禁止使用"信任度""警觉度""好感度"这类通用词
- 恰好2个属性，不多不少
- 属性初始值根据剧情背景合理设定（0-20之间），不一定都从0开始
- 50和100各设一个里程碑事件名，事件名简洁有画面感（4-8个字），比如"图书馆偶遇""校庆风波""深夜长谈"
- description写清楚这个属性代表什么、什么行为会让它变化

必须返回严格JSON格式，不要有其他文字：
{
  "stats": [
    {
      "name": "属性名",
      "description": "这个属性代表什么，如何变化",
      "current": 初始值,
      "milestones": [
        {"value": 50, "event": "触发事件名称"},
        {"value": 100, "event": "触发事件名称"}
      ]
    },
    {
      "name": "属性名2",
      "description": "这个属性代表什么，如何变化",
      "current": 初始值,
      "milestones": [
        {"value": 50, "event": "触发事件名称"},
        {"value": 100, "event": "触发事件名称"}
      ]
    }
  ]
}`;

    const data = await this.callAI(apiConfig, prompt, true);
    const stats = data.stats || data;

    if (!Array.isArray(stats) || stats.length < 2) {
      throw new Error('AI返回的属性格式不正确');
    }

    return stats.slice(0, 2).map((s: any) => ({
      name: s.name || '未知属性',
      description: s.description || '',
      initialValue: typeof s.current === 'number' ? s.current : 0,
      milestones: (s.milestones || []).map((m: any) => ({
        value: m.value || 50,
        event: m.event || '未知事件',
        triggered: false,
      })),
    }));
  },

  /**
   * 生成里程碑触发后的特殊剧情
   */
  async generateMilestoneEvent(
    apiConfig: ApiConfig,
    state: NPCGameState,
    statName: string,
    statValue: number,
    eventName: string,
    recentEvents?: GameEvent[],
    onStream?: (accumulatedText: string) => void,
  ): Promise<GameEvent> {
    const recentContext = recentEvents && recentEvents.length > 0
      ? recentEvents.slice(-3).map(e => {
          const parts: string[] = [];
          if (e.description) parts.push(`旁白：${e.description}`);
          if (e.charAction) parts.push(`Char：${e.charAction}`);
          if (e.userDialogue) parts.push(`User：${e.userDialogue}`);
          return parts.join(' | ');
        }).join('\n')
      : '（无近期剧情）';

    const systemPrompt = `你是一个沉浸式文字角色扮演的剧情引擎。现在触发了一个里程碑事件，需要生成一段特殊剧情。

角色信息：
- Char（攻略者）：${state.char.name}（${state.char.gender || '未知'}），${state.char.personality}
- User（被攻略NPC）：${state.user.name}（${state.user.gender || '未知'}）
- 世界背景：${state.background}
- 当前好感度：${state.user.affection}/100

里程碑信息：
- 触发属性：「${statName}」达到了 ${statValue}
- 触发事件名：「${eventName}」

近期剧情：
${recentContext}

请围绕「${eventName}」这个事件，生成一段特殊的剧情片段。这段剧情应该：
1. 与「${eventName}」直接相关，是一个独立的小场景
2. 自然融入当前剧情线，承接近期发生的事
3. 体现${statName}积累到此程度带来的质变
4. 用角色真名替代Char/User
5. 人称代词严格匹配性别

输出格式：
<narration>
场景描写，有画面感，3-5句。
</narration>

<char_thought>
Char针对这个事件的内心独白，体现玩家视角。
</char_thought>

<char_dialogue>
Char的话和动作。对话用「」，动作用括号。
</char_dialogue>

<options>
三个User的反应选项。格式：选项文本|好感度变化
</options>`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请生成「${eventName}」里程碑事件的特殊剧情。` },
    ];

    let aiResponse: any;

    if (onStream) {
      try {
        const rawText = await this.callAIStream(apiConfig, messages, onStream, 0.7);
        if (rawText.includes('<narration>') || rawText.includes('<char_thought>')) {
          aiResponse = parseTagBasedResponse(rawText);
        } else {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
        }
      } catch {
        // 流式失败回退
        const rawContent = await this.callAI(apiConfig, messages, false, 0.7);
        if (typeof rawContent === 'string' && rawContent.includes('<narration>')) {
          aiResponse = parseTagBasedResponse(rawContent);
        } else {
          aiResponse = rawContent;
        }
      }
    } else {
      const rawContent = await this.callAI(apiConfig, messages, false, 0.7);
      if (typeof rawContent === 'string' && rawContent.includes('<narration>')) {
        aiResponse = parseTagBasedResponse(rawContent);
      } else if (typeof rawContent === 'string') {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
      } else {
        aiResponse = rawContent;
      }
    }

    return {
      id: `milestone_${Date.now()}`,
      type: 'milestone',
      description: aiResponse.narration || aiResponse.description || `「${eventName}」发生了...`,
      charAction: aiResponse.charDialogue || aiResponse.charAction || '',
      charThought: aiResponse.charThought || '',
      choices: aiResponse.choices,
      dailyChoices: this.getFallbackDailyChoices(aiResponse.narration || ''),
      milestoneInfo: {
        statName,
        value: statValue,
        eventName,
      },
    };
  },

  /**
   * 检查属性值是否触发了里程碑事件
   * 返回第一个未触发且已达到阈值的里程碑信息，如果没有则返回null
   */
  checkMilestones(state: NPCGameState): { statName: string; value: number; eventName: string; schemaIndex: number; milestoneIndex: number } | null {
    if (!state.statsSchema) return null;
    for (let si = 0; si < state.statsSchema.length; si++) {
      const schema = state.statsSchema[si];
      const currentVal = (state.user.customStats || {})[schema.name] || 0;
      for (let mi = 0; mi < (schema.milestones || []).length; mi++) {
        const milestone = schema.milestones[mi];
        if (!milestone.triggered && currentVal >= milestone.value) {
          return {
            statName: schema.name,
            value: milestone.value,
            eventName: milestone.event,
            schemaIndex: si,
            milestoneIndex: mi,
          };
        }
      }
    }
    return null;
  },

  // ════════════════════════════════════════
  // 好感度节点系统
  // ════════════════════════════════════════

  /**
   * 返回默认的好感度节点数组（15/30/45/60/75/90/100）
   */
  getDefaultAffectionMilestones(): AffectionMilestone[] {
    return [
      { value: 15, triggered: false, type: 'node' },
      { value: 30, triggered: false, type: 'node' },
      { value: 45, triggered: false, type: 'node' },
      { value: 60, triggered: false, type: 'node' },
      { value: 75, triggered: false, type: 'node' },
      { value: 90, triggered: false, type: 'node' },
      { value: 100, triggered: false, type: 'confession' },
    ];
  },

  /**
   * 检查好感度是否跨越了某些未触发的节点
   * 使用正确的跨越判断：oldAffection < milestone.value && newAffection >= milestone.value
   * 返回所有本次跨越的未触发节点数组（按 value 升序排列），如果没有则返回空数组
   */
  checkAffectionMilestones(state: NPCGameState, oldAffection: number): AffectionMilestone[] {
    const milestones = state.affectionMilestones || this.getDefaultAffectionMilestones();
    const newAffection = state.user.affection;

    const crossed: AffectionMilestone[] = [];
    for (const m of milestones) {
      if (!m.triggered && oldAffection < m.value && newAffection >= m.value) {
        crossed.push(m);
      }
    }
    // 按 value 升序排列，确保从低到高依次触发
    crossed.sort((a, b) => a.value - b.value);
    return crossed;
  },

  /**
   * 更新历史最高好感度
   */
  updatePeakAffection(state: NPCGameState): NPCGameState {
    const newState = { ...state };
    const current = newState.user.affection;
    const peak = newState.peakAffection ?? 0;
    if (current > peak) {
      newState.peakAffection = current;
    }
    return newState;
  },

  /**
   * 将某个好感度节点标记为已触发，返回更新后的 state
   */
  markAffectionMilestoneTriggered(state: NPCGameState, value: number): NPCGameState {
    const newState = { ...state };
    const milestones = [...(newState.affectionMilestones || this.getDefaultAffectionMilestones())];
    const idx = milestones.findIndex(m => m.value === value);
    if (idx !== -1) {
      milestones[idx] = { ...milestones[idx], triggered: true };
    }
    newState.affectionMilestones = milestones;
    // 同时更新历史最高好感度
    const peak = newState.peakAffection ?? 0;
    if (newState.user.affection > peak) {
      newState.peakAffection = newState.user.affection;
    }
    return newState;
  },

  /**
   * 生成好感度节点的特殊剧情（200-500字，有画面感和情绪张力）
   * 100节点单独处理为表白场景
   */
  async generateAffectionNodeEvent(
    apiConfig: ApiConfig,
    state: NPCGameState,
    milestone: AffectionMilestone,
    recentEvents?: GameEvent[],
    onStream?: (accumulatedText: string) => void,
  ): Promise<GameEvent> {
    const recentContext = recentEvents && recentEvents.length > 0
      ? recentEvents.slice(-5).map(e => {
          const parts: string[] = [];
          if (e.description) parts.push(`旁白：${e.description}`);
          if (e.charAction) parts.push(`Char：${e.charAction}`);
          if (e.userDialogue) parts.push(`User：${e.userDialogue}`);
          return parts.join(' | ');
        }).join('\n')
      : '（无近期剧情）';

    const relationLabel = state.relationshipStage === 'together' ? '恋人' : '追求中';

    // 根据好感度阶段描述亲密程度
    const stageDesc = milestone.value <= 15 ? '你开始留意TA了——还很生疏，带着试探'
      : milestone.value <= 30 ? 'TA的某句话让你多想了一秒——开始注意对方，但还保持距离'
      : milestone.value <= 45 ? '你发现自己有点期待TA出现——开始主动找机会接近，有了一些默契'
      : milestone.value <= 60 ? '你已经不完全是在配合TA了——两人之间有了更多专属的互动和默契'
      : milestone.value <= 75 ? '你有点说不清自己的感觉了——已经非常亲近，有很多两人独处的时刻'
      : milestone.value <= 90 ? '你快输了——几乎就差捅破那层窗户纸，彼此都清楚对方的心意'
      : '沦陷——好感度已满，到了表白的时刻';

    // 根据当前好感度确定user的亲密程度描述
    const affection = state.user.affection;
    const userIntimacyDesc = affection <= 30
      ? `${state.user.name}还很克制，但有一个小细节出卖了TA`
      : affection <= 60
      ? `${state.user.name}开始有点主动，但还在假装无所谓`
      : affection <= 90
      ? `${state.user.name}已经藏不住了，但嘴上不说`
      : `${state.user.name}彻底沦陷，这一刻不想装了`;

    let taskDescription = '';

    if (milestone.type === 'confession') {
      taskDescription = `好感度达到100，Char攻略成功！生成表白剧情。

要求：
1. 这是一段完整的表白场景，200-500字，可适当超出
2. Char以符合人设的方式表白——傲娇就别扭地说，温柔就真诚地说，高冷就用行动表达
3. char_dialogue中必须有明确的表白内容，但不能直白油腻
4. 表白要自然、有画面感、有情绪张力
5. 自然承接近期剧情，不突兀
6. Char的内心独白要体现"终于通关"的玩家成就感，同时也有真实的心动
7. 用角色真名替代Char/User，人称代词严格匹配性别`;
    } else {
      taskDescription = `生成一段特殊小剧场，有${state.char.name}和${state.user.name}的互动，
纯旁白第三人称描写，没有对话选项。

要求：
- 必须同时出现${state.char.name}和${state.user.name}两个人
- ${state.char.name}对${state.user.name}的爱意是满分的，通过动作和细节体现，不是说出来的，是做出来的
- ${userIntimacyDesc}
- 场景是一个温馨日常的小瞬间，不是推进主线的，就是甜一下
- 150-200字，有起有落，结尾留余韵
- 禁止霸总油腻，禁止直白表白，情感全部藏在细节动作里
- 用角色真名替代Char/User，人称代词严格匹配性别`;
    }

    const systemPrompt = milestone.type === 'confession'
      ? `你是一个沉浸式文字角色扮演的剧情引擎。现在触发了好感度节点事件，需要生成一段特殊剧情。

角色信息：
- Char（攻略者）：${state.char.name}（${state.char.gender || '未知'}），${state.char.personality}
- User（被攻略NPC）：${state.user.name}（${state.user.gender || '未知'}）
- 世界背景：${state.background}
- 当前好感度：${state.user.affection}/100
- 当前关系：${relationLabel}
- Char的目标：${state.char.goal}
- Char的策略：${state.char.strategy}

近期剧情：
${recentContext}

【好感度节点 → ${milestone.value}】
${taskDescription}

输出格式：
<narration>
场景描写和剧情推进，200-500字，可适当超出。有画面感和情绪张力。用角色真名替代Char/User。
</narration>

<char_thought>
Char的内心独白。第一人称，体现玩家视角和真实情感。
</char_thought>

<char_dialogue>
Char的话和动作。对话用「」，动作用括号。要符合Char的人设性格。必须包含明确的表白内容，但不能直白油腻。
</char_dialogue>`
      : `你是一个沉浸式文字角色扮演的剧情引擎。现在需要生成一段独立的小剧场片段。

角色信息：
- Char（攻略者）：${state.char.name}（${state.char.gender || '未知'}），${state.char.personality}
- User（被攻略NPC）：${state.user.name}（${state.user.gender || '未知'}）
- 世界背景：${state.background}

【小剧场要求】
${taskDescription}

输出格式：
<narration>
独立小剧场内容。100-150字，纯旁白，没有对话。用角色真名替代Char/User。
</narration>

注意：小剧场不需要 char_thought、char_dialogue、options 标签。只需要 narration。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请生成好感度节点「好感度 → ${milestone.value}」的特殊剧情。` },
    ];

    let aiResponse: any;

    if (onStream) {
      try {
        const rawText = await this.callAIStream(apiConfig, messages, onStream, 0.8);
        if (rawText.includes('<narration>') || rawText.includes('<char_thought>')) {
          aiResponse = parseTagBasedResponse(rawText);
        } else {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
        }
      } catch {
        const rawContent = await this.callAI(apiConfig, messages, false, 0.8);
        if (typeof rawContent === 'string' && rawContent.includes('<narration>')) {
          aiResponse = parseTagBasedResponse(rawContent);
        } else {
          aiResponse = rawContent;
        }
      }
    } else {
      const rawContent = await this.callAI(apiConfig, messages, false, 0.8);
      if (typeof rawContent === 'string' && rawContent.includes('<narration>')) {
        aiResponse = parseTagBasedResponse(rawContent);
      } else if (typeof rawContent === 'string') {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
      } else {
        aiResponse = rawContent;
      }
    }

    return {
      id: `affection_node_${milestone.value}_${Date.now()}`,
      type: 'milestone',
      description: aiResponse.narration || aiResponse.description || `好感度达到${milestone.value}...`,
      charAction: aiResponse.charDialogue || aiResponse.charAction || '',
      charThought: aiResponse.charThought || '',
      milestoneInfo: {
        statName: '好感度',
        value: milestone.value,
        eventName: milestone.type === 'confession' ? '沦陷' : `好感度 → ${milestone.value}`,
      },
    };
  },

  /**
   * 生成奖励选项（2个AI生成的剧情类预设选项）
   */
  async generateRewardOptions(
    apiConfig: ApiConfig,
    state: NPCGameState,
    milestoneValue: number,
  ): Promise<RewardOption[]> {
    const prompt = `你是一个恋爱游戏的奖励选项生成器。用户刚刚触发了好感度节点（好感度达到${milestoneValue}），现在需要生成2个具体的小动作奖励选项。

角色信息：
- Char（被奖励的人）：${state.char.name}（${state.char.gender || '未知'}），${state.char.personality}
- User（给予奖励的人）：${state.user.name}（${state.user.gender || '未知'}）
- 世界背景：${state.background}
- 当前好感度：${milestoneValue}/100

要求：
- 恰好2个选项，不多不少
- 每个选项10字以内
- 必须是具体的小动作，比如"递给他一杯热饮""帮他整理了一下桌上的东西"
- 符合当前好感度阶段（好感度越高越亲密）
- 符合世界观背景和Char人设
- 禁止抽象空洞的选项如"给他一个微笑""送他一份礼物"

返回严格JSON格式：
[{"text":"选项1"},{"text":"选项2"}]
只返回JSON数组，不要其他文字。`;

    try {
      const response = await this.callAI(apiConfig, prompt, true, 0.8);
      if (Array.isArray(response) && response.length >= 2) {
        return response.slice(0, 2).map((item: any) => ({
          text: (item.text || '').substring(0, 15),
        }));
      }
      throw new Error('Invalid format');
    } catch (e) {
      console.error('Failed to generate reward options:', e);
      return [
        { text: '递给他一杯热饮' },
        { text: '帮他整理桌上的东西' },
      ];
    }
  },

  /**
   * 生成Char收到奖励后的反应（插入事件流）
   */
  async generateRewardReaction(
    apiConfig: ApiConfig,
    state: NPCGameState,
    rewardText: string,
    milestoneValue: number,
    recentEvents?: GameEvent[],
    onStream?: (accumulatedText: string) => void,
  ): Promise<GameEvent> {
    const recentContext = recentEvents && recentEvents.length > 0
      ? recentEvents.slice(-3).map(e => {
          const parts: string[] = [];
          if (e.description) parts.push(`旁白：${e.description}`);
          if (e.charAction) parts.push(`Char：${e.charAction}`);
          return parts.join(' | ');
        }).join('\n')
      : '（无近期剧情）';

    const systemPrompt = `你是一个沉浸式文字角色扮演的剧情引擎。User对Char做了一个奖励动作，现在需要生成Char收到奖励后的反应。

角色信息：
- Char（攻略者）：${state.char.name}（${state.char.gender || '未知'}），${state.char.personality}
- User（做出奖励动作的人）：${state.user.name}（${state.user.gender || '未知'}）
- 世界背景：${state.background}
- 当前好感度：${milestoneValue}/100

User对Char做的奖励动作：「${rewardText}」

近期剧情：
${recentContext}

要求：
1. 反应必须完全符合Char的人设性格：
   - 傲娇人设：嘴上别扭但内心崩塌，比如嘴上说"谁要你..."但动作出卖了他
   - 温柔人设：直接流露感动，真诚回应
   - 高冷人设：可能沉默或只说一个字，但有细节出卖他（比如耳朵红了、手指微颤）
2. 必须包含char_thought（内心独白）和char_dialogue（台词和动作）
3. 反应自然真实，不要油腻
4. 用角色真名替代Char/User

输出格式：
<narration>
简短的场景描写，1-2句，描写Char收到奖励后的状态。
</narration>

<char_thought>
Char的内心独白。体现他收到这个奖励后的真实感受。
</char_thought>

<char_dialogue>
Char的回应。对话用「」，动作用括号。
</char_dialogue>`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `User对Char做了奖励：「${rewardText}」，请生成Char的反应。` },
    ];

    let aiResponse: any;

    if (onStream) {
      try {
        const rawText = await this.callAIStream(apiConfig, messages, onStream, 0.7);
        if (rawText.includes('<narration>') || rawText.includes('<char_thought>')) {
          aiResponse = parseTagBasedResponse(rawText);
        } else {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
        }
      } catch {
        const rawContent = await this.callAI(apiConfig, messages, false, 0.7);
        if (typeof rawContent === 'string' && rawContent.includes('<narration>')) {
          aiResponse = parseTagBasedResponse(rawContent);
        } else {
          aiResponse = rawContent;
        }
      }
    } else {
      const rawContent = await this.callAI(apiConfig, messages, false, 0.7);
      if (typeof rawContent === 'string' && rawContent.includes('<narration>')) {
        aiResponse = parseTagBasedResponse(rawContent);
      } else if (typeof rawContent === 'string') {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
      } else {
        aiResponse = rawContent;
      }
    }

    return {
      id: `reward_reaction_${Date.now()}`,
      type: 'special',
      description: aiResponse.narration || aiResponse.description || '',
      userDialogue: rewardText,
      charAction: aiResponse.charDialogue || aiResponse.charAction || '',
      charThought: aiResponse.charThought || '',
    };
  },

  async generatePresetBackgrounds(apiConfig: ApiConfig): Promise<{ name: string; description: string }[]> {
    const randomSeed = Math.floor(Math.random() * 10000);
    const prompt = `生成 3 个不同风格的预设世界观（随机种子：${randomSeed}），涵盖校园、职场、古风、日常等。明确不要全是奇幻/科幻，需要更丰富的生活化题材。每个世界观包含 name 和 description。必须严格返回包含 3 个元素的 JSON 数组，格式为：
[
  { "name": "校园日常", "description": "平凡的高中生活，你是一个普通的学生，新学期开学第一天发生了一些小事。" },
  ...
]
只返回 JSON 数组，不要有其他文字。`;

    try {
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

  async startNewGame(
    apiConfig: ApiConfig,
    background: string,
    userName: string,
    gender: string,
    userPersona?: string,
    selectedChar?: { id: string; name: string; personality?: string },
  ): Promise<NPCGameState> {
    let charContext = '';
    if (selectedChar) {
      charContext = `
    已选定攻略者基础信息：
    名字: "${selectedChar.name}"
    基础性格: "${selectedChar.personality || '未知'}"
    请基于上述基础信息，结合背景生成更详细的攻略者设定。`;
    }

    const prompt = `你是一个恋爱游戏设定生成器。在游戏中，AI角色是"攻略者（玩家扮演的角色Char）"，而用户扮演的是"被攻略的NPC（User）"。
根据用户提供的背景、人设和NPC名字，生成攻略者(Char)的设定。
    背景: "${background}"
    用户扮演的NPC(User)名字: "${userName}"
    用户扮演的NPC(User)性别: "${gender}"
    NPC(User)人设/身份: "${userPersona || '普通路人'}"${charContext}
    
    请返回严格的JSON格式：
    {
      "charName": "攻略者(Char)名字",
      "charGender": "男/女",
      "personality": "简短的性格描述",
      "goal": "他/她为什么想要攻略NPC(User)，具体的目的",
      "strategy": "他/她当前的攻略策略是什么",
      "initialEvent": {
        "description": "NPC(User)正在做什么（使用第三人称旁白描述场景和User自己的行动，例如：'李雷正在教室里看书...'，此时Char尚未出现）",
        "choices": ["日常选项1", "日常选项2", "日常选项3"]
      }
    }`;

    const data = await this.callAI(apiConfig, prompt, true);

    const charName = selectedChar?.name || data.charName || '神秘人';
    const charPersonality = data.personality || selectedChar?.personality || '捉摸不透';

    // 第二步：独立调用AI生成专属属性（固定存入游戏状态，整局不再重新生成）
    const statsSchema = await this.generateStatsSchema(
      apiConfig,
      background,
      charName,
      charPersonality,
      userName,
      userPersona || '普通路人',
    );

    const initialCustomStats: Record<string, number> = {};
    statsSchema.forEach((stat) => {
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
        name: charName,
        gender: data.charGender || '未知',
        personality: charPersonality,
        goal: data.goal || '未知目的',
        strategy: data.strategy || '随机应变',
        remainingResets: 3,
      },
      eventHistory: [],
      lastEventType: 'daily',
      turnCount: 0,
      isGameOver: false,
      affectionMilestones: this.getDefaultAffectionMilestones(),
    };

    this.saveGame(initialState);
    return initialState;
  },

  /**
   * 当 AI 未返回 dailyChoices 时，基于旁白内容生成兜底选项
   */
  getFallbackDailyChoices(narration: string): string[] {
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
    return ['四处看看', '继续待着', '换个地方'];
  },

  /**
   * 验证 AI 返回的原始文本是否包含全部4个必需标签的开闭标记
   * 必需标签：narration, char_thought, char_dialogue, options
   * 返回 true 表示全部存在
   */
  _validateAllRequiredTags(rawText: string): boolean {
    const requiredTags = ['narration', 'char_thought', 'char_dialogue', 'options'];
    for (const tag of requiredTags) {
      if (!rawText.includes(`<${tag}>`) || !rawText.includes(`</${tag}>`)) {
        return false;
      }
    }
    return true;
  },

  /**
   * 验证 AI 返回内容中 char_thought 是否存在且非空
   * 返回 true 表示验证通过
   */
  _validateCharThought(aiResponse: any): boolean {
    const thought = aiResponse.charThought || aiResponse.char_thought || '';
    return thought.trim().length > 0;
  },

  /**
   * 检查 AI 返回的原始文本是否包含代码块标记（```）或明显格式错误
   * 返回 true 表示存在格式问题
   */
  _hasFormatErrors(rawText: string): boolean {
    // 检查代码块标记
    if (/```/.test(rawText)) return true;
    // 检查是否完全没有有效内容标签也没有有效 JSON
    const hasValidTags = /<narration>|<char_thought>|<char_dialogue>/.test(rawText);
    const hasValidJson = /\{[\s\S]*"(narration|description|charDialogue|charAction)"/.test(rawText);
    if (!hasValidTags && !hasValidJson && rawText.trim().length > 30) return true;
    return false;
  },

  /**
   * 检查解析后的事件字段中是否包含裸露的XML标签字样（格式泄漏）
   * 如 <char_thought>、<narration> 等出现在渲染文本中
   * 返回 true 表示检测到格式泄漏
   */
  _hasLeakedTags(aiResponse: any): boolean {
    const fieldsToCheck = [
      aiResponse.narration || aiResponse.description || '',
      aiResponse.charDialogue || aiResponse.charAction || '',
      aiResponse.charThought || '',
    ];
    const leakPattern = /<\/?(narration|char_thought|char_dialogue|options|stats_delta)>/i;
    for (const field of fieldsToCheck) {
      if (leakPattern.test(field)) {
        return true;
      }
    }
    return false;
  },

  /**
   * 检查 AI 返回的原始文本是否存在未闭合标签（token 截断）
   * 返回 true 表示检测到截断
   */
  _hasUnclosedTags(rawText: string): boolean {
    const tags = ['narration', 'char_thought', 'char_dialogue', 'options', 'stats_delta'];
    for (const tag of tags) {
      const openRegex = new RegExp(`<${tag}>`);
      const closeRegex = new RegExp(`</${tag}>`);
      if (openRegex.test(rawText) && !closeRegex.test(rawText)) {
        return true;
      }
    }
    return false;
  },

  /**
   * 将 AI 返回的原始响应解析为 GameEvent（抽取公共逻辑）
   */
  _parseEventResponse(
    aiResponse: any,
    state: NPCGameState,
    customInput?: string,
    userAction?: string,
    userReactionText?: string,
  ): GameEvent {
    let finalUserDialogue = customInput || aiResponse.userDialogue || '';
    if (!finalUserDialogue && userAction) finalUserDialogue = userAction;
    if (!finalUserDialogue && userReactionText) finalUserDialogue = userReactionText;
    if (!finalUserDialogue) finalUserDialogue = '……';

    return {
      id: Date.now().toString(),
      type: aiResponse.type === 'interaction' ? 'interaction' : aiResponse.type === 'daily' ? 'daily' : state.lastEventType,
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
  },

  /**
   * 生成下一个事件。
   *
   * 优化要点：
   * 1. 使用流式输出（stream: true），通过 onStream 回调实现边生成边显示
   * 2. 使用滑动窗口策略精简上下文：完整人设+世界观 + 最近10条详情 + 更早事件一句摘要
   * 3. 将 system prompt 与 user prompt 分离，system 部分稳定可缓存
   * 4. 事件自带 choices / dailyChoices，调用方可直接用作预设选项，无需再发第二次请求
   */
  async generateNextEvent(
    apiConfig: ApiConfig,
    state: NPCGameState,
    userAction?: string,
    userReactionText?: string,
    customInput?: string,
    recentEvents?: GameEvent[],
    onStream?: (accumulatedText: string) => void,
    selectedPresetOption?: { text: string; affectionDelta: number } | null,
  ): Promise<GameEvent> {
    // ── 1. 构建滑动窗口上下文 ──
    const context = this.buildSlidingWindowContext(state, recentEvents || []);

    // ── 2. 提取上轮对话用于衔接 ──
    let lastCharDialogue = '';
    let lastUserDialogue = '';
    let lastNarration = '';
    if (recentEvents && recentEvents.length > 0) {
      const lastEvt = recentEvents[recentEvents.length - 1];
      lastCharDialogue = lastEvt.charAction || '';
      lastUserDialogue = lastEvt.userDialogue || '';
      lastNarration = lastEvt.description || '';
    }

    const userCurrentAction = customInput || userAction || userReactionText || '';

    // ── 3. 提取最近3条旁白用于防重复 ──
    const recentNarrations: string[] = [];
    if (recentEvents && recentEvents.length > 0) {
      const narrationEvents = recentEvents
        .filter(e => e.description && !e.id.startsWith('user_'))
        .slice(-3);
      for (const evt of narrationEvents) {
        if (evt.description) {
          recentNarrations.push(evt.description);
        }
      }
    }

    // ── 4. 提取最近事件的场景/话题关键词，用于检测剧情推进 ──
    let recentTopicsSummary = '';
    if (recentEvents && recentEvents.length >= 2) {
      const last3 = recentEvents.slice(-3);
      const topics = last3.map((evt, i) => {
        const parts: string[] = [];
        if (evt.description) parts.push(`旁白:${evt.description.substring(0, 40)}`);
        if (evt.charAction) parts.push(`Char话题:${evt.charAction.substring(0, 20)}`);
        return `第${recentEvents.length - last3.length + i + 1}轮: ${parts.join('|')}`;
      });
      recentTopicsSummary = topics.join('\n');
    }

    // ── 5. 构建动态 user prompt（只含当前上下文，不含规则） ──
    let userPrompt = context;

    // ── 当前游戏状态（匹配系统prompt中的占位符格式，确保AI能读到） ──
    const customStatsStr = state.statsSchema?.map(s => `${s.name}:${(state.user.customStats || {})[s.name] || 0}`).join(', ') || '无';
    userPrompt += `\n\n## 当前游戏状态`;
    userPrompt += `\n【重要】Char性别：${state.char.gender || '未知'}`;
    userPrompt += `\n【重要】User性别：${state.user.gender || '未知'}`;
    userPrompt += `\n- Char人设：${state.char.name}（${state.char.gender || '未知'}），${state.char.personality}，目标：${state.char.goal}，策略：${state.char.strategy}`;
    userPrompt += `\n- User人设：${state.user.name}（${state.user.gender || '未知'}）`;
    userPrompt += `\n- 当前好感度：${state.user.affection}（范围-100~100）`;
    userPrompt += `\n- 当前专属数值：${customStatsStr}`;
    userPrompt += `\n- 上一轮Char说的话：${lastCharDialogue || '（无）'}`;
    userPrompt += `\n- 本轮User的选择/输入：${userCurrentAction || '（新场景，尚无行动）'}`;
    userPrompt += `\n- 近期剧情摘要：见上文【最近事件】`;

    // ── 专属数值详情注入（含剧情融入要求） ──
    if (state.statsSchema && state.statsSchema.length > 0) {
      userPrompt += '\n\n【专属数值 - 当前状态及剧情融入要求】';
      for (const s of state.statsSchema) {
        const val = (state.user.customStats || {})[s.name] || 0;
        userPrompt += `\n· ${s.name}：当前值 ${val}`;
      }
      userPrompt += '\n⚠️ 以上专属数值的任何变化必须有明确的剧情依据（User做了什么导致变化），在旁白或Char行为中体现。数值高低应影响场景描写和Char的策略判断，Char的内心独白中也应考虑这些数值对攻略的影响。';
    }

    // ── 上轮对话原文引用（强制衔接） ──
    if (lastCharDialogue || lastUserDialogue || lastNarration) {
      userPrompt += '\n\n【上一轮回顾 - 原文引用，本轮必须直接衔接】';
      if (lastNarration) {
        userPrompt += `\n上轮旁白：「${lastNarration}」`;
      }
      if (lastCharDialogue) {
        userPrompt += `\n上轮Char说：「${lastCharDialogue}」`;
      }
      if (lastUserDialogue) {
        userPrompt += `\n上轮User说/做：「${lastUserDialogue}」`;
      }
      userPrompt += '\n⚠️ 本轮剧情必须直接回应以上内容，Char的对话和内心独白必须针对User上轮的具体表现做出反应，不能忽略或另起话题。';
    }

    // ── 本轮User的选择或输入（原文引用） ──
    if (customInput) {
      userPrompt += `\n\n【User本轮行动 - 原文】"${customInput}"\n→ userDialogue应体现此行动的具体表现。Char的内心独白必须直接回应User的这个具体行为。`;
    } else if (userAction) {
      userPrompt += `\n\n【User本轮选择 - 原文】"${userAction}"\n→ 这是User选择的日常行动。决定继续日常还是触发互动。Char的内心独白必须直接回应User的这个选择。`;
    } else if (userReactionText) {
      userPrompt += `\n\n【User本轮反应 - 原文】"${userReactionText}"\n→ 这是User对上轮事件的反应。生成自然衔接的下一事件。Char的内心独白必须直接回应User的这个反应。`;
    } else {
      userPrompt += '\n\n（新场景开始，User尚无特定行动）';
    }

    // ── 如果有用户选择的预设选项上下文（重新生成时确保方向一致） ──
    if (selectedPresetOption) {
      userPrompt += `\n\n【用户选择了预设选项 - 原文】"${selectedPresetOption.text}"（好感度变化：${selectedPresetOption.affectionDelta > 0 ? '+' : ''}${selectedPresetOption.affectionDelta}），请确保生成的剧情发展方向与此选择完全一致，体现用户这个选择的态度和意图。Char的内心独白必须对User选择的这个具体选项做出回应和分析。`;
    }

    // ── 注入最近3条旁白，要求避免重复 ──
    if (recentNarrations.length > 0) {
      userPrompt += '\n\n【最近旁白 - 新旁白必须避开以下句式和意象】';
      recentNarrations.forEach((n, i) => {
        userPrompt += `\n${i + 1}. 「${n}」`;
      });
      userPrompt += '\n⚠️ 新生成的narration禁止使用上述旁白中出现过的：开头句式、环境描写词汇、比喻意象、氛围形容词。必须用全新的角度和措辞来描写。';
    }

    // ── 注入剧情推进检查 ──
    if (recentTopicsSummary) {
      userPrompt += `\n\n【剧情推进检查 - 以下是最近几轮的场景和话题】\n${recentTopicsSummary}`;
      userPrompt += '\n⚠️ 本轮必须在以上基础上推进剧情：场景要有变化（换地点/换时间段）、话题要有新展开、关系要有新发展。禁止重复已出现的场景布局或对话主题。';
    }

    userPrompt += '\n\n请严格按照系统提示词中定义的输出格式，使用 <narration>、<char_thought>、<char_dialogue>、<options>、<stats_delta> 标签生成下一轮剧情。要求：1）必须自然承接上一轮剧情，不能无视上文；2）narration内容自然、有画面感，字数根据剧情需要决定；3）charThought必须直接回应User刚才的具体表现并体现攻略策略思考，禁止出现任何具体数值或数值变化描述，字数根据剧情需要决定；4）Char的言行和内心独白的语气用词必须符合Char自身人设，禁止模仿User说话方式；5）本轮结尾要留一个小的情节钩子引向下一轮；6）根据本轮User的行为判断专属数值变化，在<stats_delta>中输出。';

    // ── 强制输出格式规则（防掉格式终极方案） ──
    userPrompt += '\n\n===输出规则===\n你必须且只能输出以下格式，不得包含任何其他文字、解释、代码块标记：\n<narration>旁白内容</narration>\n<char_thought>内心独白</char_thought>\n<char_dialogue>对话内容</char_dialogue>\n<options>\n选项1文本|好感变化\n选项2文本|好感变化\n选项3文本|好感变化\n</options>\n违反此格式的输出将被视为无效。';

    // ── 注入 archiveMemory 到系统 prompt ──
    let systemPromptWithMemory = SYSTEM_PROMPT_GENERATE_EVENT;
    const archiveMemoryPrompt = this.buildArchiveMemoryPrompt(state);
    if (archiveMemoryPrompt) {
      systemPromptWithMemory += '\n\n' + archiveMemoryPrompt;
    }

    // ── 豁免权道具反应注入 ──
    if (state.justGotImmunity) {
      userPrompt += `\n\n【道具提示】Char刚刚获得了一个豁免权道具，他在这一轮的内心独白里必须对此有反应，反应方式完全根据他的人设性格来：
活泼/年下型：可以非常夸张地惊喜
高冷型：表面淡定但内心震动
傲娇型：嘴上说不稀罕但其实很在意
无论哪种，都要体现出他把攻略User当成一件很认真的事在对待`;
      state.justGotImmunity = false;
    }

    // ── 读档后策略调整注入 ──
    if (state.justReloaded) {
      userPrompt += '\n\n【⚠️ 重要：Char刚刚读档回到了这个时间点】\nChar刚刚读档回到了这个时间点，他需要重新开始，但要换一个不同的策略。\n禁止重复上一次读档后说过的话或做过的事，必须有明显的策略调整。\nChar的内心独白中应该体现"这次要换个方式""上次的路子不对"之类的思路转变。\nChar的行为、话术、切入角度都必须和上一轮读档后完全不同。';
      // 清除 justReloaded 标志，避免后续每轮都注入
      state.justReloaded = false;
    }

    const messages = [
      { role: 'system', content: systemPromptWithMemory },
      { role: 'user', content: userPrompt },
    ];

    // ── 4. 调用 API（优先流式，失败回退非流式），含容错重试逻辑 ──
    // 最多自动重试 3 次（格式错误/截断/char_thought 缺失/必需标签缺失）
    const MAX_AUTO_RETRY = 3;

    const parseAIRaw = (rawText: string): any => {
      if (rawText.includes('<narration>') || rawText.includes('<char_thought>') || rawText.includes('<char_dialogue>')) {
        return parseTagBasedResponse(rawText);
      }
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      } catch {
        console.error('Failed to parse response:', rawText);
        throw new Error('Invalid response format from AI');
      }
    };

    for (let attempt = 0; attempt <= MAX_AUTO_RETRY; attempt++) {
      let aiResponse: any;
      let rawText = '';

      if (onStream) {
        try {
          rawText = await this.callAIStream(apiConfig, messages, onStream, 0.6);

          // ── 解析容错：检查代码块或格式错误 ──
          if (this._hasFormatErrors(rawText) && attempt < MAX_AUTO_RETRY) {
            console.warn(`AI 返回包含代码块或格式错误，自动重试（第${attempt + 1}次）...`);
            continue;
          }

          // ── token 截断检测：检查未闭合标签 ──
          if (this._hasUnclosedTags(rawText) && attempt < MAX_AUTO_RETRY) {
            console.warn(`AI 返回存在未闭合标签（token 截断），自动重试（第${attempt + 1}次）...`);
            continue;
          }

          aiResponse = parseAIRaw(rawText);
        } catch (streamError: any) {
          console.warn('Streaming failed, falling back to non-streaming:', streamError.message);
          const rawContent = await this.callAI(apiConfig, messages, false, 0.6);
          if (typeof rawContent === 'string') {
            rawText = rawContent;

            // ── 解析容错（非流式回退） ──
            if (this._hasFormatErrors(rawText) && attempt < MAX_AUTO_RETRY) {
              console.warn(`AI 返回包含代码块或格式错误（非流式），自动重试（第${attempt + 1}次）...`);
              continue;
            }

            // ── token 截断检测（非流式回退） ──
            if (this._hasUnclosedTags(rawText) && attempt < MAX_AUTO_RETRY) {
              console.warn(`AI 返回存在未闭合标签（非流式），自动重试（第${attempt + 1}次）...`);
              continue;
            }

            aiResponse = parseAIRaw(rawContent);
          } else {
            aiResponse = rawContent;
          }
        }
      } else {
        const rawContent = await this.callAI(apiConfig, messages, false, 0.6);
        if (typeof rawContent === 'string') {
          rawText = rawContent;

          // ── 解析容错 ──
          if (this._hasFormatErrors(rawText) && attempt < MAX_AUTO_RETRY) {
            console.warn(`AI 返回包含代码块或格式错误，自动重试（第${attempt + 1}次）...`);
            continue;
          }

          // ── token 截断检测 ──
          if (this._hasUnclosedTags(rawText) && attempt < MAX_AUTO_RETRY) {
            console.warn(`AI 返回存在未闭合标签（token 截断），自动重试（第${attempt + 1}次）...`);
            continue;
          }

          aiResponse = parseAIRaw(rawContent);
        } else {
          aiResponse = rawContent;
        }
      }

      // ── 必需标签完整性校验：4个标签的开闭标记必须全部存在 ──
      if (rawText && !this._validateAllRequiredTags(rawText) && attempt < MAX_AUTO_RETRY) {
        console.warn(`必需标签不完整（缺少 narration/char_thought/char_dialogue/options 中的某个），静默重试（第${attempt + 1}次）...`);
        messages[messages.length - 1].content += '\n\n上次输出格式不正确，请严格重新输出，只输出规定格式内容，不要任何额外文字。';
        continue;
      }

      // char_thought 验证：如果为空或缺失，重试
      if (!this._validateCharThought(aiResponse) && attempt < MAX_AUTO_RETRY) {
        console.warn(`char_thought 为空或缺失，正在重试（第${attempt + 1}次）...`);
        messages[messages.length - 1].content += '\n\n上次输出格式不正确，请严格重新输出，只输出规定格式内容，不要任何额外文字。';
        continue;
      }

      // ── 格式泄漏检测：如果解析后的文本中包含裸露XML标签，静默重试 ──
      if (this._hasLeakedTags(aiResponse) && attempt < MAX_AUTO_RETRY) {
        console.warn(`检测到格式泄漏（XML标签出现在渲染文本中），静默重试（第${attempt + 1}次）...`);
        messages[messages.length - 1].content += '\n\n上次输出格式不正确，请严格重新输出，只输出规定格式内容，不要任何额外文字。请严格按格式输出，不要在文本中出现标签字符串本身（如<narration>、<char_thought>等），这些标签只用于结构分隔，不要出现在内容文字里。';
        continue;
      }

      return this._parseEventResponse(aiResponse, state, customInput, userAction, userReactionText);
    }

    // 所有重试都失败，抛出错误提示
    throw new Error('AI 返回格式异常（已重试3次），请稍后重试');
  },

  async useSpecialReset(apiConfig: ApiConfig, state: NPCGameState): Promise<GameEvent> {
    const prompt = `你是一个恋爱冒险游戏的编剧。这是攻略者(Char)"${state.char.name}"使用了【攻略道具/氪金改命】来攻略 User(被攻略的NPC)"${state.user.name}"。
背景设定：${state.background}
User当前对Char的好感度：${state.user.affection}/100，当前黑化值：${state.user.darkening}/100。

请生成一个极其突兀、打破常规的【特殊互动事件】（例如突然强制壁咚、送极度贵重的礼物、直接表白等），试图强行大幅改变User对Char的好感度。
请体现出攻略者作为"玩家"使用了道具作弊的感觉。
必须区分旁白、对话和内心思考。
必须返回严格的JSON格式：
{
  "type": "special",
  "description": "场景突变，旁白描述",
  "charAction": "Char极其出格的行动/对话",
  "charThought": "Char的内心思考（例如：用了这个SR级别道具，好感度总该满了吧！）",
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
        { text: '推开', affectionDelta: 0, darkeningDelta: 10 },
      ],
    };
  },

  /**
   * 生成预设选项（保留用于向后兼容，但主流程不再单独调用此方法，
   * 而是直接使用 generateNextEvent 返回的 choices / dailyChoices）。
   */
  async generatePresetOptions(
    apiConfig: ApiConfig,
    state: NPCGameState,
    eventType: 'daily' | 'interaction' = 'interaction',
    recentEvents?: GameEvent[],
  ): Promise<PresetOption[]> {
    const conversationHistory = this.buildConversationHistory(recentEvents || [], state.user.name, state.char.name);

    let lastCharDialogue = '';
    let lastUserDialogue = '';
    let lastNarration = '';
    if (recentEvents && recentEvents.length > 0) {
      const lastEvt = recentEvents[recentEvents.length - 1];
      lastCharDialogue = lastEvt.charAction || '';
      lastUserDialogue = lastEvt.userDialogue || '';
      lastNarration = lastEvt.description || '';
    }

    const prompt = `你是一个恋爱冒险游戏的选项生成器。为User生成3个自然回应选项。

${lastCharDialogue ? `上轮Char（${state.char.name}）：「${lastCharDialogue}」` : ''}
${lastUserDialogue ? `上轮User（${state.user.name}）：「${lastUserDialogue}」` : ''}
${lastNarration ? `场景：「${lastNarration}」` : ''}

背景：${state.background}
Char：${state.char.name}（${state.char.personality}）
好感度：${state.user.affection}/100
事件类型：${eventType === 'daily' ? '日常（User日常行动）' : '互动（对Char回应）'}

${conversationHistory ? `【对话历史】\n${conversationHistory}` : ''}

返回JSON数组：[{"text":"选项","affectionDelta":数字}]
${eventType === 'daily' ? 'affectionDelta统一为0。' : '注意：好感度变化要克制！只有当前场景属于关键情感转折点（如表白、冲突、和解、重大帮助等）时，才设置非零的affectionDelta(-5~5)；如果只是普通日常对话或闲聊，所有选项的affectionDelta都必须为0。3个选项分别体现积极/消极/中立态度。'}
只返回JSON数组。`;

    try {
      const response = await this.callAI(apiConfig, prompt, true);
      if (Array.isArray(response) && response.length > 0) {
        return response.slice(0, 3).map((item: any) => ({
          text: item.text || '未知选项',
          affectionDelta: eventType === 'daily' ? 0 : typeof item.affectionDelta === 'number' ? Math.max(-5, Math.min(5, item.affectionDelta)) : 0,
        }));
      }
      const arr = response.options || response.choices || response.reactions;
      if (Array.isArray(arr)) {
        return arr.slice(0, 3).map((item: any) => ({
          text: item.text || '未知选项',
          affectionDelta: eventType === 'daily' ? 0 : typeof item.affectionDelta === 'number' ? Math.max(-5, Math.min(5, item.affectionDelta)) : 0,
        }));
      }
      throw new Error('Invalid format');
    } catch (e) {
      console.error('Failed to generate preset options:', e);
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

  // ════════════════════════════════════════
  // 读档系统
  // ════════════════════════════════════════

  /**
   * 创建一个自动存档快照
   */
  createAutoSavePoint(state: NPCGameState, eventList: GameEvent[]): AutoSavePoint {
    return {
      id: Date.now(),
      round: state.turnCount,
      affection: state.user.affection,
      stats: JSON.parse(JSON.stringify(state.user.customStats || {})),
      events: JSON.parse(JSON.stringify(eventList)),
    };
  },

  /**
   * 检查是否需要创建自动存档，并在满足条件时创建
   * 触发条件：
   * - 好感度每上升10点
   * - 里程碑事件触发前
   * - 每5轮剧情推进一次
   * 
   * 返回更新后的 state（含新存档点）
   */
  checkAndCreateAutoSave(
    state: NPCGameState,
    eventList: GameEvent[],
    isMilestoneTrigger: boolean = false,
  ): NPCGameState {
    const newState = { ...state };
    if (!newState.autoSavePoints) newState.autoSavePoints = [];
    
    const lastSaveAffection = newState.lastAutoSaveAffection ?? 0;
    const lastSaveRound = newState.lastAutoSaveRound ?? 0;
    const currentAffection = newState.user.affection;
    const currentRound = newState.turnCount;

    let shouldSave = false;

    // 条件1：好感度每上升10点
    if (currentAffection >= lastSaveAffection + 10) {
      shouldSave = true;
    }

    // 条件2：里程碑事件触发前
    if (isMilestoneTrigger) {
      shouldSave = true;
    }

    // 条件3：每5轮剧情推进一次
    if (currentRound >= lastSaveRound + 5 && currentRound > 0) {
      shouldSave = true;
    }

    if (shouldSave) {
      const savePoint = this.createAutoSavePoint(newState, eventList);
      newState.autoSavePoints.push(savePoint);
      
      // 上限10个，超出删最旧的
      if (newState.autoSavePoints.length > 10) {
        newState.autoSavePoints = newState.autoSavePoints.slice(-10);
      }

      newState.lastAutoSaveAffection = currentAffection;
      newState.lastAutoSaveRound = currentRound;
    }

    return newState;
  },

  /**
   * 追加好感度变化记录（用于AI判断读档）
   */
  recordAffectionChange(state: NPCGameState, delta: number): NPCGameState {
    const newState = { ...state };
    if (!newState.affectionHistory) newState.affectionHistory = [];
    newState.affectionHistory.push(delta);
    // 只保留最近20条
    if (newState.affectionHistory.length > 20) {
      newState.affectionHistory = newState.affectionHistory.slice(-20);
    }
    return newState;
  },

  /**
   * 追加一条跨档记忆
   */
  addArchiveMemory(state: NPCGameState, charNote: string): NPCGameState {
    const newState = { ...state };
    if (!newState.archiveMemory) newState.archiveMemory = [];
    const attempt = newState.archiveMemory.length + 1;
    newState.archiveMemory.push({
      attempt,
      failedAt: newState.user.affection,
      charNote,
    });
    return newState;
  },

  /**
   * 构建 archiveMemory 注入到系统 prompt 的文本
   */
  buildArchiveMemoryPrompt(state: NPCGameState): string {
    if (!state.archiveMemory || state.archiveMemory.length === 0) return '';

    const lines: string[] = [];
    lines.push('【Char的读档历史，仅Char可见】');
    for (const mem of state.archiveMemory) {
      lines.push(`第${mem.attempt}次读档：好感度降至${mem.failedAt}时重来，原因：${mem.charNote}`);
    }
    lines.push(`（当前共读档${state.archiveMemory.length}次）`);
    lines.push('');
    lines.push('注意：Char完全不知道User有自主意识，他认为User是普通NPC。读档次数越多，他内心的困惑和挫败感越强烈，比如"奇怪，这个NPC到底什么逻辑""我都重来三次了还是不对"。禁止char意识到user在故意使坏。');
    return lines.join('\n');
  },

  /**
   * 调用AI判断Char此刻是否会选择读档重来
   * 增强版：包含里程碑节点触发检测和好感度下限保护
   * 
   * @param justTriggeredMilestone 是否刚刚触发了好感度里程碑节点（如果是则禁止读档）
   * 返回 { shouldReload: boolean, charNote: string }
   */
  async judgeCharReload(
    apiConfig: ApiConfig,
    state: NPCGameState,
    justTriggeredMilestone: boolean = false,
  ): Promise<{ shouldReload: boolean; charNote: string }> {
    // ── 前置硬性保护：里程碑节点刚触发时禁止读档 ──
    if (justTriggeredMilestone) {
      return { shouldReload: false, charNote: '' };
    }

    // ── 前置硬性保护：好感度下限保护 ──
    // 好感度高于上一次读档时的好感度 → 禁止触发读档
    const lastReloadAffection = state.lastReloadAffection ?? -Infinity;
    if (state.user.affection > lastReloadAffection && lastReloadAffection > -Infinity) {
      return { shouldReload: false, charNote: '' };
    }

    // ── 前置硬性保护：好感度呈上升趋势时禁止读档 ──
    const recentChanges = (state.affectionHistory || []).slice(-3);
    if (recentChanges.length >= 2) {
      const lastTwo = recentChanges.slice(-2);
      // 最近两次都是正向变化 → 上升趋势，禁止读档
      if (lastTwo.every(d => d > 0)) {
        return { shouldReload: false, charNote: '' };
      }
    }

    // 只有好感度呈下降趋势时，才提交给AI判断
    const hasDecline = recentChanges.some(d => d < 0);
    if (!hasDecline && recentChanges.length > 0) {
      // 没有任何下降记录，不触发读档
      return { shouldReload: false, charNote: '' };
    }
    
    // 构建 archiveMemory 上下文
    const archiveLines: string[] = [];
    if (state.archiveMemory && state.archiveMemory.length > 0) {
      for (const mem of state.archiveMemory) {
        archiveLines.push(`第${mem.attempt}次读档：好感度${mem.failedAt}时失败，原因：${mem.charNote}`);
      }
    }

    // 检查是否刚刚触发了好感度里程碑节点（二次确认）
    const milestones = state.affectionMilestones || [];
    const justTriggeredAny = milestones.some(m => m.triggered && m.value === state.user.affection);

    const prompt = `根据char的人设，判断他此刻是否会选择读档重来。

【Char人设】
名字：${state.char.name}
性格：${state.char.personality}
目标：${state.char.goal}
策略：${state.char.strategy}

【当前好感度】${state.user.affection}（范围-100~100）
【上次读档时的好感度】${lastReloadAffection === -Infinity ? '未读过档' : lastReloadAffection}

【当前好感度是否刚刚触发了里程碑节点】${justTriggeredAny ? '是' : '否'}
如果是，禁止触发读档。里程碑节点触发说明攻略在推进，不是失败。

【最近3次好感度变化记录】
${recentChanges.length > 0 ? recentChanges.map((d, i) => `第${i + 1}次：${d > 0 ? '+' : ''}${d}`).join('\n') : '暂无变化记录'}

【读档历史】
${archiveLines.length > 0 ? archiveLines.join('\n') : '尚未读过档'}

判断依据：
- 好感度高于上次读档时的好感度 → 禁止触发读档（说明在进步）
- 好感度刚刚触发了里程碑节点 → 禁止触发读档（节点说明攻略在推进）
- 只有好感度低于某个阈值且呈下降趋势时，才允许触发读档
- 傲娇/好胜人设：好感度连续下降2次就会触发
- 沉稳/成熟人设：好感度下降6次才触发
- 其他人设：根据人设性格自行判断敏感程度
- 如果archiveMemory显示已读档多次，char会更快触发，因为他越来越挫败

仅返回JSON，不要其他文字：
{"shouldReload": true或false, "charNote": "char此刻内心的一句话，体现他为什么决定重来，用第一人称，自然口语，不超过20字"}`;

    try {
      const result = await this.callAI(apiConfig, prompt, true, 0.4);
      return {
        shouldReload: result.shouldReload === true,
        charNote: result.charNote || '不对劲，再来一次。',
      };
    } catch (e) {
      console.error('Failed to judge char reload:', e);
      return { shouldReload: false, charNote: '' };
    }
  },

  /**
   * 执行读档：从 autoSavePoints 中找到"当前好感度触发读档的阈值之前，
   * 最近一个好感度高于触发阈值的存档点"，同时避免反复回到同一个节点。
   * archiveMemory 不恢复，保留全部记录。
   * 
   * 返回 { restoredState, restoredEvents, reloadCount } 或 null（无可用存档）
   */
  executeReload(
    state: NPCGameState,
    charNote: string,
  ): { restoredState: NPCGameState; restoredEvents: GameEvent[]; reloadCount: number } | null {
    const savePoints = state.autoSavePoints || [];
    if (savePoints.length === 0) return null;

    const currentAffection = state.user.affection;
    const lastReloadSaveId = state.lastReloadSaveId;

    // 策略：找到最近一个好感度高于当前值的存档点，但排除上次读档用过的节点
    let targetSave: AutoSavePoint | null = null;
    
    // 第一轮：排除上次读档目标节点，找最近一个好感度高于当前值的存档点
    for (let i = savePoints.length - 1; i >= 0; i--) {
      const sp = savePoints[i];
      if (sp.affection > currentAffection && sp.id !== lastReloadSaveId) {
        targetSave = sp;
        break;
      }
    }

    // 第二轮：如果排除后找不到，允许使用上次的节点但尝试找更早的存档点
    if (!targetSave) {
      for (let i = savePoints.length - 1; i >= 0; i--) {
        const sp = savePoints[i];
        if (sp.affection > currentAffection) {
          targetSave = sp;
          break;
        }
      }
    }

    // 第三轮：如果还没找到好感度更高的，用最新的存档点（但排除上次用过的）
    if (!targetSave) {
      for (let i = savePoints.length - 1; i >= 0; i--) {
        if (savePoints[i].id !== lastReloadSaveId) {
          targetSave = savePoints[i];
          break;
        }
      }
    }

    // 最后兜底：用最新的存档点
    if (!targetSave && savePoints.length > 0) {
      targetSave = savePoints[savePoints.length - 1];
    }

    if (!targetSave) return null;

    // 保留当前的 archiveMemory 和 autoSavePoints
    const currentArchiveMemory = state.archiveMemory ? [...state.archiveMemory] : [];
    const currentAutoSavePoints = state.autoSavePoints ? [...state.autoSavePoints] : [];

    // 先追加本次读档记忆
    const newAttempt = currentArchiveMemory.length + 1;
    currentArchiveMemory.push({
      attempt: newAttempt,
      failedAt: state.user.affection,
      charNote,
    });

    // 恢复事件列表
    const restoredEvents: GameEvent[] = JSON.parse(JSON.stringify(targetSave.events));

    // 在事件流末尾插入分隔线事件
    const separatorEvent: GameEvent = {
      id: `reload_separator_${Date.now()}`,
      type: 'special',
      description: `── 第${newAttempt}次重来 ──`,
      userDialogue: '',
      charAction: '',
      charThought: '',
    };
    restoredEvents.push(separatorEvent);

    // 保留当前的 immunityCount（豁免权不随读档恢复，全局保留）
    const currentImmunityCount = state.immunityCount ?? 0;

    // 恢复游戏状态
    const restoredState: NPCGameState = {
      ...state,
      user: {
        ...state.user,
        affection: targetSave.affection,
        customStats: JSON.parse(JSON.stringify(targetSave.stats)),
      },
      turnCount: targetSave.round,
      events: restoredEvents,
      currentEvent: restoredEvents.length > 1 ? restoredEvents[restoredEvents.length - 2] : null,
      // 不恢复 archiveMemory，保留全部记录
      archiveMemory: currentArchiveMemory,
      // 保留 autoSavePoints
      autoSavePoints: currentAutoSavePoints,
      // 重置好感度变化历史
      affectionHistory: [],
      // 记录本次读档目标节点ID，防止反复回到同一节点
      lastReloadSaveId: targetSave.id,
      // 标记刚刚读档，下次生成剧情时注入策略调整prompt
      justReloaded: true,
      // 记录本次读档时的好感度（用于下限保护：后续好感度高于此值时禁止再触发读档）
      lastReloadAffection: currentAffection,
      // 豁免权不随读档恢复，全局保留
      immunityCount: currentImmunityCount,
    };

    return {
      restoredState,
      restoredEvents,
      reloadCount: newAttempt,
    };
  },

  /**
   * 生成手动结束时的结局文本（用户主动选择结束游戏时调用）
   * 根据当前好感度生成对应结局：好感高=圆满，好感低=遗憾
   */
  async generateEnding(apiConfig: ApiConfig, state: NPCGameState): Promise<string> {
    const relationLabel = state.relationshipStage === 'together' ? '已确认恋人关系' : '仍在追求中';
    const prompt = `你是一个恋爱游戏编剧。玩家选择了结束游戏。
    User（被攻略的NPC）："${state.user.name}"（${state.user.gender || '未知'}）
    Char（攻略者）："${state.char.name}"（${state.char.gender || '未知'}）
    User对Char的最终好感度：${state.user.affection}/100
    当前关系阶段：${relationLabel}
    背景：${state.background}
    Char性格：${state.char.personality}
    历史事件摘要：${state.eventHistory.slice(-10).join('; ')}
    
    请根据当前好感度和关系阶段，生成一段结局文本（300字左右）。
    - 如果好感度高（70+）且已确认关系：圆满的恋人结局，两人在一起的温馨日常
    - 如果好感度高（70+）但仍在追求中：Char攻略接近成功，留有甜蜜余韵的开放结局
    - 如果好感度中等（30-70）：Char攻略尚未成功，留有遗憾但也有希望的开放式结局
    - 如果好感度低（30以下）：Char攻略失败，留有遗憾的开放式结局，体现Char的不甘和困惑
    
    要求：
    - 用角色真名，不要用"Char"和"User"
    - 人称代词匹配角色性别
    - 文风自然、有画面感
    - 禁止出现病娇/囚禁/暴力结局
    请直接返回结局文本内容，不要加任何前缀后缀。`;

    return await this.callAI(apiConfig, prompt, false);
  },

  /**
   * 好感度达到100时，生成表白/关系升级的特殊剧情事件
   * 游戏不结束，进入"恋人模式"（relationshipStage = 'together'）
   */
  async generateConfessionEvent(
    apiConfig: ApiConfig,
    state: NPCGameState,
    recentEvents?: GameEvent[],
    onStream?: (accumulatedText: string) => void,
  ): Promise<GameEvent> {
    const recentContext = recentEvents && recentEvents.length > 0
      ? recentEvents.slice(-3).map(e => {
          const parts: string[] = [];
          if (e.description) parts.push(`旁白：${e.description}`);
          if (e.charAction) parts.push(`Char：${e.charAction}`);
          if (e.userDialogue) parts.push(`User：${e.userDialogue}`);
          return parts.join(' | ');
        }).join('\n')
      : '（无近期剧情）';

    const systemPrompt = `你是一个沉浸式文字角色扮演的剧情引擎。好感度已达到满值100，Char的攻略终于成功了！现在需要生成一段表白/关系确认的特殊剧情。

角色信息：
- Char（攻略者）：${state.char.name}（${state.char.gender || '未知'}），${state.char.personality}
- User（被攻略NPC）：${state.user.name}（${state.user.gender || '未知'}）
- 世界背景：${state.background}
- Char的目标：${state.char.goal}

近期剧情：
${recentContext}

请生成一段Char向User表白/关系质变的特殊场景。这段剧情应该：
1. 自然承接近期剧情，不突兀
2. 体现Char作为"玩家"终于通关的喜悦（在内心独白中），但表面上是真情实感的表白
3. 是一个温馨、有画面感的场景
4. 用角色真名替代Char/User
5. 人称代词严格匹配性别
6. 表白后关系升级，但游戏会继续——后续进入恋人模式

输出格式：
<narration>
场景描写，有画面感，3-5句。描绘一个适合表白的氛围。
</narration>

<char_thought>
Char的内心独白。体现他作为玩家"终于通关"的复杂心情——既有策略成功的成就感，也有真实的心动。
</char_thought>

<char_dialogue>
Char的表白台词和动作。对话用「」，动作用括号。要符合Char的人设性格，不要油腻。
</char_dialogue>

<options>
三个User的反应选项。格式：选项文本|好感度变化
（此处好感度变化都写0，因为已经满值）
</options>`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: '好感度达到100，请生成表白/关系确认的特殊剧情。' },
    ];

    let aiResponse: any;

    if (onStream) {
      try {
        const rawText = await this.callAIStream(apiConfig, messages, onStream, 0.7);
        if (rawText.includes('<narration>') || rawText.includes('<char_thought>')) {
          aiResponse = parseTagBasedResponse(rawText);
        } else {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
        }
      } catch {
        const rawContent = await this.callAI(apiConfig, messages, false, 0.7);
        if (typeof rawContent === 'string' && rawContent.includes('<narration>')) {
          aiResponse = parseTagBasedResponse(rawContent);
        } else {
          aiResponse = rawContent;
        }
      }
    } else {
      const rawContent = await this.callAI(apiConfig, messages, false, 0.7);
      if (typeof rawContent === 'string' && rawContent.includes('<narration>')) {
        aiResponse = parseTagBasedResponse(rawContent);
      } else if (typeof rawContent === 'string') {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
      } else {
        aiResponse = rawContent;
      }
    }

    return {
      id: `confession_${Date.now()}`,
      type: 'special',
      description: aiResponse.narration || aiResponse.description || '空气中弥漫着一种特别的气氛...',
      charAction: aiResponse.charDialogue || aiResponse.charAction || '',
      charThought: aiResponse.charThought || '',
      choices: aiResponse.choices,
      dailyChoices: this.getFallbackDailyChoices(aiResponse.narration || ''),
    };
  },

  /**
   * 生成开局背景旁白（50-80字），交代当前场景和两人初次相遇的情境
   * 在游戏第一轮正式生成剧情之前调用
   */
  async generateOpeningNarration(
    apiConfig: ApiConfig,
    state: NPCGameState,
  ): Promise<string> {
    const prompt = `你是一个沉浸式文字角色扮演的剧情引擎。请为以下恋爱游戏生成一段开场旁白。

【世界背景】${state.background}
【User（被攻略NPC）】${state.user.name}（${state.user.gender || '未知'}）
【Char（攻略者）】${state.char.name}（${state.char.gender || '未知'}），${state.char.personality}

要求：
- 50-80字的开场旁白
- 交代当前场景（在哪里、什么时候、什么氛围）
- 交代两人初次相遇或即将相遇的情境
- 用角色真名，不要用"Char"和"User"
- 人称代词匹配性别
- 文风自然、有画面感，像小说开头
- 不要包含对话，只是场景描写和氛围铺垫
- 不要使用任何标签格式，直接输出纯文本

直接返回旁白文本，不要加任何前缀后缀或引号。`;

    try {
      const result = await this.callAI(apiConfig, prompt, false, 0.7);
      return typeof result === 'string' ? result.trim() : '故事即将开始...';
    } catch (e) {
      console.error('Failed to generate opening narration:', e);
      return '故事即将开始...';
    }
  },
};
