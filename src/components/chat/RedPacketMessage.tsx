import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { RedPacketData } from '../../services/redPacketService';

interface RedPacketMessageProps {
  data: RedPacketData;
  isSelf?: boolean;
}

export const RedPacketMessage: React.FC<RedPacketMessageProps> = ({ data, isSelf = false }) => {
  const [showStatus, setShowStatus] = useState(false);

  const isLucky = data.type === 'lucky';

  return (
    <>
      <div 
        className={`w-[240px] rounded-2xl p-3 flex flex-col cursor-pointer transition-colors shadow-sm dark:shadow-none
          ${isSelf ? 'rounded-tr-md' : 'rounded-tl-md'} 
          bg-[#ffe8ee] dark:bg-gray-800 hover:bg-[#ffdee6] dark:hover:bg-gray-700
        `}
        onClick={() => setShowStatus(true)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/60 dark:bg-gray-700 rounded-xl flex items-center justify-center text-[#403f44]">
            <Wallet size={24} />
          </div>
          <div className="flex-1 overflow-hidden flex flex-col justify-center">
            <div className="text-[#403f44] dark:text-gray-200 font-bold text-base">红包</div>
            <div className="text-[#403f44]/80 dark:text-gray-400 text-xs truncate mt-0.5">{data.message}</div>
          </div>
          <div className="text-[#403f44] font-bold text-lg whitespace-nowrap">
            ¥{data.amount.toFixed(2)}
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-white/50 dark:border-gray-600/50 flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500">
          <span>红包</span>
          <span>{isLucky ? '拼手气' : '已发出'}</span>
        </div>
      </div>

      {showStatus && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={() => setShowStatus(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-[280px] text-center flex flex-col items-center gap-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-[#ffe8ee] dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
              <Wallet className="text-[#403f44]" size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#403f44] dark:text-gray-100">红包功能完善中</h3>
            <p className="text-sm text-[#403f44]/80 dark:text-gray-400 mb-2">当前为预览版本，暂不支持领取操作。</p>
            
            <button 
              className="mt-4 w-full py-3 bg-[#ffbccd] text-[#403f44] rounded-xl font-medium hover:bg-[#ff9eb5] transition-colors shadow-sm"
              onClick={() => setShowStatus(false)}
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
};
