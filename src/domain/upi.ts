// UPI deep links for settling up. Opens GPay / PhonePe / Paytm etc. on Android and iOS.

import { MoneyError, paiseToDecimalString } from './money';

export interface UpiPayment {
  /** Payee VPA, e.g. "daniel@okicici". */
  upiId: string;
  payeeName: string;
  amountPaise: number;
  note?: string;
}

const VPA = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;

export function isValidUpiId(upiId: string): boolean {
  return VPA.test(upiId.trim());
}

/** `upi://pay?pa=…&pn=…&am=1250.50&cu=INR&tn=…` per the NPCI deep-link format. */
export function upiLink({ upiId, payeeName, amountPaise, note }: UpiPayment): string {
  const vpa = upiId.trim();
  if (!isValidUpiId(vpa)) throw new MoneyError(`"${upiId}" is not a valid UPI ID`);
  if (amountPaise <= 0) throw new MoneyError('a UPI payment needs an amount above zero');

  // The VPA's "@" stays literal: some UPI apps don't decode "%40".
  const parts = [
    `pa=${vpa}`,
    `pn=${encodeURIComponent(payeeName.trim())}`,
    `am=${paiseToDecimalString(amountPaise)}`,
    'cu=INR',
  ];
  const trimmedNote = note?.trim();
  if (trimmedNote) parts.push(`tn=${encodeURIComponent(trimmedNote.slice(0, 80))}`);
  return `upi://pay?${parts.join('&')}`;
}
