# Dry run — before the 4–7 Dec trip

A rehearsal with the real families and their real phones, on the **dev** site, so nothing touches
the real trip. Plan about 45 minutes, ideally in one place with Wi-Fi, by **Mon 30 Nov**. Anything
that fails becomes a `fix/` PR before the freeze (see the
[release-freeze ADR](adr/2026-11-23-release-freeze-for-first-trip.md)).

- **Dry-run site:** https://x-dsi-trip-budget-dev.web.app (dev project, deployed from `main`)
- **Real site (not today):** https://x-dsi-trip-budget.web.app
- **Who:** at least one adult from every family, plus you as organiser. Have at least one iPhone
  and one Android phone, and one phone with a UPI app.

Tick each box; write down anything odd (screenshot + phone model) in the notes at the end.

## 0. Before everyone arrives (organiser, 10 min)

- [ ] Open the dry-run site, sign in with Google, and create a trip called **"Dry run"** with
      dates in the future, a destination and an expected distance.
- [ ] Add two travel legs (one car with 2 cars, one train) and check the km and car totals.
- [ ] Add every family with the right adults and kids, and your own UPI ID on your family.
- [ ] Add a budget: one line equal per family (e.g. fuel ₹12,000) and one per head (e.g. stay
      ₹36,000). Check each family's planned share looks right.
- [ ] Create an invite link.

## 1. Joining (everyone, 10 min)

- [ ] Share the invite link from your phone. **Check:** it opens the share sheet and WhatsApp is
      offered.
- [ ] Each adult opens the link in their phone's browser. **Check:** the page says "{your name}
      invited you to Dry run" with the dates, before they join.
- [ ] Each adult signs in with Google, taps **Join the trip** and picks their family.
- [ ] **Install the app on every phone:**
  - Android (Chrome): menu → *Add to Home screen* / *Install app*.
  - iPhone (Safari): Share → *Add to Home Screen*. (Chrome on iPhone can't install it; use Safari.)
- [ ] Everyone opens the app **from the home-screen icon**, not the browser, from now on.
- [ ] **Check:** the dashboard shows the countdown and "Everyone has joined" ticks once all
      adults are in.

## 2. Expenses with signal (10 min)

- [ ] One adult adds a **per-head dinner** of ₹4,000. **Check:** the preview shares look fair for
      each family's size before saving.
- [ ] Another adult adds **fuel** ₹3,000, *Equal per family*.
- [ ] Someone adds a **dish-by-dish** bill: a few dishes for different families, one shared
      starter, plus ₹200 tax and tip. **Check:** it won't save until the dishes add up to the bill.
- [ ] **Time it:** one person adds a simple expense from the home screen. **Check:** under 10
      seconds.
- [ ] **Check permissions:** a non-organiser opens someone else's expense and sees it read-only;
      the organiser can edit it.

## 3. No signal (the important part, 10 min)

- [ ] **Two phones offline at once:** turn on *Aeroplane mode* on two phones from different
      families. Each adds an expense.
      **Check:** each appears at once, marked *Not synced yet*, and the top bar says *Offline*.
- [ ] Close the app on one of them and open it again, still offline.
      **Check:** the app opens, and the unsynced expense is still there.
- [ ] Turn Aeroplane mode off on both. **Check:** within about a minute both expenses appear on
      **every** phone, and *Not synced yet* / *Waiting to sync* disappear.
- [ ] **Close-right-after-saving:** with signal, add an expense and **immediately swipe the app
      away** (within a second of tapping *Add expense*). Reopen it.
      **Check:** is the expense there? If not, note the phone model; it decides whether we need a
      fix before the trip.
- [ ] Repeat the previous step in Aeroplane mode, then turn signal back on. **Check:** it syncs.

## 4. Balances and settling up (10 min)

- [ ] Open **Balances**. **Check:** each family's "owes / gets back" makes sense, and the
      suggested payments number at most (families − 1).
- [ ] On a phone of a family that owes money to a family with a UPI ID, tap **Pay with UPI**.
      **Check:** a UPI app opens with the payee, amount and note filled in. **Back out without
      paying** (or pay ₹1 to yourself if you want a real test).
- [ ] Tap **Mark as paid** on one suggestion. **Check:** that debt disappears for everyone.
- [ ] Delete that payment from the history. **Check:** the debt comes back.
- [ ] **Trip tab → Budget:** check budget vs actual moved with the expenses.

## 5. Wrap-up (5 min)

- [ ] Ask each person: what was confusing? What took too long?
- [ ] Make sure everyone knows: **open the app once on Wi-Fi on 2–3 Dec** so the latest version is
      on their phone, and keep it installed.
- [ ] Leave the "Dry run" trip as it is (it's on the dev site; the real trip will be created on
      the real site).

## Notes

| Step | Phone (model, iOS/Android) | What happened |
|---|---|---|
| | | |

## Message to send the families

> Hi all! Before our trip we're testing the trip-expense app together. Please bring your phone
> charged, and make sure you can sign in to Google on it. It takes about 45 minutes, and on the
> trip it'll show who paid what and who owes whom, even with no signal.
