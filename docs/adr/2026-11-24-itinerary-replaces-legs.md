---
title: A day-by-day itinerary replaces travel legs; important info is pinned on the trip
status: Accepted
date: 2026-11-24
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
"Getting around" only held travel legs. On the trip, people want the whole day's plan in one
place: the drive, the sightseeing, where to eat, where they're sleeping. Keeping travel in a
separate list would mean two lists that disagree. The organiser also needs somewhere to pin
practical details (hotel addresses, booking numbers, emergency contacts) that everyone can read
offline.

## Options
- **Keep legs, add a separate plan** — no migration; two lists to keep in step.
- **One itinerary, with travel as one kind of item** — one source of truth; legs move into it.

## Decision
- A new `trips/{tripId}/itinerary` collection replaces `legs`. Each item has a day, an optional
  time, a kind (travel, sightseeing, food, stay, activity, other), a title, a place and notes.
  Travel items also carry mode, vehicles and km, so the car and distance totals still work.
- **Trip page:** a "Coming up" card shows the next five items, with a link to the full
  **Itinerary** page, laid out day by day for the whole trip.
- Organisers add, edit, reorder and delete items; everyone else reads them. It works offline like
  everything else.
- Each place gets an **Open in Maps** link (a Google Maps search URL); no map service is used.
- The trip gets an `importantInfo` text field, edited by organisers and pinned on the dashboard.
- **No migration:** only test data exists (dev). The `legs` code and rules are removed.

## Consequences
- `docs/data-model.md` replaces `legs` with `itinerary` and adds `importantInfo` to the trip.
- The dashboard's "On the road today" becomes "Today's plan", built from the itinerary.
- Legs created during testing on the dev site disappear from the app.
