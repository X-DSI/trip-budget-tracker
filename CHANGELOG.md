# Changelog

All notable changes to Trip Planner. Versions follow [SemVer](https://semver.org/);
each version gathers the fragments from `changelog.d/` (see its README).

## 0.2.0 (25 Nov 2026)

The family test build: everything up to the dry run on 30 Nov.

### Added

- Foundation decisions (stack, offline sync, sign-in and invites, hosting, data model, money, split
  modes, release freeze) and the first four handoffs: app skeleton, split engine, trip planning, and
  dashboard.
- Installable app shell for phones and desktops: Google sign-in, bottom tabs on phones and a sidebar
  on desktops, offline indicator, "waiting to sync" badge, update prompt and an iPhone install hint.
- Works offline after the first visit: the app shell is cached and Firestore keeps data and queued
  writes on the device.
- CI runs lint, typecheck, unit tests, Firestore rules tests and phone/desktop end-to-end tests;
  pull requests get a Firebase Hosting preview and `main` deploys live.
- Split and settlement engine: integer-paise money parsing and formatting, the five split modes
  (equal per family, per head with kid weighting, dish by dish with shared items and extras,
  custom, personal), family balances, fewest-payment settle-up suggestions, UPI payment links and
  budget shares per family.
- Trip planning: create and edit a trip (dates, destination, expected distance, kid weighting,
  notes), travel legs by car, bus, train or flight, families with adults, kids and UPI IDs, and
  organiser/member roles.
- Invite links: organisers create, share (WhatsApp share sheet or copy) and turn off links; adults
  join by signing in and picking or adding their family.
- "My trips" with a switcher in the top bar when you belong to more than one trip.
- Security rules for trips, legs, families, members and invites.
- Dashboard: a live countdown and "get ready" checklist before the trip, "Day 2 of 4, enjoy
  Coorg!" with a friendly line and today's travel during it, and a welcome-back nudge to settle up
  afterwards. Works offline; flips at midnight India time on its own.
- Expenses: log what anyone pays, even with no signal, and split it equally per family, per head,
  dish by dish (with shared dishes, tax and tip), with custom amounts, or as personal. A live
  preview shows each family's share before saving. Grouped by day, with trip, today and
  your-family totals.
- Only the person who added an expense, or an organiser, can edit or delete it.
- The dashboard shows today's spend during the trip.
- Budget: organisers plan the trip's costs line by line (equal per family, per head, custom, or
  one family's own), and everyone sees each family's planned share and budget vs actual by
  category and by family.
- Balances: each family's paid, share, payments and what it owes or gets back, worked out on the
  phone from expenses and payments. Suggested payments (at most one fewer than the families),
  "Pay with UPI" when the receiving family has a UPI ID, and "Mark as paid", even offline.
- Payment history; the person who recorded a payment, or an organiser, can delete it.
- The dashboard shows your family's balance during and after the trip, and ticks "Budget set".
- Day-by-day **itinerary** in place of "Getting around": travel, sightseeing, food, stays and
  activities for each day, with times, places (one tap opens Google Maps) and notes. Organisers
  plan; everyone reads, offline too.
- The Trip tab shows the next five plans under "Coming up"; the full Itinerary page shows every
  day. Home shows today's plan during the trip (with what's next highlighted) and the Day 1 plan
  before it.
- Home: a big **Add expense** button, a pinned **Important info** card (hotel addresses, bookings,
  emergency contacts; phone numbers and emergency codes like 108 are tappable), **budget at a
  glance** for the trip and your family, and the **last three expenses**. During the trip, today's
  plan comes first.
- **Dark theme.** It follows your phone's light or dark mode by default, or pick System, Light or
  Dark under More. It applies before the page appears (no white flash), works offline, and the
  phone's status bar matches.
- **Download expenses as a spreadsheet.** A button on Expenses saves every expense (with each
  family's share, who added it and who last edited it) as a file that opens in Excel or Google
  Sheets. On phones it opens the share sheet, so you can save it to Files or send it on WhatsApp.
  It works offline.
- **See who added or changed an expense.** Each expense in the list says who added it, and the
  expense shows "Added by … on …" and "Last edited by … on …".
- **Where the money went.** Money → Budget shows spending by category, largest first, with your
  family's share, even before a budget is set. Tap a category to see just those expenses.
- **Version and credits on the More page.** The bottom of More shows which version you're on (for
  bug reports), with a "Test site" badge on the test site, and "Built with ♥ by DSI": "Built"
  opens the app's code on GitHub, and "DSI" opens Danny's GitHub page.

### Changed

- Pull-request previews now deploy to a separate dev Firebase project, never the real trip's data.
  Merges to `main` deploy Firestore rules and the app to production automatically.
- The join page shows the trip name, dates, destination and who's inviting (the trip owner) before
  you join. Editing the trip keeps active invite links up to date.
- The Balances tab is now **Money**, with a Budget | Balances switch. The budget moved off the Trip
  tab; members see it read-only.
- The Trip tab has a "Your family" card: who's in your family, its UPI ID, and where to change
  it. Members see it where organisers see the invite card.
- **New name and logo.** The app is now called **Trip Planner**, with a new logo: a sun with a `$`
  rising between two mountains at dawn. Phones that already installed the app pick up the new icon
  and name when the app updates (on iPhone the name under the icon stays until it's re-added).
- **Version on every screen.** The version, the build it came from and the credits now sit at the
  bottom of every screen on phones (and on the sign-in page), and at the bottom of the side menu on
  computers, instead of only on More.

### Fixed

- **Home links go to the right place.** The Get ready links now open the exact section: the
  invite link, the families, your family, or Money → Budget (it used to point at the Trip tab).
  Members see "see who's joined" instead of an invite link they can't use. The install step shows
  how to install on your phone or browser.
- **Home stats are tappable.** Days and Distance open the itinerary; Families and People jump to
  those sections on the Trip tab.
