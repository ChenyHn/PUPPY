import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Globe2, ShieldCheck, RefreshCw, Sparkles, MessageSquare, Type, Wifi } from 'lucide-react';
import { StatusBar, GlassCard } from './Shared';
import { ApiConfig } from '../types';

export const SettingsScreen = ({ 
  apiConfig, 
  setApiConfig, 
  onBack, 
  time
}: any) => {
  const [tempConfig, setTempConfig] = useState(apiConfig);
  const [showKey, setShowKey] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = () => {
    setApiConfig(tempConfig);
    showToast('配置已保存');
  };

  const handleFetchModels = async () => {
    if (!tempConfig.baseUrl || !tempConfig.apiKey) {
      showToast('错误: 请先输入 API 地址和密钥');
      return;
    }
    setIsAiLoading(true);
    try {
      let baseUrl = tempConfig.baseUrl.trim().replace(/\/+$/, '');
      if (!/^https?:\/\//i.test(baseUrl)) {
        baseUrl = 'https://' + baseUrl;
      }
      if (baseUrl.endsWith('/chat/completions')) {
        baseUrl = baseUrl.replace('/chat/completions', '');
      }
      if (!baseUrl.endsWith('/v1')) {
        baseUrl = `${baseUrl}/v1`;
      }

      const url = `${baseUrl}/models`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

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
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const modelNames = data.data.map((m: any) => m.id);
        if (modelNames.length > 0) {
          const newSelectedModel = tempConfig.selectedModel || modelNames[0];
          setTempConfig((prev: any) => ({ ...prev, models: modelNames, selectedModel: newSelectedModel }));
          setApiConfig((prev: any) => ({ ...prev, models: modelNames, selectedModel: newSelectedModel }));
          showToast('模型列表获取成功');
        } else {
          showToast('错误: 未找到可用模型');
        }
      } else {
        showToast('错误: 返回数据格式不正确');
      }
    } catch (err: any) {
      console.error('Fetch models error:', err);
      let errorMsg = err.message || '未知错误';
      if (err.name === 'AbortError') {
         errorMsg = '请求超时(30s)，请检查网络或代理';
      } else if (errorMsg === 'Failed to fetch' || errorMsg.toLowerCase().includes('networkerror')) {
        errorMsg = '网络错误/跨域(CORS)限制，请使用支持CORS的中转API';
      }
      showToast(`错误: 获取失败 - ${errorMsg}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!tempConfig.baseUrl || !tempConfig.apiKey) {
      showToast('错误: 请先输入 API 地址和密钥');
      return;
    }
    setIsAiLoading(true);
    try {
      let baseUrl = tempConfig.baseUrl.trim().replace(/\/+$/, '');
      if (!/^https?:\/\//i.test(baseUrl)) {
        baseUrl = 'https://' + baseUrl;
      }
      if (baseUrl.endsWith('/chat/completions')) {
        baseUrl = baseUrl.replace('/chat/completions', '');
      }
      if (!baseUrl.endsWith('/v1')) {
        baseUrl = `${baseUrl}/v1`;
      }
      
      const url = `${baseUrl}/chat/completions`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

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
          max_tokens: 10
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        showToast('连接测试成功！');
      } else {
        throw new Error('返回数据格式不正确');
      }
    } catch (err: any) {
      console.error('Test connection error:', err);
      let errorMsg = err.message || '未知错误';
      if (err.name === 'AbortError') {
         errorMsg = '请求超时(30s)，请检查网络或代理';
      } else if (errorMsg === 'Failed to fetch' || errorMsg.toLowerCase().includes('networkerror')) {
        errorMsg = '网络错误/跨域(CORS)限制';
      }
      showToast(`错误: 测试失败 - ${errorMsg}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <motion.div 
      key="app-settings"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 bg-zinc-50 flex flex-col z-50"
    >
      <StatusBar time={time} className="bg-white/80 backdrop-blur-md z-10" />
      
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 active:text-zinc-600 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-bold text-zinc-700">设置</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 h-[44px] bg-zinc-800 text-white rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          <Check size={14} />
          保存
        </button>
      </div>

      <div className="absolute top-[100px] left-0 right-0 z-50 px-6 pointer-events-none">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white text-center pointer-events-auto break-words bg-[#1E1E1E]"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">API 基础地址 (Base URL)</span>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <Globe2 size={18} className="text-zinc-400" />
              <input 
                type="text" 
                placeholder="https://api.openai.com/v1"
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 placeholder:text-zinc-300"
                value={tempConfig.baseUrl}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, baseUrl: e.target.value }))}
              />
            </div>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">API 密钥 (API Key)</span>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-zinc-400" />
              <input 
                type={showKey ? "text" : "password"} 
                placeholder="sk-..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 placeholder:text-zinc-300"
                value={tempConfig.apiKey}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, apiKey: e.target.value }))}
              />
              <button onClick={() => setShowKey(!showKey)} className="text-zinc-300 active:text-zinc-500">
                <ShieldCheck size={18} />
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">模型选择</span>
            <button 
              onClick={handleFetchModels}
              disabled={isAiLoading}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 active:scale-95 transition-all min-h-[44px]"
            >
              <RefreshCw size={12} className={isAiLoading ? "animate-spin" : ""} />
              获取模型列表
            </button>
          </div>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <select 
              className="w-full h-8 bg-transparent border-none outline-none text-sm text-zinc-700 appearance-none cursor-pointer"
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
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">Temperature (创造性)</span>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-zinc-400" />
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1"
                className="flex-1 accent-zinc-600"
                value={tempConfig.temperature ?? 0.7}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              />
              <span className="text-sm font-bold text-zinc-600 w-10 text-right">{(tempConfig.temperature ?? 0.7).toFixed(1)}</span>
            </div>
            <p className="text-[9px] text-zinc-400 mt-2 px-1">值越高回复越有创造性，值越低回复越稳定。推荐 0.7</p>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">上下文消息条数</span>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className="text-zinc-400" />
              <input 
                type="range" 
                min="1" 
                max="50" 
                step="1"
                className="flex-1 accent-zinc-600"
                value={tempConfig.contextMessageCount ?? 10}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, contextMessageCount: parseInt(e.target.value) }))}
              />
              <span className="text-sm font-bold text-zinc-600 w-10 text-right">{tempConfig.contextMessageCount ?? 10}</span>
            </div>
            <p className="text-[9px] text-zinc-400 mt-2 px-1">每次调用API时读取的最近消息条数（系统消息不计入）。值越小越省Token，值越大上下文越完整。推荐 10</p>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase px-1">Max Tokens (最大回复长度)</span>
          <GlassCard className="p-4" opacity="0.8" blur="10px">
            <div className="flex items-center gap-3">
              <Type size={18} className="text-zinc-400" />
              <input 
                type="number" 
                inputMode="numeric"
                min="100" 
                max="8192" 
                step="100"
                placeholder="2048"
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-700 placeholder:text-zinc-300"
                value={tempConfig.maxTokens ?? 2048}
                onChange={(e) => setTempConfig((prev: any) => ({ ...prev, maxTokens: parseInt(e.target.value) || 2048 }))}
              />
            </div>
            <p className="text-[9px] text-zinc-400 mt-2 px-1">控制AI单次回复的最大长度。推荐 2048</p>
          </GlassCard>
        </div>

        <div className="flex justify-center mt-4">
          <button 
            onClick={handleTestConnection}
            disabled={isAiLoading}
            className="flex items-center justify-center gap-2 w-full max-w-[200px] h-[44px] bg-zinc-100 text-zinc-700 rounded-full text-sm font-bold active:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isAiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Wifi size={16} />}
            测试连接
          </button>
        </div>

        <div className="mt-auto pt-6">
          <p className="text-[10px] text-center text-zinc-300 leading-relaxed">
            配置完成后，点击右上角"保存"。未配置API时将使用模拟回复。
          </p>
        </div>
      </div>
    </motion.div>
  );
};
