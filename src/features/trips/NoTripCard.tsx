import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { parseInviteInput } from './model';
import { Button, Card, Field, inputClass } from '../../components/ui';

/** Shown when the user isn't part of any trip yet: plan one, or paste an invite link. */
export function NoTripCard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <h3 className="font-medium text-slate-900">Plan a trip</h3>
        <p className="mt-1 text-sm text-slate-600">Dates, places, distance and who's coming.</p>
        <Link
          to="/trips/new"
          className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          Plan a trip
        </Link>
      </Card>
      <JoinWithLinkCard />
    </div>
  );
}

export function JoinWithLinkCard() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const code = parseInviteInput(value);
    if (!code) {
      setError("That doesn't look like an invite link.");
      return;
    }
    void navigate(`/join/${code}`);
  }

  return (
    <Card>
      <h3 className="font-medium text-slate-900">Join with a link</h3>
      <p className="mt-1 text-sm text-slate-600">
        Open the invite link from your group chat, or paste it here.
      </p>
      <form onSubmit={submit} className="mt-3 space-y-3" noValidate>
        <Field label="Invite link" error={error}>
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              aria-invalid={!!error}
              className={inputClass}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="https://…/join/…"
              autoCapitalize="none"
              autoCorrect="off"
            />
          )}
        </Field>
        <Button type="submit" variant="secondary">
          Join
        </Button>
      </form>
    </Card>
  );
}
