import type { ComponentType, SVGProps } from 'react';
import { HomeIcon, MapIcon, MenuIcon, ReceiptIcon, ScaleIcon } from '../Icons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/trip', label: 'Trip', icon: MapIcon },
  { to: '/expenses', label: 'Expenses', icon: ReceiptIcon },
  { to: '/money', label: 'Money', icon: ScaleIcon },
  { to: '/more', label: 'More', icon: MenuIcon },
];

export function titleForPath(pathname: string): string {
  const match = NAV_ITEMS.find((item) =>
    item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  if (match) return match.label;
  if (pathname === '/trips/new') return 'New trip';
  if (pathname === '/itinerary') return 'Itinerary';
  if (pathname.startsWith('/join/')) return 'Join a trip';
  return 'Trip Budget';
}
