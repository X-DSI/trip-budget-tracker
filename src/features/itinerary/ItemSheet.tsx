import { useState, type FormEvent } from 'react';
import type { Trip } from '../trips/model';
import { addItem, deleteItem, updateItem } from './itinerary.data';
import {
  dayLabel,
  itemToForm,
  KINDS,
  TRAVEL_MODES,
  tripDays,
  validateItem,
  type ItemErrors,
  type ItemForm,
  type ItineraryItem,
} from './model';
import { Button, Field, inputClass, NumberStepper } from '../../components/ui';

export function ItemFormView({
  trip,
  item,
  defaultDay,
  nextOrder,
  onDone,
}: {
  trip: Trip;
  item: ItineraryItem | null;
  defaultDay: string;
  /** Order for a new item: after everything already on that day. */
  nextOrder: (day: string) => number;
  onDone: () => void;
}) {
  const [form, setForm] = useState<ItemForm>(() =>
    item
      ? itemToForm(item)
      : {
          day: defaultDay,
          time: '',
          kind: 'sightseeing',
          title: '',
          place: '',
          notes: '',
          mode: 'car',
          vehicles: 1,
          km: '',
        },
  );
  const [errors, setErrors] = useState<ItemErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof ItemForm>(key: K, value: ItemForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const { input, errors } = validateItem(form, trip);
    setErrors(errors);
    if (!input) return;
    if (item) updateItem(trip.id, item.id, input);
    else addItem(trip.id, input, nextOrder(input.day));
    onDone();
  }

  const days = tripDays(trip.startDate, trip.endDate);
  const vehicleLabel = TRAVEL_MODES.find((m) => m.value === form.mode)!.vehicles;

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="item-form">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">What</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Choice
              key={k.value}
              name="kind"
              checked={form.kind === k.value}
              onChange={() => set('kind', k.value)}
            >
              {k.emoji} {k.label}
            </Choice>
          ))}
        </div>
      </fieldset>

      <Field label="Title" error={errors.title}>
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            aria-invalid={!!errors.title}
            className={inputClass}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={form.kind === 'travel' ? 'e.g. Drive to Ooty' : 'e.g. Botanical Garden'}
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Day" error={errors.day}>
          {(id, d) => (
            <select
              id={id}
              aria-describedby={d}
              className={inputClass}
              value={form.day}
              onChange={(e) => set('day', e.target.value)}
            >
              {days.map((day) => (
                <option key={day} value={day}>
                  {dayLabel(day, trip.startDate)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Time" hint="Optional" error={errors.time}>
          {(id, d) => (
            <input
              id={id}
              type="time"
              aria-describedby={d}
              className={inputClass}
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
            />
          )}
        </Field>
      </div>

      <Field label="Place" hint="Optional. Opens in Maps." error={errors.place}>
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            className={inputClass}
            value={form.place}
            onChange={(e) => set('place', e.target.value)}
            placeholder="e.g. Government Botanical Garden, Ooty"
          />
        )}
      </Field>

      {form.kind === 'travel' && (
        <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-slate-700">By</legend>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_MODES.map((m) => (
                <Choice
                  key={m.value}
                  name="mode"
                  checked={form.mode === m.value}
                  onChange={() => set('mode', m.value)}
                >
                  {m.emoji} {m.label}
                </Choice>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={vehicleLabel} error={errors.vehicles}>
              {(id) => (
                <NumberStepper
                  id={id}
                  label={vehicleLabel.toLowerCase()}
                  value={form.vehicles}
                  min={1}
                  max={50}
                  onChange={(v) => set('vehicles', v)}
                />
              )}
            </Field>
            <Field label="Distance (km)" hint="Optional" error={errors.km}>
              {(id, d) => (
                <input
                  id={id}
                  inputMode="numeric"
                  aria-describedby={d}
                  aria-invalid={!!errors.km}
                  className={inputClass}
                  value={form.km}
                  onChange={(e) => set('km', e.target.value)}
                />
              )}
            </Field>
          </div>
        </div>
      )}

      <Field
        label="Notes"
        hint="Optional: booking number, PNR, who's driving…"
        error={errors.notes}
      >
        {(id, d) => (
          <textarea
            id={id}
            rows={2}
            aria-describedby={d}
            className={inputClass}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        )}
      </Field>

      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit">{item ? 'Save' : 'Add to itinerary'}</Button>
        {item &&
          (confirmDelete ? (
            <Button
              variant="danger"
              onClick={() => {
                deleteItem(trip.id, item.id);
                onDone();
              }}
            >
              Yes, delete it
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

function Choice({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`cursor-pointer rounded-xl px-3 py-2 text-sm ring-1 select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 ${
        checked ? 'bg-teal-50 text-teal-800 ring-teal-400' : 'text-slate-700 ring-slate-300'
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  );
}
