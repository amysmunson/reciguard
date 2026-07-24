# Apple App Store Deployment

Roadmap from where this app is right now to a live App Store listing. Written for a fully managed Expo app (SDK 54) with zero custom native code — EAS Build compiles the actual iOS binary in Expo's cloud, so none of this requires a Mac or touching Xcode directly.

## Current Status

| Item | Status |
|---|---|
| Apple Developer Program enrollment | ⬜ Not started |
| Bundle identifier | ✅ `com.recipeguard.app` set in `app.json` |
| Public App Store display name decided & availability-checked | ⬜ Not done — "RecipeGuard" hasn't been checked for collisions on the Store |
| `ios.config.usesNonExemptEncryption: false` | ✅ Set in `app.json` |
| Unused `expo-router` removed | ✅ Removed from `app.json`'s `plugins` array **and** uninstalled from `package.json`/`node_modules` entirely |
| `react-native-vector-icons` declared as a direct dependency | ✅ Fixed — it had only ever been present transitively via `expo-router`; removing `expo-router` broke icon rendering until this was added explicitly |
| App icon (1024×1024, no alpha) | ✅ Already compliant |
| Splash screen configured via `expo-splash-screen` plugin | ✅ Done (note: only visible in a native build or dev client, not Expo Go) |
| `eas.json` / EAS CLI project setup | ⬜ Not created |
| Apple credentials (cert + provisioning profile) | ⬜ Not generated |
| First cloud build | ⬜ Not run |
| App Store Connect app record | ⬜ Not created |
| Hosted (public URL) Privacy Policy | ⬜ Only exists in-app (`screens/PrivacyPolicy.js`) — needs a real public page |
| App Privacy "nutrition label" questionnaire | ⬜ Not filled in |
| Store screenshots (App Store Connect–compliant sizes) | ⬜ Not done — the `demo/*.webp` images in this repo are README marketing assets, not the exact pixel dimensions Apple requires per device size class |
| Demo/reviewer account seeded with sample data | ⬜ Not created |
| TestFlight build | ⬜ Not submitted |
| App Store review submission | ⬜ Not submitted |

---

## Phase 0 — What you're actually working with

This is a fully managed Expo app (SDK 54) with zero custom native code. That matters because it means EAS Build compiles the actual iOS binary for you in Expo's cloud — you never need a Mac, never touch Xcode directly, and never run `expo prebuild` yourself unless you want to inspect the generated native project.

## Phase 1 — Apple Developer Program enrollment

- Go to developer.apple.com, sign in (or create an Apple ID first if you don't have one you want tied to this).
- Enroll — $99/year, renews annually or your app gets pulled from sale.
- Two enrollment types: **Individual** (your legal name shows as the seller on the store listing — simplest, fastest) or **Organization** (needs a D-U-N-S number for your business, verification can take days to weeks). For a solo project, Individual is almost always the right call.
- Approval can take anywhere from minutes to a couple of days. Nothing else in this list can start until this is done — it gates access to App Store Connect and to registering your bundle identifier/certificates.

## Phase 2 — Lock in your app's identity (do this before anything else, it's permanent)

Two decisions you cannot change later without effectively creating a brand-new App Store listing:

- **Bundle Identifier** — reverse-DNS string. **Done**: `com.recipeguard.app`, set in `app.json`. This is the app's permanent internal fingerprint across Apple's whole system (certificates, provisioning, TestFlight, the App Store record itself).
- **Public app name** — what shows under the icon and in App Store search. Must be globally unique across the entire App Store (not just unique to you), so "RecipeGuard" alone may already be taken; you may need something more distinctive. **Not yet checked.** This is decided when you create the App Store Connect record (Phase 7), not in `app.json` — worth searching the App Store for it ahead of time and having a backup name ready.

## Phase 3 — Config gaps in `app.json`

**All done:**
- `ios.bundleIdentifier` — set.
- `ios.config.usesNonExemptEncryption: false` — set, since the app only uses standard HTTPS/TLS via Supabase, no custom cryptography. Pre-answers Apple's "does your app use encryption" export-compliance question instead of it interrupting every submission.
- The unused `"expo-router"` entry has been removed from the `plugins` array — it wasn't doing anything (no `app/` directory, everything runs through `@react-navigation/stack`), just leftover from the original template scaffold. It's since been fully uninstalled from `package.json`/`node_modules` too, not just the plugin config.
- App icon (`assets/icon.png`) is already 1024×1024 with no alpha channel — exactly what the App Store requires.

**One thing this uninstall surfaced:** `react-native-vector-icons` (used directly by `components/icons/index.js`) had only ever been present in `node_modules` as a *transitive* dependency of `expo-router` — it was never actually declared in `package.json`. Removing `expo-router` broke every icon in the app until this was caught (via `npx eslint` failing to resolve the import) and fixed by installing it explicitly with `npx expo install react-native-vector-icons`. Worth double-checking icons render correctly in the first real native build (Phase 6) since verification so far has only been lint + web bundle, not a live device/simulator.

## Phase 4 — Install and set up EAS CLI

- `npm install -g eas-cli` (or just prefix commands with `npx eas` without a global install).
- `eas login` — this creates or logs into an **Expo account**, separate from your Apple ID. EAS Build runs on Expo's own cloud infrastructure, so it needs its own identity to know whose project this is and to bill against (build minutes are metered on the free tier, generous for occasional builds).
- `eas build:configure` — generates the `eas.json` file (doesn't exist in this repo yet) with three default build profiles: `development` (includes a debug client for live-reload testing on a real device), `preview` (internal test builds), and `production` (what actually ships). It also links this project to an EAS project ID, stored in `app.json`.
- Add `"cli": { "appVersionSource": "remote" }` to `eas.json` so EAS auto-increments the iOS build number on every build instead of you manually bumping it — prevents a very common "duplicate build number" rejection later.

## Phase 5 — Apple credentials, the first time you build

- Run `eas build --platform ios --profile production`.
- EAS CLI prompts you to authenticate with Apple. The recommended path is generating an **App Store Connect API Key** (App Store Connect → Users and Access → Integrations → App Store Connect API) — a programmatic credential that avoids repeated 2FA prompts on every build/submit.
- From there, EAS can **auto-generate and manage** your Distribution Certificate (the cryptographic proof the app came from you) and Provisioning Profile (the thing that ties bundle ID + certificate + entitlements together and authorizes the binary to run). This is the "managed credentials" path — simplest for a solo developer.

## Phase 6 — The actual cloud build

- EAS uploads your project to a macOS cloud worker, runs the equivalent of `expo prebuild` internally to turn your `app.json` + plugins into a real native Xcode project, compiles it, signs it with the credentials from Phase 5, and produces a signed `.ipa`.
- Takes roughly 10–20 minutes. You get a live log stream and a build page when it's done.
- Given this project has no bare native code and a clean plugin list, the main failure modes to watch for are config plugin misconfigurations (the splash screen plugin is exactly the kind of thing that can go sideways here) or an incompatible dependency version — worth doing one throwaway build early to surface any of that before racing a deadline.
- Also watch for **missing Privacy Manifest (`PrivacyInfo.xcprivacy`) entries** — Apple requires these for certain "required reason" APIs (e.g. file timestamps, UserDefaults-equivalent storage used by AsyncStorage). Expo generally auto-generates these for its own bundled modules, but this is a real category of build/processing failure worth knowing the name of if a build gets flagged.

## Phase 7 — Create the app record in App Store Connect

- appstoreconnect.apple.com → My Apps → "+" → New App.
- Fill in: platform (iOS), the public app name from Phase 2 (availability-checked), primary language, the bundle identifier (selected from a dropdown — becomes selectable once registered, which happens automatically the first time EAS builds with it in Phase 6), and a SKU — an internal-only string you invent yourself (never shown to users, just your own bookkeeping label).

## Phase 8 — App Information & the privacy questionnaire

- **Category** (Food & Drink fits), **content rights** declaration, and an **age rating questionnaire** — a series of yes/no questions about violence, gambling, user-generated content, etc. Since users can enter their own recipes/notes, "User Generated Content" likely applies — answer honestly rather than guessing toward the lowest rating.
- **Pricing and Availability** — free vs. paid, which countries.
- **App Privacy ("nutrition label")** — a separate, structured questionnaire from the in-app Privacy Policy text. For each data category (Contact Info, User Content, Identifiers, etc.) you declare: is it collected, is it linked to the user's identity, is it used for tracking. Map this directly onto what's actually documented in `PrivacyPolicy.js` (already audited for accuracy): account info and `friend_code` as identifiers linked to identity, recipes/folders/notes as user content linked to identity, and — importantly — nothing here should be marked as used for cross-app "tracking," since nothing in this codebase does that, meaning the App Tracking Transparency prompt isn't needed.
- **Hosted Privacy Policy URL** — Apple requires an actual public webpage, not just the in-app screen. `PrivacyPolicy.js`'s content needs to be published somewhere reachable (GitHub Pages, a simple static page, etc.) before submission — **not done yet**.
- **Support URL** — a real page or contact email; required field, submission won't go through without it.

## Phase 9 — The visual store listing

- **Screenshots** at Apple's exact required pixel dimensions per device size class — since `ios.supportsTablet: true` is set, iPad screenshots are needed too, not just iPhone. Note: the `demo/*.webp` images already in this repo (used in the README) are marketing assets at whatever resolution they were captured at — they are **not** guaranteed to match App Store Connect's required exact dimensions and will likely need to be recaptured or resized per required size class.
- **Description**, **keywords** (comma-separated, drives App Store search), optional **promotional text** (editable anytime without a new review) and app preview video.
- App icon is pulled automatically from the build itself.

## Phase 10 — Give the reviewer a way in

Every screen in this app sits behind Supabase auth (`App.js`'s `RootNavigator` only ever shows `AppStack` or `AuthStack`, nothing public). Apple's reviewer needs actual credentials to get past Login, supplied in the "App Review Information" section of the version you submit — otherwise it's an automatic rejection under Guideline 2.1 for being unable to test the app. **Not done yet** — seed a demo account with a few real recipes, folders, and friends first, so the reviewer isn't looking at a completely empty app.

## Phase 11 — TestFlight before the real thing

- `eas submit --platform ios` uploads the `.ipa` to App Store Connect (same Apple auth as Phase 5).
- After Apple's automated processing (roughly 10–30 minutes — includes checks like missing privacy manifest entries or bad entitlements), the build shows up under the app's TestFlight tab.
- **Internal Testing** — instantly available to up to 100 people on your team, no Apple review needed. First real smoke test on an actual device.
- **External Testing** (optional) — up to 10,000 testers via a public link, but requires a lightweight "Beta App Review" first (much faster and less strict than full App Store review).

## Phase 12 — Submit for App Store review

- In App Store Connect, create a new version (e.g. `1.0.0`), attach the build already validated via TestFlight, confirm the metadata from Phases 8–9, and submit.
- Typical turnaround is 24–48 hours. Outcomes: **Approved**, **Rejected** (with a specific guideline citation to address and resubmit against), or **Metadata Rejected** (only the listing text/screenshots need fixing — no new build required).

## Phase 13 — Rejection reasons worth preempting specifically for this app

- **Guideline 5.1.1(v), account deletion** — already satisfied; `Settings.js` has a working Delete Account flow.
- **Guideline 2.1, reviewer can't get in** — covered by Phase 10's demo account, once created.
- **Guideline 4.0, minimum functionality / empty states** — make sure that demo account isn't a bare, contentless shell.
- **Guideline 5.1.2, data use accuracy** — the privacy nutrition label (Phase 8) needs to actually match real behavior; already audited once for the in-app policy text, so extending the same accuracy to the App Store Connect questionnaire is mostly a transcription exercise.
- The recipe-link-parsing feature (pulling structured data off third-party recipe URLs) is unlikely to be an issue since it's user-initiated, single-page, read-it-later-style parsing — but worth having a one-sentence explanation ready in case a reviewer asks.

## Phase 14 — After approval

- Choose Manual, Automatic, or Scheduled release timing under the version's release settings.
- Any future update means bumping `app.json`'s `version` field, letting EAS auto-increment the build number again (Phase 4's config), and repeating Build → TestFlight → Submit.

## Phase 15 — Ongoing upkeep

- The $99/year Developer Program renewal — miss it and the app comes off the store until you renew.
- Apple periodically raises the minimum Xcode/iOS SDK version required for new submissions, which can eventually force an Expo SDK upgrade on your end to stay build-eligible — not urgent, just something to keep half an eye on over time.

---

## Additional steps not covered above

A few things worth doing that fall outside the phase-by-phase mechanics:

- **Check "RecipeGuard" availability on the App Store before Phase 7.** Search the Store for the name now and have one or two backup names ready, so a naming collision doesn't stall the App Store Connect record creation at the last minute.
- **Stand up the hosted Privacy Policy page early** (Phase 8 blocker) — it's a small, one-time task (a single static HTML page or GitHub Pages site mirroring `PrivacyPolicy.js`'s content) but it gates submission, so it's worth doing well before you're ready to submit rather than discovering the requirement at submission time.
- **Seed the demo/reviewer account deliberately** (Phase 10) — a few recipes with allergy conflicts, a folder, and at least one friend (ideally one manually-added and one linked via friend code) so a reviewer can actually exercise the allergy-filtering and friend-linking features, not just see an empty shell.
- **Recapture or resize screenshots specifically for App Store Connect** (Phase 9) — the existing `demo/*.webp` images are README-scale marketing assets; Apple's required screenshot sizes are exact per device class and are a distinct task from the README's demo row.
- **Budget for the $99/year recurring cost** as an ongoing line item, not a one-time expense — it's easy to plan for the first submission and forget it's annual.
