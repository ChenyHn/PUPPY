export type Screen = 'splash' | 'lock' | 'password-setup' | 'password-unlock' | 'home' | 'app-chat' | 'app-settings' | 'ai-chat' | 'app-appearance' | 'app-persona' | 'app-phone-list' | 'app-world' | 'app-world-edit' | 'app-favorites' | 'app-heartbeat-npc' | 'app-music' | 'app-shopping';
export type WorldBookScope = 'global' | 'local';

export interface WorldBook {
  id: string;
  title: string;
  content: string;
  scope: WorldBookScope;
  isActive: boolean;
  boundPersonas: string[];
  folderId?: string;
}

export interface WorldBookFolder {
  id: string;
  name: string;
}

export type ChatTab = 'messages' | 'contacts' | 'moments' | 'me';

export interface Persona {
  id: string;
  name: string;
  gender: string;
  chatName: string;
  chatId: string;
  avatar: string | null;
  height: string;
  weight: string;
  age: string;
  occupation: string;
  location: string;
  personality: string;
  bio: string;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  models: string[];
  temperature: number;
  maxTokens: number;
  contextMessageCount: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  persona: string;
  color: string;
}

export interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  createdAt: number;
  isPinned: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  groupId?: string;
  quote?: { content: string; sender: string };
  timestamp: number;
  isMergedForward?: boolean;
  originalMessages?: {
    content: string;
    sender: string;
    timestamp: number;
  }[];
  messageType?: 'text' | 'image' | 'redpacket' | 'gift' | 'location' | 'custom_gift' | 'system';
  giftData?: {
    imageUrl: string;
    name?: string;
    message?: string;
  };
  locationData?: {
    type: 'real' | 'virtual';
    name: string;
    lat?: number;
    lon?: number;
    mapUrl?: string;
  };
  specialData?: any;
}

export interface ChatSettings {
  remark: string;
  background: string;
  isBlocked: boolean;
  isPinned: boolean;
  isAutoSummaryEnabled?: boolean;
  autoSummaryThreshold?: number;
  lastSummaryMessageIndex?: number;
  timeAwareness?: boolean;
  showAvatar?: boolean;
  lastInteractionTime?: number;
  patSuffix?: string;
  longDistanceMode?: boolean;
  backgroundImage?: string;
  customBubbleCSS?: string;
}

export interface FavoriteItem {
  id: string;
  messageId: string;
  contactId: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: number;
}

export interface IconStyleConfig {
  isEnabled: boolean;
  borderRadius: number;
  iconSize: number;
  bgOpacity: number;
  bgLightColor: string;
  bgDarkColor: string;
  shadowIntensity: number;
  iconLightColor: string;
  iconDarkColor: string;
  shadowColorMode?: 'auto' | 'custom';
  shadowLightColor?: string;
  shadowDarkColor?: string;
  colorMode?: 'auto' | 'custom';
  customBgColor?: string;
  customIconColor?: string;
}
