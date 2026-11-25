import { NavLink } from 'react-router';
import { NAV_ITEMS } from './nav';
import { AppLogo } from '../Icons';

/** Desktop navigation (≥ lg). */
export function Sidebar() {
  return (
    <aside
      data-testid="sidebar"
      className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex"
    >
      <div className="flex items-center gap-3 px-6 py-5">
        <AppLogo className="h-9 w-9" />
        <span className="text-lg font-semibold text-slate-900">Trip Planner</span>
      </div>
      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
