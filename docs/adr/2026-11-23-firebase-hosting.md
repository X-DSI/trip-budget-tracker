---
title: Host on Firebase Hosting, with a preview channel per pull request
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
The PWA needs free, fast static hosting over HTTPS, and a way to try each PR on a phone before it
merges.

## Options
- **Cloudflare Pages** — free and fast, but a second provider next to Firebase.
- **Firebase Hosting** — free, same project, CLI and console as Auth and Firestore, and preview
  channels per PR.

## Decision
Deploy to **Firebase Hosting** in the same Firebase project. A GitHub Actions workflow deploys each
PR to a **preview channel** (expires after 7 days) and posts its URL on the PR, and deploys `main`
to the **live** channel. `index.html` and the service worker are served with `no-cache`; hashed
assets get long cache lifetimes.

## Consequences
- Maintainer actions: create the Firebase project, add a service-account key as the
  `FIREBASE_SERVICE_ACCOUNT` repository secret, and add preview domains to Auth's authorised domains
  if sign-in is tested on previews.
- Every push to `main` goes live, so the release freeze applies to merges into `main`.
