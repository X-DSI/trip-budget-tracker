# Status

> Updated by hand in each PR until agent-workflow's status generator exists.

**Protocol version:** 0.2.0 · **First trip:** 4–7 Dec 2026 · **Feature freeze:** Sun 29 Nov ·
[Release-freeze ADR](adr/2026-11-23-release-freeze-for-first-trip.md)

## Maintainer actions pending

- [ ] Invite `X-DSI-agent` to this repo as a collaborator with the **Write** role.
- [ ] Add a `main` ruleset: PR required (0 approvals), **Require review from Code Owners**, required
      `ci` checks, no force pushes or deletions, only you on the bypass list. Turn on auto-merge and
      automatic branch deletion.
- [x] Create the Firebase project `x-dsi-trip-budget` and register the web app.
- [ ] Firestore `(default)` in **asia-south1**; enable Google sign-in.
- [ ] Repository variables `VITE_FIREBASE_*` (auth domain `x-dsi-trip-budget.web.app`) and secret
      `FIREBASE_SERVICE_ACCOUNT`; add `x-dsi-trip-budget--*.web.app` preview domains to Auth's
      authorised domains as they appear.
- [ ] Deploy the rules once with `npm run deploy:rules`.

## Open handoffs

| # | Handoff | Depends on | Assignee | Review | Target |
|---|---|---|---|---|---|
| 1 | [App skeleton — PWA shell, sign-in, Firestore offline, CI, hosting](handoff/2026-11-23-app-skeleton.md) | — | X-DSI-agent · **done** (#2; manual checks wait on Firebase setup) | human | Tue 24 Nov |
| 1 | [Split and settlement engine](handoff/2026-11-23-split-engine.md) | — (parallel) | X-DSI-agent · **done** (#3) | auto | Tue 24 Nov |
| 2 | [Trip planning, families and invite links](handoff/2026-11-23-trip-planning-and-invites.md) | skeleton | agent:any | human | Thu 26 Nov |
| 3 | [Dashboard — countdown, welcome, summary](handoff/2026-11-23-dashboard.md) | trip planning | agent:any | auto | Fri 27 Nov |

## Next planning session

Expenses UI (add/edit with the five split modes, dish-by-dish entry), budget vs actual, balances and
UPI settle-up. Target: Sat 28 – Sun 29 Nov, then the 30 Nov dry run.

## Later (after the trip)

Common chat, receipt photos (needs Blaze or Cloudflare R2), bill OCR.
