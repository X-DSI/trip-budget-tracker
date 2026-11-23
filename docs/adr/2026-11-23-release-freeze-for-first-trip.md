---
title: Freeze features on 29 Nov and stop deploys during the 4–7 Dec trip
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
The app must work flawlessly from 4 to 7 December 2026, mostly offline. A deploy during the trip
could ship a bug, or a service-worker update that half the phones never pick up.

## Options
- **Ship until departure** — more features; untested changes on the road.
- **Freeze with a dry run** — fewer features; what ships has been used by the real group.

## Decision
- **Feature freeze:** end of Sun 29 Nov (IST). After that only `fix/` PRs merge.
- **Dry run:** Mon 30 Nov. Every adult installs the PWA, signs in, joins the trip and logs a test
  expense, including some offline on two phones at once.
- **Release candidate:** Wed 2 Dec. It goes live and everyone opens the app once on Wi-Fi.
- **No deploys from Thu 3 Dec to Tue 8 Dec**, except a critical fix the maintainer approves.
- Test data from the dry run is deleted (soft) or the dry run uses a separate trip.

## Consequences
- Anything not merged by 29 Nov waits for the next version (common chat, receipt photos, OCR…).
- Handoffs are ordered so the trip-critical path (trip, families, expenses, splits, balances,
  offline) lands first.
