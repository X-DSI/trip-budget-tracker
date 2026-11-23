---
title: Separate dev and prod Firebase projects; previews deploy only to dev
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: 2026-11-23-firebase-hosting.md
superseded_by: null
review: auto
---

## Context
The hosting ADR put pull-request previews in the same Firebase project as the live app. Previews
then read and write the real Firestore database, so an untested PR could corrupt the real trip's
expenses or loosen its security rules. The maintainer chose the industry-standard setup.

## Options
- **One project, previews share live data** — least setup; a preview can damage real trip data.
- **Separate dev and prod projects** — Firebase's recommended practice; previews and experiments
  can never touch production. Costs one more free project and service account.

## Decision
- **Two Firebase projects**, both on the free Spark plan, both with Firestore in `asia-south1`:
  `x-dsi-trip-budget-dev` (dev) and `x-dsi-trip-budget` (prod). `.firebaserc` aliases are `dev`
  (the default) and `prod`.
- **Firebase Hosting** remains the host, carrying over the hosting ADR's details: `no-cache` for
  `index.html` and the service worker, long caching for hashed assets.
- **GitHub environments** hold each project's config: `preview` → dev, `production` → prod. Each
  environment has its own `VITE_FIREBASE_*` variables and `FIREBASE_SERVICE_ACCOUNT` secret.
- **Pull requests** deploy Firestore rules, indexes and a 7-day Hosting preview channel to **dev**.
  The workflow refuses to run a preview against the prod project ID.
- **Merges to `main`** deploy rules, indexes and the live channel to **prod**. No one deploys
  rules by hand.

## Consequences
- Maintainer actions: create the dev project the same way as prod. Create one deploy service
  account per project with the roles Firebase Hosting Admin, Firebase Rules Admin, Cloud Datastore
  Index Admin, Firebase Authentication Admin, API Keys Viewer, Cloud Run Viewer and Service Usage
  Consumer (the CLI checks that APIs are enabled before deploying rules). Fill in both
  GitHub environments; optionally require approval on `production` during the trip.
- The release freeze applies to the `production` environment only; dev can keep moving.
- Dry-run data and tests live in dev. The real trip is created only in prod.
