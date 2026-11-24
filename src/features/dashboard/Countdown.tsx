import { useEffect, useState } from 'react';
import { splitCountdown } from './phase';

/**
 * Live countdown to `target` (epoch ms). Isolated so only this component re-renders as it ticks:
 * every second on the last day, every 15 seconds before that.
 */
export function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, target - now);
  const lastDay = remaining < 86_400_000;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), lastDay ? 1_000 : 15_000);
    return () => clearInterval(id);
  }, [lastDay]);

  const { days, hours, minutes, seconds } = splitCountdown(remaining);
  const units: [number, string][] = lastDay
    ? [
        [hours, hours === 1 ? 'hour' : 'hours'],
        [minutes, minutes === 1 ? 'minute' : 'minutes'],
        [seconds, seconds === 1 ? 'second' : 'seconds'],
      ]
    : [
        [days, days === 1 ? 'day' : 'days'],
        [hours, hours === 1 ? 'hour' : 'hours'],
        [minutes, minutes === 1 ? 'minute' : 'minutes'],
      ];

  return (
    <div className="mt-4 flex gap-3" data-testid="countdown" role="timer" aria-live="off">
      {units.map(([value, label]) => (
        <div key={label} className="min-w-[4.5rem] rounded-2xl bg-white/15 px-3 py-3 text-center">
          <div className="text-3xl font-semibold tabular-nums lg:text-4xl">
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-xs tracking-wide text-teal-100 uppercase">{label}</div>
        </div>
      ))}
    </div>
  );
}
