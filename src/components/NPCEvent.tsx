import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameEvent } from '../types/npcGame';

interface NPCEventProps {
  event: GameEvent;
  charName: string;
  userAvatar?: string;
}

import { MessageCircle, BrainCircuit, RefreshCw, User } from 'lucide-react';

export const NPCEvent = memo(function NPCEvent({ event, charName, userAvatar }: NPCEventProps) {
  // 判断是否为临时用户气泡（仅显示用户发言，等待 AI 响应）
  const isUserBubbleOnly = event.id.startsWith('user_');

  // 读档分隔线事件：居中灰色小字，上下各一条细线
  const isReloadSeparator = event.id.startsWith('reload_separator_');
  if (isReloadSeparator) {
    return (
      <div className="flex items-center gap-3 my-4 px-4">
        <div className="flex-1 h-px bg-zinc-300/50 dark:bg-zinc-600/50" />
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium whitespace-nowrap tracking-wider">
          {event.description}
        </span>
        <div className="flex-1 h-px bg-zinc-300/50 dark:bg-zinc-600/50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 读档提示 */}
      <AnimatePresence>
        {event.shouldReload && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-xl text-xs font-bold w-fit"
          >
            <RefreshCw size={14} className="animate-[spin_3s_linear_infinite]" />
            <span>【时空回溯】{event.reloadReason || 'Char 触发了读档...'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User的对话/行动 - 靠右对齐 */}
      <AnimatePresence>
        {event.userDialogue && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex gap-2 items-start justify-end mb-1"
          >
            <div className="text-right">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-0.5 block">我</span>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-medium">
                {event.userDialogue}
              </p>
            </div>
            {userAvatar ? (
              <img src={userAvatar} alt="我" className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-zinc-500/20" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-200/50 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-zinc-500/20">
                <User size={12} className="text-zinc-500 dark:text-zinc-400" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 如果是临时用户气泡，不渲染旁白和 Char 内容 */}
      {!isUserBubbleOnly && (
        <>
          {/* 场景/旁白描述 - 纯文本，无背景（仅在有内容时显示） */}
          {event.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed tracking-wide whitespace-pre-wrap"
            >
              {event.description}
            </motion.div>
          )}

          {/* Char的内心思考 - 斜体，灰色，无背景 */}
          <AnimatePresence>
            {event.charThought && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-2 items-start"
              >
                <BrainCircuit size={14} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                <div className="text-sm italic text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                  {event.charThought}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Char的行动/对话 - 加粗，带引号标记，无背景 */}
          <AnimatePresence>
            {event.charAction && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
                className="flex gap-2 items-start"
              >
                <MessageCircle size={14} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-0.5 block">{charName}</span>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white whitespace-pre-wrap leading-relaxed">
                    「{event.charAction}」
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // 只在 event id 或内容变化时重渲染
  return prevProps.event.id === nextProps.event.id
    && prevProps.event.description === nextProps.event.description
    && prevProps.event.userDialogue === nextProps.event.userDialogue
    && prevProps.event.charAction === nextProps.event.charAction
    && prevProps.event.charThought === nextProps.event.charThought
    && prevProps.charName === nextProps.charName
    && prevProps.userAvatar === nextProps.userAvatar;
});
