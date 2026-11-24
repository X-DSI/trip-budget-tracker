import { createBrowserRouter, Link, Navigate, RouterProvider } from 'react-router';
import { AuthProvider } from './features/auth/AuthProvider';
import { RequireAuth } from './features/auth/RequireAuth';
import { SignInPage } from './features/auth/SignInPage';
import { AppShell } from './components/layout/AppShell';
import { ReloadPrompt } from './components/ReloadPrompt';
import { HomePage } from './pages/HomePage';
import { MorePage } from './pages/MorePage';
import { ActiveTripProvider } from './features/trips/ActiveTripProvider';
import { TripPage } from './features/trips/TripPage';
import { EditTripPage, NewTripPage } from './features/trips/TripFormPage';
import { JoinPage } from './features/trips/JoinPage';
import { ExpensesPage } from './features/expenses/ExpensesPage';
import { ItineraryPage } from './features/itinerary/ItineraryPage';
import { BalancesPage } from './features/balances/BalancesPage';
import { MoneyLayout } from './features/money/MoneyLayout';
import { BudgetPage } from './features/money/BudgetPage';
import { ErrorToasts } from './components/ErrorToasts';

const router = createBrowserRouter([
  { path: '/signin', element: <SignInPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <ActiveTripProvider>
          <AppShell />
        </ActiveTripProvider>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'trip', element: <TripPage /> },
      { path: 'trip/edit', element: <EditTripPage /> },
      { path: 'itinerary', element: <ItineraryPage /> },
      { path: 'trips/new', element: <NewTripPage /> },
      { path: 'join/:code', element: <JoinPage /> },
      { path: 'expenses', element: <ExpensesPage /> },
      {
        path: 'money',
        element: <MoneyLayout />,
        children: [
          { index: true, element: <Navigate to="/money/balances" replace /> },
          { path: 'budget', element: <BudgetPage /> },
          { path: 'balances', element: <BalancesPage /> },
        ],
      },
      { path: 'balances', element: <Navigate to="/money/balances" replace /> },
      { path: 'budget', element: <Navigate to="/money/budget" replace /> },
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
      <ErrorToasts />
    </AuthProvider>
  );
}
