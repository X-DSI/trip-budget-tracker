import { useState } from 'react';
import { signOutUser } from '../lib/auth';
import { useAuth } from '../features/auth/AuthProvider';
import { MyTrips } from '../features/trips/MyTrips';
import { ThemeSetting } from '../components/ThemeSetting';
import { AppFooter } from '../components/AppFooter';

export function MorePage() {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            referrerPolicy="no-referrer"
            className="h-12 w-12 rounded-full"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800">
            {(user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{user?.displayName ?? 'Signed in'}</p>
          <p className="truncate text-sm text-slate-500">{user?.email}</p>
        </div>
      </div>

      <MyTrips />

      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <ThemeSetting />
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        {confirming ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Sign out? Anything not yet synced stays on this device and syncs after you sign in
              again — but you'll need internet to sign back in.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void signOutUser()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                Sign out
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-sm font-medium text-red-700"
          >
            Sign out
          </button>
        )}
      </div>

      <AppFooter />
    </section>
  );
}
