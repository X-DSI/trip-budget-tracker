import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Scroll to the element named in the URL's #hash, e.g. /trip#families.
 * React Router doesn't do this itself, and the section may render a moment after the page does
 * (it waits for its data), so keep looking for a couple of seconds.
 */
export function useScrollToHash(): void {
  const { hash } = useLocation();
  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    if (!id) return;
    let frame = 0;
    const started = performance.now();
    const look = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (performance.now() - started < 2000) frame = requestAnimationFrame(look);
    };
    look();
    return () => cancelAnimationFrame(frame);
  }, [hash]);
}
