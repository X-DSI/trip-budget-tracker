import { useAuth } from '../features/auth/AuthProvider';
import { useUserProfile } from '../features/profile/profile.data';
import { firstName } from '../lib/names';

/** Placeholder dashboard. The dashboard handoff replaces the body with countdown/welcome cards. */
export function HomePage() {
  const { user } = useAuth();
  const profile = useUserProfile(user?.uid);
  const name = firstName(profile?.displayName ?? user?.displayName);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-sm lg:p-8">
        <p className="text-sm text-teal-100">Welcome</p>
        <h2 className="mt-1 text-2xl font-semibold lg:text-3xl">Hi {name}!</h2>
        <p className="mt-2 max-w-prose text-teal-50">
          {profile?.activeTripId
            ? 'Your trip dashboard is on its way.'
            : "You're not part of a trip yet. Planning and invite links are coming next."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PlaceholderCard title="Plan a trip" body="Dates, places, distance and who's coming." />
        <PlaceholderCard
          title="Join with a link"
          body="Open the invite link from your group chat."
        />
      </div>
    </section>
  );
}

function PlaceholderCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h3 className="font-medium text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
      <p className="mt-3 text-xs font-medium tracking-wide text-slate-400 uppercase">Coming soon</p>
    </div>
  );
}
