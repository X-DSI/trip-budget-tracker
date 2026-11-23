# Architecture Decision Records

Decisions about trip-budget-tracker. Format and rules: [`docs/PROTOCOL.md` §5](../PROTOCOL.md#5-architecture-decision-records).
Accepted decisions live here; proposals live in [`proposed/`](proposed/).

| Date | Decision | Status |
|---|---|---|
| 2026-11-23 | [Build this project with the agent-workflow protocol](2026-11-23-adopt-agent-workflow.md) | Accepted |
| 2026-11-23 | [One offline-first PWA for phones and desktops (React, Vite, TypeScript)](2026-11-23-offline-first-pwa.md) | Accepted |
| 2026-11-23 | [Cloud Firestore with persistent offline cache, in asia-south1, on the free plan](2026-11-23-firestore-with-offline-persistence.md) | Accepted |
| 2026-11-23 | [Adults sign in with Google and join a trip through an invite link](2026-11-23-google-sign-in-and-invite-links.md) | Accepted |
| 2026-11-23 | [Host on Firebase Hosting, with a preview channel per pull request](2026-11-23-firebase-hosting.md) | Accepted |
| 2026-11-23 | [Many trips per user, one active; everything lives under its trip](2026-11-23-multi-trip-data-model.md) | Accepted |
| 2026-11-23 | [Store and compute money as integer paise, rounding by largest remainder](2026-11-23-money-as-integer-paise.md) | Accepted |
| 2026-11-23 | [Expenses are the source of truth; balances are always computed](2026-11-23-expenses-are-the-source-of-truth.md) | Accepted |
| 2026-11-23 | [Five split modes, chosen per expense, with families as the unit of settlement](2026-11-23-split-modes.md) | Accepted |
| 2026-11-23 | [Freeze features on 29 Nov and stop deploys during the 4–7 Dec trip](2026-11-23-release-freeze-for-first-trip.md) | Accepted |
