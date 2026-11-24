import { setMemberFamily } from './trips.data';
import {
  familySize,
  FAMILY_COLOR_CLASSES,
  ownerNameOf,
  type Member,
  type Trip,
  type TripFamily,
} from './model';
import { Card, inputClass } from '../../components/ui';

/** The signed-in person's family: who's in it, its UPI ID, and a way to change it. */
export function YourFamilyCard({
  trip,
  families,
  members,
  uid,
  canEdit,
}: {
  trip: Trip;
  families: TripFamily[];
  members: Member[];
  uid: string;
  canEdit: boolean;
}) {
  const me = members.find((m) => m.uid === uid);
  const family = families.find((f) => f.id === me?.familyId);
  const joined = family ? members.filter((m) => m.familyId === family.id) : [];
  const active = families.filter((f) => f.active);
  const owner = ownerNameOf(trip, members) || 'the organiser';

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Your family</h2>
      <Card className="space-y-4" data-testid="your-family">
        {family ? (
          <div className="flex items-start gap-3">
            <span
              className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${FAMILY_COLOR_CLASSES[family.color].dot}`}
            />
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{family.name}</p>
              <p className="text-sm text-slate-600">{familySize(family)}</p>
              <p className="text-sm text-slate-500">
                Joined: {joined.map((m) => (m.uid === uid ? 'you' : m.displayName)).join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-amber-800">You haven’t picked your family yet.</p>
        )}

        {family && (
          <p className="text-sm text-slate-700">
            {family.upiId ? (
              <>
                UPI ID: <span className="font-mono">{family.upiId}</span>
              </>
            ) : canEdit ? (
              'No UPI ID yet. Add one under Families so others can pay you back in one tap.'
            ) : (
              'No UPI ID yet. Ask an organiser to add it so others can pay you back in one tap.'
            )}
          </p>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            {family ? 'Change family' : 'Pick your family'}
          </span>
          <select
            className={inputClass}
            value={me?.familyId ?? ''}
            onChange={(e) => setMemberFamily(trip.id, uid, e.target.value || null)}
            disabled={!me}
          >
            <option value="">Not chosen</option>
            {active.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        {!canEdit && <p className="text-sm text-slate-500">Need to invite someone? Ask {owner}.</p>}
      </Card>
    </section>
  );
}
