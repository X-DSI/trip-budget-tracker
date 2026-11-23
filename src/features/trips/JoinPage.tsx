import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useActiveTrip } from './ActiveTripProvider';
import {
  createOwnFamily,
  joinTrip,
  lookupInvite,
  setActiveTrip,
  setMemberFamily,
  useFamilies,
  useTrip,
  type InviteLookup,
} from './trips.data';
import { familySize, nextFamilyColor, type Trip } from './model';
import { FamilyFormView } from './FamiliesSection';
import { Button, Card } from '../../components/ui';
import { formatDateRange } from '../../lib/dates';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

type Step =
  | { kind: 'checking' }
  | { kind: 'problem'; lookup: Exclude<InviteLookup['status'], 'ok'> | 'error' }
  | { kind: 'ready'; lookup: Extract<InviteLookup, { status: 'ok' }> }
  | { kind: 'joining' }
  | { kind: 'pick-family'; tripId: string };

export function JoinPage() {
  const { code = '' } = useParams();
  const { user } = useAuth();
  const { trips } = useActiveTrip();
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const [step, setStep] = useState<Step>({ kind: 'checking' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    lookupInvite(code)
      .then((lookup) => {
        if (cancelled) return;
        setStep(
          lookup.status === 'ok'
            ? { kind: 'ready', lookup }
            : { kind: 'problem', lookup: lookup.status },
        );
      })
      .catch(() => !cancelled && setStep({ kind: 'problem', lookup: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [code, attempt]);

  // Already on this trip? Make it active and go straight there.
  const alreadyMember =
    step.kind === 'ready' && trips.some((t) => t.id === step.lookup.invite.tripId);
  useEffect(() => {
    if (alreadyMember && user && step.kind === 'ready') {
      setActiveTrip(user.uid, step.lookup.invite.tripId);
      void navigate('/trip', { replace: true });
    }
  }, [alreadyMember, user, step, navigate]);

  if (!user) return null;

  async function join() {
    if (step.kind !== 'ready' || !user) return;
    const { invite } = step.lookup;
    setStep({ kind: 'joining' });
    try {
      await joinTrip(user, invite);
      setStep({ kind: 'pick-family', tripId: invite.tripId });
    } catch {
      setStep({ kind: 'problem', lookup: navigator.onLine ? 'error' : 'offline' });
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {step.kind === 'checking' && <Card>Checking your invite…</Card>}

      {step.kind === 'problem' && (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {step.lookup === 'offline' ? "You're offline" : "This invite doesn't work"}
          </h2>
          <p className="text-slate-600">
            {step.lookup === 'offline'
              ? 'Joining a trip needs internet once. Connect and try again.'
              : step.lookup === 'inactive'
                ? 'The organiser has turned this link off. Ask them for a new one.'
                : step.lookup === 'not-found'
                  ? 'The link may be mistyped or expired. Ask the organiser to share it again.'
                  : 'Something went wrong. Please try again.'}
          </p>
          <div className="flex gap-2">
            <Button
              disabled={!online}
              onClick={() => {
                setStep({ kind: 'checking' });
                setAttempt((a) => a + 1);
              }}
            >
              Try again
            </Button>
            <Link to="/" className="rounded-xl px-4 py-2.5 text-sm font-medium text-teal-700">
              Go home
            </Link>
          </div>
        </Card>
      )}

      {step.kind === 'ready' && !alreadyMember && (
        <Card className="space-y-4 text-center">
          <h2 className="text-xl font-semibold text-slate-900">You're invited to a trip</h2>
          <p className="text-slate-600">
            Join to see the plan, add expenses and split them with the other families.
          </p>
          <Button onClick={() => void join()} className="w-full">
            Join the trip
          </Button>
        </Card>
      )}

      {step.kind === 'joining' && <Card>Joining…</Card>}

      {step.kind === 'pick-family' && (
        <PickFamily tripId={step.tripId} uid={user.uid} onDone={() => void navigate('/trip')} />
      )}
    </div>
  );
}

function PickFamily({ tripId, uid, onDone }: { tripId: string; uid: string; onDone: () => void }) {
  const trip = useTrip(tripId);
  const families = useFamilies(tripId);
  const [creating, setCreating] = useState(false);
  const active = families.data.filter((f) => f.active);

  if (!trip.data) return <Card>Loading the trip…</Card>;

  return (
    <div className="space-y-4">
      <TripSummary trip={trip.data} />
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Which family are you in?</h2>
        {!creating && (
          <>
            <ul className="space-y-2">
              {active.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setMemberFamily(tripId, uid, f.id);
                      onDone();
                    }}
                    className="w-full rounded-xl px-4 py-3 text-left ring-1 ring-slate-300 hover:bg-teal-50 hover:ring-teal-400"
                  >
                    <span className="block font-medium text-slate-900">{f.name}</span>
                    <span className="text-sm text-slate-600">{familySize(f)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setCreating(true)}>
                My family isn't listed
              </Button>
              <Button variant="ghost" onClick={onDone}>
                Decide later
              </Button>
            </div>
          </>
        )}
        {creating && (
          <FamilyFormView
            family={null}
            defaultColor={nextFamilyColor(families.data)}
            submitLabel="Add my family"
            onSubmit={(input) => {
              createOwnFamily(
                tripId,
                uid,
                input,
                families.data.reduce((m, f) => Math.max(m, f.order), -1) + 1,
              );
              onDone();
            }}
          />
        )}
      </Card>
    </div>
  );
}

function TripSummary({ trip }: { trip: Trip }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white">
      <p className="text-sm text-teal-100">You've joined</p>
      <h2 className="mt-1 text-2xl font-semibold" data-testid="joined-trip-name">
        {trip.name}
      </h2>
      <p className="mt-2 text-sm text-teal-50">
        {formatDateRange(trip.startDate, trip.endDate)}
        {trip.destination && ` · ${trip.destination}`}
      </p>
    </div>
  );
}
