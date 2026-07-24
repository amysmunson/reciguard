# Architecture

Recipes is a React Native + Expo (SDK 54) app backed by Supabase (Postgres + Auth).
The app stores per-user recipes, organizes them into folders, tracks friends and
their allergies, and is built to expand into sharing and allergy-aware recipe
filtering.

The codebase is organized in three layers:

1. **Screens** (`screens/`) — what the user sees. Stateless about data
   persistence; they call into `lib/api/*` and render results.
2. **Data layer** (`lib/`) — the only place Supabase is touched. Exposes a
   small set of functions (`getRecipes()`, `createFolder()`, `signOut()`, ...)
   that screens consume. Screens **never** import `supabase` directly.
3. **Shared components** (`components/`) — the `NavigationBar` and small
   utilities.
4. **Styles** (`styles/`) — the single shared `StyleSheet` for the whole app.

Authentication is gated at the navigator level: when there is no session, the
app renders the `AuthStack` (Landing / Login / SignUp / PrivacyPolicy). When a
session exists, the app renders the `AppStack` (Home, Folders, Friends,
Settings, and their detail screens).

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
├── lib/                            # Data layer — the ONLY place Supabase is used
│   ├── supabase.js                 # Single createClient() instance (AsyncStorage + URL polyfill)
│   ├── auth-context.js             # AuthProvider + useAuth() hook (session, user, loading)
│   ├── storage.js                  # AsyncStorage helpers (loadJson, saveJson) + KEYS registry
│   ├── cache.js                    # Stale-while-revalidate cache: useCachedResource() + mutateCachedResource() + invalidate()
│   ├── sort.js                     # Shared sort options + sortRecipes/sortFolders + normalizeSort
│   └── api/                        # Per-domain functions screens import
│       ├── auth.js                 # signUp, signIn, signOut, deleteAccount
│       ├── recipes.js              # getRecipes, getRecipe, create/update/deleteRecipe
│       ├── folders.js              # folders CRUD + recipe-folder mapping
│       ├── friends.js              # friendships CRUD
│       ├── profile.js              # profile read/update
│       └── allergies.js            # per-user and per-friend allergy CRUD
│
├── screens/                        # Stack screens — one file per route
│   │
│   │  ── AuthStack (no session) ──
│   ├── Landing.js                  # Marketing / entry point
│   ├── Login.js                    # Email + password sign-in
│   ├── SignUp.js                   # Email + password + name sign-up
│   ├── PrivacyPolicy.js            # Static text screen
│   │
│   │  ── AppStack (session present) ──
│   ├── Home.js                     # Grid of the user's recipes
│   ├── RecipeCard.js               # Read-only recipe view
│   ├── EditRecipe.js               # Recipe editor (name, ingredients, steps, notes)
│   ├── InputSelector.js            # "How do you want to add this recipe?" picker
│   ├── Folders.js                  # Grid of folders + create-folder modal; long-press to bulk-delete
│   ├── FolderDetail.js             # Recipes inside a folder; long-press to bulk-remove
│   ├── Friends.js                  # Friends list — search bar, "Me" row, allergy-overview entry point
│   ├── FriendProfile.js            # Friend name + notes (editable); allergies edited via EditAllergies
│   ├── Profile.js                  # Edit your own profile; allergies edited via EditAllergies
│   ├── EditAllergies.js            # Shared allergy editor for Profile & FriendProfile (see Feature notes)
│   ├── AllergyOverview.js          # Read-only summary of allergies for a chosen set of people
│   ├── Settings.js                 # Sign out + delete account + privacy policy link
│   └── Accessibility.js            # High-contrast mode toggle tied to profile settings
│
├── components/                     # Shared UI + utilities (NOT screens)
│   ├── NavigationBar.js            # Bottom tab bar with active-tab highlight
│   ├── AllergyChecklist.js         # Group/individual/custom allergen picker — instant add/remove, used by EditAllergies
│   ├── AllergyFilterControl.js     # Shared "which profiles' allergies matter" trigger+popup (Home, FolderDetail)
│   ├── ConfirmModal.js             # Generic discard-confirmation dialog (Profile, FriendProfile)
│   ├── SortMenu.js                 # Pop-down sort menu shared by Home / Folders / FolderDetail
│   ├── LandingCard.js              # Decorative oval-with-cusps SVG shape behind the Landing title
│   ├── LandingCard2.js             # Alternate shape: smooth oval with 4 small outward points
│   ├── icons/                      # Central icon registry — one file controls every icon
│   │   ├── index.js                # Barrel: re-exports SVGs + wraps every vector-icon glyph
│   │   ├── PlusIcon.js             # Custom SVG (Heroicons-style outline)
│   │   ├── SearchIcon.js           # Custom SVG
│   │   ├── SortIcon.js             # Custom SVG
│   │   ├── FilterIcon.js           # Custom SVG
│   │   └── EditIcon.js             # Custom SVG (InputSelector's edit-manually option)
│   ├── utils/
│   │   └── addRecipe.js            # createRecipe() + navigate to InputSelector
│   └── samples/
│       └── sample_recipes.js       # Reference sample data (preserved by request)
│
├── styles/
│   ├── theme.js                    # Color palette + semantic tokens + useColors() hook
│   └── main_style.js               # Single shared StyleSheet for the whole app
│
├── constants/
│   └── allergens.js                # Static catalog: ALLERGEN_PRESETS + ALLERGEN_GROUPS
│
├── assets/                         # Icons, splash, images
│   └── images/
│
├── scripts/
│   └── reset-project.js            # Expo template helper (unused day-to-day)
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
| `@react-navigation/stack` | Auth stack and app stack in [App.js](App.js). |
| `@supabase/supabase-js` | The Postgres + Auth client — initialized once in [lib/supabase.js](lib/supabase.js). |
| `@react-native-async-storage/async-storage` | Storage adapter for Supabase auth session and the per-user filter persistence in [lib/storage.js](lib/storage.js). |
| `react-native-url-polyfill` | Side-effect import in [lib/supabase.js](lib/supabase.js) — Supabase needs URL globals that RN doesn't ship. |
| `react-native-svg` | Used by `components/LandingCard*.js` for the decorative title shapes and by `components/icons/*.js` for the custom Heroicons-style glyphs (Plus / Search / Sort). |
| `@expo/vector-icons` | Provides the `react-native-vector-icons/Ionicons` and `/FontAwesome` font sets. Direct imports are confined to [components/icons/index.js](components/icons/index.js); every screen consumes semantic wrappers (e.g. `<TrashIcon>`, `<BackIcon>`) from the registry instead. |

### Runtime — peer / framework requirements (not directly imported)

| Package | Why it's installed |
|---|---|
| `react-native-gesture-handler` | Required by React Navigation animations. |
| `react-native-reanimated` | Required by React Navigation transitions. |
| `react-native-safe-area-context` | Required by React Navigation for safe-area inset handling. |
| `react-native-screens` | Required by React Navigation to use native screen primitives. |
| `react-native-worklets` | Peer of `react-native-reanimated` v4. |
| `react-dom` / `react-native-web` | Needed for the web build (`npx expo start --web`). Not used on mobile. |
| `expo-status-bar` | Provided by SDK template. Lightweight, kept for the default status-bar wrapper. |
| `expo-splash-screen`, `expo-system-ui`, `expo-constants`, `expo-font` | Managed by Expo internally; the SDK pulls bits of these in for startup/runtime. Safe to leave installed. |

### Runtime — template leftovers (currently UNUSED by app code)

These were added by `npx create-expo-app` and our code never imports them.
Removing them would slim the install slightly; verify nothing imports each
one (grep) before deleting.

| Package | Replaced by / status |
|---|---|
| `expo-router` | We use `@react-navigation/stack` directly. Unused. |
| `expo-sqlite` | Legacy from the local-SQLite version of the app before Supabase. Unused now. |
| `expo-image` | We use `ImageBackground` from `react-native`. Unused. |
| `expo-haptics` | No haptic feedback wired up. Unused. |
| `expo-linking` | No deep links yet. Unused. |
| `expo-symbols` | No SF Symbols use. Unused. |
| `expo-web-browser` | No in-app browser use. Unused. |
| `@react-navigation/bottom-tabs` | We use a custom `NavigationBar` component. Unused. |
| `@react-navigation/elements` | Pulled in transitively by `@react-navigation/native`. May be removable but low priority. |

### Dev tooling

| Package | Why we use it |
|---|---|
| `@expo/ngrok` | Required for `npx expo start --tunnel` (used during sharing dev builds). |
| `eslint` + `eslint-config-expo` | Linting. Run via `npm run lint`. |
| `typescript` + `@types/react` | Required by the lone `constants/theme.ts` file and `tsconfig.json` — the rest of the codebase is JS. |

### Upgrade discipline

- Always install or update packages via `npx expo install <pkg>` — never `npm install <pkg>` for anything Expo-aware. Expo picks the SDK-54-compatible version, which avoids subtle runtime issues from version drift.
- `npx expo install --check` periodically; `npx expo install --fix` to bring everything to expected versions when the SDK gets a patch bump.
- Never bundle the Supabase **service-role key**. Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the anon key) go in the client. The service-role key in `.env.local` is for tooling/scripts only, never imported into app code.

---

## Layer responsibilities

### `lib/supabase.js` — the client

One file, one `createClient()` call, configured for React Native:

- Uses `AsyncStorage` to persist the session across app restarts.
- Imports `react-native-url-polyfill/auto` (required for Supabase in RN).
- Reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  from `.env.local`.

Nothing else in the app should import `@supabase/supabase-js` — they import
from `lib/api/*` instead.

### `lib/auth-context.js` — session state

Wraps the whole app in `<AuthProvider>`. Exposes `useAuth()` returning
`{ session, user, loading }`. Subscribes to `supabase.auth.onAuthStateChange`
so when the user signs in, signs out, refreshes, or has their account deleted,
the entire app re-renders against the new session state. That re-render is
what flips the navigator between `AuthStack` and `AppStack` automatically —
there is no manual `navigation.navigate('Home')` after sign-in.

### `lib/api/*` — per-domain data functions

Each file is a flat set of async functions. They:

- Call `supabase.from(...)` / `supabase.auth.*` / `supabase.rpc(...)`.
- Throw on errors so screens can catch with try/catch.
- Reshape rows into camelCase JS objects the UI wants (e.g. `ext_link` →
  `extLink`, joined `recipe_ingredients` collapsed to `ingredients: string[]`).
- Look up the current user via `supabase.auth.getUser()` and tag inserts with
  `user_id` automatically — screens never deal with user IDs.
- **Bust the cache after mutations.** Every write (`createFolder`,
  `updateRecipe`, `deleteFriend`, …) calls a small `bust*Caches()` helper after
  the DB succeeds, which calls `invalidate(resource, userId)` from
  [lib/cache.js](lib/cache.js). This forces any mounted `useCachedResource`
  hooks for that resource to refetch and drops the stale on-disk snapshot. The
  profile flow also uses `mutateCachedResource('profile', userId, nextValue)`
  so the Accessibility toggle updates instantly before the Supabase write
  completes. The resource keys in use today are `'recipes'`, `'folders'`,
  `'friends'`, and `'profile'`.
- **One exception to "call `lib/api/*` directly per action":**
  [lib/api/allergies.js](lib/api/allergies.js)'s `syncAllergies({ original,
  updated, friendId })`. The EditAllergies screen (see Feature notes) edits
  a local, unsaved copy of the allergy list; `syncAllergies` diffs that
  local copy against what was originally loaded and issues the matching
  `addAllergy` / `deleteAllergy` / `updateAllergySeverity` calls in one
  batch when the user hits Save. Local-only rows (not yet persisted) carry
  an id prefixed with `LOCAL_ID_PREFIX`, generated by `makeLocalAllergyId()`,
  so the diff can tell "new" from "existing" without a round trip.

When you need a new piece of data, add a function to the appropriate file (or
a new file under `lib/api/`). Don't query Supabase from a screen.

### `screens/*` — the UI

Each screen is a default-exported React component that:

- Reads params via `route.params` (e.g. `recipeId`, `folderId`, `friendshipId`).
- Reads list data through the `useCachedResource()` hook from
  [lib/cache.js](lib/cache.js) where a cached, focus-refreshed snapshot is
  wanted (Home → recipes, Folders → folders, Friends → friends + profile name).
  The hook owns the fetch/refresh/invalidation lifecycle, so these screens no
  longer keep their own `useState` list + manual `load()` in `useFocusEffect`.
- Still calls `lib/api/*` directly inside `useFocusEffect`/`useEffect` for data
  that isn't cache-backed (e.g. Home's opened-map and active-allergy details).
- The Accessibility screen also uses the profile cache, but writes the
  `contrast` field optimistically so the switch responds immediately before the
  Supabase update finishes.
- Renders styles from `styles/main_style.js`.
- Calls `navigation.navigate(...)` for transitions.
- Uses `Alert` for errors (simple, non-blocking).

Screens never import `supabase`.

### `components/NavigationBar.js`

Bottom tab bar used by the four "tab-like" screens (Home, Folders, Friends,
Settings). Uses `useNavigationState` to figure out the active route and
highlights it. The Add (+) button is special: it doesn't navigate to a tab,
it calls a `onAddPress` handler the parent screen provides (which creates a
recipe and routes to `InputSelector`).

### `components/utils/addRecipe.js`

The single helper for "create a blank recipe and start the add flow." Used by
Home, Folders, Friends, and Settings so the `+` button works consistently
everywhere.

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
| `options` | `[{ id, label }]` | the sort keys to render — pass `RECIPE_SORT_OPTIONS` or `FOLDER_SORT_OPTIONS` from [lib/sort.js](../lib/sort.js), or a custom list |
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
`react-native-vector-icons` directly anymore — the only file that does
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
   `AllergyListIcon`, `FolderIcon`.

3. **Stateful wrappers** — take a state prop and pick the right glyph +
   default color internally so callers don't have to keep two icon names
   in sync. `CheckboxIcon` (`checked` / `partial`), `SelectCircleIcon`
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

### `lib/storage.js`

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
  by `normalizeSort()` in [lib/sort.js](../lib/sort.js).
- `KEYS.foldersSort(userId)` — same shape, for the **Folders** grid.
- `KEYS.folderRecipesSort(userId)` — same shape, applied to recipes
  rendered **inside** any folder on FolderDetail.
- `KEYS.recipeOpenedAt(userId)` — map of `{ recipeId: ISO timestamp }`
  for the "Recently opened" sort.

Plus two domain helpers built on the generic ones:

- `recordRecipeOpened(userId, recipeId)` — write the current timestamp
  into the recipe-opens map. Called from RecipeCard on focus.
- `getRecipeOpenedMap(userId)` — read the full map. Called from Home on
  focus.

### `lib/sort.js` — shared sort logic

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

### `lib/cache.js` — stale-while-revalidate cache

A small client-side cache that lets list screens paint instantly from the last
known data while a fresh fetch runs in the background. Built on `lib/storage.js`
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

- **`invalidate(resource, userId)`** — called by the `lib/api/*` write helpers
  after a mutation. Removes the on-disk snapshot (so a cold start doesn't flash
  deleted data) and notifies every mounted hook for that resource to refetch.

Cache keys are namespaced per user (`cache:<resource>:<userId ?? 'anon'>`),
matching the per-user discipline of the `KEYS` registry. This is why mutations
must call `invalidate()` — without it a screen would keep showing its cached
list until the next focus refetch.

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
   │     │              author_notes text[], user_notes text[], is_public)
   │     │ 1:N
   │     ├──▶ recipe_ingredients (recipe_id, position, text)
   │     └──▶ recipe_steps      (recipe_id, position, text)
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
   └──▶ allergies (user_id, name, severity, user_custom)
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
  `RECIPE_SORT_OPTIONS` in [lib/sort.js](../lib/sort.js): *Date added*
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
[lib/sort.js](../lib/sort.js); the screens just call
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

- **[lib/sort.js](../lib/sort.js)** owns options, defaults, the
  `normalizeSort()` back-compat shim, and the pure `sortRecipes` /
  `sortFolders` functions. See the layer-responsibilities section above
  for the full API.
- **[components/SortMenu.js](../components/SortMenu.js)** is the
  pop-down UI. It's stateless about persistence — the parent screen
  owns `useState`.
- **AsyncStorage keys** (in [lib/storage.js](../lib/storage.js)) keep
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
   `RECIPE_SORT_OPTIONS` in `lib/sort.js`.
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
  `addRecipesToFolder`) and "Delete" (bulk `deleteRecipes`).
- On **Folders**: the bulk action is "Delete" (bulk `deleteFolders` from
  [lib/api/folders.js](lib/api/folders.js)) — the confirm alert calls out
  that recipes inside the deleted folders are not deleted, only the
  folders and their recipe-folder mappings.
- On **FolderDetail**: the bulk action is "Remove from folder" via
  `removeRecipesFromFolder` — recipes themselves are not deleted.

The selection state is local to each screen; backing out exits the mode.

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
[lib/api/allergies.js](lib/api/allergies.js)).

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

The Accessibility screen toggles `profiles.contrast` on and off. That value is
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
Hitting the top-right Save calls `syncAllergies({ original:
initialAllergies, updated: items, friendId })` (see the `lib/api/*` note
above) — which does the actual Supabase writes — then `goBack()`. The
back button (top-left) just discards and goes back; there's no "unsaved
changes" prompt here specifically (that confirmation lives on the
Profile/FriendProfile side for their *own* fields — see "Profile editing"
below — allergy edits are a separate, self-contained save).

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
2. **Groups** — composite entries (*Tree nuts*, *Dairy*, etc.). Tapping a
   group adds/removes every member preset at once; half-checked groups
   render a half-circle icon.
3. **Common allergens** — flat list of individual presets.

A live filter input narrows both sections (group descriptions are
searched too — typing "shrimp" surfaces "Crustacean shellfish"). Two
behaviors worth knowing if you touch this component:

- **Group checkboxes track which group was tapped, not raw preset
  overlap.** Several groups share members — "All shellfish" is a superset
  of "Crustacean shellfish" and "Molluscs". Checking "Molluscs" doesn't
  touch "All shellfish"'s own checked/partial state, because that state
  comes from a separate `selectedGroupIds` set (which group was
  *explicitly* tapped), not from re-deriving it off however many of its
  member presets happen to already be selected via a different group.
- **Already-added allergens stay selectable**, they're not disabled. Since
  `EditAllergies`'s `handleAdd` matches by name against what's already
  staged, re-picking one there updates its severity in place rather than
  creating a duplicate — an additional path to adjust an existing entry,
  alongside the trash-can icon in the row list above (which still removes
  outright).

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

- Top-right overlay button reads "Edit" outside edit mode, "Save" inside
  it (previously "Cancel" while editing — that role moved to the back
  button below). Pressing it while editing calls the screen's own
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
  navigate back.

`ConfirmModal` is generic (`visible`, `title`, `message`, `confirmLabel`,
`cancelLabel`, `onConfirm`, `onCancel`) — same visual language as the
app's other custom modals (backdrop + centered card), used here in place
of a native `Alert` because a fully-styled dialog was wanted for this
specific choice.

### Friends screen: search + Add Friend modal

The action bar (below the header, same `home_actionBar` styling as Home/
Folders) has a search box that live-filters the friends list by display
name (`friendDisplayName`, case-insensitive substring), an allergy-overview
icon button (`navigation.navigate('AllergyOverview')`, no params — defaults
to everyone selected), and the "+" button that opens the Add Friend modal.
The "+" used to be a floating absolute-positioned overlay button; it's now
just the last icon in that action bar row, same as Folders' "+".

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
code from the Profile screen. They link to others two ways:

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
  `lib/api/friends.js`).
- The friend's public `profile.notes` becomes readable to the user.
- The friend's own personal allergies are unioned into the Home allergy
  filter when that friend is selected.
- `friendships.friend_notes` (the user's private notes about the friend)
  remains private — RLS scopes it to `user_id = auth.uid()`.

When the friend deletes their account, `existing_friend_id` is set to
`NULL` (via `ON DELETE SET NULL`) but the friendship row survives. The UI
falls back to the snapshotted name and hides the "About them" and "Their
allergies" sections.

### Adding a recipe (InputSelector → EditRecipe)

[screens/InputSelector.js](screens/InputSelector.js) offers three ways to
land on a new recipe, and each ends the flow differently:

- **Manual** — navigates straight to `EditRecipe` with no `recipeId`
  (`isNew`). Saving there calls `createRecipe` and `navigation.popToTop()`
  back to Home.
- **Link, successful parse** — `handleFetch` calls `createRecipe` itself
  (the row already exists) and immediately `navigation.popToTop()`s; the
  user never sees `EditRecipe` for this path.
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

1. Pick the right file in `lib/api/` (or create a new domain file).
2. Add an async function. Reshape DB rows into a camelCase object before
   returning. Throw on error.
3. Import it from your screen. Don't import `supabase` directly.

### A new table

1. Add the table in Supabase (SQL editor or dashboard).
2. Enable RLS and add an owner policy (`user_id = auth.uid()` or similar).
3. Add a corresponding file under `lib/api/` exposing CRUD functions.
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
