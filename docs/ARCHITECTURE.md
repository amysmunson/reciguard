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
│   ├── Folders.js                  # Grid of folders + create-folder modal
│   ├── FolderDetail.js             # Recipes inside a single folder
│   ├── Friends.js                  # List of friends + add-friend modal
│   ├── FriendProfile.js            # Friend notes + per-friend allergies
│   └── Settings.js                 # Sign out + delete account + privacy policy link
│
├── components/                     # Shared UI + utilities (NOT screens)
│   ├── NavigationBar.js            # Bottom tab bar with active-tab highlight
│   ├── utils/
│   │   └── addRecipe.js            # createRecipe() + navigate to InputSelector
│   └── samples/
│       └── sample_recipes.js       # Reference sample data (preserved by request)
│
├── styles/
│   └── main_style.js               # Single shared StyleSheet for the whole app
│
├── constants/
│   └── theme.ts                    # Reserved for future theming
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

When you need a new piece of data, add a function to the appropriate file (or
a new file under `lib/api/`). Don't query Supabase from a screen.

### `screens/*` — the UI

Each screen is a default-exported React component that:

- Reads params via `route.params` (e.g. `recipeId`, `folderId`, `friendshipId`).
- Calls `lib/api/*` functions inside `useFocusEffect` (for "refresh when shown")
  or `useEffect` (for "load once").
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
profiles (id FK → auth.users, name, email, notes, phone)
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
