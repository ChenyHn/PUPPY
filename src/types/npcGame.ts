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

  statsSchema?: { name: string; initialValue: number }[]; // 数值定义

  // Char（攻略者/玩家角色，主动攻略User）数据
  char: {
    id: string;
    name: string;
    avatar?: string;
    personality: string;       // 性格描述
    goal: string;              // 攻略目标（让User爱上自己）
    strategy: string;          // 当前策略（由AI决定）
    remainingResets: number;   // 剩余“氪金改命”次数（Char专用）
  };
  
  // 历史事件摘要（用于AI生成下一事件）
  eventHistory: string[];
  lastEventType: 'daily' | 'interaction';
  
  // 游戏进度
  turnCount: number;
  isGameOver: boolean;
  ending?: string;
  
  // 保存当前事件以便读档恢复
  currentEvent?: GameEvent | null;
  
  // 完整事件列表（用于读档后恢复历史记录滚动）
  events?: GameEvent[];
}

export interface GameEvent {
  id: string;
  type: 'daily' | 'interaction' | 'special';
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
