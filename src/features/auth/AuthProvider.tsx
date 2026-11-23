import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { completeRedirectSignIn, upsertUserProfile, watchAuth, type User } from '../../lib/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    void completeRedirectSignIn();
    return watchAuth((user) => {
      setState({ user, loading: false });
      if (user) void upsertUserProfile(user).catch(() => undefined);
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider
export function useAuth() {
  return useContext(AuthContext);
}
