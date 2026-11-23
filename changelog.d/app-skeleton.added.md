- Installable app shell for phones and desktops: Google sign-in, bottom tabs on phones and a sidebar
  on desktops, offline indicator, "waiting to sync" badge, update prompt and an iPhone install hint.
- Works offline after the first visit: the app shell is cached and Firestore keeps data and queued
  writes on the device.
- CI runs lint, typecheck, unit tests, Firestore rules tests and phone/desktop end-to-end tests;
  pull requests get a Firebase Hosting preview and `main` deploys live.
