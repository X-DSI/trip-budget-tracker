---
title: App skeleton — PWA shell, Google sign-in, Firestore offline, CI and hosting
status: in-progress
assignee: X-DSI-agent
base_sha: 8057ca1
adrs: [2026-11-23-offline-first-pwa.md, 2026-11-23-firestore-with-offline-persistence.md, 2026-11-23-google-sign-in-and-invite-links.md, 2026-11-23-firebase-hosting.md]
plan_pr: 1
impl_pr: null
review: human
---

## Goal
A deployable, installable, offline-capable app shell that every later handoff builds on: sign in
with Google, a responsive layout with empty screens, Firestore wired up with its offline cache, and
CI that tests, builds and deploys previews.

## Scope
**In:**
- Vite + React + TypeScript project at the repo root; Tailwind CSS; React Router; ESLint + Prettier.
- `vite-plugin-pwa`: manifest (name "Trip Budget", INR-friendly theme colour, icons 192/512 and a
  maskable icon), precached app shell, a SPA fallback, and a "new version available, reload" prompt
  (no silent auto-reload mid-use).
- Firebase JS SDK (modular). `src/lib/firebase.ts` reads config from `VITE_FIREBASE_*` env vars
  (`.env.example` committed). Firestore with `persistentLocalCache` + `persistentMultipleTabManager`.
  Connect to emulators when `VITE_USE_EMULATORS=true`.
- Auth: Google sign-in (popup on desktop, redirect on mobile/standalone PWA), sign-out, an auth
  guard, and creating/updating `users/{uid}` on sign-in.
- Layout: phone (< 1024 px) has a top bar and a bottom tab bar; desktop (≥ 1024 px) has a sidebar.
  Tabs: **Home**, **Trip**, **Expenses**, **Balances**, **More**. Expenses and Balances show
  "Coming soon".
- An online/offline indicator in the top bar, and a "pending sync" badge driven by Firestore
  `hasPendingWrites` / `waitForPendingWrites`.
- An iOS "Add to Home Screen" hint when running in Safari, not standalone.
- `firebase.json` (Hosting with SPA rewrite; `no-cache` for `index.html`, `sw.js` and the manifest;
  long cache for `/assets/**`), `.firebaserc` with a placeholder project ID, `firestore.rules` that
  allows only `users/{uid}` for its own user and denies everything else for now, and
  `firestore.indexes.json`.
- Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test` (Vitest), `test:rules`
  (`@firebase/rules-unit-testing` on the Firestore emulator), `test:e2e` (Playwright, phone and
  desktop projects).
- CI (`.github/workflows/ci.yml`): keep the `commit-identity` job; add a job running lint, typecheck,
  unit tests, rules tests (emulator) and build on Node 22. Add `.github/workflows/deploy.yml`: preview
  channel per PR (`FirebaseExtended/action-hosting-deploy`, expires 7d) and live deploy on push to
  `main`; both skip cleanly when the `FIREBASE_SERVICE_ACCOUNT` secret is missing.
- Fill in the Commands table in `AGENTS.md`.

**Out:** Trip screens, invites, expenses, budget, chat, receipt photos.

## Acceptance criteria
- [ ] Lint, typecheck and unit tests pass — check: `npm run lint && npm run typecheck && npm test`
- [ ] Production build succeeds and emits a service worker and manifest — check: `npm run build && test -f dist/sw.js && test -f dist/manifest.webmanifest`
- [ ] Rules deny reading another user's `users/{uid}` and allow your own — check: `npm run test:rules`
- [ ] With the network off, a reload of the built app still renders the shell and the offline indicator — check: `npm run test:e2e -- --grep @offline`
- [ ] Phone viewport shows the bottom tab bar and no sidebar; desktop shows the sidebar and no tab bar — check: `npm run test:e2e -- --grep @layout`
- [ ] A PR gets a working preview URL, and signing in with Google works on it — check: manual
- [ ] The app installs to the home screen on Android Chrome and iOS Safari and opens offline — check: manual

## Constraints
- No Firebase imports outside `src/lib/` and feature data hooks; UI components get data via hooks.
- Do not commit real Firebase config or any secret. Firebase web config is public, but keep it in
  env vars so preview and live can differ.
- E2E tests run against the emulators, never the live project.

## Implementer may decide
Folder structure inside `src/`, component helpers (e.g. Radix primitives), icon set, state handling
(React context or a small store), exact colours and typography.

## Must escalate
Any change to the ADRs above or to `docs/data-model.md`; a different auth provider; anything that
needs the Blaze (paid) plan.

## Attached content
None.

## Maintainer actions this handoff needs
1. Create Firebase project (Spark plan); Firestore `(default)` in **asia-south1**; enable Google
   sign-in in Authentication.
2. Register a web app and share its config values for `.env` / GitHub Actions variables.
3. Add `FIREBASE_SERVICE_ACCOUNT` as a repository secret (from `firebase init hosting:github` or a
   service-account key with Hosting Admin).
4. Approve the PR: it touches code-owned `.github/` and `firestore.rules`.
