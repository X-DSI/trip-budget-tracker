import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useActiveTrip } from '../trips/ActiveTripProvider';
import { NoTripCard } from '../trips/NoTripCard';
import { isOrganizer, type Trip } from '../trips/model';
import { useItinerary, swapItems } from './itinerary.data';
import {
  dayLabel,
  nextUpId,
  shortDay,
  sortItems,
  tripDays,
  travelSummary,
  type ItineraryItem,
} from './model';
import { ItemCard } from './ItemCard';
import { ItemFormView } from './ItemSheet';
import { Button, Sheet } from '../../components/ui';
import { useTripNow } from '../expenses/useTripToday';

export function ItineraryPage() {
  const { user } = useAuth();
  const { trip, loading } = useActiveTrip();
  if (loading && !trip) return <p className="text-slate-500">Loading…</p>;
  if (!trip || !user) return <NoTripCard />;
  return <TripItinerary key={trip.id} trip={trip} uid={user.uid} />;
}

type Editing = { item: ItineraryItem } | { day: string } | null;

function TripItinerary({ trip, uid }: { trip: Trip; uid: string }) {
  const canEdit = isOrganizer(trip, uid);
  const items = useItinerary(trip.id).data;
  const now = useTripNow(trip.timezone);
  const [editing, setEditing] = useState<Editing>(null);

  const days = tripDays(trip.startDate, trip.endDate);
  const byDay = useMemo(() => {
    const map = new Map<string, ItineraryItem[]>();
    for (const item of sortItems(items)) map.set(item.day, [...(map.get(item.day) ?? []), item]);
    return map;
  }, [items]);
  const nextId = nextUpId(items, now);
  const travel = travelSummary(items, trip.expectedKm);
  const nextOrder = (day: string) =>
    (byDay.get(day) ?? []).reduce((m, i) => Math.max(m, i.order), -1) + 1;
  // Items outside the trip's dates (e.g. after the dates changed) still show, at the end.
  const stray = [...byDay.keys()].filter((d) => !days.includes(d));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/trip" className="text-sm font-medium text-teal-700">
            ← Trip
          </Link>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Itinerary</h2>
          <p className="text-sm text-slate-600">
            {items.length} plan{items.length === 1 ? '' : 's'} over {days.length} day
            {days.length === 1 ? '' : 's'}
            {travel.totalKm != null && ` · ${travel.totalKm.toLocaleString('en-IN')} km`}
            {travel.cars > 0 && ` · ${travel.cars} car${travel.cars === 1 ? '' : 's'}`}
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() =>
              setEditing({ day: days.includes(now.today) ? now.today : (days[0] ?? now.today) })
            }
          >
            Add to itinerary
          </Button>
        )}
      </div>

      <nav
        aria-label="Days"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
        data-testid="day-chips"
      >
        {days.map((day, i) => (
          <a
            key={day}
            href={`#day-${day}`}
            className={`shrink-0 rounded-xl px-3 py-2 text-center text-sm ring-1 ${
              day === now.today
                ? 'bg-teal-700 text-white ring-teal-700'
                : 'bg-white text-slate-700 ring-slate-200'
            }`}
          >
            <span className="block font-medium">Day {i + 1}</span>
            <span className="block text-xs opacity-80">{shortDay(day)}</span>
          </a>
        ))}
      </nav>

      {[...days, ...stray].map((day) => {
        const list = byDay.get(day) ?? [];
        return (
          <section key={day} id={`day-${day}`} className="scroll-mt-20" data-testid="itinerary-day">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className="font-semibold text-slate-900">
                {dayLabel(day, trip.startDate)}
                {day === now.today && <span className="ml-2 text-sm text-teal-700">Today</span>}
              </h3>
              {canEdit && days.includes(day) && (
                <button
                  type="button"
                  className="text-sm font-medium text-teal-700"
                  onClick={() => setEditing({ day })}
                >
                  + Add to this day
                </button>
              )}
            </div>
            {list.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">
                Nothing planned yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {list.map((item, i) => (
                  <li key={item.id}>
                    <ItemCard
                      item={item}
                      highlight={item.id === nextId}
                      actions={
                        canEdit && (
                          <>
                            <IconButton
                              label="Move up"
                              disabled={i === 0 || list[i - 1]!.time !== item.time}
                              onClick={() => swapItems(trip.id, item, list[i - 1]!)}
                            >
                              ↑
                            </IconButton>
                            <IconButton
                              label="Move down"
                              disabled={i === list.length - 1 || list[i + 1]!.time !== item.time}
                              onClick={() => swapItems(trip.id, item, list[i + 1]!)}
                            >
                              ↓
                            </IconButton>
                            <button
                              type="button"
                              onClick={() => setEditing({ item })}
                              className="rounded-lg px-2 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
                            >
                              Edit
                            </button>
                          </>
                        )
                      }
                    />
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}

      <Sheet
        open={editing !== null}
        title={editing && 'item' in editing ? 'Edit plan' : 'Add to itinerary'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <ItemFormView
            key={'item' in editing ? editing.item.id : `new-${editing.day}`}
            trip={trip}
            item={'item' in editing ? editing.item : null}
            defaultDay={'item' in editing ? editing.item.day : editing.day}
            nextOrder={nextOrder}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </div>
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
