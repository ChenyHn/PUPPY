import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Plus, ChevronRight, ArrowLeft, ReceiptText } from 'lucide-react';
import type { Persona, ApiConfig } from '../types';

export interface Transaction {
  id: string;
  type: 'recharge';
  amount: number;
  balanceAfter: number;
  timestamp: string;
  description: string;
}

export interface WalletData {
  balance: number;
  transactions: Transaction[];
}

interface WalletActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletData;
  setWallet: React.Dispatch<React.SetStateAction<WalletData>>;
  phonePersonas?: Persona[];
  apiConfig?: ApiConfig;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${min}`;
};

const BillDetailModal = ({ 
  transaction, 
  onClose,
  portalTarget
}: { 
  transaction: Transaction; 
  onClose: () => void;
  portalTarget: HTMLElement;
}) => {
  const content = (
    <div className="absolute inset-0 z-[120] flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-[280px] bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Ticket cutouts */}
        <div className="absolute top-[80px] -left-3 w-6 h-6 bg-zinc-900/40 dark:bg-black/60 rounded-full" />
        <div className="absolute top-[80px] -right-3 w-6 h-6 bg-zinc-900/40 dark:bg-black/60 rounded-full" />
        
        <div className="p-6 pb-4 border-b border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-3">
            <ReceiptText size={24} />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-1">
            {transaction.description}
          </h3>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white my-2">
            +{transaction.amount.toFixed(2)}
          </div>
        </div>
        
        <div className="p-6 pt-4 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">当前状态</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">充值成功</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">时间</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{formatDate(transaction.timestamp)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">交易单号</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{transaction.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">充值后余额</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">¥ {transaction.balanceAfter.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-xl text-zinc-700 dark:text-zinc-200 font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(content, portalTarget);
};

export const WalletActionsModal: React.FC<WalletActionsModalProps> = ({
  isOpen,
  onClose,
  wallet,
  setWallet,
}) => {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [showFullList, setShowFullList] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedBill, setSelectedBill] = useState<Transaction | null>(null);

  useEffect(() => {
    const target = document.getElementById('phone-container') || document.body;
    setPortalTarget(target);
  }, []);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setShowFullList(false);
      setShowRecharge(false);
      setRechargeAmount('');
      setSelectedBill(null);
    }
  }, [isOpen]);

  const handleRecharge = () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效的充值金额');
      return;
    }

    const newBalance = wallet.balance + amount;
    const newTx: Transaction = {
      id: `TX${Date.now()}`,
      type: 'recharge',
      amount,
      balanceAfter: newBalance,
      timestamp: new Date().toISOString(),
      description: '余额充值',
    };

    setWallet(prev => ({
      balance: newBalance,
      transactions: [newTx, ...(prev.transactions || [])],
    }));

    setShowRecharge(false);
    setRechargeAmount('');
  };

  if (!isOpen || !portalTarget) return null;

  const transactions = wallet.transactions || [];
  const recentTransactions = transactions.slice(0, 5);
  const displayTransactions = showFullList ? transactions : recentTransactions;

  const content = (
    <div className="absolute inset-0 z-[100] flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-[320px] max-h-[90%] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showFullList ? (
              <button 
                onClick={() => setShowFullList(false)}
                className="p-1 -ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <Wallet size={20} className="text-zinc-800 dark:text-zinc-200" />
            )}
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              {showFullList ? '账单记录' : '我的钱包'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 no-scrollbar">
          {!showFullList && (
            <div className="p-6 flex flex-col items-center border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">当前余额</span>
              <div className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-baseline">
                <span className="text-2xl mr-1">¥</span>
                {wallet.balance.toFixed(2)}
              </div>
              
              <button
                onClick={() => setShowRecharge(true)}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={18} />
                充值
              </button>
            </div>
          )}

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                {showFullList ? '所有交易' : '最近账单'}
              </h4>
              {!showFullList && transactions.length > 5 && (
                <button 
                  onClick={() => setShowFullList(true)}
                  className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors flex items-center"
                >
                  查看全部
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

            {displayTransactions.length === 0 ? (
              <div className="text-center py-8 text-sm text-zinc-400 dark:text-zinc-500">
                暂无交易记录
              </div>
            ) : (
              <div className="space-y-4">
                {displayTransactions.map(tx => (
                  <div 
                    key={tx.id} 
                    onClick={() => setSelectedBill(tx)}
                    className="flex justify-between items-center p-3 -mx-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {tx.description}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {formatDate(tx.timestamp)}
                      </span>
                    </div>
                    <span className="text-base font-bold text-zinc-900 dark:text-white">
                      +{tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recharge Inline Modal */}
      <AnimatePresence>
        {showRecharge && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRecharge(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[280px] bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6"
            >
              <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-4">充值金额</h4>
              <div className="flex items-center gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-700 pb-2">
                <span className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">¥</span>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent border-none text-3xl font-bold text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecharge(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium active:scale-95 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleRecharge}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium active:scale-95 transition-all"
                >
                  确认充值
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bill Detail Modal */}
      <AnimatePresence>
        {selectedBill && portalTarget && (
          <BillDetailModal 
            transaction={selectedBill} 
            onClose={() => setSelectedBill(null)} 
            portalTarget={portalTarget}
          />
        )}
      </AnimatePresence>
    </div>
  );

  return createPortal(content, portalTarget);
};
