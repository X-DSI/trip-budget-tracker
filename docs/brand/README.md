# Brand

**Name:** Trip Planner (renamed from "Trip Budget" on 25 Nov 2026). The repository, Firebase
projects and URLs keep their `trip-budget` names; only what people see changed.

**Logo:** [`logo.svg`](logo.svg) is the master (option B of five, chosen 25 Nov 2026). A pale sun
with a `$` rises between two dark mountains, with a fan of rays across a dawn sky that fades from
teal to orange. [`logo-512.png`](logo-512.png) is a rendered copy for documents.

| Colour | Hex | Use |
|---|---|---|
| Sky (top → middle → bottom) | `#0f766e` → `#f59e0b` → `#fb923c` | Background; `#0f766e` is also the theme colour |
| Rays | `#fde68a` at 35% | Sun rays |
| Sun | `#fef3c7` | The sun |
| `$` | `#b45309` | The dollar sign |
| Mountains | `#134e4a`, `#0f3d3a` | Left and right peaks |

Everything that shows the logo comes from the master:

- `public/favicon.svg`: a copy of the master.
- `src/components/Icons.tsx` (`AppLogo`): the same shapes as a React component.
- PWA and Apple icons in `public/`: run `python3 scripts/make-icons.py public` (needs
  `rsvg-convert`). The maskable and Apple icons drop the rounded corners, because the phone adds
  its own.

If you change the logo, change `logo.svg` first, then copy it to the favicon, update `AppLogo`
and rerun the script.
