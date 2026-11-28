import { NavLink } from 'react-router';
import { NAV_ITEMS } from './nav';
import { NavBadge, badgeLabel } from './NavBadge';
import { useUnseenExpenses } from '../../features/expenses/useUnseen';

/** Phone navigation (< lg). Hidden on wide screens, where the sidebar takes over. */
export function BottomTabs() {
  const { count: unseen } = useUnseenExpenses();
  return (
    <nav
      aria-label="Main"
      data-testid="bottom-tabs"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
          const count = to === '/expenses' ? unseen : 0;
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                aria-label={badgeLabel(label, count)}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                    isActive ? 'text-teal-700' : 'text-slate-500'
                  }`
                }
              >
                <span className="relative">
                  <Icon className="h-6 w-6" />
                  <NavBadge count={count} className="absolute -top-1 left-4" />
                </span>
                {label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
