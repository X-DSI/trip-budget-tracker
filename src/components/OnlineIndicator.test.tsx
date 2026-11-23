import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { OnlineIndicator } from './OnlineIndicator';

afterEach(() => vi.restoreAllMocks());

function setOnline(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value);
  window.dispatchEvent(new Event(value ? 'online' : 'offline'));
}

describe('OnlineIndicator', () => {
  it('shows a visible badge only while offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    render(<OnlineIndicator />);
    expect(screen.getByTestId('online-indicator')).toHaveAttribute('data-online', 'true');

    act(() => setOnline(false));
    expect(screen.getByTestId('online-indicator')).toHaveTextContent('Offline');

    act(() => setOnline(true));
    expect(screen.getByTestId('online-indicator')).toHaveAttribute('data-online', 'true');
  });
});
