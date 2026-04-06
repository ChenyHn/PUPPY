import React, { useState } from 'react';
import { renderInPhoneContainer } from '../../utils/portal';
import { X } from 'lucide-react';
import { redPacketService, RedPacketData } from '../../services/redPacketService';

interface RedPacketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: RedPacketData) => void;
}

export const RedPacketModal: React.FC<RedPacketModalProps> = ({ isOpen, onClose, onSend }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('请输入有效的金额');
      return;
    }

    const data = redPacketService.createRedPacket(numAmount, message);
    onSend(data);
    onClose();
    
    // Reset form
    setAmount('');
    setMessage('');
  };

  const modalContent = (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#ffe8ee] dark:bg-gray-800 w-[300px] max-w-[90%] rounded-2xl overflow-hidden p-5 relative flex flex-col gap-4 shadow-[0_0_12px_rgba(255,188,205,0.6)] dark:shadow-none">
        {/* Header */}
        <div className="flex justify-center items-center relative pb-2">
          <h3 className="text-lg font-bold text-[#403f44] dark:text-gray-100">发红包</h3>
          <button onClick={onClose} className="absolute right-0 text-[#403f44]/60 hover:text-[#403f44] dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-3 flex items-center transition-all focus-within:ring-2 focus-within:ring-[#ffbccd] dark:focus-within:ring-pink-900">
            <span className="text-[#403f44] dark:text-gray-300 font-medium mr-3 text-sm shrink-0">金额</span>
            <input 
              type="number" 
              step="0.01"
              placeholder="0.00"
              className="flex-1 min-w-0 w-full bg-transparent outline-none text-right text-lg text-[#403f44] dark:text-gray-100 placeholder-gray-400 pr-2 text-ellipsis overflow-hidden whitespace-nowrap"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 9) setAmount(val);
              }}
            />
            <span className="ml-1 text-[#403f44] dark:text-gray-300 font-medium text-sm shrink-0">元</span>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl p-3 flex items-center transition-all focus-within:ring-2 focus-within:ring-[#ffbccd] dark:focus-within:ring-pink-900">
            <input 
              type="text" 
              placeholder="恭喜发财，大吉大利"
              className="w-full bg-transparent outline-none text-[#403f44] dark:text-gray-100 text-sm placeholder-gray-400"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="text-center py-4 overflow-hidden px-2">
            <div className="text-3xl font-bold text-[#403f44] dark:text-gray-100 truncate">
              ¥ {amount ? parseFloat(amount).toFixed(2) : '0.00'}
            </div>
          </div>

          <button 
            onClick={handleSend}
            className={`w-full py-3 rounded-full font-medium text-base transition-colors
              ${amount && parseFloat(amount) > 0 
                ? 'bg-[#ffbccd] dark:bg-pink-600 text-white hover:bg-[#ff9eb5] dark:hover:bg-pink-500 shadow-sm' 
                : 'bg-white/50 dark:bg-gray-700 text-[#ffbccd] dark:text-gray-500 cursor-not-allowed'}`}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            塞钱进红包
          </button>
        </div>
      </div>
    </div>
  );

  return renderInPhoneContainer(modalContent);
};
