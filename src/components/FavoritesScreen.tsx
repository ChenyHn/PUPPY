import React from 'react';
import { ArrowLeft, Trash2, User, Bot, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FavoriteItem, Persona, Screen, ChatSettings } from '../types';

export interface FavoritesScreenProps {
  favorites: FavoriteItem[];
  setFavorites: React.Dispatch<React.SetStateAction<FavoriteItem[]>>;
  contacts: Persona[];
  chatSettings: Record<string, ChatSettings>;
  onBack: () => void;
  onJumpToChat: (contactId: string, messageId: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
}

export function FavoritesScreen(props: FavoritesScreenProps) {
  const { favorites, setFavorites, contacts, chatSettings, onBack, onJumpToChat } = props;
  const [toastMessage, setToastMessage] = React.useState('');

  // Sort by timestamp descending
  const sortedFavorites = [...favorites].sort((a, b) => b.timestamp - a.timestamp);

  const getContactName = (contactId: string): string => {
    if (contactId === 'ai_assistant') {
      const aiSettings = chatSettings['ai_assistant'];
      return aiSettings?.remark || 'AI 助手';
    }
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      const settings = chatSettings[contact.id];
      return settings?.remark || contact.chatName;
    }
    return '未知联系人';
  };

  const handleRemoveFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.filter(f => f.id !== id));
    setToastMessage('已取消收藏');
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleItemClick = (item: FavoriteItem) => {
    onJumpToChat(item.contactId, item.messageId);
  };

  return (
    <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-900 flex flex-col z-[70]">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
        <button onClick={onBack} className="text-zinc-400 dark:text-zinc-300 active:text-zinc-600 transition-colors">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <h2 className="text-[16px] font-bold text-zinc-800 dark:text-zinc-100">我的收藏</h2>
        <div className="w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {sortedFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-400 dark:text-zinc-500 gap-4">
            <Star size={48} strokeWidth={1} />
            <p className="text-xs font-bold tracking-widest uppercase">暂无收藏</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">长按聊天消息可以收藏</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {sortedFavorites.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="flex items-start gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors cursor-pointer bg-white dark:bg-zinc-900"
              >
                {/* Sender icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  item.sender === 'user' 
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800' 
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300'
                }`}>
                  {item.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Content area */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  {/* Top row: sender & contact */}
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-200">
                      {item.sender === 'user' ? '我' : 'AI'}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">→</span>
                    <span className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                      {getContactName(item.contactId)}
                    </span>
                  </div>

                  {/* Message content */}
                  <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3 break-words whitespace-pre-wrap">
                    {item.content}
                  </p>

                  {/* Time */}
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => handleRemoveFavorite(item.id, e)}
                  className="p-2 text-zinc-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-400 active:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                  title="取消收藏"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-zinc-800/80 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
