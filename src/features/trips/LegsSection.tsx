import { useState, type FormEvent } from 'react';
import { addLeg, deleteLeg, swapLegs, updateLeg } from './trips.data';
import { LEG_MODES, sortLegs, travelSummary, type Leg, type Trip } from './model';
import { validateLeg, type Errors, type LegForm } from './validation';
import { formatDate } from '../../lib/dates';
import {
  Button,
  Card,
  EmptyState,
  Field,
  inputClass,
  NumberStepper,
  SectionHeader,
  Sheet,
} from '../../components/ui';

const MODE_EMOJI: Record<Leg['mode'], string> = {
  car: '🚗',
  bus: '🚌',
  train: '🚆',
  flight: '✈️',
  other: '🧭',
};

export function LegsSection({
  trip,
  legs,
  canEdit,
}: {
  trip: Trip;
  legs: Leg[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState<Leg | 'new' | null>(null);
  const sorted = sortLegs(legs);
  const summary = travelSummary(sorted, trip.expectedKm);

  return (
    <section aria-labelledby="legs-heading">
      <SectionHeader
        title="Getting around"
        subtitle={
          <>
            {summary.cars > 0 && `${summary.cars} car${summary.cars === 1 ? '' : 's'} · `}
            {summary.totalKm != null
              ? `${summary.totalKm.toLocaleString('en-IN')} km`
              : 'Distance not set'}
          </>
        }
        action={
          canEdit && (
            <Button variant="secondary" onClick={() => setEditing('new')}>
              Add leg
            </Button>
          )
        }
      />
      <h2 id="legs-heading" className="sr-only">
        Travel legs
      </h2>
      {sorted.length === 0 ? (
        <EmptyState>
          {canEdit
            ? "Add how you'll travel: cars, a bus, a train or a flight, leg by leg."
            : "The organisers haven't added the travel plan yet."}
        </EmptyState>
      ) : (
        <ol className="space-y-2">
          {sorted.map((leg, i) => (
            <li key={leg.id}>
              <Card className="flex items-start gap-3 !p-4">
                <span className="text-2xl" aria-hidden="true">
                  {MODE_EMOJI[leg.mode]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">
                    {[leg.from, leg.to].filter(Boolean).join(' → ') || 'Leg'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {[
                      LEG_MODES.find((m) => m.value === leg.mode)?.label,
                      leg.date && formatDate(leg.date, { withYear: false }),
                      leg.mode === 'car' || leg.mode === 'bus'
                        ? `${leg.vehicles} ${leg.mode === 'car' ? (leg.vehicles === 1 ? 'car' : 'cars') : leg.vehicles === 1 ? 'bus' : 'buses'}`
                        : null,
                      leg.km != null && `${leg.km.toLocaleString('en-IN')} km`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {leg.notes && (
                    <p className="mt-1 text-sm break-words text-slate-500">{leg.notes}</p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1">
                    <IconButton
                      label="Move up"
                      disabled={i === 0}
                      onClick={() => swapLegs(trip.id, leg, sorted[i - 1]!)}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      label="Move down"
                      disabled={i === sorted.length - 1}
                      onClick={() => swapLegs(trip.id, leg, sorted[i + 1]!)}
                    >
                      ↓
                    </IconButton>
                    <Button variant="ghost" className="!px-2" onClick={() => setEditing(leg)}>
                      Edit
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ol>
      )}

      <Sheet
        open={editing !== null}
        title={editing === 'new' ? 'Add a leg' : 'Edit leg'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <LegFormView
            key={editing === 'new' ? 'new' : editing.id}
            trip={trip}
            leg={editing === 'new' ? null : editing}
            nextOrder={sorted.reduce((m, l) => Math.max(m, l.order), -1) + 1}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </section>
  );
}

function IconButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="h-9 w-9 rounded-lg text-slate-600 hover:bg-slate-100 disabled:text-slate-300"
      {...props}
    >
      {children}
    </button>
  );
}

function LegFormView({
  trip,
  leg,
  nextOrder,
  onDone,
}: {
  trip: Trip;
  leg: Leg | null;
  nextOrder: number;
  onDone: () => void;
}) {
  const [form, setForm] = useState<LegForm>({
    mode: leg?.mode ?? 'car',
    from: leg?.from ?? '',
    to: leg?.to ?? '',
    date: leg?.date ?? '',
    vehicles: leg?.vehicles ?? 1,
    km: leg?.km != null ? String(leg.km) : '',
    notes: leg?.notes ?? '',
  });
  const [errors, setErrors] = useState<Errors<keyof LegForm>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const { input, errors } = validateLeg(form);
    setErrors(errors);
    if (!input) return;
    if (leg) updateLeg(trip.id, leg.id, input);
    else addLeg(trip.id, input, nextOrder);
    onDone();
  }

  const vehicleLabel = LEG_MODES.find((m) => m.value === form.mode)!.vehicleLabel;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">Travelling by</legend>
        <div className="flex flex-wrap gap-2">
          {LEG_MODES.map((m) => (
            <label
              key={m.value}
              className={`cursor-pointer rounded-xl px-3 py-2 text-sm ring-1 ${
                form.mode === m.value ? 'bg-teal-50 text-teal-800 ring-teal-400' : 'ring-slate-300'
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={form.mode === m.value}
                onChange={() => setForm((f) => ({ ...f, mode: m.value }))}
                className="sr-only"
              />
              {MODE_EMOJI[m.value]} {m.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From">
          {(id) => (
            <input
              id={id}
              className={inputClass}
              value={form.from}
              onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
              placeholder="e.g. Hosur"
            />
          )}
        </Field>
        <Field label="To" error={errors.to}>
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              aria-invalid={!!errors.to}
              className={inputClass}
              value={form.to}
              onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
              placeholder="e.g. Ooty"
            />
          )}
        </Field>
        <Field label="Date" error={errors.date}>
          {(id, d) => (
            <input
              id={id}
              type="date"
              aria-describedby={d}
              className={inputClass}
              min={trip.startDate}
              max={trip.endDate}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Distance (km)" error={errors.km}>
          {(id, d) => (
            <input
              id={id}
              inputMode="numeric"
              aria-describedby={d}
              aria-invalid={!!errors.km}
              className={inputClass}
              value={form.km}
              onChange={(e) => setForm((f) => ({ ...f, km: e.target.value }))}
              placeholder="Optional"
            />
          )}
        </Field>
      </div>
      <Field label={vehicleLabel} error={errors.vehicles}>
        {(id) => (
          <NumberStepper
            id={id}
            label={vehicleLabel.toLowerCase()}
            value={form.vehicles}
            min={1}
            max={50}
            onChange={(vehicles) => setForm((f) => ({ ...f, vehicles }))}
          />
        )}
      </Field>
      <Field label="Notes" hint="PNR, flight number, who's driving…" error={errors.notes}>
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            className={inputClass}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        )}
      </Field>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit">{leg ? 'Save leg' : 'Add leg'}</Button>
        {leg &&
          (confirmDelete ? (
            <Button
              variant="danger"
              onClick={() => {
                deleteLeg(trip.id, leg.id);
                onDone();
              }}
            >
              Yes, delete this leg
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          ))}
      </div>
    </form>
  );
}
