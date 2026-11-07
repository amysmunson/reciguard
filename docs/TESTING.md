# Testing

One command checks that the app still works:

```bash
npm run verify
```

It runs, in order, and stops at the first failure:

1. **Lint**: ESLint over the whole repo. It fails only if the problem count rises above the baseline in `scripts/verify.js` (`LINT_BASELINE`, currently 6). Those 6 are older React Compiler warnings from the SDK 57 upgrade. Lower the baseline as you fix them.
2. **Unit tests**: app logic and shared components (`tests/unit`).
3. **Security tests**: secrets, session storage, sign-out cleanup, unsafe links, input limits, and code hygiene (`tests/security`).
4. **Dependency audit**: `npm audit` on production dependencies, through `scripts/audit.js` and `security/audit-allowlist.json`.
5. **iOS bundle build**: `expo export`, which catches import or syntax errors in files the tests don't load.

Run any step on its own:

| Command | What it runs |
|---|---|
| `npm test` | Unit + security Jest suites |
| `npm run test:unit` | Unit suite only |
| `npm run test:security` | Security suite + dependency audit |
| `npm run audit:deps` | Dependency audit only |
| `npx jest tests/unit/scaleIngredient.test.js` | One file |
| `npx jest --watch` | Re-run on save |

The tests use [Jest](https://jestjs.io) with Expo's `jest-expo` preset and [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) for components. They run on your machine and never contact Supabase. The network-dependent part of `verify` is the dependency audit, which needs internet access to reach the npm registry.

## Layout

```
jest.config.js            two Jest projects: unit, security
tests/
  setup.js                in-memory AsyncStorage / SecureStore / Haptics, public env vars
  helpers/
    fakeSupabase.js       records every supabase.from(...) query; tests feed back rows
    repoFiles.js          lists tracked + new source files for static checks
  unit/                   app behavior
  security/               security checks
scripts/
  verify.js               npm run verify
  audit.js                dependency gate (npm audit + allowlist)
security/
  audit-allowlist.json    accepted advisories, each with its reason
```

## What's covered

### Unit (`tests/unit`)

| File | Covers |
|---|---|
| `scaleIngredient.test.js` | ½×/2×/3× scaling: fractions, mixed numbers, unicode, ranges, lines left alone |
| `recipeTimes.test.js` | ISO 8601 / text durations, formatting, prep + cook total |
| `recipeItems.test.js` | `{ text, isHeader }` items, headers excluded from ingredient text, defaults for old cached copies |
| `recipeUrlParser.test.js` | Link import: name, servings, times, step sections, WP Recipe Maker ingredient sections (including the US/Metric toggle title), count-mismatch fallback, error messages |
| `sortAndVisibility.test.js` | Sorting, invalid saved sort values, allergy matching and dots, hide-vs-warn |
| `recipesApi.test.js` | Queries scoped to the user, Recently Deleted excluded, header rows written, soft delete and restore, favorites don't touch `updated_at`, copies |
| `caching.test.js` | 5-recent-recipe eviction, turning caching off (clears and stops writes), `clearUserCache` |
| `unsavedChanges.test.js` | App-wide unsaved-edit registry (holds theme switches), `confirmDiscard` |
| `dialog.test.js` | `appAlert` card, button handling, queued dialogs |
| `components.test.js` | Drag-and-drop accessibility Move up / Move down, `EditHeader` |

### Security (`tests/security`)

| File | Checks |
|---|---|
| `secrets.test.js` | No Supabase secret / service-role keys, private keys, or cloud tokens in tracked (or new) files. No `.env` committed. App code reads only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. |
| `session.test.js` | The Supabase session is stored in SecureStore (Keychain/Keystore), over HTTPS. `detectSessionInUrl` is off. Chunked SecureStore values round-trip and are fully removed. |
| `signOut.test.js` | Sign-out and account deletion leave no per-user data on the device: caches, cached recipes, cached friend names, and preferences. |
| `friendCache.test.js` | FriendProfile caches only `{ id, name }`, never notes, bio, or dietary data. First-time friends get a name from the cached friends list. Full profiles cached by earlier builds are purged, even with caching off. |
| `inputs.test.js` | Source links open only if they're `http(s)`. Link import refuses non-http(s) URLs and oversized pages, and keeps imported text plain. Feedback limits on length, type, and empty messages. |
| `codeHygiene.test.js` | No `eval` or `new Function`. No console logging in app code. Network calls only through Supabase, the health check, or the user's recipe URL. The health check sends only the public key. No session data written to AsyncStorage. |

### Dependency audit

`scripts/audit.js` fails on any high or critical advisory in the production dependency tree that isn't in `security/audit-allowlist.json`. It also fails if an allowlist entry is no longer reported, so stale exceptions get removed. Every accepted entry must say why. Moderate and low advisories are printed but don't fail the build.

As of 2026-11-06 the allowlist is **empty**. The `node-forge` / `zod` / `@expo/cli` highs that were accepted on 2026-10-24 got fixed releases, and `npm audit fix` picked them up (Expo 57.0.32). The remaining moderates are build-time tooling only (`glob` / `minimatch` via `@expo/fingerprint`); npm's only suggested fix is downgrading to Expo SDK 52.

### Not covered (check on a device)

- Full screens and navigation flows. Screens depend on Supabase, navigation, and native views, so the suite tests their logic and shared components rather than rendering whole screens.
- Supabase Row Level Security. The client always scopes its queries, but real protection comes from RLS policies on the server. Verify those by signing in as a second user (PR template: "Verified RLS").
- Real gestures (the drag itself, swipe-back), dark-mode visuals, and the status-bar backdrop.

## Security fixes made when the suite first ran

| Finding | Fix |
|---|---|
| Recipe source links opened with **any** URL scheme (`tel:`, `sms:`, another app's scheme, …), handed straight to `Linking.openURL` | `lib/safeUrl.js` `isSafeWebUrl()`. RecipeCard opens only `http(s)` links and otherwise shows "Cannot open link". |
| Feedback had **no length limit**, and the API accepted any `type` | `FEEDBACK_MAX_LENGTH` (2000) enforced on the form (`maxLength`) and in `submitFeedback`, which also rejects empty messages and unknown types. |
| Turning off **Keep copies on this device** left the cached full recipes on the phone. The cleanup read its index through the now-disabled cache. | Cleanup reads the index directly (`loadIndexForCleanup` in `lib/recipeCache.js`), and `applyCachingPreference` clears before switching off. |
| Vulnerable dependencies: 14 advisories, 1 critical | `npm audit fix` (non-breaking, lockfile only), plus an `overrides` pin of `brace-expansion` 1.1.21 under ESLint's `minimatch@3`. The 5 build-time Expo tooling highs left over were fixed by a later `npm audit fix` (2026-11-06, Expo 57.0.32), so no exceptions remain. |
| Invalid saved sort values were accepted as-is (found by the unit tests) | `normalizeSort` only accepts real sort fields and falls back otherwise. |

## Adding tests

- Put app-behavior tests in `tests/unit/<area>.test.js` and security checks in `tests/security/`.
- For API code, mock Supabase with `jest.mock('../../lib/supabase', () => require('../helpers/fakeSupabase').module)`. Then assert on `fake.state.log` and feed back rows with `fake.state.respond`.
- React Native Testing Library v14 is async: `await render(...)`, `await fireEvent.press(...)`, `await renderHook(...)`.
- New native modules may need an in-memory mock in `tests/setup.js`.
