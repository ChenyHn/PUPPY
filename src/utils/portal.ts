import ReactDOM from 'react-dom';
import React from 'react';

export const getPhoneContainer = (): HTMLElement => {
  const container = document.querySelector('.phone-mockup') || document.querySelector('#phone-container');
  if (!container) {
    console.warn('手机容器未找到，回退到 body');
    return document.body;
  }
  return container as HTMLElement;
};

export const renderInPhoneContainer = (element: React.ReactElement) => {
  return ReactDOM.createPortal(element, getPhoneContainer());
};
