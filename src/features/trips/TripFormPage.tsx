import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useActiveTrip } from './ActiveTripProvider';
import { createTrip, updateTrip, useInvites, useMembers } from './trips.data';
import { isOrganizer, ownerNameOf, type Trip } from './model';
import { validateTrip, type Errors, type TripForm } from './validation';
import { Button, Card, Field, inputClass } from '../../components/ui';

function formFrom(trip: Trip | null): TripForm {
  return {
    name: trip?.name ?? '',
    destination: trip?.destination ?? '',
    startDate: trip?.startDate ?? '',
    endDate: trip?.endDate ?? '',
    expectedKm: trip?.expectedKm != null ? String(trip.expectedKm) : '',
    kidWeight: String(trip?.kidWeight ?? 0.5),
    notes: trip?.notes ?? '',
  };
}

export function NewTripPage() {
  return <TripFormView trip={null} />;
}

export function EditTripPage() {
  const { trip, loading } = useActiveTrip();
  const { user } = useAuth();
  if (loading) return null;
  if (!trip) return <TripFormView trip={null} />;
  if (!isOrganizer(trip, user?.uid)) {
    return (
      <Card>
        <p className="text-slate-700">Only the trip organisers can edit the trip details.</p>
        <Link to="/trip" className="mt-3 inline-block font-medium text-teal-700">
          Back to the trip
        </Link>
      </Card>
    );
  }
  return <TripFormView key={trip.id} trip={trip} />;
}

function TripFormView({ trip }: { trip: Trip | null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<TripForm>(() => formFrom(trip));
  const [errors, setErrors] = useState<Errors<keyof TripForm>>({});
  const invites = useInvites(trip?.id ?? null, !!trip);
  const members = useMembers(trip?.id ?? null);

  const set = (key: keyof TripForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const { input, errors } = validateTrip(form);
    setErrors(errors);
    if (!input || !user) return;
    if (trip) {
      updateTrip(
        trip.id,
        input,
        invites.data.filter((i) => i.active).map((i) => i.code),
        ownerNameOf(trip, members.data),
      );
    } else createTrip(user, input);
    void navigate('/trip');
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          {trip ? 'Edit trip details' : 'Plan a new trip'}
        </h2>
        <p className="mt-1 text-slate-600">
          {trip
            ? 'Changes sync to everyone on the trip.'
            : "You'll be the organiser. Next you'll add families and share an invite link."}
        </p>
      </div>

      <Card className="space-y-5">
        <Field label="Trip name" error={errors.name}>
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              aria-invalid={!!errors.name}
              className={inputClass}
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
              placeholder="e.g. Ooty & Coorg, December"
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Where to" hint="The main places, e.g. Ooty, Coorg" error={errors.destination}>
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              aria-invalid={!!errors.destination}
              className={inputClass}
              value={form.destination}
              onChange={(e) => set('destination')(e.target.value)}
              autoComplete="off"
            />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Starts" error={errors.startDate}>
            {(id, d) => (
              <input
                id={id}
                type="date"
                aria-describedby={d}
                aria-invalid={!!errors.startDate}
                className={inputClass}
                value={form.startDate}
                onChange={(e) => set('startDate')(e.target.value)}
              />
            )}
          </Field>
          <Field label="Ends" error={errors.endDate}>
            {(id, d) => (
              <input
                id={id}
                type="date"
                aria-describedby={d}
                aria-invalid={!!errors.endDate}
                className={inputClass}
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={(e) => set('endDate')(e.target.value)}
              />
            )}
          </Field>
        </div>
      </Card>

      <Card className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Expected driving (km)"
            hint="Total for the trip. Optional; travel plans in the itinerary add up their own."
            error={errors.expectedKm}
          >
            {(id, d) => (
              <input
                id={id}
                inputMode="numeric"
                aria-describedby={d}
                aria-invalid={!!errors.expectedKm}
                className={inputClass}
                value={form.expectedKm}
                onChange={(e) => set('expectedKm')(e.target.value)}
                placeholder="e.g. 850"
              />
            )}
          </Field>
          <Field
            label="A child counts as"
            hint="For per-head splits. 0.5 = half an adult."
            error={errors.kidWeight}
          >
            {(id, d) => (
              <select
                id={id}
                aria-describedby={d}
                className={inputClass}
                value={form.kidWeight}
                onChange={(e) => set('kidWeight')(e.target.value)}
              >
                <option value="0">Free (0)</option>
                <option value="0.25">A quarter (0.25)</option>
                <option value="0.5">Half (0.5)</option>
                <option value="0.75">Three quarters (0.75)</option>
                <option value="1">A full adult (1)</option>
              </select>
            )}
          </Field>
        </div>
        <Field label="Notes" hint="Anything everyone should know." error={errors.notes}>
          {(id, d) => (
            <textarea
              id={id}
              aria-describedby={d}
              rows={3}
              className={inputClass}
              value={form.notes}
              onChange={(e) => set('notes')(e.target.value)}
            />
          )}
        </Field>
      </Card>

      <div className="flex gap-3">
        <Button type="submit">{trip ? 'Save changes' : 'Create trip'}</Button>
        <Button variant="secondary" onClick={() => void navigate(trip ? '/trip' : '/')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
