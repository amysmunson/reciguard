# Architecture

Recipes is a React Native + Expo (SDK 58) app backed by Supabase (Postgres + Auth).
The app stores per-user recipes, organizes them into folders, tracks friends and
their allergies, and is built to expand into sharing and allergy-aware recipe
filtering.

**Terminology note:** user-facing text says "dietary needs" (screen titles,
hints, alerts), but this is a UI-copy-only rename — every identifier in the
codebase still says "allergy": the `allergies` table/columns, `lib/server/api/allergies.js`,
`AllergyChecklist`/`AllergyFilterControl`/`AllergyOverview`/`EditAllergies`
file, component, and route names, `KEYS.homeAllergyFilter`, etc. Don't infer
from the code's naming that a rename is pending — it isn't; keep new
identifiers consistent with the existing "allergy" naming and only adjust
user-visible strings.

The codebase is organized in four layers:

1. **Screens** (`screens/`) — what the user sees. Stateless about data
   persistence; they call into `lib/server/api/*` and render results.
2. **Logic** (`lib/`) — no UI, in two folders:
   - `lib/server/` — everything that makes a network request: the Supabase
     client and session, the per-table functions in `lib/server/api/`
     (`getRecipes()`, `createFolder()`, `signOut()`, ...), the connectivity
     ping, recipe-link import, and the hooks that load or save through them.
     The only place Supabase is touched; screens **never** import `supabase`
     directly.
   - `lib/app/` — on-device only, never a server call: local storage and
     caches, dialogs, the unsaved-changes guard, theme, sorting, and the pure
     recipe helpers (scaling, times, items, safe links). A file belongs here
     only if nothing in it reaches the network; it may still be handed a
     server function to call (e.g. `useCachedResource`'s `fetcher`).
3. **Shared components** (`components/`) — the `NavigationBar` and small
   utilities.
4. **Styles** (`styles/`) — the single shared `StyleSheet` for the whole app.

Authentication is gated at the navigator level: when there is no session, the
app renders the `AuthStack` (Landing / Login / SignUp / PrivacyPolicy /
TermsOfService / ForgotPassword). When a session exists, the app renders the
`AppStack` (Home, Folders, Friends, Settings, and their detail screens).

---

## File tree

```
recipes/
├── App.js                          # Root: AuthProvider + AuthStack/AppStack swap
├── index.js                        # registerRootComponent(App)
├── app.json                        # Expo config
├── package.json                    # Dependencies (Expo, RN, Supabase, etc.)
├── .env.example                    # EXPO_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY
│
├── lib/                            # Logic with no UI, split by whether it talks to a server
│   ├── server/                     # Anything that makes a network request (the ONLY place Supabase is used)
│   │   ├── supabase.js             # Single createClient() instance (SecureStore session storage + URL polyfill)
│   │   ├── secureStoreAdapter.js   # Chunked expo-secure-store adapter used as the auth session storage above
│   │   ├── auth-context.js         # AuthProvider + useAuth() hook (session, user, loading)
│   │   ├── connectivity.js         # Server ping: useIsOnline(), checkConnection(), alertSaveFailed()
│   │   ├── recipeUrlParser.js      # fetchRecipeFromUrl(): downloads a recipe page → name/ingredients/steps/servings/times (+ sections)
│   │   ├── useCacheWarmup.js       # On launch/sign-in: quietly refresh folders, folder memberships, friends, cached recipes
│   │   ├── useContrastSetting.js   # High-contrast mode toggle (saved to the profile) shared by Accessibility + Settings → Display
│   │   ├── usePullToRefresh.js     # usePullToRefresh(refresh) → <RefreshControl>; also re-pings the server
│   │   └── api/                    # Per-table database functions screens import
│   │       ├── auth.js             # signUp, signIn, signOut, deleteAccount
│   │       ├── recipes.js          # recipes CRUD, favorites, duplicate, Trash (trash/restore/delete forever/empty)
│   │       ├── folders.js          # folders CRUD + recipe-folder mapping
│   │       ├── friends.js          # friendships CRUD + block/revoke shared access
│   │       ├── profile.js          # profile read/update
│   │       ├── allergies.js        # per-user and per-friend allergy CRUD
│   │       └── feedback.js         # submitFeedback (submit-only)
│   └── app/                        # On-device only: never makes a server call
│       ├── storage.js              # AsyncStorage helpers (loadJson, saveJson) + KEYS registry
│       ├── cache.js                # Stale-while-revalidate cache: useCachedResource() + mutateCachedResource() + invalidate()
│       ├── cachePreference.js      # Settings "Keep copies on this device": the on/off switch + gated loadCached/saveCached
│       ├── recipeCache.js          # Full-recipe cache for the 5 most recently opened recipes (offline/instant RecipeCard)
│       ├── dialog.js               # appAlert(title, message, buttons) — Alert.alert replacement; dialog queue + host stack
│       ├── unsavedChanges.js       # useUnsavedChangesGuard() (leave-screen prompt) + confirmDiscard() (modals)
│       ├── theme-context.js        # ThemeProvider/useTheme: System/Light/Dark preference, applyColorScheme()
│       ├── useHideUnsafe.js        # Settings "hide recipes with dietary conflicts": useHideUnsafe(), applyDietaryVisibility()
│       ├── sort.js                 # Shared sort options + sortRecipes/sortFolders + normalizeSort
│       ├── scaleIngredient.js      # Ingredient amount multiplier: scaleIngredient(), formatAmount(), MULTIPLIERS
│       ├── recipeItems.js          # { text, isHeader } ingredient/step items: toItem, normalizeItems, itemTexts, normalizeRecipe
│       ├── recipeTimes.js          # parseDuration (ISO 8601 → minutes), formatMinutes, resolveTotalMinutes
│       └── safeUrl.js              # isSafeWebUrl(): only http(s) links may be opened from recipe data
│
├── screens/                        # Stack screens — one file per route
│   │
│   │  ── AuthStack (no session) ──
│   ├── Landing.js                  # Marketing / entry point
│   ├── Login.js                    # Email + password sign-in
│   ├── SignUp.js                   # Email + password + name sign-up; links to Privacy Policy and Terms of Service
│   ├── PrivacyPolicy.js            # Static text screen
│   │
│   │  ── AppStack (session present) ──
│   ├── Home.js                     # Grid of the user's recipes
│   ├── RecipeCard.js               # Read-only recipe view + ★ favorite, ⋯ menu (copy/trash), times, multiplier, sections
│   ├── EditRecipe.js               # Recipe editor (name, servings, times, sections, drag-to-reorder, ⋯ copy/trash)
│   ├── InputSelector.js            # "How do you want to add this recipe?" picker
│   ├── Folders.js                  # Grid of folders + create-folder modal; long-press to bulk-delete
│   ├── FolderDetail.js             # Recipes inside a folder, or the built-in Favorites / Trash folders
│   ├── Friends.js                  # Friends list — search bar, "Me" row, allergy-overview entry point
│   ├── FriendProfile.js            # Friend name + notes (editable); allergies edited via EditAllergies
│   ├── Profile.js                  # Edit your own profile; allergies edited via EditAllergies
│   ├── EditAllergies.js            # Shared allergy editor for Profile & FriendProfile (see Feature notes)
│   ├── AllergyOverview.js          # Read-only summary of allergies for a chosen set of people
│   ├── SharingWith.js              # Who has linked to you — remove or block their access
│   ├── BlockedUsers.js             # Submenu of SharingWith — people you've blocked, with Unblock
│   ├── Settings.js                 # Appearance (System/Light/Dark), hide-unsafe toggle, sign out, delete account, links
│   ├── TermsOfService.js           # Static text screen, same shape as PrivacyPolicy.js
│   ├── Feedback.js                 # Submit-only feedback form (no replies, no questions)
│   └── Accessibility.js            # High-contrast mode toggle tied to profile settings
│
├── components/                     # Shared UI + utilities (NOT screens)
│   ├── NavigationBar.js            # Bottom tab bar with active-tab highlight
│   ├── StatusBarBackdrop.js        # Fixed strip behind the status bar (safe-area top inset); hidden on Landing
│   ├── OfflineBanner.js            # Floating "You're offline" strip (App.js + AppModal); nothing while online
│   ├── AllergyChecklist.js         # Group/individual/custom allergen picker — instant add/remove, used by EditAllergies
│   ├── AllergyFilterControl.js     # Shared "which profiles' allergies matter" trigger+popup (Home, FolderDetail)
│   ├── ConfirmModal.js             # Declarative confirm dialog (discard prompts) — built on DialogCard
│   ├── DialogCard.js               # The one dialog look: title, message, button row (all alerts + ConfirmModal)
│   ├── DialogHost.js               # Draws the current appAlert() dialog (root + inside each AppModal)
│   ├── AppModal.js                 # Drop-in for RN Modal; mounts a DialogHost so dialogs show over it
│   ├── ActionMenu.js               # ⋯ pop-down action menu (RecipeCard, EditHeader)
│   ├── EditHeader.js               # EditHeader (back | Save ⋯) — the standard edit-screen header
│   ├── SectionHeading.js           # Section heading with an optional right-aligned action ("Edit")
│   ├── FolderPickerModal.js        # One recipe's folder memberships: checkbox per folder + "New folder"
│   ├── RemoveBadge.js              # Red minus on an input's top-right corner (EditRecipe rows' remove control)
│   ├── ReorderableList.js          # Drag-and-drop list (EditRecipe ingredients / steps)
│   ├── SortMenu.js                 # Pop-down sort menu shared by Home / Folders / FolderDetail
│   ├── LandingCard.js              # Decorative oval-with-cusps SVG shape behind the Landing title
│   ├── LandingCard2.js             # Alternate shape: smooth oval with 4 small outward points
│   ├── icons/                      # Central icon registry — one file controls every icon
│   │   ├── index.js                # Barrel: re-exports SVGs + wraps every vector-icon glyph
│   │   ├── PlusIcon.js             # Custom SVG (Heroicons-style outline)
│   │   ├── SearchIcon.js           # Custom SVG
│   │   ├── SortIcon.js             # Custom SVG
│   │   ├── FilterIcon.js           # Custom SVG
│   │   ├── EditIcon.js             # Custom SVG (InputSelector's edit-manually option)
│   │   └── StarIcon.js             # Custom SVG (Heroicons star; filled = favorite)
│   └── samples/
│       └── sample_recipes.js       # Reference sample data (preserved by request)
│
├── styles/
│   ├── theme.js                    # Color palette + light/dark semantic tokens; live `colors` + setColorTokens()
│   └── main_style.js               # Single shared StyleSheet for the whole app
│
├── constants/
│   └── allergens.js                # Static catalog: ALLERGEN_PRESETS (268) + ALLERGEN_GROUPS (35)
│
├── assets/                         # Icons, splash, images
│   └── images/
│
├── scripts/
│   └── reset-project.js            # Expo template helper (unused day-to-day)
│
├── tests/                          # Jest suite — see docs/TESTING.md
│   ├── setup.js                    # native-module mocks, public env vars
│   ├── helpers/                    # fakeSupabase.js (query recorder), repoFiles.js
│   ├── unit/                       # app logic + shared components
│   └── security/                   # secrets, session, sign-out wipe, unsafe links, input limits, hygiene
├── scripts/
│   ├── verify.js                   # npm run verify: lint + tests + audit + bundle
│   └── audit.js                    # dependency gate (npm audit + security/audit-allowlist.json)
├── security/
│   └── audit-allowlist.json        # accepted npm advisories, each with its reason
├── jest.config.js                  # unit + security Jest projects (jest-expo preset)
│
├── supabase/                       # Migration SQL to run in the Supabase SQL editor
│   ├── recipes_add_servings.sql    # recipes.servings integer (nullable = not filled in, > 0)
│   └── recipes_favorites_trash_times_sections.sql  # is_favorite, deleted_at, prep/cook/total minutes, is_header
│
└── docs/
    └── ARCHITECTURE.md             # This file
```

---

## Dependencies

Everything in `package.json`, grouped by purpose, with what it's used for
and whether it's actually used by application code today. "Template
leftover" means the package was added by `npx create-expo-app` and could
be safely removed if/when you confirm nothing pulls it in.

### Runtime — directly imported

| Package | Why we use it |
|---|---|
| `expo` | Bootstraps the app (`registerRootComponent` in [index.js](index.js)) and provides the SDK. |
| `react` | UI library. |
| `react-native` | Native primitives (View, Text, ScrollView, etc.). |
| `@react-navigation/native` | Navigator root + hooks (`useFocusEffect`, etc.) in [App.js](App.js) and screens. |
| `@react-navigation/native-stack` | Auth stack and app stack in [App.js](App.js) (`createNativeStackNavigator`) — native platform transitions and swipe-back via `react-native-screens`. Replaced `@react-navigation/stack`, whose JS card animations call React Native's deprecated `InteractionManager` on every transition ("InteractionManager has been deprecated" warning; still present in its latest 7.x). Supports everything the app uses: `headerShown: false`, `animation: 'none'` (tab screens), `gestureEnabled: false` (EditRecipe and the four nav-bar screens — `TAB_SCREEN_OPTIONS`), and `usePreventRemove` (it blocks the iOS swipe natively via `preventNativeDismiss`). |
| `@supabase/supabase-js` | The Postgres + Auth client — initialized once in [lib/server/supabase.js](lib/server/supabase.js). |
| `@react-native-async-storage/async-storage` | Storage for the non-sensitive per-user filter/sort persistence in [lib/app/storage.js](lib/app/storage.js) (recipe caches, sort order, allergy-filter selections) — not the auth session, see `expo-secure-store` below. |
| `expo-secure-store` | Backs [lib/server/secureStoreAdapter.js](lib/server/secureStoreAdapter.js), the Supabase auth session storage adapter — puts the access/refresh token in the OS Keychain (iOS) / encrypted storage (Android) instead of plain AsyncStorage. Values are chunked across multiple SecureStore items since a single item is capped around 2048 bytes and a full session (tokens + user metadata) can exceed that. |
| `react-native-url-polyfill` | Side-effect import in [lib/server/supabase.js](lib/server/supabase.js) — Supabase needs URL globals that RN doesn't ship. |
| `react-native-svg` | Used by `components/LandingCard*.js` for the decorative title shapes and by `components/icons/*.js` for the custom Heroicons-style glyphs (Plus / Search / Sort). |
| `@expo/vector-icons` | Provides the `Ionicons` and `FontAwesome` font sets, imported as `@expo/vector-icons/Ionicons` and `/FontAwesome`. Direct imports are confined to [components/icons/index.js](components/icons/index.js); every screen consumes semantic wrappers (e.g. `<TrashIcon>`, `<BackIcon>`) from the registry instead. (The registry used to import `react-native-vector-icons`, but Expo's Metro config and `jest-expo` both silently redirect that name to `@expo/vector-icons`, so that package was never actually loaded. It was removed 2026-11-07.) |
| `expo-clipboard` | `setStringAsync` — long-press-to-copy on the friend code in `Profile.js`. |
| `expo-haptics` | `selectionAsync()` ticks when a row is picked up / moves in [components/ReorderableList.js](components/ReorderableList.js). |
| `expo-status-bar` | `<StatusBar>` in [App.js](App.js), styled light/dark to match the theme. |

### Runtime — peer / framework requirements (not directly imported)

| Package | Why it's installed |
|---|---|
| `react-native-screens` | Peer of `@react-navigation/native-stack` (native screen primitives and swipe-back). |
| `react-native-safe-area-context` | Peer of `@react-navigation/native-stack`; also used directly by `App.js` and `StatusBarBackdrop`. |
| `expo-font` | Peer of `@expo/vector-icons` (loads the icon fonts). Listed in `app.json` plugins (re-added by the SDK 58 upgrade). |
| `expo-asset` | Required by `expo-font` 58. Installed directly because npm otherwise nests it inside `expo/`, where `expo-font` can't resolve it (Jest failed with "Cannot find module 'expo-asset'"). Also in `app.json` plugins. |
| `expo-splash-screen` | Splash image, configured as a plugin in `app.json`. |
| `expo-system-ui` | Needed for `userInterfaceStyle: "automatic"` on Android, and sets the root background color. |

### Removed template leftovers (2026-11-07)

These came from `npx create-expo-app` or earlier versions of the app, and
nothing imported them. They were uninstalled, and their `app.json` plugins
dropped (`expo-sqlite`, `expo-web-browser`, `expo-image`, plus the no-op
`expo-font` entry, which the SDK 58 upgrade later added back). If you need one again, add it with `npx expo install`.

| Package | Why it was unused |
|---|---|
| `expo-sqlite` | Local storage from before the move to Supabase. |
| `expo-image` | The app uses `ImageBackground` from `react-native`. |
| `expo-linking`, `expo-constants` | No deep links. `expo` still bundles `expo-constants` itself. |
| `expo-symbols` | No SF Symbols. |
| `expo-web-browser` | No in-app browser. |
| `@react-navigation/bottom-tabs` | The app uses its own `NavigationBar`. |
| `@react-navigation/elements` | Not imported; `native-stack` still installs it as its own dependency. |
| `react-native-gesture-handler` | Only `@react-navigation/stack` needed it, and that was replaced by the native stack. |
| `react-native-reanimated`, `react-native-worklets` | Not used by any code or by the native stack. |
| `react-dom`, `react-native-web` | Web build only. The app targets iOS (and the auth session needs SecureStore, which has no web version), so the `web` script was removed too. |
| `react-native-vector-icons` | Never loaded (see `@expo/vector-icons` above). |
| `typescript`, `@types/react` | No TypeScript files or `tsconfig.json` remain. |

### Dev tooling

| Package | Why we use it |
|---|---|
| `@expo/ngrok` | Required for `npx expo start --tunnel` (used during sharing dev builds). |
| `eslint` + `eslint-config-expo` | Linting. Run via `npm run lint`. |
| `jest` + `jest-expo` | Test runner with Expo's React Native preset (`npm test`, `npm run verify`). See [docs/TESTING.md](TESTING.md). |
| `@testing-library/react-native` | Component tests (DialogHost, ReorderableList, EditHeader). v14: `render` / `fireEvent` are async. |

### Upgrade discipline

- Always install or update packages via `npx expo install <pkg>` — never `npm install <pkg>` for anything Expo-aware. Expo picks the SDK-compatible version, which avoids subtle runtime issues from version drift.
- `npx expo install --check` periodically; `npx expo install --fix` to bring everything to expected versions when the SDK gets a patch bump.
- Never bundle the Supabase **service-role key**. Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the anon key) go in the client. The service-role key in `.env.local` is for tooling/scripts only, never imported into app code.

---

## Layer responsibilities

### `lib/server/supabase.js` — the client

One file, one `createClient()` call, configured for React Native:

- Uses [lib/server/secureStoreAdapter.js](lib/server/secureStoreAdapter.js) (backed by `expo-secure-store`, not `AsyncStorage`) to persist the session across app restarts, so the access/refresh token sit in the OS Keychain/encrypted storage rather than a plain on-disk file.
- Imports `react-native-url-polyfill/auto` (required for Supabase in RN).
- Reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  from `.env.local`.

Nothing else in the app should import `@supabase/supabase-js` — they import
from `lib/server/api/*` instead.

### `lib/server/auth-context.js` — session state

Wraps the whole app in `<AuthProvider>`. Exposes `useAuth()` returning
`{ session, user, loading }`. Subscribes to `supabase.auth.onAuthStateChange`
so when the user signs in, signs out, refreshes, or has their account deleted,
the entire app re-renders against the new session state. That re-render is
what flips the navigator between `AuthStack` and `AppStack` automatically —
there is no manual `navigation.navigate('Home')` after sign-in.

### `lib/server/api/*` — per-domain data functions

Each file is a flat set of async functions. They:

- Call `supabase.from(...)` / `supabase.auth.*` / `supabase.rpc(...)`.
- Throw on errors so screens can catch with try/catch.
- Reshape rows into camelCase JS objects the UI wants (e.g. `ext_link` →
  `extLink`, joined `recipe_ingredients` collapsed to `ingredients` — `{ text,
  isHeader }` items on a full recipe, plain strings without headers on list
  summaries; see "Section headers" below).
- Look up the current user via `supabase.auth.getUser()` and tag inserts with
  `user_id` automatically — screens never deal with user IDs.
- **Bust the cache after mutations.** Every write (`createFolder`,
  `updateRecipe`, `deleteFriend`, …) calls a small `bust*Caches()` helper after
  the DB succeeds, which calls `invalidate(resource, userId)` from
  [lib/app/cache.js](lib/app/cache.js). This forces any mounted `useCachedResource`
  hooks for that resource to refetch and drops the stale on-disk snapshot. The
  profile flow also uses `mutateCachedResource('profile', userId, nextValue)`
  so the Accessibility toggle updates instantly before the Supabase write
  completes. The resource keys in use today are `'recipes'`, `'folders'`,
  `'friends'`, and `'profile'`.
- **One exception to "call `lib/server/api/*` directly per action":**
  [lib/server/api/allergies.js](lib/server/api/allergies.js)'s `syncAllergies({ original,
  updated, friendId })`. The EditAllergies screen (see Feature notes) edits
  a local, unsaved copy of the allergy list; `syncAllergies` diffs that
  local copy against what was originally loaded and, when the user hits
  Save, issues at most 3 requests total — one bulk `.delete().in(...)`, one
  bulk `.insert([...])`, one bulk `.upsert([...])` — regardless of how many
  rows changed. (It used to call `addAllergy`/`deleteAllergy`/
  `updateAllergySeverity` once per changed row; on a large edit — e.g.
  checking dozens of presets in `AllergyChecklist` at once — that meant
  dozens of concurrent requests, plus a redundant `requireUser()` auth
  round trip on every single add, so it was rewritten to batch.) The
  per-row functions `addAllergy`/`deleteAllergy`/`updateAllergySeverity`
  are still exported as the single-item API but are no longer used inside
  this file. Local-only rows (not yet persisted) carry an id prefixed with
  `LOCAL_ID_PREFIX`, generated by `makeLocalAllergyId()`, so the diff can
  tell "new" from "existing" without a round trip. The bulk upsert sends
  full rows, not just `{id, severity}` — Postgres validates NOT NULL
  columns against the row an upsert *would* insert before it discovers the
  conflict and takes the update path, so a partial-column payload can fail
  that check even though the row already exists.

When you need a new piece of data, add a function to the appropriate file (or
a new file under `lib/server/api/`). Don't query Supabase from a screen.

### `screens/*` — the UI

Each screen is a default-exported React component that:

- Reads params via `route.params` (e.g. `recipeId`, `folderId`, `friendshipId`).
- Reads list data through the `useCachedResource()` hook from
  [lib/app/cache.js](lib/app/cache.js) where a cached, focus-refreshed snapshot is
  wanted (Home → recipes, Folders → folders, Friends → friends + profile name).
  The hook owns the fetch/refresh/invalidation lifecycle, so these screens no
  longer keep their own `useState` list + manual `load()` in `useFocusEffect`.
- Still calls `lib/server/api/*` directly inside `useFocusEffect`/`useEffect` for data
  that isn't cache-backed (e.g. Home's opened-map and active-allergy details).
- The Accessibility screen also uses the profile cache, but writes the
  `contrast` field optimistically so the switch responds immediately before the
  Supabase update finishes.
- Renders styles from `styles/main_style.js`.
- Calls `navigation.navigate(...)` for transitions.
- Uses `appAlert()` ([lib/app/dialog.js](lib/app/dialog.js)) for errors and confirms —
  never the native `Alert` (see "Dialogs"). Failed **saves** go through
  `alertSaveFailed()` from [lib/server/connectivity.js](lib/server/connectivity.js) instead
  (see "Offline banner & failed saves").

Screens never import `supabase`.

### `components/NavigationBar.js`

Bottom tab bar used by the four "tab-like" screens (Home, Folders, Friends,
Settings). Uses `useNavigationState` to figure out the active route and
highlights it. The Add (+) button is the one tab that isn't a screen of its
own: its `route` is `InputSelector`, the start of the add-recipe flow. No
recipe row exists until Save in EditRecipe. Home passes `onHomePress` to clear
its search when Home is tapped again.

It reports its measured height to [components/OfflineBanner.js](components/OfflineBanner.js)
(`reportNavBarHeight`) and exports `TAB_ROUTES`, so App.js can float the
offline banner right on top of the bar on these screens.

### `components/SortMenu.js`

Pop-down menu shared by Home, Folders, and FolderDetail. Renders a radio
list of options followed by an asc/desc direction toggle separated by a
divider. The visuals are positioned (not centered) by the
`sort_popdown` style block in `main_style.js`.

Props (small, intentionally generic):

| prop | type | meaning |
|---|---|---|
| `visible` | `boolean` | whether the menu is shown |
| `onClose` | `() => void` | called on backdrop tap |
| `options` | `[{ id, label }]` | the sort keys to render — pass `RECIPE_SORT_OPTIONS` or `FOLDER_SORT_OPTIONS` from [lib/app/sort.js](../lib/app/sort.js), or a custom list |
| `sort` | `{ by, dir }` | current selection |
| `onChange` | `(next) => void` | called when the user picks a row or flips the direction |
| `popdownStyle` | object | optional style override (FolderDetail uses this to anchor the popdown to its own action button) |

The menu is purely presentational — it does not know about
AsyncStorage, screen-specific keys, or the data being sorted. Each
parent screen owns the `useState` for `sort`, the persistence in
AsyncStorage, and the call to `sortRecipes` / `sortFolders` on the
list.

### `components/icons/*` — central icon registry

Every icon used in the app is exported from
[components/icons/index.js](../components/icons/index.js). Screens import
**named semantic components** (`<BackIcon>`, `<TrashIcon>`, `<CheckboxIcon checked />`, etc.)
from `'../components/icons'`. No screen or shared component imports
`@expo/vector-icons` directly — the only file that does
is `index.js` itself. To swap a glyph globally (change vendor, switch
from outline to filled, replace a vendor icon with a custom SVG), edit
the registry in one place and every consumer picks it up.

The registry has three kinds of icons:

1. **Custom SVG icons** — `PlusIcon`, `SearchIcon`, `SortIcon`,
   `FilterIcon`, `EditIcon`. One file each in this directory, rendered via
   `react-native-svg`. Each accepts `size`, `color`, and `strokeWidth`
   props. `index.js` re-exports them so the same import path works for
   custom and vendor-backed icons alike.

2. **Static vendor wrappers** — thin components that pin a semantic name
   to one vendor icon string. Each takes optional `size`/`color`/`style`
   props with sensible defaults; passing `style` always wins (react-
   native-vector-icons honors `style.fontSize` and `style.color`).
   Today: `BackIcon`, `ExternalLinkIcon`, `TrashIcon`, `EllipsisIcon`,
   `CheckIcon`, `RemoveCircleIcon`, `ShareIcon`, `LinkIcon`,
   `LinkOutlineIcon`, `ImageIcon`, `KeyIcon`, `PersonAddIcon`,
   `AllergyListIcon`, `SharingWithIcon`, `FolderIcon`.

3. **Stateful wrappers** — take a state prop and pick the right glyph +
   default color internally so callers don't have to keep two icon names
   in sync. `CheckboxIcon` (`checked`), `SelectCircleIcon`
   (`selected`), `RadioIcon` (`selected`), `SortArrowIcon`
   (`direction: 'asc' | 'desc'`).

The bottom-tab bar has its own component:
**`TabIcon`** takes a `name` prop matching the route name
(`Home` / `Folders` / `Add` / `Friends` / `Settings`) and maps internally
to the right FontAwesome glyph via a `TAB_GLYPHS` table at the bottom of
the registry. `NavigationBar`'s `TABS` array therefore doesn't carry
icon strings — just the route name and label.

**Adding an icon.** Pick a semantic name, decide whether it's static or
stateful, and add the wrapper to `index.js`. If you want a custom SVG,
add a new file under `components/icons/` and re-export it from
`index.js`. Then `import { YourIcon } from '../components/icons'` from
wherever you need it.

### `components/LandingCard.js` and `LandingCard2.js`

Decorative SVG shape backings for the Landing-screen title. Both auto-size
to their text children, render the shape via `react-native-svg`, and
accept `width`/`height`/`fill`/`stroke` props. `LandingCard` is the ogee
variant (dramatic concave dips approaching the top/bottom peaks).
`LandingCard2` is the smoother alternative (oval with four small outward
points and convex curves throughout). Swap one for the other by changing a
single import in [screens/Landing.js](screens/Landing.js).

### `lib/app/storage.js`

AsyncStorage helpers. `loadJson`, `saveJson`, `removeKey` are generic
wrappers. `KEYS` is the registry of per-user storage keys — all currently
namespaced by `userId` so users sharing a device don't see each other's
state:

- `KEYS.homeAllergyFilter(userId)` — selected profiles for the shared
  `AllergyFilterControl` popup (Home and FolderDetail both read/write
  this same key, so the selection stays in sync between them; RecipeCard
  reads it directly too, read-only). See "Allergy filter + severity-aware
  warnings" below.
- `KEYS.allergyOverviewFilter(userId)` — a **separate** selection for the
  standalone AllergyOverview screen. Not synced with
  `homeAllergyFilter` — see "Allergy Overview screen" below for how the
  two relate.
- `KEYS.homeSort(userId)` — last-chosen sort selection for Home, stored as
  a `{ by, dir }` object (e.g. `{ by: 'opened_at', dir: 'desc' }`). Legacy
  installs that saved a bare string (`"created_at"`) are migrated lazily
  by `normalizeSort()` in [lib/app/sort.js](../lib/app/sort.js).
- `KEYS.foldersSort(userId)` — same shape, for the **Folders** grid.
- `KEYS.folderRecipesSort(userId)` — same shape, applied to recipes
  rendered **inside** any folder on FolderDetail.
- `KEYS.recipeOpenedAt(userId)` — map of `{ recipeId: ISO timestamp }`
  for the "Recently opened" sort. Also decides which recipes
  [lib/app/recipeCache.js](lib/app/recipeCache.js) keeps.

Plus two domain helpers built on the generic ones:

- `recordRecipeOpened(userId, recipeId)` — write the current timestamp
  into the recipe-opens map. Called from RecipeCard on focus.
- `forgetRecipesOpened(userId, recipeIds)` — remove deleted recipes from
  the map, so they stop holding "recently opened" cache slots.
- `getRecipeOpenedMap(userId)` — read the full map. Called from Home on
  focus.

### `lib/app/sort.js` — shared sort logic

Pure-JS module that owns everything about how lists are sorted on Home,
Folders, and FolderDetail. Screens import options + a `sortRecipes` /
`sortFolders` helper from here; no sort math lives in the screens
themselves.

Exports:

- **`RECIPE_SORT_OPTIONS`** — `[{ id, label }, ...]` consumed by
  `SortMenu`. Today: *Date added* (`created_at`), *Last edited*
  (`updated_at`), *Recently opened* (`opened_at`), *Alphabetical*
  (`name`).
- **`FOLDER_SORT_OPTIONS`** — *Alphabetical* (`name`), *Date added*
  (`created_at`).
- **`DEFAULT_RECIPE_SORT`** / **`DEFAULT_FOLDER_SORT`** — the
  `{ by: 'created_at', dir: 'desc' }` defaults a screen uses when nothing
  has been persisted yet.
- **`normalizeSort(saved, fallback)`** — back-compat shim that accepts
  whatever shape was previously written into `AsyncStorage`:
  - a `{ by, dir }` object → returned as-is (clamping `dir` to `'asc'` or
    `'desc'`);
  - a bare string like `"created_at"` (the pre-direction-toggle format)
    → upgraded to `{ by: <string>, dir: 'desc' }`;
  - anything else → `fallback`.
- **`sortRecipes(recipes, { by, dir }, openedMap = {})`** — returns a
  new sorted array. Uses `openedMap` (the per-user recipe-opens map from
  storage.js) for the `opened_at` key. Recipes missing the active key
  sort to the bottom regardless of direction. `name` uses locale-aware
  comparison so accented characters order correctly; everything else
  sorts lexicographically on ISO timestamps.
- **`sortFolders(folders, { by, dir })`** — same contract for folders.

Adding a new sort option is one entry in `RECIPE_SORT_OPTIONS` or
`FOLDER_SORT_OPTIONS` plus a branch in the matching `recipeKey` /
`folderKey` helper inside this file. Screens pick it up automatically.

### `lib/app/cache.js` — stale-while-revalidate cache

A small client-side cache that lets list screens paint instantly from the last
known data while a fresh fetch runs in the background. Built on `lib/app/storage.js`
(AsyncStorage) for the persisted snapshot plus an in-memory pub/sub registry for
live invalidation. Two exports:

- **`mutateCachedResource(resource, userId, nextData)`** — optimistic cache
  helper used by the Accessibility toggle. Persists the new snapshot, notifies
  mounted hooks with the fresh value immediately, and returns the value so the
  caller can continue with the DB write.

- **`useCachedResource({ resource, userId, fetcher, enabled })`** — the hook
  screens use. On mount it hydrates `data` from the on-disk snapshot
  (`cache:<resource>:<userId>`) so the UI paints with no spinner, then:
  - refetches quietly via `fetcher()` on every screen focus (`useFocusEffect`),
  - subscribes to `invalidate(resource)` events and refetches when one fires,
  - writes each successful result back to disk.

  Returns `{ data, loading, error, refresh }`. It's inert until both `userId` is
  present and `enabled !== false`. The `fetcher` is held in a ref, so it can be
  an inline async closure (e.g. Friends fetches friends + profile in one
  `Promise.all`) without re-subscribing on every render.

- **`invalidate(resource, userId)`** — called by the `lib/server/api/*` write helpers
  after a mutation. Removes the on-disk snapshot (so a cold start doesn't flash
  deleted data) and notifies every mounted hook for that resource to refetch.

Cache keys are namespaced per user (`cache:<resource>:<userId ?? 'anon'>`),
matching the per-user discipline of the `KEYS` registry. This is why mutations
must call `invalidate()` — without it a screen would keep showing its cached
list until the next focus refetch.

**Quiet updates.** The hook remembers the JSON of what it's showing; a
refetch that returns identical data doesn't re-render or rewrite the
snapshot, so background refreshes are invisible unless something changed. A
`fetchedRef` stops a slow disk read from overwriting a fresher server result.

Two non-hook helpers:

- **`readCachedResource(resource, userId)`** — one-off read of a snapshot,
  for screens that paint first from data another screen cached.
- **`updateCachedResource(resource, userId, updater)`** — read-modify-write
  of a snapshot no hook subscribes to (used for `friendNames`).
- **`prefetchResource(resource, userId, fetcher)`** — fetch in the
  background; only if the data changed, save it and push it to mounted
  hooks. Throws on failure (callers stay quiet).

**Launch warm-up** — [lib/server/useCacheWarmup.js](lib/server/useCacheWarmup.js) runs
once per signed-in session from `AppStack` in [App.js](App.js). It
prefetches `folders`, `folderMembers`, and `friends` (Home already fetches
`recipes` and `profile` itself) and calls `refreshAllCachedRecipes()` so the
recently opened recipes are current before the user goes offline. Failures
are silent; every screen still refetches when opened.

**Cache-first screens without their own resource:**

| Screen | First paint from | Then |
|---|---|---|
| FolderDetail | cached `recipes` list filtered by cached `folderMembers` (`{ folderId: [recipeId] }`, ids only, from `getFolderMemberships()`) | `getFolder` + `getRecipesInFolder`; state only replaced if different |
| Profile | cached `profile` | `getMyProfile` + `getMyAllergies` |
| RecipeCard | `lib/app/recipeCache.js` (5 most recent) | `getRecipe`; only re-renders if different |

Profile shows the cached copy **read-only**: the Edit button is disabled
until server data arrives, so edits never start from (or save over) a stale
copy. Its dietary needs aren't cached, so that section stays blank (not
"None") until loaded, and the section's "Edit" link only appears once it is. A
failed background load is silent when a cached copy is showing.

**FriendProfile caches only who the friend is.** The `friendNames` snapshot
holds `{ [friendshipId]: { id, name } }` (display name: the linked user's own
name, else your name for them) — enough to open the right friend and show
their name instantly. Notes, your dietary-need notes for them, and their own
shared dietary needs are **never cached**; they always come from the server.

- On open, `getCachedFriendIdentity()` ([lib/server/api/friends.js](lib/server/api/friends.js))
  supplies the name — from `friendNames`, or, for a friend not opened before,
  from the cached friends list — and the screen shows it with "Loading
  details…" while `getFriend` + the allergy lists load. Every open and focus
  quietly re-fetches and refreshes the cached name (`cacheFriendIdentity`).
- If the server can't be reached and a name is showing, the screen says
  details need a connection (no alert); with nothing cached it alerts. Edit
  is enabled only once the server data is in.
- Removed on `deleteFriend` or "Friend not found"; cleared on sign-out.
- Earlier builds cached whole profiles under `friendProfiles`;
  `purgeLegacyFriendProfiles()` deletes that at every launch
  (`useCacheWarmup`, even with caching off), and it stays in
  `CACHED_RESOURCES` so sign-out removes it too.

EditRecipe deliberately loads from the server only — editing a
cached copy could save over newer changes.

`folderMembers` is invalidated by every folder/mapping mutation in
[lib/server/api/folders.js](lib/server/api/folders.js) (via `bustFolderCaches`).

**Keeping the recipe list light.** The `recipes` resource (Home) is
`getRecipes()`, which selects only `id`, `name`, `photo`, `is_favorite`,
dates, and ingredient text (`RECIPE_SUMMARY_SELECT` / `shapeRecipeSummary`,
shared with folders, Favorites, and Trash) — what tiles, search, sort, the ★
badge, and allergy dots need. Steps, notes, links, servings, and times are
never in the list (or its on-disk snapshot), so it doesn't grow with long
recipes. Ingredients stay because Home's allergy dots are computed from them
on-device; section headers are left out of that text. Recipes in Trash are
excluded.

### Turning caching off

Settings → Data → **Keep copies on this device** (default on; stored per
device as `app.cachingEnabled`, kept across sign-out).
[lib/app/cachePreference.js](lib/app/cachePreference.js) is the single switch:

- `loadCached` / `saveCached` replace `loadJson` / `saveJson` for every
  cache key in `lib/app/cache.js` and `lib/app/recipeCache.js`. With caching off,
  reads return the fallback and writes are skipped (checked at write time,
  so a fetch finishing after the switch flips writes nothing). Hooks still
  fetch and share data in memory, so screens work normally — they just
  always load from the server.
- `applyCachingPreference(enabled, userId)` in `lib/app/cache.js` sets the flag
  and, when turning it off, calls `clearUserCache(userId)` immediately.
- `useCacheWarmup` does nothing while it's off.
- Reads wait for the saved setting to load at startup, so a cache-off device
  never paints stale copies first.
- Not affected: preferences (sort/filter, theme, hide-conflicts) and the
  recently-opened timestamps — they're settings, not copies of your data.
- With it off: RecipeCard, Profile, folders, etc. show "Loading…" until the
  server answers, FriendProfile has nothing to fall back to after 2 s, and
  recipes can't be opened offline.

### `lib/app/recipeCache.js` — recently opened recipes

Full recipes are cached only for the **5 most recently opened**
(`RECENT_RECIPE_LIMIT`), ranked by the `KEYS.recipeOpenedAt` map. Each is its
own AsyncStorage entry (`cache:recipe:<userId>:<recipeId>`), plus an index
(`cache:recipeIndex:<userId>`) listing the stored ids so eviction and
sign-out don't have to scan all keys. Index updates run one at a time.

- **RecipeCard** paints `getCachedRecipe()` immediately, records the open,
  then fetches with `getRecipe()`. On success it shows and stores the fresh
  copy via `cacheRecentRecipe()`, which evicts anything that has dropped out
  of the 5 most recent. If the fetch fails (e.g. offline) and a cached copy
  is showing, no error is shown.
- **Edits** — `updateRecipe()` calls `refreshCachedRecipe()`, which
  overwrites the cached copy only if that recipe is already cached (editing
  doesn't count as opening).
- **Trash / delete forever** — `trashRecipes()`, `deleteRecipesForever()`
  and `emptyTrash()` call `removeCachedRecipes()`, which also removes the
  ids from the opens map. Favoriting refreshes cached copies.
- **Older cached copies** (from before section headers/times) hold plain
  string ingredients/steps; RecipeCard passes them through
  `normalizeRecipe()` ([lib/app/recipeItems.js](lib/app/recipeItems.js)) first.
- **Sign-out / account deletion** — `clearUserCache()` calls
  `clearCachedRecipes()`.

The cache is per device, like the opens map. Edits made on another device
show up on the next successful fetch.

### Pull to refresh

Cached data is only what paints first: every screen still calls the server
when it opens/regains focus, and [lib/server/usePullToRefresh.js](lib/server/usePullToRefresh.js)
adds a manual pull-down refetch on top. `usePullToRefresh(refresh)` returns a
`<RefreshControl>` for a FlatList/ScrollView's `refreshControl` prop; the
spinner runs until `refresh()` settles, and `checkConnection()` runs
alongside so the offline banner updates on the same pull. Failures leave the
current data on screen.

| Screen | Refetches |
|---|---|
| Home | recipe list (`refresh` from `useCachedResource`), opened map, allergy dots |
| Folders | folder list |
| FolderDetail | folder + its recipes, opened map, allergy dots |
| Friends | friends list + profile name |
| RecipeCard | the recipe (and its cached copy) |

---

## Navigation flow

```
                  AuthProvider (session, loading)
                            │
                            ▼
        ┌─────────────── RootNavigator ───────────────┐
        │                                             │
   loading?                                       has session?
        │                                             │
        ▼                                             ▼
 <ActivityIndicator/>                ┌──────────────────────────────┐
                                     │                              │
                                     │           false              │           true
                                     │             ▼                │             ▼
                                     │      AuthStack                │      AppStack
                                     │   ┌───────────────┐           │   ┌──────────────────┐
                                     │   │ Landing       │           │   │ Home  ⇄  RecipeCard
                                     │   │  ↳ Login      │           │   │   │         │
                                     │   │  ↳ SignUp     │           │   │   │         ▼
                                     │   │  ↳ PrivacyPol │           │   │   │     EditRecipe
                                     │   └───────────────┘           │   │   ▼
                                     │                              │   │ Folders → FolderDetail
                                     │                              │   │ Friends → FriendProfile
                                     │                              │   │ Settings
                                     │                              │   └──────────────────┘
                                     └──────────────────────────────┘
```

Sign-in / sign-up succeeds → `onAuthStateChange` fires → `AuthProvider`
state updates → React swaps `AuthStack` for `AppStack`. No manual navigation.

Sign-out / delete-account works the same way in reverse.

---

## Supabase schema (current)

```
auth.users (managed by Supabase Auth)
   │ 1:1
   ▼
profiles (id FK → auth.users, name, email, notes, phone, friend_code unique,
          contrast boolean default false)
   │ 1:N
   ├──▶ recipes (id, user_id, name, photo, source, ext_link,
   │     │              servings integer null check (> 0),
   │     │              prep_minutes / cook_minutes / total_minutes integer null (>= 0),
   │     │              is_favorite boolean default false,
   │     │              deleted_at timestamptz null  -- set = in Trash,
   │     │              author_notes text[] (legacy), user_notes text[], is_public)
   │     │ 1:N
   │     ├──▶ recipe_ingredients (recipe_id, position, text, is_header boolean default false)
   │     └──▶ recipe_steps      (recipe_id, position, text, is_header boolean default false)
   │
   ├──▶ folders (id, user_id, name, photo)
   │     │ N:M via recipe_folder_mapping (recipe, folder, user_id)
   │     └──▶ recipes
   │
   ├──▶ friendships (id, user_id, existing_friend_id → profiles,
   │     │           friend_name, friend_notes)
   │     │
   │     └──▶ allergies (friend_id → friendships)
   │
   ├──▶ allergies (user_id, name, severity, user_custom)
   │
   ├──▶ blocked_users (blocker_id → profiles, blocked_id → profiles)
   │
   └──▶ feedback_submissions (user_id → profiles, type, message, open boolean default true)
```

Key relationships:

- A user has one profile row, auto-created by the `handle_new_user` trigger
  on `auth.users` insert.
- The profile row carries `contrast` to control high-contrast accessibility
  mode. The Accessibility screen updates this flag, and the profile cache keeps
  the toggle responsive without waiting for a round trip.
- A recipe has many ordered ingredients and steps in child tables (designed
  this way so the future allergy-detection feature can join `allergies` to
  `recipe_ingredients` instead of unnesting JSONB).
- A folder belongs to one user; recipes are mapped into folders via
  `recipe_folder_mapping` (many-to-many).
- A "friend" is either another platform user (`existing_friend_id` set) or
  an off-platform contact (`friend_name` set, `existing_friend_id` null).
- Allergies belong to *either* the user themselves OR a specific friendship
  (enforced by the `allergies_owner_check` constraint).
- `blocked_users` stores one row per direction (the blocker's row only), but
  a `BEFORE INSERT OR UPDATE` trigger on `friendships` checks both directions,
  so the effect is mutual even though storage isn't. See "Blocking & revoking
  shared access" in Feature notes.
- `feedback_submissions` is submit-only — there is no SELECT policy for the
  `authenticated` role at all, so nobody (not even the submitter) can read
  rows back through the app. Reviewed via the Supabase dashboard. Its `open`
  column (added in a follow-up migration,
  [supabase/feedback_submissions_add_open_column.sql](../supabase/feedback_submissions_add_open_column.sql))
  defaults to `true` and is meant to be flipped to `false` by hand in the
  dashboard once a submission's been read/addressed — bookkeeping only, no
  app code reads or writes it.

Row Level Security is enabled on every table and scopes each row to the
owning user via `auth.uid()`.

---

## Feature notes

### Home action bar (search, sort, filter)

Home's top region is a single inline action bar sitting **below** the
"Your Recipes" header and **above** the recipe grid:

```
            Your Recipes
[🔍 Search           ] sort filter
[ recipe grid ]
```

- **Search** is always-visible. The TextInput in the action bar live-filters
  `displayedRecipes` by case-insensitive substring on recipe name. No
  modal, no toggle — just type. `clearButtonMode="while-editing"` shows
  the native iOS × inside the input for one-tap clear.
- **Sort** opens the shared `SortMenu` popdown (not a centered modal)
  anchored below the sort button. The available options come from
  `RECIPE_SORT_OPTIONS` in [lib/app/sort.js](../lib/app/sort.js): *Date added*
  (`created_at`), *Last edited* (`updated_at`), *Recently opened*
  (`opened_at`), *Alphabetical* (`name`). A divider below the options
  separates the ascending/descending direction toggle, so any sort key
  can run in either direction. Choice persists per-user via
  `KEYS.homeSort(userId)`, stored as `{ by, dir }`. A small
  primary-colored dot appears on the sort icon when the selection is
  non-default (i.e. anything other than `DEFAULT_RECIPE_SORT`). Tap the
  backdrop to dismiss without changing.
- **Filter** opens the existing allergy-profile modal (see "Allergy filter
  + severity-aware warnings" below).

**Sort logic.** All ordering math lives in
[lib/app/sort.js](../lib/app/sort.js); the screens just call
`sortRecipes(recipesData, sort, openedMap)` and render the result.
`createdAt` / `updatedAt` come straight off the Supabase row;
`opened_at` is looked up from the in-memory copy of
`KEYS.recipeOpenedAt(userId)` (the recipe-opens map) that the screen
passes in; `name` uses `String.prototype.localeCompare` so accented
characters order correctly. Recipes with no value for the active key
always sort to the bottom — so an unopened recipe under the "Recently
opened" sort just falls off the end — regardless of direction.

**Opened-at tracking.** [RecipeCard.js](screens/RecipeCard.js) calls
`recordRecipeOpened(userId, recipeId)` inside its load effect; every time
the user views a recipe, the map updates with a fresh ISO timestamp.
Home re-reads the map on focus so when you return from a recipe view,
the "Recently opened" sort reflects that view immediately. The map lives
in AsyncStorage (per-device); cross-device sync would require moving it
into Supabase.

**Selection mode** replaces the action bar inline (same vertical slot)
with a `selectBar` showing Cancel / count / bulk-action buttons.

### Sorting (Home, Folders, FolderDetail)

Three screens render sortable grids — Home (recipes), Folders (folders),
and FolderDetail (recipes inside a folder). They all share the same
architecture so adding a new sort key, reordering options, or changing a
visual is a single-file edit.

The pieces:

- **[lib/app/sort.js](../lib/app/sort.js)** owns options, defaults, the
  `normalizeSort()` back-compat shim, and the pure `sortRecipes` /
  `sortFolders` functions. See the layer-responsibilities section above
  for the full API.
- **[components/SortMenu.js](../components/SortMenu.js)** is the
  pop-down UI. It's stateless about persistence — the parent screen
  owns `useState`.
- **AsyncStorage keys** (in [lib/app/storage.js](../lib/app/storage.js)) keep
  each screen's selection per-user:
  - `KEYS.homeSort(userId)` — Home recipes
  - `KEYS.foldersSort(userId)` — Folders grid
  - `KEYS.folderRecipesSort(userId)` — recipes inside any folder
    (FolderDetail). One key for *all* folders rather than per-folder, so
    flipping the sort while browsing applies the next time you open
    *any* folder.

Each screen's responsibilities are minimal: hold `sort` in `useState`,
hydrate from AsyncStorage on mount (using `normalizeSort()` so legacy
bare-string entries upgrade cleanly), save back on every change, pass
the right options array to `<SortMenu>`, and feed the result through
`sortRecipes` / `sortFolders` before rendering.

A non-default selection is signaled with a small primary-colored dot on
the sort icon (`home_actionBar_iconDot` style — reused across the three
screens). FolderDetail places its sort button slightly differently from
Home/Folders and passes `popdownStyle` to `SortMenu` to anchor the
popdown correctly.

**Adding a new sort key** (e.g. "Most ingredients" on recipes):

1. Add `{ id: 'ingredient_count', label: 'Most ingredients' }` to
   `RECIPE_SORT_OPTIONS` in `lib/app/sort.js`.
2. Add a branch to `recipeKey()` returning the value to compare on.
3. Done — Home and FolderDetail pick it up automatically; the
   AsyncStorage migration is also automatic.

### Selection mode (Home, Folders, FolderDetail)

Long-press any tile (recipe or folder) to enter **selection mode**. While in
selection mode:

- The action bar is replaced by a `selectBar` with Cancel / count /
  bulk-action buttons.
- Tapping a tile toggles its selection instead of opening it.
- On **Home**: the bulk actions are "Add to folder" (opens a folder picker
  modal — picks one folder and adds all selected recipes via
  `addRecipesToFolder`) and "Move to Trash" (bulk `trashRecipes`).
- On **Folders**: the bulk action is "Delete" (bulk `deleteFolders` from
  [lib/server/api/folders.js](lib/server/api/folders.js)) — the confirm alert calls out
  that recipes inside the deleted folders are not deleted, only the
  folders and their recipe-folder mappings.
- On **FolderDetail**: the bulk action is "Remove from folder" via
  `removeRecipesFromFolder` — recipes themselves are not deleted. In the
  built-in **Favorites** folder it's "Remove from Favorites"
  (`setRecipesFavorite(ids, false)`); in **Trash** it's Restore
  (`restoreRecipes`) and Delete forever (`deleteRecipesForever`).
- The built-in Favorites / Trash tiles on Folders can't be selected.

The selection state is local to each screen; backing out exits the mode.

### FolderDetail overflow menu (rename + delete)

The ellipsis button (top-right, hidden while in select mode) opens a
popdown menu (`sort_popdown` styling, same as `SortMenu`) with two
actions on the folder currently being viewed:

- **Rename folder** — opens a `surface_modal` prompt (same shape as
  Folders' "New Folder" modal) pre-filled with the current name. Save
  calls `updateFolder(folderId, { name })` from
  [lib/server/api/folders.js](lib/server/api/folders.js) and updates local `folder`
  state immediately so the header reflects the new name without waiting
  on a refetch. Disabled while the trimmed input is empty.
- **Delete folder** — confirm-and-delete via `deleteFolder`, then
  `navigation.goBack()`. Recipes inside are not deleted, only the folder
  and its recipe-folder mappings (same caveat as the bulk-delete path in
  Selection mode above).

In **Trash** the menu has a single **Empty Trash** action
(`emptyTrash()`); **Favorites** has no menu (it can't be renamed or
deleted).

### Allergy filter + severity-aware warnings

**The filter** — "Me" + any combination of friends, selecting whose
allergies contribute recipe-tile dots and ingredient highlights — lives in
[components/AllergyFilterControl.js](components/AllergyFilterControl.js),
a single component rendered by both **Home** and **FolderDetail** (top-right
funnel icon in each). It's fully self-contained: it owns the popup, hydrates
from and persists to `KEYS.homeAllergyFilter(userId)` itself, and reports
the current selection back to its host screen via an
`onSelectionChange(includeSelf, selectedFriendIds)` callback — once after
hydrating, and again whenever "Done" is pressed. The host screen doesn't
own the selection; it just keeps a small local copy of whatever it was last
told, to know when to re-run `getActiveAllergyDetails` and recompute
`activeAllergies`. Both screens read and write the *same* storage key, so
picking friends on Home and then opening a folder shows the same selection
already applied. **RecipeCard** doesn't render the popup at all — it reads
`KEYS.homeAllergyFilter` directly (read-only) on focus, since it only needs
the resulting `activeAllergies`, never the editing UI.

The popup also has an "Overview" button next to "Done" that jumps to the
**AllergyOverview** screen — see below.

**Severity model.** Each `allergies` row has a `severity` column accepting
`severe | moderate | mild | null`. Severity is set on the **EditAllergies**
screen (see "Editing allergies" below) via a 4-way per-row choice, not
inline on Profile/FriendProfile anymore. Severity rank is
`severe > moderate > mild > unknown`, and colors are red / orange / yellow
/ gray respectively (see `severityColor()` in
[lib/server/api/allergies.js](lib/server/api/allergies.js)).

**Data flow.** `getActiveAllergyDetails({ includeSelf, friendshipIds, myName })`
returns one row per `(profile, allergy)`:

```
[{ profileId, profileName, name (lowercased), severity }, ...]
```

- `profileId` is `'self'` for the current user, otherwise a friendship id.
- For linked friends, the linked user's personal allergies and the user's
  local notes about that friendship are both included under the same
  friendship id, so they collapse to one "person".

This same function backs three different UIs: Home/FolderDetail's tile
dots, RecipeCard's ingredient highlights, and AllergyOverview's summary
list (below) — each calls it with a different `friendshipIds` selection.

**Recipe tiles (Home + FolderDetail)** call `dotsForRecipe(recipe, active)`
which returns one entry per matching profile, each with that profile's
max severity for this recipe. The tile then renders a row of small colored
dots in the upper-right — one per person, colored by their personal worst
match in this recipe.

**Ingredient highlights (RecipeCard)** call
`ingredientAllergyInfo(ingredient, active)` per ingredient:

- Returns `null` if no profile's allergy substrings into this ingredient.
- Otherwise returns `{ severity, color, background, people }` where:
  - `severity` is the **highest** severity across all matching profiles
    for this ingredient.
  - `color` / `background` come from that severity and drive the ingredient
    highlight tint.
  - `people` lists every matching profile with their individual severity,
    sorted severe → mild. UI renders each name in the person's own
    severity color so a mixed-severity ingredient shows a red name and a
    yellow name in the same sentence.
  - Exception: outside high-contrast mode, a **mild** match renders as
    black text with a yellow `textShadow` glow behind it rather than plain
    yellow text — plain yellow-on-white read poorly, and RN Text has no
    real stroke/outline property, so the glow is a black-and-yellow
    faux-highlighter effect instead of a background chip. High-contrast
    mode is unaffected (still `colors.text` on a severity-tinted chip).

Matching ingredients render with a translucent severity-tinted background
and a colored border; tapping toggles an inline popup below them with
the "Worst: SEVERITY" label and the comma-separated, color-coded names.

**Matching-limitation disclaimer.** Substring matching can't reliably catch
every case (hidden/alternate ingredient names, cross-contamination, less
common restrictions), so a short warning hint repeats this at every point a
user acts on a match: [screens/EditAllergies.js](screens/EditAllergies.js)
(below the header, while adding restrictions),
[components/AllergyFilterControl.js](components/AllergyFilterControl.js)
(inside the "Filter on Profiles" popup, shared by Home and FolderDetail —
moved here from a Home-only banner so it covers both), and
[screens/AllergyOverview.js](screens/AllergyOverview.js) (below its header).
[screens/TermsOfService.js](screens/TermsOfService.js)'s "Not Medical
Advice" section states the same thing as a matter of terms, not just UI
copy.

### Allergy Overview screen

[screens/AllergyOverview.js](screens/AllergyOverview.js) is a read-only,
standalone summary: pick any set of people and see everyone's allergies
listed together, grouped by person, sorted severe → mild within each
person. Reachable from the Friends screen's action bar (always defaults to
everyone selected there) and from the "Overview" button inside
`AllergyFilterControl`'s popup on Home/FolderDetail.

It's deliberately **not** the same selection as `KEYS.homeAllergyFilter`:

- It persists its own choice to `KEYS.allergyOverviewFilter(userId)`. First
  visit ever (nothing saved) defaults to everyone selected; after that, it
  restores whatever was last chosen *on this screen*, dropping any friend
  ids that no longer exist.
- Arriving via the "Overview" button seeds the initial selection from
  whatever was checked in `AllergyFilterControl` at that moment (via
  `route.params.initialIncludeSelf`/`initialFriendIds`) — but this is a
  one-time seed, not a link: picking "Done" on AllergyOverview's own popup
  still only writes to `allergyOverviewFilter`, never back to
  `homeAllergyFilter`. If that seed is empty (nobody was checked in the
  home/folder filter — i.e. no filter applied there), it's treated as
  "everyone" rather than "nobody": an unfiltered Home/FolderDetail view
  shows every profile's allergies on Overview too, instead of an empty list.
- Its own popup (a plain `Filter` icon top-right, not `AllergyFilterControl`
  — it doesn't need the reopen-on-return plumbing described next) lets you
  narrow the roster without a server round trip: `load()` fetches
  `getActiveAllergyDetails` once for *everyone* (self + every friend) on
  focus, and toggling checkboxes just re-filters that in-memory list.

**Returning to a reopened filter.** Back-navigation from AllergyOverview
checks `route.params.returnTo` (`{ screen, params }`, set by whichever
`AllergyFilterControl` instance sent it there). If present, it calls
`navigation.navigate(returnTo.screen, { ...returnTo.params,
reopenAllergyFilter: true })` instead of a plain `goBack()`. Home and
FolderDetail each watch `route.params.reopenAllergyFilter` in a `useEffect`
and reopen their `AllergyFilterControl` popup when it appears (clearing the
param immediately after so it doesn't fire again on an unrelated future
focus). Opened directly from Friends (no `returnTo`), the back button is a
plain `goBack()`.

### High-contrast mode

The Accessibility screen and Settings → Display both toggle
`profiles.contrast` on and off, through one shared hook,
[lib/server/useContrastSetting.js](lib/server/useContrastSetting.js), so the two switches
always agree. That value is
cached in the `profile` resource, so the switch updates immediately by mutating
the cached profile first and then syncing the change to Supabase.

The value is consumed by the profile-aware screens that need contrast-sensitive
text rendering:

- `RecipeCard` changes text color and severity highlighting rules so the
  foreground stays readable.
- `Home`, `Folders`, and `FolderDetail` use the flag for the search bar's icon
  and placeholder text so those controls stay readable in contrast mode.
- `Accessibility` itself reads the cached profile so the switch reflects the
  stored value immediately on mount and focus.

The general rule is: contrast mode adjusts text-oriented affordances, while the
underlying highlights/backgrounds stay unchanged unless a screen needs a
specific override.

### Editing allergies (EditAllergies screen)

There is no inline allergy editing on Profile or FriendProfile anymore.
In edit mode, each shows an "Edit Allergies" button that navigates to the
shared [screens/EditAllergies.js](screens/EditAllergies.js), passing the
current allergy list and (for FriendProfile) the `friendId`:
`navigation.navigate('EditAllergies', { allergies, friendId })`.

**Nothing is saved until this screen's own Save is pressed.** It keeps a
local working copy (`items` state) seeded from `route.params.allergies`;
adding, removing, or changing a severity only touches that local copy.
Hitting Save (top right) calls `syncAllergies({ original:
initialAllergies, updated: items, friendId })` (see the `lib/server/api/*` note
above) — which does the actual Supabase writes — then `goBack()`. Leaving
any other way (back button, swipe, Android back) with a changed list shows
the "Discard changes?" prompt — see "Unsaved-changes guard". Dirty is an
order-independent name + severity comparison against the original list, so
adding then removing the same item isn't counted as a change.

**Per-row severity** is a 4-way choice (unspecified / mild / moderate /
severe), not a cycling chip anymore: each row shows a small colored dot
per option (`severityChoice_hitArea`/`severityChoice_dot` styles). The hit
area is a fixed size regardless of which option is selected, so picking
one never reshuffles the row; the selected option's dot gets a border in
its *own* color (rather than a generic highlight color), reading as one
solid circle rather than a dot-in-a-box. A legend row at the very top
(`severityLegend_row`/`_item`/`_label`) spells out what each color means
once, so the per-row choices don't need to repeat text labels.

**Adding/removing** happens through `<AllergyChecklist>` below the list —
now used *only* by this screen (not directly by Profile/FriendProfile).
Checking or unchecking is instant: it calls `onAdd(name, userCustom)` /
`onRemove(name)` on the parent immediately, no batched confirm step and no
severity picker of its own (new allergens start at `null`/unspecified —
set the real severity afterward via the row above). Three sections, all
sourced from `constants/allergens.js`:

1. **"Enter your own"** — a text row at the top; press return (or the
   checkbox) to add/remove it.
2. **Groups** — composite entries (*Tree nuts*, *Dairy*, etc., 35 total).
   Tapping a group adds/removes every member preset at once.
3. **Common dietary needs** — flat list of individual presets (268 total,
   organized top-to-bottom by category — nuts, dairy, fish, meat, produce,
   grains, sauces, fats, seasonings, etc.; see the section comments in
   `constants/allergens.js` itself for the exact ordering).

A live filter input narrows both sections (group descriptions are
searched too — typing "shrimp" surfaces "Crustacean shellfish"). Two
behaviors worth knowing if you touch this component:

- **A group's checked state is derived from membership, not tracked.**
  `groupState(group)` (a plain boolean, not a three-way state) is true
  whenever every member preset is present in `existingNames` — so it
  survives leaving and re-entering EditAllergies the same way individual
  presets do. There's no separate partial/half-checked visual — an
  incompletely-selected group just renders as a plain unchecked box, same
  as any other unselected item. Several groups share members — "All
  shellfish" is a superset of "Crustacean shellfish" and "Molluscs" — so
  checking every item in both of those also makes "All shellfish" show
  checked; that's intentional, not overlap leaking across groups.
  `toggleGroup` mirrors the same membership check (`isFullySelected`) to
  decide whether tapping should add or remove, so the tap always does what
  the checkbox is currently showing.
- **Already-added allergens stay selectable**, they're not disabled. Since
  `EditAllergies`'s `handleAdd` matches by name against what's already
  staged, re-picking one there updates its severity in place rather than
  creating a duplicate — an additional path to adjust an existing entry,
  alongside the trash-can icon in the row list above (which still removes
  outright).

**Performance.** At 268 presets + 35 groups, a naive re-render of every row
on every keystroke/tap is visibly slow. Each row is a separate `PresetRow` /
`GroupRow`, defined at module scope and wrapped in `React.memo`, so a single
toggle only re-renders the row(s) whose own props actually changed. That only
works because `togglePreset`/`toggleGroup` are stabilized with `useCallback`
reading through a ref (`latestRef`, same pattern as `onSelectionChangeRef` in
`AllergyFilterControl.js`) — otherwise `AllergyChecklist` would hand each row
a brand-new callback identity every render and `React.memo`'s prop comparison
would never bail out. Keep new row-level UI inside `PresetRow`/`GroupRow`
(not inlined back into the parent's `.map()`) to preserve this.

**Synonyms/near-duplicates** (e.g. chickpea vs. garbanzo bean, or chili vs.
chili powder vs. chili oil) are handled via the group-binding convention
documented at the top of `constants/allergens.js`: add each variant as its
own preset (so recipe-card substring matching still works against whatever
word the recipe actually uses), then bind them with a group
(`chickpea-all`, `chili-all`) so picking one visually surfaces as related to
the others. Don't try to solve this by adding aliases to a single preset.

**Display vs storage**: allergen names are stored lowercase (presets are
already lowercase in `constants/allergens.js`; freeform entries are
lowercased on save). UI renders them with a capitalized first letter via
a small `cap()` helper in each screen.

To add a new common allergen or group, edit `constants/allergens.js`
only — no schema, RLS, or component changes are required.

### Profile editing

- **Own profile**: tap the "Me" row at the top of the Friends screen → opens
  `Profile.js`. Editable: name, phone, about, notes. Email is shown
  read-only (it lives in `auth.users`, not `profiles`). Allergies are
  edited on the separate EditAllergies screen (see above), not inline.
- **Friend profile**: tap any friend → `FriendProfile.js`. For off-platform
  friends, name is editable. For on-platform friends (`linkedProfile` set),
  the linked user's name is displayed and the local name field is hidden.
  Notes are always editable; allergies go through EditAllergies here too.

**Save / Cancel / discard confirmation** — both screens share the same
edit-mode pattern:

- Outside edit mode the top-right button reads "Edit". In edit mode the
  screen switches to the standard `EditHeader` (back | Save ⋯ — see "Edit
  screens"). Save calls the screen's own
  `handleSave` (writes `name`/`phone`/`about`/`notes` via `updateMyProfile`
  or `friendName`/`friendNotes` via `updateFriend`) — this never touches
  allergies; that's entirely EditAllergies' concern now.
- Top-left back button doubles as Cancel while editing. It tracks a
  `baseline` snapshot (the fields as last loaded/saved) and computes
  `isDirty` by comparing current field values against it. Not editing →
  plain `goBack()`. Editing + not dirty → discards immediately (no-op,
  since nothing changed). Editing + dirty → shows
  [components/ConfirmModal.js](components/ConfirmModal.js) ("Discard
  changes?" / Discard / Keep Editing) before reverting.
- No more success alert on save — saving used to pop a native `Alert.alert
  ('Saved')`; it doesn't anymore, the screen just drops out of edit mode.
- Both screens refetch on every focus (`useFocusEffect`, not a one-time
  mount effect) so allergy edits made on EditAllergies — which save
  straight to the database themselves — are reflected here as soon as you
  navigate back. That refetch takes a `{ preserveEdits }` flag (passed as
  `isEditing`): while actively editing, only the allergy list (and, on
  FriendProfile, the `friend` record) is refreshed — the name/phone/
  about/notes fields and their `baseline` are left alone so navigating to
  EditAllergies and back doesn't clobber whatever's still unsaved in
  those fields. `handleDiscard` always calls `load()` with the default
  (`preserveEdits: false`) to fully revert, regardless of this flag.
- The back button only *leaves edit mode*; actually leaving the screen
  mid-edit (iOS swipe, Android back, popping the stack from elsewhere) is
  caught separately by `useUnsavedChangesGuard` with `isDirty: isEditing &&
  isDirty`, which shows the same dialog and then leaves on Discard. Removing
  a friend leaves via `leaveWithoutPrompt` so it isn't interrupted.

`ConfirmModal` is generic (`visible`, `title`, `message`, `confirmLabel`,
`cancelLabel`, `confirmStyle`, `onConfirm`, `onCancel`) and draws the same
`DialogCard` as every `appAlert()` — see "Dialogs".

### Friends screen: search + Add Friend modal

The action bar (below the header, same `home_actionBar` styling as Home/
Folders) has a search box that live-filters the friends list by display
name (`friendDisplayName`, case-insensitive substring), an allergy-overview
icon button (`navigation.navigate('AllergyOverview')`, no params — defaults
to everyone selected), a "Sharing With" icon button (`navigation.navigate
('SharingWith')` — see "Blocking & revoking shared access" above), and the
"+" button that opens the Add Friend modal. The "+" used to be a floating
absolute-positioned overlay button; it's now just the last icon in that
action bar row, same as Folders' "+".

**The Add Friend modal's visibility is intentionally decoupled from its
step content.** `modalVisible` (boolean, drives the `Modal`'s `visible`)
and `modalStep` (`'choose' | 'code' | 'manual'`, drives which step renders)
are separate pieces of state. Closing only flips `modalVisible` to false;
it doesn't reset `modalStep`. Why: `Modal`'s fade-out is a native
animation that plays for a moment *after* `visible` changes, but React
re-renders the JS content immediately — if closing had also nulled out
`modalStep` (so no step matched), the box's content would collapse to
empty for that last render, flashing a thin blank box mid-fade. Leaving
`modalStep` alone until the *next* open (`openAddFriend()` resets it to
`'choose'` there) means the box keeps its full content throughout the
fade, so nothing visibly flashes.

### Friend codes & linking

Each profile has a unique 8-character `friend_code` (auto-generated by a DB
trigger, no `I/L/O/0/1` to avoid confusion). Users see and share their own
code from the Profile screen — displayed and entered as a plain 8-character
string with no dash grouping. (A dash-formatted display used to exist and
caused a real bug: the code-entry `TextInput`s had `maxLength={8}`, so
pasting a 9-character dash-formatted code truncated the last character
*before* `normalizeCode()` ever got a chance to strip the dash. Fixed by
removing the dash entirely and dropping `maxLength` from those inputs —
`normalizeCode()`'s own `.slice(0, 8)` is what actually caps the length now,
robust to any stray punctuation.) Holding down the code on Profile copies it
to the clipboard via `expo-clipboard`'s `setStringAsync`, with a transient
"Copied!" label swapped in for 1.5s.

Users link to others two ways:

- **At creation** — Friends → "+" → "By friend code" enters the code,
  resolves to a real profile, and creates a linked friendship.
- **After the fact** — FriendProfile → "Link to Real Account" updates an
  existing manually-added friendship with the code.

Linking is implemented via a `SECURITY DEFINER` RPC,
`lookup_friend_code(p_code)`, which returns only `(id, name)`. This is the
only way a non-friend can read another profile — the SELECT policy on
`profiles` otherwise restricts reads to self + linked friends.

When a friendship is linked:

- `friendships.existing_friend_id` points at the friend's profile.
- `friendships.friend_name` keeps a *snapshot* of the friend's name at link
  time so the row has a label even if the linked profile later disappears.
- The display name resolves as: live `linkedProfile.name` →
  snapshot `friend_name` → "Unnamed" (see `friendDisplayName()` in
  `lib/server/api/friends.js`).
- The friend's public `profile.notes` becomes readable to the user.
- The friend's own personal allergies are unioned into the Home allergy
  filter when that friend is selected.
- `friendships.friend_notes` (the user's private notes about the friend)
  remains private — RLS scopes it to `user_id = auth.uid()`.

When the friend deletes their account, `existing_friend_id` is set to
`NULL` (via `ON DELETE SET NULL`) but the friendship row survives. The UI
falls back to the snapshotted name and hides the "About them" and "Their
allergies" sections.

### Blocking & revoking shared access

Linking is one-directional by construction: adding someone by friend code
creates *your own* `friendships` row (`user_id = you`, `existing_friend_id =
them`) — that row is what grants *you* visibility into *their* public
profile and allergies (`getLinkedUserAllergies`/`getActiveAllergyDetails`
read `allergies` filtered on that `existing_friend_id`). Historically there
was no way for the person being watched to do anything about it:
`unlinkFriend`/`deleteFriend` only ever touch the caller's own row, and RLS
(`user_id = auth.uid()`) prevents anyone from touching a row they don't own.
`SharingWith.js` and three new RPCs close that gap — see
[supabase/blocking_and_shared_access.sql](../supabase/blocking_and_shared_access.sql)
for the exact SQL (this repo has no migration tooling; schema changes are
pasted into the Supabase SQL editor by hand).

- **`get_sharing_with()`** — a `SECURITY DEFINER` RPC (same class of
  exception as `lookup_friend_code` above) returning every other user's
  friendship row that points at the caller, i.e. "who has linked to me."
  Exposes only the sharer's `name`, nothing else.
- **Remove** (`revoke_my_access(friendship_id)`) — one-directional. The
  caller (who must be the `existing_friend_id` on the target row) nulls
  *that* row's link. Mirrors `unlinkFriend`'s own update, except it checks
  `existing_friend_id = auth.uid()` instead of relying on RLS's
  `user_id = auth.uid()`, since the caller isn't the row's owner. The other
  person can add the caller again later — nothing is blocked.
- **Block** (`block_user(target_user_id)`) — inserts a row into
  `blocked_users`, then severs the link in *both* directions (nulls
  `existing_friend_id` on the target's row pointing at the caller, and on
  the caller's own row pointing at the target, if one exists). Only nulls
  the link — neither friendship row is deleted, so notes/allergies on both
  sides are left intact, the same depth as Unlink rather than the deeper,
  cascading delete Remove Friend does.
- **Enforcement against re-adding** — a `BEFORE INSERT OR UPDATE` trigger on
  `friendships` (`check_not_blocked`) rejects any attempt to set
  `existing_friend_id` between two people where a `blocked_users` row exists
  in either direction. This covers both `addFriendByCode`'s insert and
  `linkFriendByCode`'s update, including any future code path — the DB is
  the actual enforcement boundary, not the client. `is_blocked(user_id)` is
  a cheap client-side pre-check so `addFriendByCode`/`linkFriendByCode` can
  surface a clean error before ever attempting the write; the trigger is
  what actually can't be bypassed.

`SharingWith.js` lists everyone `get_sharing_with()` returns, with
Remove/Block confirm dialogs built on [components/ConfirmModal.js](components/ConfirmModal.js)
— a single `confirmTarget` state
(`{ person, action: 'remove' | 'block' }`) drives one shared modal instance,
with title/message/confirm-label computed from which action was tapped.
Errors from the underlying RPC after confirming are shown with `appAlert()`.

**Unblocking.** `SharingWith.js` has a "Blocked Users" link (top-right
overlay text, same slot other screens use for a secondary action) to
`BlockedUsers.js` — a submenu listing everyone the caller has blocked
(`get_my_blocks()`, another `SECURITY DEFINER` RPC, needed because a blocked
person's `profiles` row usually isn't readable to the caller anymore —
blocking is exactly what severs the friendship link that would otherwise
permit it) with an Unblock action per row, also confirmed via `ConfirmModal`
rather than `Alert.alert`. Unlike every other write in this feature,
**unblocking needs no RPC**: it's a plain `DELETE` against the caller's own
`blocked_users` row, already permitted directly by the
`blocked_users_delete_own` RLS policy, since (unlike Remove/Block) the row
being modified is one the caller actually owns. Unblocking only lifts the
restriction on re-adding each other — it does not restore any previous
friendship link.

**Preemptive blocking.** `block_user(p_target_user_id)` only ever needed a
target user id, not an existing friendship row — the two `UPDATE`s inside it
are simply no-ops if no matching `friendships` rows exist yet. So blocking
someone you've never shared with was already possible at the DB layer; the
only missing piece was a client-side way to resolve a friend code to a user
id without going through an existing friendship first. `BlockedUsers.js`'s
"Block by Code" button opens a modal (same shape as `Friends.js`'s
add-by-code step) and calls a new `blockUserByCode(code)` in
[lib/server/api/friends.js](lib/server/api/friends.js), which resolves the code via the
same `lookupProfileByFriendCode`/`lookup_friend_code` RPC `addFriendByCode`
uses, then calls `blockUser(profile.id)` directly — no friendship, no prior
sharing, no `SharedWith`/`SharingWith` entry required first.

### Unsaved-changes guard

[lib/app/unsavedChanges.js](lib/app/unsavedChanges.js) has two helpers:

- **`useUnsavedChangesGuard({ navigation, isDirty })`** — for stack screens.
  Built on React Navigation's `usePreventRemove`, so it catches *every* way a
  screen is removed: the in-screen back button, the iOS swipe-back gesture
  (where enabled — EditRecipe turns it off for drag-and-drop),
  Android hardware back, and nav-bar jumps that pop the stack. When
  `isDirty`, the removal is held and a `ConfirmModal` ("Discard changes?" /
  Discard / Keep Editing) is shown; Discard re-dispatches the held action.
  Returns `{ discardModalProps, leaveWithoutPrompt }` — spread the first onto
  `<ConfirmModal />`; wrap navigation after a successful save/delete in
  `leaveWithoutPrompt(() => navigation.goBack())`, since `isDirty` is still
  true until the next render.
  Used by EditRecipe, EditAllergies, Profile, FriendProfile, and Feedback.
  EditRecipe's dirty check compares a snapshot of name/ingredients/steps/notes
  with blank rows dropped (they're dropped on save too).
- **`confirmDiscard(isDirty, onDiscard)`** — for in-screen modals, which
  aren't stack screens. Wired to the backdrop tap and `onRequestClose`
  (Android back) of: Folders' New Folder, FolderDetail's Rename and Add
  recipes picker, Home's "New folder" inside Add to folder, and Friends' Add
  Friend modal. Explicit Cancel buttons still discard without asking.

### Offline banner & failed saves

[lib/server/connectivity.js](lib/server/connectivity.js) tracks server reachability
app-wide by pinging Supabase's `/auth/v1/health` (5 s timeout). Any HTTP
response below 500 counts as online; a network error, timeout, or 5xx
counts as offline. Polling runs only while something is subscribed via
`useIsOnline()` — every 20 s while online, every 5 s while offline so the
banner clears quickly — plus an immediate check whenever the app returns to
the foreground. Concurrent checks share one request.

- [components/OfflineBanner.js](components/OfflineBanner.js) is mounted in
  only two places, so no screen or popup has to add it:
  - **App.js**, over the whole navigator. Every screen gets it, including
    auth screens, InputSelector, Feedback, and SharingWith.
  - **AppModal**, inside every popup, because a native modal covers the root
    one. This is the same reason AppModal mounts its own `DialogHost`.

  It floats over the content instead of taking layout space, since screens
  hard-code their top spacing. It also has `pointerEvents="none"`, so the
  list under it still scrolls and taps pass through. On the four tab screens
  (`TAB_ROUTES`, picked by App.js's current route name) it sits flush on top
  of the NavigationBar, using the bar's measured height. Everywhere else it's
  pinned to the bottom edge and padded past the home indicator. While typing,
  the keyboard covers it, and a failed save still shows `alertSaveFailed`.
- `alertSaveFailed(err, title)` replaces the plain error alert on recipe,
  dietary needs, profile, and folder saves. It always says the changes were
  **not** saved; if the error looks like a network failure *or* a fresh ping
  fails, it shows "You're offline … stay on this page and try again once
  you're reconnected" instead. The re-ping matters because offline failures
  don't always look like network errors — `requireUser()` in
  `lib/server/api/recipes.js` surfaces a failed auth check as "Not signed in".

### Servings

`recipes.servings` is an optional positive integer ("Makes 4 servings"),
added by [supabase/recipes_add_servings.sql](../supabase/recipes_add_servings.sql).
NULL means not filled in: the recipe card doesn't show it, and the multiplier
works as if it were 1 (amounts scale; there's just no servings line).

- **Link import** — `parseServings()` in
  [lib/server/recipeUrlParser.js](lib/server/recipeUrlParser.js) reads schema.org
  `recipeYield`, which sites publish as a number, a string ("Serves 4-6"), an
  array (`["4", "4 servings"]`), or a `QuantitativeValue`. It takes the first
  count (a range uses its low end, decimals round), preferring an array entry
  that mentions servings/people over e.g. "24 cookies". InputSelector passes
  it to `createRecipe`; a page with no yield leaves it empty.
- **Manual entry / edits** — EditRecipe has a "Makes [ # ] servings" number
  field above Ingredients (digits only, up to 3). It's never pre-filled; blank
  or 0 saves as empty. It's part of the unsaved-changes snapshot.
- **Display** — RecipeCard shows "Makes N serving(s)" under the title only
  when servings is filled in, scaled by the multiplier below. The times line
  is conditional the same way: it only renders the prep / cook / total
  values that are set, and not at all when none are.

### Ingredient amount multiplier

RecipeCard shows ½× / 1× / 2× / 3× chips beside the Ingredients header.
[lib/app/scaleIngredient.js](lib/app/scaleIngredient.js) scales only the **leading**
amount of each line — integers, decimals, `1/2`, mixed `1 1/2`, unicode `½` /
`1½`, and ranges (`2-3`, `2 to 3`) — and formats results as common cooking
fractions (⅛ ⅙ ¼ ⅓ ⅜ ½ ⅝ ⅔ ¾ ⅚ ⅞) or a 2-place decimal. Lines without a
leading amount are untouched. It's display-only: nothing is written to the
database, the multiplier resets to 1× each time the recipe opens, allergy
highlighting still matches against the original text, and amounts inside the
instructions aren't changed (a hint says so when not at 1×). When servings is
filled in, the "Makes N servings" line scales with it (e.g. 4 → 8 at 2×, 3 →
1½ at ½×) and the hint reads "scaled 2× from 4 to 8 servings"; otherwise the
hint just says "shown at 2×".

### Recipe notes

Recipes have a single "Your Notes" list. The `author_notes` column is legacy
(it was never auto-populated by the link parser): `shapeRecipe` folds any
existing author notes into `userNotes`, and `updateRecipe` clears
`author_notes` whenever it writes `user_notes`, so nothing a user typed is
lost or shown twice.

### Favorites, Trash, and copies

- **Favorites** — `recipes.is_favorite`. The star is a custom SVG
  ([components/icons/StarIcon.js](components/icons/StarIcon.js), Heroicons
  outline; filled with `colors.favorite` — accent blue, white in dark mode —
  when favorited, `colors.text` outline when not). Toggled with the ★ at the top of
  RecipeCard (optimistic; reverts on failure) via `setRecipeFavorite()`;
  favorited tiles show a small ★ on Home and in folders. Favoriting doesn't
  change `updated_at`, so it doesn't count as an edit for sorting.
- **Trash ("Recently Deleted" in the UI)** — "Delete" anywhere in the app is now a soft delete:
  `trashRecipes()` sets `recipes.deleted_at`. Trashed recipes are excluded
  from `getRecipes()` and `getRecipesInFolder()` (their folder rows are kept,
  so Restore puts them back in their folders). `getTrashedRecipes()` first
  purges anything trashed more than `TRASH_RETENTION_DAYS` (30) ago, then
  lists the rest newest-first. Opening a trashed recipe shows an "In Trash"
  banner with its purge date and a ⋯ menu with Restore / Delete forever.
- **Built-in folders** — Folders always shows Favorites **first** and
  **Recently Deleted** (the user-facing name for Trash; the code still says
  `trash`) **last**, around your own folders, unaffected by sort and not
  selectable. Their tiles use the normal folder
  tile with a small 16 pt icon inline before the name (blue star / black trash can). Both open FolderDetail with
  `route.params.systemFolder` (`'favorites'` | `'trash'`; see
  `SYSTEM_FOLDERS`): Favorites lists starred recipes (+ stars more), Trash
  lists trashed ones. Neither can be renamed or deleted.
- **Add to folder** — in the ⋯ menu on RecipeCard and EditRecipe (not for a
  new unsaved recipe or one in Trash). Opens
  [components/FolderPickerModal.js](components/FolderPickerModal.js): every
  folder with a checkbox showing whether this recipe is in it (from
  `getFolderMemberships()`); tapping adds or removes it immediately
  (optimistic, reverted on failure), and "New folder" creates one and adds
  the recipe. Home's multi-select "Add to folder" is the bulk equivalent.
- **Make a copy** — in the ⋯ menu on RecipeCard and EditRecipe.
  `duplicateRecipe(source)` creates a new recipe named "<name> (copy)" with
  everything except the id, favorite flag, and folder memberships. On
  RecipeCard it copies the saved recipe and pushes the copy's card; on
  EditRecipe it copies **what's on screen, including unsaved edits** (after
  a confirm when there are any) and replaces the editor with the copy's
  card, leaving the original as last saved.

### Section headers

Ingredients and steps can be split into sections ("For the sauce"). A
header is a normal row in `recipe_ingredients` / `recipe_steps` with
`is_header = true`; its text is the section name and its position orders
it. Full recipes carry `{ text, isHeader }` items
([lib/app/recipeItems.js](lib/app/recipeItems.js)); list summaries drop headers so
they never trigger allergy dots.

- **Manual** — EditRecipe has an "Add Section" button next to "Add
  Ingredient" / "Add Step". Section rows are bold and aren't numbered.
- **From links** — steps: named `HowToSection`s in the JSON-LD.
  Ingredients: schema.org has no ingredient sections, so
  `ingredientSectionsFromHtml()` reads group headings from the recipe-card
  HTML of WP Recipe Maker, Tasty Recipes, and Mediavine Create. It's used
  only when the plugin's `<li>` count equals the JSON-LD ingredient count,
  so a page it can't read reliably just imports without sections. The
  plugin's own card title ("Ingredients", `wprm-recipe-header`) is never a
  section, and controls inside headings — US Customary / Metric unit
  toggles, 1x/2x/3x scale buttons — are stripped before the text is read
  (e.g. natashaskitchen.com puts the unit toggle inside the title).
- **Display** — RecipeCard shows headers as labels; step
  numbering skips them; scaling and allergy matching ignore them.

### Drag-and-drop reordering

EditRecipe's ingredient and step rows are rendered by
[components/ReorderableList.js](components/ReorderableList.js). Pressing a
row's ≡ handle picks it up (haptic tick); it follows the finger, rows it
passes shift out of the way, and releasing drops it there. It's built on the
plain React Native responder system (no gesture library), works with
variable-height multiline rows, and keeps inputs attached to their rows via
a client-only `key` per item. The editor's ScrollView is disabled while a
row is lifted, and EditRecipe has the iOS swipe-back gesture turned off
(`gestureEnabled: false` in [App.js](App.js)) because the handles sit at
the left edge where that swipe starts — the back button and Android back
still work (and still prompt about unsaved changes). The four nav-bar
screens (Home, Folders, Friends, Settings) also have swipe-back off, since
switching tabs pushes them onto the stack and a swipe would jump to the
previous tab. Every other screen keeps it, including RecipeCard, so e.g. a
folder swipes back to Folders. The handle is also an accessibility
"adjustable" element with Move up / Move down actions. Limitation: the list
doesn't auto-scroll while dragging, so a row can only be dragged within
what's on screen.

### Cooking times

`prep_minutes`, `cook_minutes`, `total_minutes` (whole minutes).
`parseDuration()` ([lib/app/recipeTimes.js](lib/app/recipeTimes.js)) reads schema.org
`prepTime` / `cookTime` / `totalTime` (ISO 8601, e.g. `PT1H30M`, with a
plain-text fallback); zero counts as unset. EditRecipe has Prep / Cook /
Total minute fields; Total defaults to prep + cook (`resolveTotalMinutes`)
but a typed or published total wins, since it can include resting time.
RecipeCard shows "Prep 15 min · Cook 1 hr · Total 1 hr 15 min".

### Hide vs warn for dietary conflicts

Settings → "Hide recipes with dietary conflicts" (`KEYS.hideUnsafeRecipes`,
per user, default off). Off: recipes matching the active dietary filter show
warning dots (the original behavior). On: Home, folders, and Favorites leave
those recipes out (`applyDietaryVisibility()` in
[lib/app/useHideUnsafe.js](lib/app/useHideUnsafe.js)) and say how many were hidden.
It only applies while a dietary filter is active, and never in Trash.
`useHideUnsafe()` re-reads the setting on focus, so a change applies as soon
as you return to a list.

### Dark mode

Settings → Appearance: **System** (follow the phone), **Light**, or
**Dark**; stored per device (`app.themePreference`, kept across sign-out).
[lib/app/theme-context.js](lib/app/theme-context.js):

- `ThemeProvider` (wraps the app in App.js) loads the preference before the
  first paint, resolves the scheme (system → `useColorScheme()`), and calls
  `applyColorScheme()`, which swaps the token values in `colors`
  (`setColorTokens()` in [styles/theme.js](styles/theme.js)) and rebuilds the
  shared stylesheet in place (`rebuildStyles()` in
  [styles/main_style.js](styles/main_style.js)). It also calls
  `Appearance.setColorScheme()` so native UI (alerts, keyboards) matches a
  manual choice.
- App.js keys the `NavigationContainer` by scheme, so a change remounts the
  screens with the new colors; the navigation state is carried over, so you
  stay on the same screen. The status bar and navigator theme follow.
- Because tokens are swapped in place, components must read `colors.*` at
  render time (never copy one into a module-level constant), and every Text
  style needs an explicit color (RN's default text color is black).
- The dark palette brightens `primary` / `link` / `danger` / severity colors
  for contrast on the near-black background and uses a dark blue for tiles.
- `app.json` `userInterfaceStyle` is `automatic` so the phone's setting is
  visible; that's a native setting, so it needs a new EAS build.
- **Unsaved edits hold the switch.** Because a scheme change remounts the
  screens, it would wipe anything typed but not saved — e.g. the phone
  switching to dark at sunset, or from Control Center, mid-edit. So
  `ThemeProvider` keeps the current scheme while `useHasUnsavedChanges()`
  ([lib/app/unsavedChanges.js](lib/app/unsavedChanges.js)) is true, and applies the
  new one as soon as the edit is saved or discarded. What registers as
  unsaved: every `useUnsavedChangesGuard` screen (automatically — EditRecipe,
  EditAllergies, Profile / FriendProfile while editing with changes,
  Feedback with a message), plus typed modal input via `useRegisterUnsaved`
  (New Folder, rename folder, add-recipes picker, Home's new-folder name,
  Add Friend, Add to folder's new-folder name, and the friend-code boxes on
  FriendProfile and Blocked Users). Anything that isn't unsaved work (scroll
  position, a search query, an open sort menu) still resets on a switch.
  **New modals or edit screens that hold typing should register too.**

### Status-bar backdrop

Screens draw edge to edge (no SafeAreaView), so scrolled content used to
slide up under the clock / battery / Dynamic Island.
[components/StatusBarBackdrop.js](components/StatusBarBackdrop.js) is a
fixed, absolutely positioned strip at the top of the app, exactly the
safe-area top inset tall (`useSafeAreaInsets()`; App.js wraps everything in
`SafeAreaProvider`). It takes no layout space, so screens aren't pushed down,
and has `pointerEvents="none"`. Fixed headers already start below it (the
top overlay buttons sit ≥ 60 pt down). It uses `colors.background`, white in
light mode and the dark background in dark mode (the status icons turn
white there). App.js tracks the current route name and leaves it off
Landing, whose photo is meant to run under the status bar. Modals and
dialogs draw above it.

### Edit screens

Every edit screen — EditRecipe, EditAllergies, and Profile / FriendProfile
in edit mode — uses the same chrome from
[components/EditHeader.js](components/EditHeader.js):

- `EditHeader`: back arrow upper left; **Save** (bold, link blue) and the
  **⋯** menu upper right. `variant="safe"` for EditRecipe's offsets,
  `"card"` for the others.
- Save lives only in the header — there's no bottom Save button on any edit
  screen (EditRecipe's old full-width "Save Changes" was removed too).
- ⋯ menus (via `ActionMenu`):

  | Screen | ⋯ actions |
  |---|---|
  | EditRecipe | Add to folder, Make a copy, Discard changes\*, Delete (not for a new recipe, except Discard) |
  | EditAllergies | Remove all (until Save), Discard changes\* |
  | Profile | Edit dietary needs, Discard changes\* |
  | FriendProfile | Edit dietary needs, Duplicate friend, Discard changes\*, Remove friend |

  \* only while there are unsaved edits; confirms first, then reverts to the
  last saved values (Profile/FriendProfile also leave edit mode).
- **Duplicate friend** — `duplicateFriend()` in
  [lib/server/api/friends.js](lib/server/api/friends.js) creates a new unlinked friend
  named "<name> (copy)" from what's on screen (unsaved edits included, after
  a confirm) and copies the dietary needs you track for them (via
  `syncAllergies`). A linked friend's own shared dietary needs aren't
  copied, and the copy isn't linked. The editor is replaced by the copy's
  profile; the original stays as last saved.
- **Remove friend** moved from the red footer button into the ⋯ menu.
- **Edit dietary needs** — in edit mode, Profile's "My Dietary Needs" and
  FriendProfile's "My Dietary Need Notes" headings have a small right-aligned
  **Edit** (bold link blue, same as the header's Save) via
  [components/SectionHeading.js](components/SectionHeading.js), replacing
  the old full-width "Edit Dietary Needs" button. It's also in the ⋯ menu.
- View screens (RecipeCard, Profile / FriendProfile when not editing) keep
  their own headers.

### Dialogs

Every alert and confirm in the app uses one look — the card from the
"Discard changes?" prompt — instead of the native `Alert`:

- [components/DialogCard.js](components/DialogCard.js) draws it: title,
  optional message, right-aligned buttons (`cancel` plain, `destructive`
  bold red, default bold blue).
- **`appAlert(title, message?, buttons?)`** ([lib/app/dialog.js](lib/app/dialog.js))
  takes the same arguments as `Alert.alert` (buttons default to one "OK"),
  so it's a drop-in replacement. Dialogs queue: one opened from another's
  button shows next. Backdrop tap / Android back presses the cancel button,
  or the only button of a one-button dialog; otherwise the dialog waits for
  a choice.
- **`ConfirmModal`** is the declarative version for screens that keep the
  open state themselves (the unsaved-changes guard, Profile/FriendProfile,
  SharingWith, BlockedUsers).
- **Where dialogs render** — on iOS a modal can only be presented from the
  topmost one, so a dialog raised while another modal is open must render
  inside it. Every `<DialogHost>` registers in a stack and the newest one
  draws the current dialog: one at the root (App.js), and one inside every
  in-app modal via [components/AppModal.js](components/AppModal.js), a
  drop-in for RN's `Modal`. **Always use `AppModal`, not `Modal`**, or
  alerts raised while it's open won't appear. After a modal closes, the
  host underneath waits ~400 ms before presenting (iOS can't present while
  another modal is still animating away), which covers the common "close
  the picker, then show 'Added'" sequence.

### Feedback form

[screens/Feedback.js](screens/Feedback.js) is a simple submit-only form
(a single message box — feedback only, no questions, since submissions
aren't replied to; the screen says so) backed by
[lib/server/api/feedback.js](lib/server/api/feedback.js)'s `submitFeedback({ type,
message })` with `type` always `'suggestion'` (an existing allowed value, so
the table didn't change; older rows may still be `'question'`), a plain
authenticated insert into `feedback_submissions` (no
RPC needed — same pattern as `addFriend`'s direct table insert). There is
no corresponding read function anywhere in the app: the table's RLS only
grants `INSERT`, not `SELECT`, to the `authenticated` role, so submissions
are reviewed directly in the Supabase dashboard, not surfaced back through
the UI. Every row also carries an `open` boolean (default `true`) for the
developer to mark a submission handled directly in the dashboard — purely
bookkeeping, no app code touches it. See
[supabase/feedback_submissions.sql](../supabase/feedback_submissions.sql)
and [supabase/feedback_submissions_add_open_column.sql](../supabase/feedback_submissions_add_open_column.sql).

### Adding a recipe (InputSelector → EditRecipe)

[screens/InputSelector.js](screens/InputSelector.js) offers three ways to
land on a new recipe, and each ends the flow differently:

- **Manual** — navigates straight to `EditRecipe` with no `recipeId`
  (`isNew`); servings are typed there. Saving there calls `createRecipe` and `navigation.popToTop()`
  back to Home.
- **Link, successful parse** — `handleFetch` calls `createRecipe` itself
  (the row already exists, including `servings` parsed from `recipeYield`
  when present) and immediately `navigation.popToTop()`s; the user never
  sees `EditRecipe` for this path.
- **Link, no recipe found ("Create anyway")** — the page loaded but
  nothing parseable was on it. `handleCreateAnyway` creates a blank recipe
  (source + link only) and navigates to `EditRecipe` **with** a
  `recipeId` — so `EditRecipe` sees `isNew = false` even though this is
  conceptually still a fresh creation. To keep Save behaving like a
  creation (return to Home) rather than an edit (`goBack()` to the
  still-mounted link-entry screen, which used to strand the user back on
  the URL modal instead of Home), `handleCreateAnyway` also passes
  `fromCreate: true`; `EditRecipe`'s save handler checks that flag
  alongside `isNew` to decide `popToTop()` vs `goBack()`.

---

## Testing

`npm run verify` is the one-command check (lint, unit + security tests,
dependency audit, iOS bundle build). Details, coverage, and how to add tests
are in [docs/TESTING.md](TESTING.md). When adding a feature, add or extend a
test in `tests/unit/`; when it touches links, storage, auth, or user input,
add a check in `tests/security/` too.

## Adding things

### A new screen

1. Create `screens/MyScreen.js` exporting a default component.
2. Register it in `App.js` under whichever stack it belongs to
   (`AuthStack` or `AppStack`).
3. Navigate to it from another screen with
   `navigation.navigate('MyScreen', { ... })`.
4. Use styles from `styles/main_style.js`. Add new ones at the
   bottom of that file if you need them.

### A new data operation

1. Pick the right file in `lib/server/api/` (or create a new domain file).
2. Add an async function. Reshape DB rows into a camelCase object before
   returning. Throw on error.
3. Import it from your screen. Don't import `supabase` directly.

### A new table

1. Add the table in Supabase (SQL editor or dashboard).
2. Enable RLS and add an owner policy (`user_id = auth.uid()` or similar).
3. Add a corresponding file under `lib/server/api/` exposing CRUD functions.
4. Wire it into the relevant screen(s).

---

## Environment

`.env.local` (gitignored) holds:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

`EXPO_PUBLIC_*` is required for the value to be inlined into the client
bundle by Metro.

## Running locally

```bash
npx expo install   # one-time, picks SDK-compatible versions
npx expo start --tunnel
```
