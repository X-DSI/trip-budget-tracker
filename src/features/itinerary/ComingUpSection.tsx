import { Link } from 'react-router';
import type { Trip } from '../trips/model';
import { comingUp, dayLabel, nextUpId, travelSummary, type ItineraryItem } from './model';
import { ItemCard } from './ItemCard';
import { EmptyState, SectionHeader } from '../../components/ui';
import { useTripNow } from '../expenses/useTripToday';

/** The Trip page's short view of the itinerary: the next five plans and the travel totals. */
export function ComingUpSection({
  trip,
  items,
  canEdit,
}: {
  trip: Trip;
  items: ItineraryItem[];
  canEdit: boolean;
}) {
  const now = useTripNow(trip.timezone);
  const next = comingUp(items, trip, now, 5);
  const nextId = nextUpId(items, now);
  const travel = travelSummary(items, trip.expectedKm);

  return (
    <section data-testid="coming-up">
      <SectionHeader
        title="Coming up"
        subtitle={
          <>
            {travel.cars > 0 && `${travel.cars} car${travel.cars === 1 ? '' : 's'} · `}
            {travel.totalKm != null
              ? `${travel.totalKm.toLocaleString('en-IN')} km`
              : 'Distance not set'}
          </>
        }
        action={
          <Link
            to="/itinerary"
            className="rounded-xl px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
          >
            See full itinerary
          </Link>
        }
      />
      {next.length === 0 ? (
        <EmptyState>
          {items.length > 0 ? (
            'Nothing else planned.'
          ) : canEdit ? (
            <>
              Plan each day: travel, sightseeing, food and where you're staying.{' '}
              <Link to="/itinerary" className="font-medium text-teal-700">
                Open the itinerary
              </Link>
            </>
          ) : (
            'The organisers haven’t planned the days yet.'
          )}
        </EmptyState>
      ) : (
        <ol className="space-y-2">
          {next.map((item) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                highlight={item.id === nextId}
                label={dayLabel(item.day, trip.startDate)}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
