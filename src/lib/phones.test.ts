import { describe, expect, it } from 'vitest';
import { splitPhones } from './phones';

const phones = (text: string) =>
  splitPhones(text).flatMap((p) => ('phone' in p ? [[p.phone, p.href]] : []));

describe('splitPhones', () => {
  it('finds Indian mobiles in common formats', () => {
    expect(phones('Driver Ravi 98765 43210')).toEqual([['98765 43210', 'tel:+919876543210']]);
    expect(phones('Call +91-98765-43210 or 9123456789.')).toEqual([
      ['+91-98765-43210', 'tel:+919876543210'],
      ['9123456789', 'tel:+919123456789'],
    ]);
    expect(phones('Hotel: 098765 43210')).toEqual([['098765 43210', 'tel:+919876543210']]);
  });

  it('finds landlines with an STD code', () => {
    expect(phones('Sterling Ooty 0423-2444444')).toEqual([['0423-2444444', 'tel:+914232444444']]);
    expect(phones('Office 080 2345 6789')).toEqual([['080 2345 6789', 'tel:+918023456789']]);
  });

  it('leaves amounts, dates, PNRs and other numbers alone', () => {
    expect(phones('Advance ₹1,25,000 paid on 04/12/2026')).toEqual([]);
    expect(phones('Room 204, booking 123456')).toEqual([]);
    expect(phones('PNR 8412345678, coach S4')).toEqual([]);
    expect(phones('Card ending 12345678901234')).toEqual([]);
    expect(phones('Starts 2026-12-04')).toEqual([]);
  });

  it('links emergency short codes only next to a word that names them', () => {
    expect(phones('Ambulance: 108\nPolice 100, fire – 101')).toEqual([
      ['108', 'tel:108'],
      ['100', 'tel:100'],
      ['101', 'tel:101'],
    ]);
    expect(phones('Emergency 112')).toEqual([['112', 'tel:112']]);
    expect(phones('Room 108, 100 km to go, ₹112 tip')).toEqual([]);
  });

  it('keeps the surrounding text intact', () => {
    const parts = splitPhones('A 98765 43210 B');
    expect(parts).toEqual([
      { text: 'A ' },
      { phone: '98765 43210', href: 'tel:+919876543210' },
      { text: ' B' },
    ]);
    expect(splitPhones('no numbers here')).toEqual([{ text: 'no numbers here' }]);
  });
});
