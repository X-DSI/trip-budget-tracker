import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppShell } from './AppShell';
import { titleForPath } from './nav';

vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW: vi.fn() }));
vi.mock('../../features/trips/TripSwitcher', () => ({ TripSwitcher: () => null }));
vi.mock('../../features/expenses/useUnseen', () => ({
  useUnseenExpenses: () => ({ unseen: new Map(), count: 2, seenAt: 0, markSeen: () => {} }),
}));

describe('titleForPath', () => {
  it('names each tab and its sub-pages', () => {
    expect(titleForPath('/')).toBe('Home');
    expect(titleForPath('/trip')).toBe('Trip');
    expect(titleForPath('/trip/edit')).toBe('Trip');
    expect(titleForPath('/tripping')).toBe('Trip Planner');
    expect(titleForPath('/nowhere')).toBe('Trip Planner');
  });
});

describe('AppShell', () => {
  it('renders both navigations, each limited to its breakpoint by CSS', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppShell />,
          children: [{ index: true, element: <p>home body</p> }],
        },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    expect(screen.getByText('home body')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-tabs')).toHaveClass('lg:hidden');
    expect(screen.getByTestId('sidebar')).toHaveClass('hidden', 'lg:flex');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Home');
    // Five tabs in each navigation.
    // The Expenses item carries the "new since you last looked" count in both.
    expect(screen.getAllByRole('link', { name: 'Expenses, 2 new' })).toHaveLength(2);
    expect(screen.getAllByTestId('nav-badge').map((b) => b.textContent)).toEqual(['2', '2']);
  });
});
