import { useEffect, useState } from 'react';
import { zonedParts } from '../dashboard/phase';

/** Today's date (YYYY-MM-DD) in the trip's timezone, refreshed every minute. */
export function useTripToday(timeZone: string): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return zonedParts(now, timeZone || 'Asia/Kolkata').date;
}
