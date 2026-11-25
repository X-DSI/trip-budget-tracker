import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { authErrorMessage, signInWithGoogle } from '../../lib/auth';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuth } from './AuthProvider';
import { Splash } from '../../components/Splash';
import { AppLogo } from '../../components/Icons';
import { safeNext } from './safeNext';

export function SignInPage() {
  const { user, loading } = useAuth();
  const online = useOnlineStatus();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <Splash />;
  if (user) return <Navigate to={safeNext(params.get('next'))} replace />;

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-slate-50 px-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <AppLogo className="mx-auto h-16 w-16" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Trip Planner</h1>
        <p className="mt-2 text-slate-600">
          Plan the trip together, log expenses on the road, and split them fairly between families.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={busy || !online}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleMark />
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>

        {!online && (
          <p className="mt-4 text-sm text-amber-700" role="status">
            You're offline. The first sign-in needs internet; after that the app works offline.
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <p className="mt-6 text-xs text-slate-500">
          Tip: sign in once on Wi-Fi before the trip, so the app is ready with no signal.
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M21.8 10H12v4h5.6a6 6 0 1 1-1.7-6.4l2.9-2.8A10 10 0 1 0 22 12c0-.7-.1-1.4-.2-2Z"
      />
      <path fill="#FF3D00" d="M3.2 7.3l3.3 2.4A6 6 0 0 1 15.9 7.6l2.9-2.8A10 10 0 0 0 3.2 7.3Z" />
      <path
        fill="#4CAF50"
        d="M12 22a10 10 0 0 0 6.7-2.6l-3.1-2.6A6 6 0 0 1 6.5 14l-3.3 2.5A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#1976D2"
        d="M21.8 10H12v4h5.6a6 6 0 0 1-2 2.8l3.1 2.6C18.5 19.6 22 17 22 12c0-.7-.1-1.4-.2-2Z"
      />
    </svg>
  );
}
