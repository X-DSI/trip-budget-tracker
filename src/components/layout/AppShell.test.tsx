import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppShell } from './AppShell';
import { titleForPath } from './nav';

vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW: vi.fn() }));

describe('titleForPath', () => {
  it('names each tab and its sub-pages', () => {
    expect(titleForPath('/')).toBe('Home');
    expect(titleForPath('/trip')).toBe('Trip');
    expect(titleForPath('/trip/edit')).toBe('Trip');
    expect(titleForPath('/tripping')).toBe('Trip Budget');
    expect(titleForPath('/nowhere')).toBe('Trip Budget');
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
    expect(screen.getAllByRole('link', { name: 'Expenses' })).toHaveLength(2);
  });
});
