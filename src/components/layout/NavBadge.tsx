/** A small count on a navigation item, e.g. how many expenses are new since you last looked. */
export function NavBadge({ count, className = '' }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`min-w-[1.125rem] rounded-full bg-rose-600 px-1 text-center text-[10px] leading-[1.125rem] font-semibold text-white tabular-nums ${className}`}
      data-testid="nav-badge"
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

/** Screen-reader text for a badged item: "Expenses, 3 new". */
export function badgeLabel(label: string, count: number): string {
  return count > 0 ? `${label}, ${count} new` : label;
}
