---
title: Day-by-day itinerary (replaces travel legs)
status: open
assignee: agent:any
base_sha: c3bd444
adrs: [2026-11-24-itinerary-replaces-legs.md, 2026-11-23-multi-trip-data-model.md]
plan_pr: null
impl_pr: null
review: human
---

## Goal
Everyone can see what's planned for each day of the trip: travel, sightseeing, food, stay,
activities. Organisers keep it up to date, and it works with no signal.

## Scope
**In:**
- **Data and rules:** the `itinerary` collection as in `docs/data-model.md`. Organisers create,
  update and delete; members read. Validate kind, day (within the trip's dates), time format and
  the travel-only fields. Remove `legs` (code, rules, tests).
- **Trip page:** "Getting around" becomes **Coming up**:
  - the next five items: from now onwards during the trip; from day 1 before it; the last five
    after it;
  - the car and distance totals, from travel items, with the trip estimate as fallback;
  - **See full itinerary** → `/itinerary`.
- **Itinerary page (`/itinerary`):**
  - every day of the trip as a section ("Day 2 · Sat 5 Dec"), including empty days ("Nothing
    planned yet");
  - a strip of day chips to jump between days, with today highlighted during the trip;
  - items sorted by time (untimed first), then order; each shows a kind icon, time, title,
    place, notes, and travel details (mode, cars, km);
  - **Open in Maps** for items with a place:
    `https://www.google.com/maps/search/?api=1&query=<place>`, opened in a new tab or app;
  - organisers get add/edit/delete in a sheet, and move up/down within a day; "Add to this
    day" on each day.
- **Dashboard:** during the trip, "On the road today" becomes **Today's plan** (today's items,
  with the next upcoming item highlighted). Before the trip, show a "Day 1" preview.

- **`docs/dry-run.md`:** replace the travel-legs steps with itinerary steps (an organiser adds
  items on two days; members check Coming up and the Itinerary page).

**Out:** Drag-and-drop, attachments, maps embedded in the page.

## Acceptance criteria
- [ ] Rules: organisers write itinerary items; members can't; items outside the trip dates, bad kinds or bad times are rejected — check: `npm run test:rules`
- [ ] Unit: "coming up" selection before, during and after the trip; sorting by time then order; totals from travel items — check: `npm test`
- [ ] E2E: an organiser adds items on two days, the Trip page shows them under Coming up, and the Itinerary page shows each day with its items and a Maps link; a member sees them read-only — check: `npm run test:e2e -- --grep @itinerary`
- [ ] E2E @offline: an item added offline appears at once and syncs later — check: `npm run test:e2e -- --grep @offline`
- [ ] No horizontal scroll on the itinerary page at 390×844 and 1440×900 — check: `npm run test:e2e -- --grep @layout`

## Constraints
- Days and times are trip-timezone strings (`YYYY-MM-DD`, `HH:MM`); no `Date` conversions for
  display.

## Implementer may decide
Icons per kind, the day-chip design, how "next up" is highlighted.

## Must escalate
Changes to the itinerary fields beyond the data model.

## Attached content
None.
