import { useState } from 'react';
import { createInvite, setInviteActive, setMemberRole } from './trips.data';
import {
  inviteLink,
  ownerNameOf,
  type Invite,
  type Member,
  type Trip,
  type TripFamily,
} from './model';
import { Button, Card, EmptyState, inputClass, SectionHeader } from '../../components/ui';

const ROLE_LABEL: Record<Member['role'], string> = {
  owner: 'Owner',
  organizer: 'Organiser',
  member: 'Member',
};

export function PeopleSection({
  trip,
  members,
  families,
  canEdit,
  uid,
}: {
  trip: Trip;
  members: Member[];
  families: TripFamily[];
  canEdit: boolean;
  uid: string;
}) {
  const sorted = [...members].sort(
    (a, b) =>
      Number(b.uid === uid) - Number(a.uid === uid) || a.displayName.localeCompare(b.displayName),
  );

  return (
    <section id="people" className="scroll-mt-20">
      <SectionHeader title="People" subtitle={`${members.length} joined`} />
      <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
        {sorted.map((m) => {
          const family = families.find((f) => f.id === m.familyId);
          const isMe = m.uid === uid;
          return (
            <li key={m.uid} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Avatar member={m} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {m.displayName}
                  {isMe && <span className="text-slate-500"> (you)</span>}
                </p>
                <p className="truncate text-sm text-slate-600">
                  {family?.name ?? 'No family chosen'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {ROLE_LABEL[m.role]}
                </span>
                {canEdit && !isMe && m.role !== 'owner' && (
                  <Button
                    variant="ghost"
                    className="!px-2 !py-1"
                    onClick={() =>
                      setMemberRole(trip.id, m.uid, m.role === 'organizer' ? 'member' : 'organizer')
                    }
                  >
                    {m.role === 'organizer' ? 'Make member' : 'Make organiser'}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Avatar({ member }: { member: Member }) {
  if (member.photoURL) {
    return (
      <img
        src={member.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        className="h-9 w-9 rounded-full"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
      {member.displayName.charAt(0).toUpperCase()}
    </span>
  );
}

export function InviteSection({
  trip,
  invites,
  members,
  uid,
}: {
  trip: Trip;
  invites: Invite[];
  members: Member[];
  uid: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const active = invites.filter((i) => i.active);

  async function share(code: string) {
    const url = inviteLink(window.location.origin, code);
    const text = `Join "${trip.name}" on Trip Planner to plan and split expenses together.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: trip.name, text, url });
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(code);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      window.prompt('Copy this invite link', url);
    }
  }

  return (
    <section id="invite" className="scroll-mt-20">
      <SectionHeader
        title="Invite people"
        subtitle="Share the link in your group chat. Each adult signs in with Google and picks their family."
      />
      <Card className="space-y-3">
        {active.length === 0 ? (
          <EmptyState>No active invite link.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {active.map((invite) => (
              <li key={invite.code} className="space-y-2">
                <input
                  readOnly
                  aria-label="Invite link"
                  data-testid="invite-link"
                  className={`${inputClass} font-mono !text-sm`}
                  value={inviteLink(window.location.origin, invite.code)}
                  onFocus={(e) => e.target.select()}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void share(invite.code)}>
                    {copied === invite.code ? 'Copied!' : 'Share link'}
                  </Button>
                  <Button variant="danger" onClick={() => setInviteActive(invite.code, false)}>
                    Turn off
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {active.length === 0 && (
          <Button
            disabled={members.length === 0}
            onClick={() => createInvite(trip, uid, ownerNameOf(trip, members))}
          >
            Create invite link
          </Button>
        )}
        <p className="text-xs text-slate-500">
          Anyone with an active link can join. Turn it off once everyone is in, and make a new one
          if needed.
        </p>
      </Card>
    </section>
  );
}
