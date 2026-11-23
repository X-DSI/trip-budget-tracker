import { useState, type FormEvent } from 'react';
import { addFamily, updateFamily, type FamilyInput } from './trips.data';
import {
  FAMILY_COLOR_CLASSES,
  FAMILY_COLORS,
  headcount,
  familySize,
  nextFamilyColor,
  type Member,
  type Trip,
  type TripFamily,
} from './model';
import { validateFamily, type Errors, type FamilyForm } from './validation';
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

export function FamiliesSection({
  trip,
  families,
  members,
  canEdit,
  uid,
}: {
  trip: Trip;
  families: TripFamily[];
  members: Member[];
  canEdit: boolean;
  uid: string;
}) {
  const [editing, setEditing] = useState<TripFamily | 'new' | null>(null);
  const count = headcount(families);
  const visible = families.filter((f) => f.active || canEdit);

  return (
    <section>
      <SectionHeader
        title="Families"
        subtitle={`${count.families} families · ${count.adults} adults${count.kids ? ` · ${count.kids} kids` : ''}`}
        action={
          canEdit && (
            <Button variant="secondary" onClick={() => setEditing('new')}>
              Add family
            </Button>
          )
        }
      />
      {visible.length === 0 ? (
        <EmptyState>
          {canEdit
            ? 'Add each family with how many adults and kids are coming. Splits per head use this.'
            : 'No families yet.'}
        </EmptyState>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map((f) => {
            const people = members.filter((m) => m.familyId === f.id);
            return (
              <li key={f.id}>
                <Card className={`flex items-start gap-3 !p-4 ${f.active ? '' : 'opacity-60'}`}>
                  <span
                    className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${FAMILY_COLOR_CLASSES[f.color].dot}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {f.name}
                      {!f.active && <span className="ml-2 text-xs text-slate-500">(inactive)</span>}
                    </p>
                    <p className="text-sm text-slate-600">{familySize(f)}</p>
                    <p className="truncate text-xs text-slate-500">
                      {people.length > 0
                        ? people.map((p) => (p.uid === uid ? 'You' : p.displayName)).join(', ')
                        : 'Nobody has joined in this family yet'}
                    </p>
                  </div>
                  {canEdit && (
                    <Button variant="ghost" className="!px-2" onClick={() => setEditing(f)}>
                      Edit
                    </Button>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet
        open={editing !== null}
        title={editing === 'new' ? 'Add a family' : 'Edit family'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <FamilyFormView
            key={editing === 'new' ? 'new' : editing.id}
            family={editing === 'new' ? null : editing}
            defaultColor={nextFamilyColor(families)}
            onSubmit={(input) => {
              if (editing === 'new') {
                addFamily(
                  trip.id,
                  uid,
                  input,
                  families.reduce((m, f) => Math.max(m, f.order), -1) + 1,
                );
              } else {
                updateFamily(trip.id, editing.id, input);
              }
              setEditing(null);
            }}
            onToggleActive={
              editing === 'new'
                ? undefined
                : () => {
                    updateFamily(trip.id, editing.id, { active: !editing.active });
                    setEditing(null);
                  }
            }
          />
        )}
      </Sheet>
    </section>
  );
}

export function FamilyFormView({
  family,
  defaultColor,
  onSubmit,
  onToggleActive,
  submitLabel,
}: {
  family: TripFamily | null;
  defaultColor: FamilyInput['color'];
  onSubmit: (input: FamilyInput) => void;
  onToggleActive?: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<FamilyForm>({
    name: family?.name ?? '',
    adults: family?.adults ?? 2,
    kids: family?.kids ?? 0,
    upiId: family?.upiId ?? '',
    color: family?.color ?? defaultColor,
  });
  const [errors, setErrors] = useState<Errors<keyof FamilyForm>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const { input, errors } = validateFamily(form);
    setErrors(errors);
    if (input) onSubmit(input);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Family name" error={errors.name}>
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            aria-invalid={!!errors.name}
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Daniel & family"
            autoComplete="off"
          />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Adults" error={errors.adults}>
          {(id) => (
            <NumberStepper
              id={id}
              label="adults"
              value={form.adults}
              min={1}
              max={20}
              onChange={(adults) => setForm((f) => ({ ...f, adults }))}
            />
          )}
        </Field>
        <Field label="Kids" error={errors.kids}>
          {(id) => (
            <NumberStepper
              id={id}
              label="kids"
              value={form.kids}
              min={0}
              max={20}
              onChange={(kids) => setForm((f) => ({ ...f, kids }))}
            />
          )}
        </Field>
      </div>
      <Field
        label="UPI ID"
        hint="Optional. Lets others pay this family back in one tap."
        error={errors.upiId}
      >
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            aria-invalid={!!errors.upiId}
            className={inputClass}
            value={form.upiId}
            onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))}
            placeholder="name@okhdfcbank"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        )}
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {FAMILY_COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                checked={form.color === c}
                onChange={() => setForm((f) => ({ ...f, color: c }))}
                className="peer sr-only"
                aria-label={c}
              />
              <span
                className={`block h-8 w-8 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-slate-900 peer-focus-visible:ring-2 peer-focus-visible:ring-teal-600 ${FAMILY_COLOR_CLASSES[c].dot}`}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit">{submitLabel ?? (family ? 'Save family' : 'Add family')}</Button>
        {family && onToggleActive && (
          <Button variant={family.active ? 'danger' : 'secondary'} onClick={onToggleActive}>
            {family.active ? 'Mark inactive' : 'Make active again'}
          </Button>
        )}
      </div>
      {family?.active && onToggleActive && (
        <p className="text-xs text-slate-500">
          Inactive families are left out of new splits but keep their past expenses.
        </p>
      )}
    </form>
  );
}
