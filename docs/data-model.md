# Data model

Firestore layout for trip-budget-tracker. Decided in
[multi-trip data model](adr/2026-11-23-multi-trip-data-model.md),
[integer paise](adr/2026-11-23-money-as-integer-paise.md),
[expenses are the source of truth](adr/2026-11-23-expenses-are-the-source-of-truth.md) and
[split modes](adr/2026-11-23-split-modes.md). Changing this file is an escalation unless a handoff
asks for it.

Conventions: `*Paise` fields are integers. Dates without a time are `YYYY-MM-DD` strings in the
trip's timezone. `createdAt`/`updatedAt` are `serverTimestamp()`. IDs are Firestore auto-IDs made on
the device, except where noted.

## `users/{uid}`

| Field | Type | Notes |
|---|---|---|
| `displayName`, `photoURL` | string | Copied from Google on sign-in |
| `activeTripId` | string \| null | The trip the dashboard shows |

Only the user can read or write their own document.

## `invites/{code}`

The document ID **is** the invite code (≥ 128 bits, URL-safe). Nobody can list this collection;
knowing the code is what grants a `get`.

| Field | Type | Notes |
|---|---|---|
| `tripId` | string | |
| `active` | bool | Organisers turn an invite off |
| `createdBy`, `createdAt` | | |

## `trips/{tripId}`

| Field | Type | Notes |
|---|---|---|
| `name` | string | e.g. "Ooty & Coorg, Dec 2026" |
| `destination` | string | Free text, the main places |
| `startDate`, `endDate` | `YYYY-MM-DD` | Inclusive |
| `timezone` | string | `Asia/Kolkata` by default |
| `expectedKm` | int \| null | Total expected driving distance |
| `kidWeight` | number | Per-head weight of a child, default `0.5` |
| `currency` | `"INR"` | Fixed in v1 |
| `ownerUid` | string | |
| `memberUids` | string[] | Everyone who has joined; used for queries and rules |
| `organizerUids` | string[] | Owner plus promoted organisers |
| `notes` | string | Optional |
| `createdAt`, `updatedAt` | timestamp | |

### `trips/{tripId}/legs/{legId}` — how the group travels

| Field | Type | Notes |
|---|---|---|
| `mode` | `car` \| `bus` \| `train` \| `flight` \| `other` | |
| `from`, `to` | string | |
| `date` | `YYYY-MM-DD` \| null | |
| `vehicles` | int | Number of cars / buses; 1 for train or flight bookings |
| `km` | int \| null | Expected distance for this leg |
| `notes` | string | e.g. PNR, flight number, who is driving |
| `order` | int | Display order |

### `trips/{tripId}/families/{familyId}`

| Field | Type | Notes |
|---|---|---|
| `name` | string | e.g. "Daniel & family" |
| `adults`, `kids` | int | `adults ≥ 1`, `kids ≥ 0` |
| `upiId` | string \| null | For settle-up links |
| `color` | string | One of a fixed palette, for charts and chips |
| `order` | int | Stable order for display and rounding ties |
| `active` | bool | `false` hides a family without breaking old expenses |

### `trips/{tripId}/members/{uid}` — document ID is the user's uid

| Field | Type | Notes |
|---|---|---|
| `displayName`, `photoURL` | string | |
| `familyId` | string \| null | Chosen when joining; `null` until chosen |
| `role` | `owner` \| `organizer` \| `member` | Must match `organizerUids` on the trip |
| `joinedVia` | string | Invite code used |
| `joinedAt` | timestamp | |

### `trips/{tripId}/expenses/{expenseId}` — built by a later handoff

| Field | Type | Notes |
|---|---|---|
| `title`, `category` | string | Categories: fuel, tolls, food, stay, tickets, shopping, transport, other |
| `amountPaise` | int | > 0 |
| `paidByFamilyId` | string | |
| `date` | `YYYY-MM-DD` | |
| `splitMode` | `equal_family` \| `per_head` \| `itemized` \| `custom` \| `personal` | |
| `participants` | string[] | Family IDs; empty means all active families |
| `items` | `{ name, amountPaise, familyId \| "shared" }[]` | `itemized` only |
| `extrasPaise` | int | `itemized` only: tax + service + tip, spread proportionally |
| `customShares` | `{ [familyId]: int }` | `custom` only; must add up to `amountPaise` |
| `deleted` | bool | Soft delete |
| `createdBy`, `updatedBy`, `createdAt`, `updatedAt` | | |

### `trips/{tripId}/budget/{lineId}` and `trips/{tripId}/settlements/{id}`

Reserved for a later handoff. Budget lines: `category`, `title`, `amountPaise`, `splitMode`.
Settlements: `fromFamilyId`, `toFamilyId`, `amountPaise`, `date`, `method` (`upi` \| `cash` \| `other`).

## Access rules

| Who | Can |
|---|---|
| Signed-in user | Create a trip (becoming its owner); read/write their own `users` doc; `get` an invite by code |
| Holder of an active invite | Add their own uid to `memberUids` and create their own `members/{uid}` doc with role `member` |
| Member | Read the trip and all its subcollections; set their own `familyId`; create a family when joining; create and edit expenses, settlements |
| Organiser | Everything a member can, plus edit the trip, legs, families, budget, invites and roles |
| Owner | Everything an organiser can; cannot be removed by others |

Nobody can change their own `role`, add someone else to `memberUids`, or list `invites`.
