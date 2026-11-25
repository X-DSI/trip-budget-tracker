// Small inline icon set (24×24, stroke-based) so the app shell needs no icon font or network.
import { useId, type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M10 21v-6h4v6" />
  </Icon>
);

export const MapIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </Icon>
);

export const ReceiptIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Icon>
);

export const ScaleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v18M7 21h10M5 7h14" />
    <path d="m5 7-3 6a3 3 0 0 0 6 0L5 7ZM19 7l-3 6a3 3 0 0 0 6 0l-3-6Z" />
  </Icon>
);

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="19" cy="12" r="1.2" />
  </Icon>
);

export const OfflineIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 8.8a15 15 0 0 1 4.2-2.6M9.6 5.3A15 15 0 0 1 22 8.8" />
    <path d="M5 12.5a10 10 0 0 1 3.3-2M13 10a10 10 0 0 1 6 2.5" />
    <path d="M8.5 16a5 5 0 0 1 7 0" />
    <path d="M12 20h.01M3 3l18 18" />
  </Icon>
);

export const CloudUploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.6 1.5A4 4 0 0 1 17.5 18" />
    <path d="M12 12v8M9 15l3-3 3 3" />
  </Icon>
);

export const ShareIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M5 12v8h14v-8" />
  </Icon>
);

/** The app logo. Same shapes as docs/brand/logo.svg (the master); change that first. */
export function AppLogo(props: IconProps) {
  const id = useId();
  const sky = `tp-sky-${id}`;
  const clip = `tp-clip-${id}`;
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f766e" />
          <stop offset=".55" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#fb923c" />
        </linearGradient>
        <clipPath id={clip}>
          <rect width="64" height="64" rx="14" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="64" height="64" fill={`url(#${sky})`} />
        <path
          d="M32 40L-7.4 33.1M32 40L-2.6 20.0M32 40L6.3 9.4M32 40L18.3 2.4M32 40L32.0 0.0M32 40L45.7 2.4M32 40L57.7 9.4M32 40L66.6 20.0M32 40L71.4 33.1"
          stroke="#fde68a"
          strokeOpacity=".35"
          strokeWidth="5"
        />
        <circle cx="32" cy="40" r="15" fill="#fef3c7" />
        <path
          d="M36.6 30.2c-.9-1.5-2.6-2.3-4.6-2.3-2.7 0-4.7 1.4-4.7 3.6 0 4.9 9.6 2.9 9.6 8 0 2.2-2.1 3.7-4.9 3.7-2.2 0-4-.9-4.9-2.4M32 27v19"
          stroke="#b45309"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M-10 64L16 36L42 64Z" fill="#134e4a" />
        <path d="M22 64L48 33L74 64Z" fill="#0f3d3a" />
      </g>
    </svg>
  );
}
