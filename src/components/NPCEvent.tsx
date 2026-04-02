import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameEvent } from '../types/npcGame';

interface NPCEventProps {
  event: GameEvent;
  charName: string;
}

import { MessageCircle, BrainCircuit, RefreshCw } from 'lucide-react';

export function NPCEvent({ event, charName }: NPCEventProps) {
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

      {/* 场景/旁白描述 - 纯文本，无背景 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed tracking-wide whitespace-pre-wrap"
      >
        {event.description}
      </motion.div>

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
    </div>
  );
}
