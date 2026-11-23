---
title: One offline-first PWA for phones and desktops (React, Vite, TypeScript)
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
Adults from four families need the app on Android phones, iPhones and desktops. During the trip,
signal drops on highways, ghat roads and at hill-station hotels. The app must open and work with no
network. There are 11 days to the first trip, so there is no time for app-store releases.

## Options
- **Native apps (or React Native)** — best offline story, but store review and two builds; too slow.
- **Server-rendered web app** — simple, but doesn't open offline.
- **Client-rendered PWA** — installs to the home screen, opens offline from a service-worker cache,
  one codebase for every screen size.

## Decision
Build one client-rendered PWA: **React + Vite + TypeScript**, `vite-plugin-pwa` (Workbox) to precache
the app shell, **React Router** for routes, **Tailwind CSS** for styling. One responsive layout:
bottom tab bar on phones, sidebar on wide screens (breakpoint `lg`, 1024 px). Tests use **Vitest**
and Testing Library for units, and **Playwright** for end-to-end runs at a phone viewport (390×844)
and a desktop viewport (1440×900). Node 22 LTS, npm.

## Consequences
- Every screen must be built and checked at both viewports.
- "Works offline" is a requirement for every trip-time feature, and Playwright tests it with the
  browser set offline.
- iOS needs "Add to Home Screen" from Safari; the app shows an install hint there.
- The implementer may choose headless component helpers (e.g. Radix primitives) and icons.
