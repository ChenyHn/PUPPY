import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Filter, Plus, FolderOpen, Delete, Check, BookOpen, ChevronDown, ChevronRight, Folder, Pencil } from 'lucide-react';
import { StatusBar, GlassCard } from './Shared';

// Fallback FolderPlus icon component
const FolderPlus = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
    <line x1="12" y1="10" x2="12" y2="16"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
  </svg>
);

const WorldBookCard = ({ wb, toggleActive, onEdit, deleteWorldBook }: any) => (
  <GlassCard className={`p-4 flex flex-col gap-3 transition-colors border dark:!bg-[#1c1c1e] ${wb.isActive && wb.scope === 'global' ? 'border-zinc-800 dark:!border-zinc-400 shadow-[0_0_15px_rgba(39,39,42,0.1)]' : 'border-zinc-200/50 dark:!border-zinc-800'}`} opacity="0.8" blur="10px">
    <div className="flex justify-between items-start">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-zinc-800 dark:text-zinc-200 truncate text-[15px]">{wb.title}</h3>
          {wb.isActive && wb.scope === 'global' && (
            <span className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-200 shadow-sm" title="当前激活的全局世界书"></span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${wb.scope === 'global' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300' : 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-800'}`}>
            {wb.scope === 'global' ? '全局' : '局部'}
          </span>
          {wb.scope === 'local' && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">已绑定 {wb.boundPersonas.length} 角色</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
          <button 
          onClick={() => toggleActive(wb.id)}
          className={`w-10 h-5 rounded-full transition-colors relative ${wb.isActive ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-200 dark:bg-zinc-700'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white dark:bg-zinc-900 rounded-full transition-all ${wb.isActive ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
    </div>
    <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-700/50">
      <button 
        onClick={() => onEdit(wb)}
        className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full text-[10px] font-bold active:scale-95 transition-all flex items-center gap-1"
      >
        <Pencil size={12} />
        编辑
      </button>
      <button 
        onClick={() => deleteWorldBook(wb.id)}
        className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-400 hover:text-red-500 rounded-full text-[10px] font-bold active:scale-95 transition-all flex items-center gap-1"
      >
        <Delete size={12} />
        删除
      </button>
    </div>
  </GlassCard>
);

export const WorldBookListScreen = ({ onBack, time, worldBooks, setWorldBooks, folders, setFolders, onEdit, onAdd }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'local'>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const toggleActive = (id: string) => {
    setWorldBooks((prev: any[]) => {
      const target = prev.find(wb => wb.id === id);
      if (!target) return prev;
      
      const newActiveState = !target.isActive;
      
      return prev.map(wb => {
        if (wb.id === id) {
          return { ...wb, isActive: newActiveState };
        }
        // 当用户手动激活全局世界书时，其他全局世界书自动失效
        if (newActiveState && target.scope === 'global' && wb.scope === 'global') {
          return { ...wb, isActive: false };
        }
        return wb;
      });
    });
  };

  const deleteWorldBook = (id: string) => {
    setWorldBooks((prev: any[]) => prev.filter(wb => wb.id !== id));
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    if (editingFolderId) {
      setFolders((prev: any[]) => prev.map(f => f.id === editingFolderId ? { ...f, name: newFolderName.trim() } : f));
    } else {
      setFolders((prev: any[]) => [...prev, { id: Math.random().toString(36).substr(2, 9), name: newFolderName.trim() }]);
    }
    
    setNewFolderName('');
    setIsCreatingFolder(false);
    setEditingFolderId(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev: any[]) => prev.filter(f => f.id !== folderId));
    setWorldBooks((prev: any[]) => prev.map(wb => wb.folderId === folderId ? { ...wb, folderId: undefined } : wb));
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // 1. 过滤搜索和作用域
  const filteredBooks = worldBooks.filter((wb: any) => {
    const matchesSearch = wb.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScope = filterScope === 'all' || wb.scope === filterScope;
    return matchesSearch && matchesScope;
  });

  // 2. 将世界书分组
  const groupedBooks = {
    unassigned: filteredBooks.filter((wb: any) => !wb.folderId),
    ...folders.reduce((acc: any, folder: any) => {
      acc[folder.id] = filteredBooks.filter((wb: any) => wb.folderId === folder.id);
      return acc;
    }, {})
  };

  return (
    <motion.div 
      key="app-world"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 bg-zinc-50 dark:bg-black flex flex-col z-50 transition-colors"
    >
      <StatusBar time={time} className="bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 dark:text-zinc-200" />
      
      <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-[#1c1c1e] border-b border-zinc-100 dark:border-zinc-800 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-100">世界书</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditingFolderId(null);
              setNewFolderName('');
              setIsCreatingFolder(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-[#2c2c2e] text-zinc-600 dark:text-zinc-300 shadow-sm active:scale-95 transition-all"
          >
            <FolderPlus size={16} />
          </button>
          <button 
            onClick={onAdd}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm active:scale-95 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="px-6 py-3 bg-white dark:bg-[#1c1c1e] border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-3 z-10 transition-colors">
        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2">
          <Search size={16} className="text-zinc-400 dark:text-zinc-500" />
          <input 
            type="text" 
            placeholder="搜索世界书..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 items-center">
          <Filter size={14} className="text-zinc-400" />
          <button 
            onClick={() => setFilterScope('all')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${filterScope === 'all' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
          >
            全部
          </button>
          <button 
            onClick={() => setFilterScope('global')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${filterScope === 'global' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
          >
            全局
          </button>
          <button 
            onClick={() => setFilterScope('local')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${filterScope === 'local' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
          >
            局部
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {/* Folder Creation Modal / Inline Input */}
        <AnimatePresence>
          {isCreatingFolder && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <GlassCard className="p-4 flex gap-2 items-center mb-4 dark:!border-zinc-800 dark:!bg-[#1c1c1e]" opacity="0.8" blur="10px">
                <FolderOpen size={18} className="text-zinc-500" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="输入文件夹名称..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-100"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
                <button onClick={() => setIsCreatingFolder(false)} className="text-zinc-400 p-1"><Delete size={16} /></button>
                <button onClick={handleCreateFolder} className="text-zinc-800 dark:text-zinc-200 p-1"><Check size={16} /></button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {worldBooks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600 py-20">
            <BookOpen size={64} strokeWidth={1} />
            <p className="mt-4 text-sm font-bold tracking-widest uppercase">暂无世界书</p>
            <button 
              onClick={onAdd}
              className="mt-6 px-6 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-full text-xs font-bold active:scale-95 transition-all"
            >
              创建世界书
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Render Folders */}
            {folders.map((folder: any) => {
              const booksInFolder = groupedBooks[folder.id] || [];
              const isExpanded = expandedFolders[folder.id] !== false; // Default to expanded

              return (
                <div key={folder.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2">
                    <div 
                      className="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity"
                      onClick={() => toggleFolderExpand(folder.id)}
                    >
                      {isExpanded ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
                      <Folder size={16} className="text-zinc-500" />
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{folder.name} ({booksInFolder.length})</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingFolderId(folder.id); setNewFolderName(folder.name); setIsCreatingFolder(true); }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => handleDeleteFolder(folder.id)} className="text-red-300 hover:text-red-500 transition-colors"><Delete size={12} /></button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-4 overflow-hidden"
                      >
                        {booksInFolder.length === 0 ? (
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center py-2">空文件夹</div>
                        ) : (
                          booksInFolder.map((wb: any) => (
                            <WorldBookCard key={wb.id} wb={wb} toggleActive={toggleActive} onEdit={onEdit} deleteWorldBook={deleteWorldBook} />
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Render Unassigned Books */}
            {groupedBooks.unassigned.length > 0 && (
              <div className="flex flex-col gap-3">
                {folders.length > 0 && (
                  <div className="flex items-center gap-2 px-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">未分类 ({groupedBooks.unassigned.length})</span>
                  </div>
                )}
                {groupedBooks.unassigned.map((wb: any) => (
                  <WorldBookCard key={wb.id} wb={wb} toggleActive={toggleActive} onEdit={onEdit} deleteWorldBook={deleteWorldBook} />
                ))}
              </div>
            )}
            
            {/* Empty Search Result */}
            {filteredBooks.length === 0 && worldBooks.length > 0 && (
              <div className="text-center text-zinc-400 dark:text-zinc-500 text-sm py-10">
                没有找到匹配的世界书
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
