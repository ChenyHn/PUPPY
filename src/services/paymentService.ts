/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const isPasswordFree = (): boolean => {
  return localStorage.getItem('payment_free_enabled') === 'true';
};

export const hasPaymentPassword = (): boolean => {
  return !!localStorage.getItem('payment_password');
};

export const verifyPaymentPassword = (input: string): boolean => {
  const stored = localStorage.getItem('payment_password');
  if (!stored) return false;
  return btoa(input) === stored;
};
