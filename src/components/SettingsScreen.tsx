import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Globe2, ShieldCheck, RefreshCw, Sparkles, MessageSquare, Type, Wifi } from 'lucide-react';
import { StatusBar, GlassCard } from './Shared';
import { ApiConfig } from '../types';

/**
 * Normalize a user-entered Base URL:
 * - Trim whitespace and trailing slashes
 * - Auto-prepend https:// if no protocol
 * - Strip trailing /chat/completions if user pasted a full endpoint
 */
function normalizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  // If user pasted the full chat completions endpoint, strip it
  if (url.endsWith('/chat/completions')) {
    url = url.replace(/\/chat\/completions$/, '');
  }
  return url;
}

export const SettingsScreen = ({ 
  apiConfig, 
  setApiConfig, 
  onBack, 
  time
}: any) => {
  const [tempConfig, setTempConfig] = useState(apiConfig);
  const [showKey, setShowKey] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = () => {
    setApiConfig(tempConfig);
    showToast('配置已保存', 'success');
  };

  const handleFetchModels = async () => {
    if (!tempConfig.baseUrl || !tempConfig.apiKey) {
      showToast('请先输入 API 地址和密钥', 'error');
      return;
    }
    setIsAiLoading(true);
    try {
      const baseUrl = normalizeBaseUrl(tempConfig.baseUrl);
      const url = `${baseUrl}/models`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${tempConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(msg);
      }
      
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const modelNames = data.data.map((m: any) => m.id);
        if (modelNames.length > 0) {
          const newSelectedModel = modelNames.includes(tempConfig.selectedModel) 
            ? tempConfig.selectedModel 
            : modelNames[0];
          // Immediately update both tempConfig and apiConfig for instant UI refresh
          const updated = { ...tempConfig, models: modelNames, selectedModel: newSelectedModel };
          setTempConfig(updated);
          setApiConfig((prev: any) => ({ ...prev, models: modelNames, selectedModel: newSelectedModel }));
          showToast(`成功获取 ${modelNames.length} 个模型`, 'success');
        } else {
          showToast('未找到可用模型', 'error');
        }
      } else {
        showToast('返回数据格式不正确，预期 { data: [...] }', 'error');
      }
    } catch (err: any) {
      console.error('Fetch models error:', err);
      let errorMsg = err.message || '未知错误';
      if (err.name === 'AbortError') {
        errorMsg = '请求超时(10s)，请检查网络连接或 API 地址是否正确';
      } else if (errorMsg === 'Failed to fetch' || errorMsg.toLowerCase().includes('networkerror') || errorMsg.toLowerCase().includes('network')) {
        errorMsg = '网络连接失败或跨域(CORS)限制。请使用支持 CORS 的中转 API 服务。';
      }
      showToast(errorMsg, 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!tempConfig.baseUrl || !tempConfig.apiKey) {
      showToast('请先输入 API 地址和密钥', 'error');
      return;
    }
    setIsAiLoading(true);
    try {
      const baseUrl = normalizeBaseUrl(tempConfig.baseUrl);
      const url = `${baseUrl}/chat/completions`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempConfig.apiKey}`,
        },
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        body: JSON.stringify({
          model: tempConfig.selectedModel || tempConfig.models?.[0] || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
          stream: false
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(msg);
      }

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        showToast('连接测试成功！', 'success');
      } else {
        throw new Error('返回数据格式不正确');
      }
    } catch (err: any) {
      console.error('Test connection error:', err);
      let errorMsg = err.message || '未知错误';
      if (err.name === 'AbortError') {
        errorMsg = '请求超时(15s)，请检查网络或 API 地址';
      } else if (errorMsg === 'Failed to fetch' || errorMsg.toLowerCase().includes('networkerror') || errorMsg.toLowerCase().includes('network')) {
        errorMsg = '网络连接失败或跨域(CORS)限制。请使用支持 CORS 的中转 API。';
      }
      showToast(errorMsg, 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      exit={{ x: 0 }}
      transition={{ duration: 0 }}
      key="app-settings"
      className="absolute inset-0 bg-white dark:bg-black flex flex-col z-50"
    >
      <StatusBar time={time} className="bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 dark:text-zinc-200" />
      
      <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-[#1c1c1e] border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 transition-colors">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-100">设置</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 h-[44px] bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Check size={14} />
          保存
        </button>
      </div>

      {/* Toast container at top of settings page */}
      <div className="absolute top-[100px] left-0 right-0 z-50 px-6 pointer-events-none">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`w-full py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white text-center pointer-events-auto break-words ${
                toastType === 'error' ? 'bg-red-500' : 'bg-[#1E1E1E]'
              }`}
            >
              {toastType === 'error' ? '⚠️ ' : '✅ '}{toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">API 基础地址 (Base URL)</span>
          <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <Globe2 size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
              <input 
                type="url" 
                placeholder="https://your-proxy.com/v1"
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[44px]"
                value={tempConfig.baseUrl}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, baseUrl: e.target.value }))}
              />
            </div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-2 px-1">
              填写中转站提供的地址，如 https://api.example.com/v1。请求将发送到 Base URL/chat/completions
            </p>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">API 密钥 (API Key)</span>
          <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
              <input 
                type={showKey ? "text" : "password"} 
                placeholder="sk-..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[44px]"
                value={tempConfig.apiKey}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, apiKey: e.target.value }))}
              />
              <button 
                onClick={() => setShowKey(!showKey)} 
                className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-500 dark:hover:text-zinc-400 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              >
                <ShieldCheck size={18} />
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">模型选择</span>
            <button 
              onClick={handleFetchModels}
              disabled={isAiLoading}
              className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 active:scale-95 transition-all min-h-[44px] min-w-[44px] justify-center disabled:opacity-50"
            >
              <RefreshCw size={12} className={isAiLoading ? "animate-spin" : ""} />
              {isAiLoading ? '获取中...' : '获取模型列表'}
            </button>
          </div>
          <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
            <select 
              className="w-full h-[44px] bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-100 appearance-none cursor-pointer"
              value={tempConfig.selectedModel || ''}
              onChange={(e) => setTempConfig((prev: any) => ({ ...prev, selectedModel: e.target.value }))}
            >
              {tempConfig.models && tempConfig.models.length > 0 ? (
                tempConfig.models.map((m: any) => <option key={m} value={m}>{m}</option>)
              ) : (
                <option value="">请先获取模型列表</option>
              )}
            </select>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">Temperature (创造性)</span>
          <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1"
                className="flex-1 accent-zinc-600 min-h-[44px]"
                value={tempConfig.temperature ?? 0.7}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              />
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 w-10 text-right">{(tempConfig.temperature ?? 0.7).toFixed(1)}</span>
            </div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-2 px-1">值越高回复越有创造性，值越低回复越稳定。推荐 0.7</p>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">上下文消息条数</span>
          <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
              <input 
                type="range" 
                min="1" 
                max="50" 
                step="1"
                className="flex-1 accent-zinc-600 min-h-[44px]"
                value={tempConfig.contextMessageCount ?? 10}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, contextMessageCount: parseInt(e.target.value) }))}
              />
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 w-10 text-right">{tempConfig.contextMessageCount ?? 10}</span>
            </div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-2 px-1">每次调用API时读取的最近消息条数（系统消息不计入）。值越小越省Token，值越大上下文越完整。推荐 10</p>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase px-1">Max Tokens (最大回复长度)</span>
          <GlassCard className="p-4 dark:!bg-[#1c1c1e] dark:!border-zinc-800" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <Type size={18} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
              <input 
                type="number" 
                inputMode="numeric"
                min="100" 
                max="8192" 
                step="100"
                placeholder="2048"
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[44px]"
                value={tempConfig.maxTokens ?? 2048}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, maxTokens: parseInt(e.target.value) || 2048 }))}
              />
            </div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-2 px-1">控制AI单次回复的最大长度。推荐 2048</p>
          </GlassCard>
        </div>

        <div className="flex justify-center mt-4">
          <button 
            onClick={handleTestConnection}
            disabled={isAiLoading}
            className="flex items-center justify-center gap-2 w-full max-w-[200px] h-[44px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-sm font-bold active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {isAiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Wifi size={16} />}
            测试连接
          </button>
        </div>

        <div className="mt-auto pt-6">
          <p className="text-[10px] text-center text-zinc-300 dark:text-zinc-600 leading-relaxed">
            配置完成后，点击右上角"保存"。未配置API时将使用模拟回复。
          </p>
        </div>
      </div>
    </motion.div>
  );
};
