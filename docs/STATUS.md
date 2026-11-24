# Status

> Updated by hand in each PR until agent-workflow's status generator exists.

**Protocol version:** 0.2.0 · **First trip:** 4–7 Dec 2026 · **Feature freeze:** Sun 29 Nov ·
[Release-freeze ADR](adr/2026-11-23-release-freeze-for-first-trip.md)

## Maintainer actions pending

- [x] Prod Firebase project `x-dsi-trip-budget`: web app, Firestore in asia-south1, Google sign-in,
      OAuth redirect URI for `x-dsi-trip-budget.web.app`, repository variables.
- [x] Dev Firebase project `x-dsi-trip-budget-dev`, deploy service accounts, GitHub environments
      `preview` and `production`. Live deploy works.
- [ ] Invite `X-DSI-agent` with Write; add the `main` ruleset.

## Handoffs

| # | Handoff | Depends on | Assignee | Review | Target |
|---|---|---|---|---|---|
| 1 | [App skeleton — PWA shell, sign-in, Firestore offline, CI, hosting](handoff/2026-11-23-app-skeleton.md) | — | X-DSI-agent · **done** (#4) | human | Tue 24 Nov |
| 1 | [Split and settlement engine](handoff/2026-11-23-split-engine.md) | — (parallel) | X-DSI-agent · **done** (#3) | auto | Tue 24 Nov |
| 2 | [Trip planning, families and invite links](handoff/2026-11-23-trip-planning-and-invites.md) | skeleton | X-DSI-agent · **done** (#5) | human | Thu 26 Nov |
| 3 | [Dashboard — countdown, welcome, summary](handoff/2026-11-23-dashboard.md) | trip planning | X-DSI-agent · **done** (#7) | auto | Fri 27 Nov |
| 4 | [Expenses — add, edit and split, offline](handoff/2026-11-24-expenses.md) | trip planning | X-DSI-agent · **done** (#9) | human | Thu 26 Nov |
| 5 | [Budget vs actual, balances and UPI settle-up](handoff/2026-11-24-budget-and-balances.md) | expenses | Claude Code (local) · **done** (#10) | human | Sat 28 Nov |

## Next

All v1 handoffs are done; the app is live. Remaining before the trip:

- [ ] Run the [dry run](dry-run.md) on the dev project with the families (plan: by Mon 30 Nov).
- [ ] Manual checks on real phones: WhatsApp share, UPI app opens prefilled, add an expense in
      under 10 s, Google sign-in on the live site, install on iPhone and Android.
- [ ] Feature freeze end of Sun 29 Nov; after that only `fix/` PRs.
- [ ] Create the real trip on the live site and send the invite (by Wed 2 Dec).
- [ ] No deploys Thu 3 – Tue 8 Dec.

## Later (after the trip)

Common chat, receipt photos (needs Blaze or Cloudflare R2), bill OCR.
