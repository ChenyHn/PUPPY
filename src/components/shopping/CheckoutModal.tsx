import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Wallet, UserPlus } from 'lucide-react';
import { createOrder, getProductById } from '../../services/shoppingService';
import { isPasswordFree, verifyPaymentPassword, hasPaymentPassword } from '../../services/paymentService';
import { Toast } from './Toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  contacts: any[];
  cart: any[];
  onSuccess: () => void;
  wallet: any;
  setWallet: any;
  setChatHistories: any;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  contacts,
  cart,
  onSuccess,
  wallet,
  setWallet,
  setChatHistories,
}) => {
  const [step, setStep] = useState<'method' | 'contact'>('method');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [proxyContact, setProxyContact] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);
  
  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSearchQuery('');
      setIsProcessing(false);
      setProxyContact(null);
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelfPaymentClick = () => {
    if (wallet.balance < totalAmount) {
      showToast('余额不足');
      return;
    }
    
    if (isPasswordFree()) {
      executeSelfPayment();
    } else if (!hasPaymentPassword()) {
      showToast("未设置支付密码，请先在‘我-支付安全’中设置。");
    } else {
      setShowPasswordModal(true);
      setPasswordInput('');
      setPasswordError('');
    }
  };

  const handlePasswordInputKey = (num: string) => {
    if (passwordInput.length < 6) {
      const newVal = passwordInput + num;
      setPasswordInput(newVal);
      setPasswordError('');
      
      if (newVal.length === 6) {
        setTimeout(() => {
          if (verifyPaymentPassword(newVal)) {
            setShowPasswordModal(false);
            executeSelfPayment();
          } else {
            setPasswordError('密码错误');
            setPasswordInput('');
          }
        }, 150);
      }
    }
  };

  const handlePasswordDelete = () => {
    setPasswordInput(prev => prev.slice(0, -1));
    setPasswordError('');
  };

  const executeSelfPayment = async () => {
    setIsProcessing(true);
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));

    // 推断配送类型：如果有外卖，则是 food；如果都是快递，则为 normal (简单处理)
    let deliveryType: 'food' | 'normal' | 'express' = 'normal';
    for (const item of cart) {
      const p = getProductById(item.productId);
      if (p && p.category === 'food') {
        deliveryType = 'food';
        break;
      }
    }

    const order = createOrder(cart, totalAmount, 'self', undefined, deliveryType);

    // 扣减余额并记录账单
    const newWallet = {
      ...wallet,
      balance: wallet.balance - totalAmount,
      transactions: [
        {
          id: `tx_${Date.now()}`,
          amount: -totalAmount,
          type: 'expense',
          description: `商城消费 - 订单${order.id}`,
          balanceAfter: wallet.balance - totalAmount,
          timestamp: new Date().toISOString()
        },
        ...wallet.transactions
      ]
    };
    setWallet(newWallet);
    setIsProcessing(false);
    showToast('付款成功！');
    setTimeout(() => {
        onSuccess();
    }, 1500);
  };

  const handleProxyPayment = async (contact: any) => {
    setIsProcessing(true);
    setProxyContact(contact);

    // 推断配送类型
    let deliveryType: 'food' | 'normal' | 'express' = 'normal';
    for (const item of cart) {
      const p = getProductById(item.productId);
      if (p && p.category === 'food') {
        deliveryType = 'food';
        break;
      }
    }

    const order = createOrder(cart, totalAmount, 'proxy', contact.id, deliveryType);

    // 模拟发送消息
    const msgId1 = `msg_${Date.now()}_1`;
    const msgId2 = `msg_${Date.now()}_2`;

    if (setChatHistories) {
      setChatHistories((prev: any) => {
        const history = prev[contact.id] || [];
        return {
          ...prev,
          [contact.id]: [
            ...history,
            {
              id: msgId1,
              content: `${contact.chatName || contact.name}，能帮我付一下 ${totalAmount.toFixed(2)} 元买这些东西吗？订单号 [${order.id}]。`,
              sender: 'user',
              timestamp: Date.now()
            }
          ]
        };
      });
    }

    // 模拟对方思考及回复（1.5s ~ 3s）
    const delay = 1500 + Math.random() * 1500;
    await new Promise(resolve => setTimeout(resolve, delay));

    const isAgreed = Math.random() < 0.6; // 60% 概率同意

    if (setChatHistories) {
      setChatHistories((prev: any) => {
        const history = prev[contact.id] || [];
        return {
          ...prev,
          [contact.id]: [
            ...history,
            {
              id: msgId2,
              content: isAgreed ? `${contact.chatName || contact.name} 帮你付款成功！` : '抱歉，我现在手头也有点紧呢。',
              sender: 'assistant',
              timestamp: Date.now()
            }
          ]
        };
      });
    }

    setIsProcessing(false);
    if (isAgreed) {
      showToast(`代付成功！${contact.chatName || contact.name} 帮你付了 ${totalAmount.toFixed(2)} 元。`);
      setTimeout(() => {
          onSuccess();
      }, 1500);
    } else {
      showToast(`代付失败！${contact.chatName || contact.name} 拒绝了代付请求。`);
      setTimeout(() => {
          onClose(); // 取消订单，关闭弹窗
      }, 1500);
    }
  };

  const renderDots = () => {
    return (
      <div className="flex justify-center gap-2 my-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 transition-colors"
          >
            {i < passwordInput.length && (
              <div className="w-2.5 h-2.5 rounded-full bg-gray-800 dark:bg-gray-200" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderKeypad = () => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '取消', '0', '删除'];
    return (
      <div className="grid grid-cols-3 gap-2 mt-4 w-full">
        {keys.map((key, index) => {
          if (key === '取消') {
            return (
              <button
                key={index}
                onClick={() => setShowPasswordModal(false)}
                className="py-3 flex items-center justify-center text-sm font-medium bg-gray-50 dark:bg-gray-700/50 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 text-gray-600 dark:text-gray-300 transition-colors"
              >
                {key}
              </button>
            );
          }
          if (key === '删除') {
            return (
              <button
                key={index}
                onClick={handlePasswordDelete}
                className="py-3 flex items-center justify-center text-sm font-medium bg-gray-50 dark:bg-gray-700/50 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 text-gray-600 dark:text-gray-300 transition-colors"
              >
                {key}
              </button>
            );
          }
          return (
            <button
              key={index}
              onClick={() => handlePasswordInputKey(key)}
              className="py-3 flex items-center justify-center text-lg font-bold bg-gray-50 dark:bg-gray-700/50 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 text-gray-800 dark:text-gray-100 transition-colors"
            >
              {key}
            </button>
          );
        })}
      </div>
    );
  };

  const filteredContacts = contacts.filter(c => 
    (c.chatName || c.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const phoneContainer = document.querySelector('.phone-mockup') || document.getElementById('phone-container') || document.body;

  const modalContent = (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-opacity" style={{ borderRadius: 'inherit' }}>
      <div 
        className="w-[300px] flex flex-col bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(30,30,35,0.85)] backdrop-blur-[20px] rounded-[24px] border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeInZoom 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center h-12 border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)]">
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
            {step === 'method' ? '确认付款' : '选择代付人'}
          </h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute right-3 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full transition-colors bg-transparent border-none outline-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 relative min-h-[200px]">
          {isProcessing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent dark:border-gray-100 dark:border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {proxyContact ? `等待 ${proxyContact.chatName || proxyContact.name} 回复...` : '处理中...'}
              </p>
            </div>
          ) : null}

          {step === 'method' && (
            <>
              <div className="flex flex-col items-center py-4">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">支付金额</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">¥</span>
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <button
                  onClick={handleSelfPaymentClick}
                  className="w-full py-3 px-4 flex items-center justify-between rounded-full bg-white dark:bg-gray-800 border border-white/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-gray-800/90 active:bg-white/80 dark:active:bg-gray-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] dark:bg-white flex items-center justify-center text-white dark:text-[#1a1a1a]">
                      <Wallet size={16} />
                    </div>
                    <span className="text-[14px] font-bold text-gray-800 dark:text-gray-200">自己付款</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">余额: ¥{wallet?.balance.toFixed(2)}</span>
                </button>

                <button
                  onClick={() => setStep('contact')}
                  className="w-full py-3 px-4 flex items-center justify-between rounded-full bg-white dark:bg-gray-800 border border-white/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-gray-800/90 active:bg-white/80 dark:active:bg-gray-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                      <UserPlus size={16} />
                    </div>
                    <span className="text-[14px] font-bold text-gray-800 dark:text-gray-200">找人代付</span>
                  </div>
                </button>
              </div>
            </>
          )}

          {step === 'contact' && (
            <div className="flex flex-col h-[280px]">
              <div className="neumorph-input flex items-center w-full !py-2 !px-3 mb-3 shrink-0 shadow-none !border-[rgba(0,0,0,0.05)] dark:!border-[rgba(255,255,255,0.05)]">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索联系人"
                  className="w-full bg-transparent border-none outline-none pl-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
                {filteredContacts.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">
                    未找到联系人
                  </div>
                ) : (
                  filteredContacts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleProxyPayment(c)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] active:scale-[0.98] transition-all bg-transparent border-none text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                        {c.avatar ? (
                          <img src={c.avatar} className="w-full h-full object-cover grayscale" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <UserPlus size={16} />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1 truncate">
                        {c.chatName || c.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal Overlay */}
      {showPasswordModal && (
        <div className="absolute inset-0 z-[70] flex flex-col items-center justify-end pb-4 bg-black/40 backdrop-blur-sm transition-opacity" style={{ borderRadius: 'inherit' }}>
          <div 
            className="w-[95%] max-w-[320px] flex flex-col bg-[rgba(255,255,255,0.95)] dark:bg-[rgba(30,30,35,0.95)] backdrop-blur-[20px] rounded-[24px] border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden mb-4"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            <div className="relative flex justify-center items-center pt-5 px-4 pb-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="absolute left-4 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full transition-colors bg-transparent border-none outline-none"
              >
                <X size={18} />
              </button>
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                请输入支付密码
              </h3>
            </div>
            <div className="p-4 flex flex-col items-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">¥{totalAmount.toFixed(2)}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">自己付款-商城消费</span>
              {renderDots()}
              {passwordError && (
                <span className="text-xs text-gray-600 dark:text-gray-400 mb-2">{passwordError}</span>
              )}
              {renderKeypad()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {createPortal(modalContent, phoneContainer)}
      <Toast message={toastMessage} isOpen={isToastOpen} onClose={() => setIsToastOpen(false)} />
    </>
  );
};
