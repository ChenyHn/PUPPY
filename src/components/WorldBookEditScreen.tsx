import React, { useState } from 'react';
import * as mammoth from 'mammoth';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, User, FileUp } from 'lucide-react';
import { StatusBar, GlassCard } from './Shared';

export const WorldBookEditScreen = ({ onBack, time, initialData, onSave, phonePersonas, folders }: any) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [scope, setScope] = useState<'global' | 'local'>(initialData?.scope || 'global');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [boundPersonas, setBoundPersonas] = useState<string[]>(initialData?.boundPersonas || []);
  const [folderId, setFolderId] = useState<string>(initialData?.folderId || '');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入内容');
      return;
    }
    onSave({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      content: content.trim(),
      scope,
      isActive,
      boundPersonas: scope === 'local' ? boundPersonas : [],
      folderId: folderId || undefined
    });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setContent((prev: any) => prev ? `${prev}\n\n${text}` : text);
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        setContent((prev: any) => prev ? `${prev}\n\n${text}` : text);
      } else {
        alert('仅支持导入 .txt 或 .docx 文件');
      }
    } catch (err) {
      console.error('导入失败:', err);
      alert('解析文件失败，请确保文件格式正确。');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const togglePersona = (id: string) => {
    setBoundPersonas((prev: any[]) => 
      prev.includes(id) ? prev.filter((pId: string) => pId !== id) : [...prev, id]
    );
  };

  return (
    <motion.div 
      key="app-world-edit"
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      exit={{ x: 0 }}
      transition={{ duration: 0 }}
      className="absolute inset-0 bg-zinc-50 dark:bg-black z-50 flex flex-col"
    >
      <StatusBar time={time} className="bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 dark:text-zinc-200" />
      
      <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-[#1c1c1e] border-b border-zinc-100 dark:border-zinc-800 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-100">{initialData ? '编辑世界书' : '创建世界书'}</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Check size={14} />
          保存
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <GlassCard className="p-4 flex flex-col gap-4 dark:!border-zinc-800 dark:!bg-[#1c1c1e]" opacity="0.8" blur="10px">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-1">标题 (必填)</label>
            <input 
              type="text" 
              placeholder="例如：修仙世界观"
              className="w-full bg-zinc-50/50 dark:bg-zinc-800/50 p-3 rounded-xl text-sm text-zinc-700 dark:text-zinc-100 outline-none border border-transparent focus:border-zinc-300 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-1">生效范围</label>
            <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${scope === 'global' ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm' : 'text-zinc-400 dark:text-zinc-500'}`}
                onClick={() => setScope('global')}
              >
                全局生效
              </button>
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${scope === 'local' ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm' : 'text-zinc-400 dark:text-zinc-500'}`}
                onClick={() => setScope('local')}
              >
                局部生效
              </button>
            </div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 px-1 mt-1">
              {scope === 'global' ? '全局只能激活一个，对所有角色生效（除非角色绑定了局部世界书）。' : '仅对选择的特定角色生效。'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-1">所属文件夹</label>
            <select 
              className="w-full bg-zinc-50/50 dark:bg-zinc-800/50 p-3 rounded-xl text-sm text-zinc-700 dark:text-zinc-100 outline-none border border-transparent appearance-none"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            >
              <option value="">未分类</option>
              {folders.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center px-1 py-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-100">是否激活</span>
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-200 dark:bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white dark:bg-[#1c1c1e] rounded-full transition-all ${isActive ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </GlassCard>

        {scope === 'local' && (
          <GlassCard className="p-4 flex flex-col gap-3 dark:!border-zinc-800 dark:!bg-[#1c1c1e]" opacity="0.8" blur="10px">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-1">选择绑定角色</label>
            {phonePersonas.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">暂无角色，请先在电话簿中添加。</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar">
                {phonePersonas.map((p: any) => (
                  <div 
                    key={p.id} 
                    onClick={() => togglePersona(p.id)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${boundPersonas.includes(p.id) ? 'bg-zinc-800 border-zinc-800 dark:bg-zinc-200 dark:border-zinc-200' : 'border-zinc-300 dark:border-zinc-600'}`}>
                      {boundPersonas.includes(p.id) && <Check size={12} className="text-white dark:text-[#1c1c1e]" />}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                      {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <User size={16} className="m-2 text-zinc-400" />}
                    </div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-100 font-medium truncate">{p.chatName || p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        <GlassCard className="p-4 flex flex-col gap-2 flex-1 min-h-[400px] dark:!border-zinc-800 dark:!bg-[#1c1c1e]" opacity="0.8" blur="10px">
          <div className="flex justify-between items-center px-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">世界观内容 (纯文本)</label>
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" 
                onChange={handleImportFile} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 rounded-full text-[10px] font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                <FileUp size={12} />
                {isImporting ? '导入中...' : '导入文件'}
              </button>
            </div>
          </div>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 px-1">建议保持内容精简，过长会消耗大量 Token 且影响对话响应速度。支持导入 .txt 和 .docx 文件提取纯文本。</p>
          <textarea 
            placeholder="在此输入或粘贴世界书内容..."
            className="w-full h-full flex-1 bg-transparent p-2 text-sm text-zinc-700 dark:text-zinc-100 outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 leading-relaxed"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </GlassCard>
      </div>
    </motion.div>
  );
};
