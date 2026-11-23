import { createBrowserRouter, Link, RouterProvider } from 'react-router';
import { AuthProvider } from './features/auth/AuthProvider';
import { RequireAuth } from './features/auth/RequireAuth';
import { SignInPage } from './features/auth/SignInPage';
import { AppShell } from './components/layout/AppShell';
import { ReloadPrompt } from './components/ReloadPrompt';
import { HomePage } from './pages/HomePage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { MorePage } from './pages/MorePage';

const router = createBrowserRouter([
  { path: '/signin', element: <SignInPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'trip',
        element: (
          <ComingSoonPage
            title="Trip details"
            body="Dates, destination, distance, cars, buses, trains and flights, families and invites."
          />
        ),
      },
      {
        path: 'expenses',
        element: (
          <ComingSoonPage
            title="Expenses"
            body="Log what you spend, even with no signal, and split it the way your group agrees."
          />
        ),
      },
      {
        path: 'balances',
        element: (
          <ComingSoonPage
            title="Balances"
            body="See who owes whom between families, and settle up over UPI."
          />
        ),
      },
      { path: 'more', element: <MorePage /> },
      {
        path: '*',
        element: (
          <section className="rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Page not found</h2>
            <Link to="/" className="mt-4 inline-block font-medium text-teal-700">
              Back home
            </Link>
          </section>
        ),
      },
    ],
  },
]);

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <ReloadPrompt />
    </AuthProvider>
  );
}
