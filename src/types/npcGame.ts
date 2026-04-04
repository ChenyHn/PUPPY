// ═══════════════════════════════════════
// 自动存档快照
// ═══════════════════════════════════════
export interface AutoSavePoint {
  id: number;              // 时间戳
  round: number;           // 当前轮数
  affection: number;       // 当前好感度
  stats: Record<string, number>; // 当前所有属性值
  events: GameEvent[];     // 完整事件历史数组的深拷贝
}

// ═══════════════════════════════════════
// 跨档记忆
// ═══════════════════════════════════════
export interface ArchiveMemoryEntry {
  attempt: number;         // 第几次读档（从1开始累计）
  failedAt: number;        // 触发读档时的好感度数值
  charNote: string;        // AI返回的读档原因
}

export interface AffectionMilestone {
  value: number;           // 触发阈值（30, 60, 100）
  triggered: boolean;      // 是否已触发
  type: 'first_move' | 'key_event' | 'confession';
}

export interface StatMilestone {
  value: number;           // 触发阈值（如50、100）
  event: string;           // 触发事件名称
  triggered?: boolean;     // 是否已触发
}

export interface StatSchema {
  name: string;            // 属性名（有画面感，和剧本强相关）
  description: string;     // 属性定义：代表什么、如何变化
  initialValue: number;    // 初始值
  milestones: StatMilestone[];  // 里程碑事件（50和100各一个）
}

export interface NPCGameState {
  // 游戏基础
  gameId: string;
  background: string;          // 背景描述
  createdAt: string;
  
  // User（玩家扮演的NPC，被攻略者）数据
  user: {
    name: string;
    gender?: string;           // 性别
    avatar?: string;
    dailyRoutine?: string;     // 当前日常行动描述
    location?: string;         // 当前位置
    // 情绪/关系数值
    affection: number;         // User对Char的好感度（0~100）
    darkening: number;         // 黑化值（0~100）
    customStats?: Record<string, number>; // 剧本专属数值（系统根据User反应变化）
  };

  statsSchema?: StatSchema[]; // 数值定义（含描述和里程碑）

  // Char（攻略者/玩家角色，主动攻略User）数据
  char: {
    id: string;
    name: string;
    gender?: string;           // 性别
    avatar?: string;
    personality: string;       // 性格描述
    goal: string;              // 攻略目标（让User爱上自己）
    strategy: string;          // 当前策略（由AI决定）
    remainingResets: number;   // 剩余"氪金改命"次数（Char专用）
  };
  
  // 历史事件摘要（用于AI生成下一事件）
  eventHistory: string[];
  lastEventType: 'daily' | 'interaction' | 'special' | 'milestone';
  
  // 游戏进度
  turnCount: number;
  isGameOver: boolean;
  ending?: string;
  relationshipStage?: 'pursuing' | 'together'; // 关系阶段：pursuing=追求中, together=已确认关系
  
  // 好感度节点系统
  affectionMilestones?: AffectionMilestone[];

  // 保存当前事件以便读档恢复
  currentEvent?: GameEvent | null;
  
  // 完整事件列表（用于读档后恢复历史记录滚动）
  events?: GameEvent[];

  // ═══ 读档系统 ═══
  autoSavePoints?: AutoSavePoint[];       // 自动存档点（上限10个）
  manualSavePoints?: AutoSavePoint[];     // 手动存档点（独立数组）
  archiveMemory?: ArchiveMemoryEntry[];   // 跨档记忆（永不清空）
  affectionHistory?: number[];            // 最近好感度变化记录（用于AI判断读档）
  lastAutoSaveAffection?: number;         // 上次自动存档时的好感度（用于每10点触发）
  lastAutoSaveRound?: number;             // 上次自动存档时的轮数（用于每5轮触发）
}

export interface GameEvent {
  id: string;
  type: 'daily' | 'interaction' | 'special' | 'milestone';
  description: string;         // 剧情文本
  userDialogue?: string;       // User 说的话或行动描述
  choices?: ReactionChoice[];  // 仅 interaction 时有选项
  dailyChoices?: string[];     // 仅 daily 时有选项
  charAction?: string;         // Char的行动/对话
  charThought?: string;        // Char的内心思考
  shouldReload?: boolean;      // 是否触发了读档
  reloadReason?: string;       // 读档原因
  result?: {
    affectionDelta?: number; // 废弃：好感度只能由用户选择/操作触发
    darkeningDelta: number;
    customStatsDelta?: Record<string, number>;
  };
  // 里程碑触发信息
  milestoneInfo?: {
    statName: string;
    value: number;
    eventName: string;
  };
}

export interface ReactionChoice {
  text: string;                // 按钮文字（如"开心接受"）
  affectionDelta: number;
  darkeningDelta: number;
  customStatsDelta?: Record<string, number>; // 自定义数值变动
}

export interface PresetOption {
  text: string;                // 选项文字
  affectionDelta: number;      // 好感度变化 (-5~5)
}
