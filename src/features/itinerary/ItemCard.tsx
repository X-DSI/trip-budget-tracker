import type { ReactNode } from 'react';
import { formatTime, itemEmoji, mapsUrl, travelDetails, type ItineraryItem } from './model';

/** One itinerary item. `actions` holds organiser controls; `label` an optional day label. */
export function ItemCard({
  item,
  highlight,
  label,
  actions,
}: {
  item: ItineraryItem;
  highlight?: boolean;
  label?: string;
  actions?: ReactNode;
}) {
  const details = travelDetails(item);
  return (
    <div
      data-testid="itinerary-item"
      data-next={highlight ? 'true' : undefined}
      className={`flex items-start gap-3 rounded-2xl p-4 ring-1 ${
        highlight ? 'bg-teal-50 ring-teal-300' : 'bg-white ring-slate-200'
      }`}
    >
      <span className="text-2xl leading-none" aria-hidden="true">
        {itemEmoji(item)}
      </span>
      <div className="min-w-0 flex-1">
        {(label || item.time || highlight) && (
          <p className="text-xs font-medium text-slate-500">
            {[label, formatTime(item.time)].filter(Boolean).join(' · ')}
            {highlight && <span className="ml-2 text-teal-700">Next up</span>}
          </p>
        )}
        <p className="font-medium break-words text-slate-900">{item.title}</p>
        {details && <p className="text-sm text-slate-600">{details}</p>}
        {item.place && (
          <a
            href={mapsUrl(item.place)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-sm break-words text-teal-700 hover:underline"
            data-testid="maps-link"
          >
            📍 {item.place}
            <span className="sr-only">(open in Maps)</span>
          </a>
        )}
        {item.notes && (
          <p className="mt-1 text-sm break-words whitespace-pre-line text-slate-500">
            {item.notes}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
