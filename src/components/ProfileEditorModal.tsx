import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Camera, User } from 'lucide-react';

export interface CurrentUser {
  avatar: string | null;
  name: string;
  chatId: string;
  gender?: string;
  age?: number | string;
  occupation?: string;
  location?: string;
  personality?: string;
  background?: string;
}

interface ProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onSave: (user: CurrentUser) => void;
}

export function ProfileEditorModal({ isOpen, onClose, currentUser, onSave }: ProfileEditorModalProps) {
  const [formData, setFormData] = useState<CurrentUser>(currentUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frostedBarClassName = 'bg-white/80 dark:bg-black/80 backdrop-blur-md';
  const fieldLabelClassName = 'block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1';
  const fieldInputClassName = 'w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 border-none outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 transition-all';
  const fieldTextareaClassName = `${fieldInputClassName} resize-none`;

  const handleChange = (field: keyof CurrentUser, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, avatar: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('姓名不能为空');
      return;
    }
    if (!formData.chatId.trim()) {
      alert('ID不能为空');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 z-50 bg-neutral-50 dark:bg-black flex flex-col"
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-4 sticky top-0 z-10 ${frostedBarClassName}`}>
            <button
              onClick={onClose}
              className="p-2 -ml-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-base font-bold text-zinc-800 dark:text-zinc-100">编辑个人资料</span>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <div 
                className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.avatar ? (
                  <img src={formData.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-zinc-400 dark:text-zinc-500" />
                )}
                <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center transition-colors">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">点击更换头像</span>
            </div>

            {/* Form Fields */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
              <div>
                <label className={fieldLabelClassName}>姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={fieldInputClassName}
                  placeholder="请输入姓名"
                />
              </div>

              <div>
                <label className={fieldLabelClassName}>ID</label>
                <input
                  type="text"
                  value={formData.chatId}
                  onChange={(e) => handleChange('chatId', e.target.value)}
                  className={fieldInputClassName}
                  placeholder="设置唯一ID"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelClassName}>性别</label>
                  <input
                    type="text"
                    value={formData.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className={fieldInputClassName}
                    placeholder="选填"
                  />
                </div>
                <div>
                  <label className={fieldLabelClassName}>年龄</label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className={fieldInputClassName}
                    placeholder="选填"
                  />
                </div>
              </div>

              <div>
                <label className={fieldLabelClassName}>职业</label>
                <input
                  type="text"
                  value={formData.occupation || ''}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  className={fieldInputClassName}
                  placeholder="选填"
                />
              </div>

              <div>
                <label className={fieldLabelClassName}>所在地</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className={fieldInputClassName}
                  placeholder="选填"
                />
              </div>

              <div>
                <label className={fieldLabelClassName}>性格</label>
                <input
                  type="text"
                  value={formData.personality || ''}
                  onChange={(e) => handleChange('personality', e.target.value)}
                  className={fieldInputClassName}
                  placeholder="选填"
                />
              </div>

              <div>
                <label className={fieldLabelClassName}>具体人设</label>
                <textarea
                  value={formData.background || ''}
                  onChange={(e) => handleChange('background', e.target.value)}
                  rows={4}
                  className={fieldTextareaClassName}
                  placeholder="选填，详细描述自己"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 border-t border-zinc-100 dark:border-zinc-800 sticky bottom-0 z-10 flex gap-4 ${frostedBarClassName}`}>
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-sm font-bold text-zinc-700 dark:text-zinc-300 active:scale-95 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3.5 rounded-2xl bg-black dark:bg-white text-sm font-bold text-white dark:text-black active:scale-95 transition-all"
            >
              保存
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
