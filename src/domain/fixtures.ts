import type { Family } from './types';

/** Four families of 2, 4, 3 and 3 adults, in order A, B, C, D. */
export function fourFamilies(): Family[] {
  return [
    { id: 'A', name: 'Family A', adults: 2, kids: 0, order: 0, active: true },
    { id: 'B', name: 'Family B', adults: 4, kids: 0, order: 1, active: true },
    { id: 'C', name: 'Family C', adults: 3, kids: 0, order: 2, active: true },
    { id: 'D', name: 'Family D', adults: 3, kids: 0, order: 3, active: true },
  ];
}
