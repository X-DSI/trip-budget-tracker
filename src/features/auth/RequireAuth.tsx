import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './AuthProvider';
import { Splash } from '../../components/Splash';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Splash />;
  if (!user) {
    const next = location.pathname + location.search;
    return <Navigate to={`/signin?next=${encodeURIComponent(next)}`} replace />;
  }
  return <>{children}</>;
}
