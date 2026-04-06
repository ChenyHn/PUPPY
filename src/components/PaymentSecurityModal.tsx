/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderInPhoneContainer } from '../utils/portal';
import { X, ShieldCheck, ChevronRight, Check } from 'lucide-react';

interface PaymentSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentSecurityModal({ isOpen, onClose }: PaymentSecurityModalProps) {
  const [hasPassword, setHasPassword] = useState(false);
  const [isPasswordFreeEnabled, setIsPasswordFreeEnabled] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'setup-password' | 'verify-password'>('main');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupStep, setSetupStep] = useState<1 | 2>(1); // 1: input, 2: confirm

  useEffect(() => {
    // Load state from local storage on mount
    const storedPassword = localStorage.getItem('payment_password');
    const storedFreeStatus = localStorage.getItem('payment_free_enabled');
    
    if (storedPassword) {
      setHasPassword(true);
    }
    if (storedFreeStatus === 'true') {
      setIsPasswordFreeEnabled(true);
    }
  }, [isOpen]);

  const handleTogglePasswordFree = () => {
    const newState = !isPasswordFreeEnabled;
    setIsPasswordFreeEnabled(newState);
    localStorage.setItem('payment_free_enabled', newState.toString());
  };

  const handlePasswordInput = (num: string) => {
    if (passwordInput.length < 6) {
      setPasswordInput(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPasswordInput(prev => prev.slice(0, -1));
  };

  const handleSetupNext = () => {
    if (passwordInput.length === 6) {
      if (setupStep === 1) {
        setConfirmPassword(passwordInput);
        setPasswordInput('');
        setSetupStep(2);
      } else if (setupStep === 2) {
        if (passwordInput === confirmPassword) {
          // Store securely - simplified for demo, in real app use proper hashing
          localStorage.setItem('payment_password', btoa(passwordInput));
          setHasPassword(true);
          resetSetup();
          setCurrentView('main');
        } else {
          alert('两次输入的密码不一致，请重新输入');
          setPasswordInput('');
          setConfirmPassword('');
          setSetupStep(1);
        }
      }
    }
  };

  const resetSetup = () => {
    setPasswordInput('');
    setConfirmPassword('');
    setSetupStep(1);
    setCurrentView('main');
  };

  // Trigger effect when password reaches 6 digits
  useEffect(() => {
    if (passwordInput.length === 6 && currentView === 'setup-password') {
       // Small delay to let user see the last dot
       const timer = setTimeout(() => {
          handleSetupNext();
       }, 200);
       return () => clearTimeout(timer);
    }
  }, [passwordInput, currentView]);


  const renderKeypad = () => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '重置', '0', '删除'];
    return (
      <div className="grid grid-cols-3 gap-2 mt-4 w-full">
        {keys.map((key, index) => {
          if (key === '重置') {
            return (
              <button
                key={index}
                onClick={() => setPasswordInput('')}
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
                onClick={handleDelete}
                className="py-3 flex items-center justify-center text-sm font-medium bg-gray-50 dark:bg-gray-700/50 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 text-gray-600 dark:text-gray-300 transition-colors"
              >
                {key}
              </button>
            );
          }
          return (
            <button
              key={index}
              onClick={() => handlePasswordInput(key)}
              className="py-3 flex items-center justify-center text-lg font-bold bg-gray-50 dark:bg-gray-700/50 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 text-gray-800 dark:text-gray-100 transition-colors"
            >
              {key}
            </button>
          );
        })}
      </div>
    );
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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-11/12 max-w-[280px] flex flex-col max-h-[85vh] mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center pt-4 px-4 pb-3">
                <div className="flex items-center gap-2">
                  {currentView !== 'main' && (
                    <button onClick={resetSetup} className="p-1 -ml-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                      <ChevronRight className="rotate-180" size={18} />
                    </button>
                  )}
                  <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck size={18} />
                    支付安全
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="px-4 flex-1 overflow-y-auto no-scrollbar pb-4">
                {currentView === 'main' && (
                  <div className="flex flex-col gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 flex flex-col gap-3">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setCurrentView('setup-password')}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800 dark:text-white">
                            {hasPassword ? '修改支付密码' : '设置支付密码'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            用于转账、发红包等支付验证
                          </span>
                        </div>
                        <div className="flex items-center justify-center">
                          <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
                        </div>
                      </div>
                    </div>

                    {hasPassword && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col flex-1 pr-2">
                            <span className="text-sm font-bold text-gray-800 dark:text-white">
                              免密支付
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              开启后，所有支付无需输入密码
                            </span>
                          </div>
                          <button
                            onClick={handleTogglePasswordFree}
                            className={`w-11 h-6 rounded-full p-1 transition-colors relative flex items-center shrink-0 ${
                              isPasswordFreeEnabled ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          >
                            <motion.div
                              className={`w-4 h-4 rounded-full ${isPasswordFreeEnabled ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-400'}`}
                              animate={{ x: isPasswordFreeEnabled ? 20 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentView === 'setup-password' && (
                  <div className="flex flex-col items-center py-2">
                    <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">
                      {setupStep === 1 ? '请输入支付密码' : '请再次输入支付密码'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">为保障资金安全，请设置6位数字密码</p>
                    
                    {renderDots()}
                    {renderKeypad()}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return isOpen ? renderInPhoneContainer(modalContent) : null;
}

/**
 * Utility function to verify payment password.
 * To be used in transfer, red packet, etc.
 * @param amount The transaction amount.
 * @param callback Callback to execute if validation passes.
 */
export const verifyPaymentPassword = (amount: number, callback: () => void) => {
  const hasPassword = !!localStorage.getItem('payment_password');
  const isFreeEnabled = localStorage.getItem('payment_free_enabled') === 'true';

  if (!hasPassword) {
    // Ideally prompt to set password, for now just allow or reject based on requirements
    alert("未设置支付密码，请先在‘我-支付安全’中设置。");
    return;
  }

  if (isFreeEnabled) {
    // Password free condition met
    callback();
    return;
  }

  // Real app: show a modal to enter password, verify hash, then call callback
  // Here we just prompt for simple verification
  const entered = prompt("请输入支付密码：");
  if (entered) {
    const stored = localStorage.getItem('payment_password');
    if (stored && btoa(entered) === stored) {
       callback();
    } else {
       alert("密码错误");
    }
  }
};
