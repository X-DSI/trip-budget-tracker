import { NavLink, Outlet } from 'react-router';

const TABS = [
  { to: '/money/budget', label: 'Budget' },
  { to: '/money/balances', label: 'Balances' },
];

/** The Money tab: a Budget | Balances switch over the two pages. */
export function MoneyLayout() {
  return (
    <div className="space-y-6">
      <nav
        aria-label="Money"
        className="flex rounded-2xl bg-slate-200/70 p-1"
        data-testid="money-switch"
      >
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `flex-1 rounded-xl px-4 py-2 text-center text-sm font-medium transition ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
