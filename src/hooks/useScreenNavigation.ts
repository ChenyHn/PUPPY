import { useEffect, useState } from 'react';
import type { ChatTab, Screen } from '../types';

interface UseScreenNavigationParams {
  isLockScreenEnabled: boolean;
  isPasswordEnabled: boolean;
}

export function useScreenNavigation({ isLockScreenEnabled, isPasswordEnabled }: UseScreenNavigationParams) {
  const [screen, setScreen] = useState<Screen>('splash');
  const [chatTab, setChatTab] = useState<ChatTab>('messages');
  const [password, setPassword] = useState<string | null>(() => localStorage.getItem('aiphone_password'));
  const [input, setInput] = useState('');
  const [setupStep, setSetupStep] = useState<'first' | 'confirm'>('first');
  const [firstInput, setFirstInput] = useState('');
  const [error, setError] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      setDate(`${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => {
        if (!isLockScreenEnabled) {
          setScreen('home');
        } else {
          setScreen('lock');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [screen, isLockScreenEnabled]);

  const handleNumpad = (num: string) => {
    if (input.length >= 6) return;
    const newInput = input + num;
    setInput(newInput);
    setError('');

    if (newInput.length === 6) {
      setTimeout(() => {
        if (screen === 'password-setup') {
          if (setupStep === 'first') {
            setFirstInput(newInput);
            setInput('');
            setSetupStep('confirm');
          } else {
            if (newInput === firstInput) {
              localStorage.setItem('aiphone_password', newInput);
              setPassword(newInput);
              setScreen('home');
              setInput('');
            } else {
              setError('两次密码不一致，请重试');
              setInput('');
              setSetupStep('first');
            }
          }
        } else if (screen === 'password-unlock') {
          if (newInput === password) {
            setScreen('home');
            setInput('');
          } else {
            setError('密码错误，请重试');
            setInput('');
          }
        }
      }, 300);
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
    setError('');
  };

  const isPostAuth = !['splash', 'lock', 'password-setup', 'password-unlock'].includes(screen);
  const lockScreenTarget = !isPasswordEnabled ? 'home' : password ? 'password-unlock' : 'password-setup';

  return {
    screen,
    setScreen,
    chatTab,
    setChatTab,
    password,
    setPassword,
    input,
    setupStep,
    error,
    time,
    date,
    isPostAuth,
    lockScreenTarget,
    handleNumpad,
    handleDelete,
  };
}
