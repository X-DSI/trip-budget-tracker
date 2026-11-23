import { NavLink } from 'react-router';
import { NAV_ITEMS } from './nav';

/** Phone navigation (< lg). Hidden on wide screens, where the sidebar takes over. */
export function BottomTabs() {
  return (
    <nav
      aria-label="Main"
      data-testid="bottom-tabs"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  isActive ? 'text-teal-700' : 'text-slate-500'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
