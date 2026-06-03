# RecipeGuard

RecipeGuard is a React Native + Expo app with a Supabase backend for storing recipes, organizing them into folders, and tracking food allergies for yourself and friends.


## Features

- Create, edit, and delete recipes
- Organize recipes into folders
- Search recipes by name
- Sort recipes and folders by date added, last edited, recently opened, or alphabetical — ascending or descending, persisted per-user per-screen
- Track allergies for yourself and friends
- Filter by allergies for different people and groups
- Severity-aware allergy warnings inside recipes and in list
- Friend profile linking via unique friend codes
- Persistent per-user filters and preferences
- Instant list loads with a stale-while-revalidate cache
- Authentication with Supabase Auth


## Allergy System

This app includes an allergy-aware filtering system.

### Features

- Personal allergies
- Friend allergies
- Severity levels
    - Unknown 
    - Mild
    - Moderate
    - Severe
- Ingredient-level warnings
- Recipe-level warning dots
- Persistent allergy filters

### Severity Colors

- Severe → Red
- Moderate → Orange
- Mild → Yellow
- Unknown → Gray


## Friend System

Users can:

- Add manual friends
- Link friends to real accounts using friend codes
- Track friend allergies
- Store private notes per friendship

Linked friendships automatically include the friend's public allergies in allergy filtering.


## Tech Stack

### Frontend

- React Native
- Expo SDK 54
- React Navigation
- react-native-svg

### Backend

- Supabase
    - Postgres
    - Auth
    - Row Level Security (RLS)
- AsyncStorage
    - Session persistence
    - Local recipe-open timestamps
    - Per-user filter persistence
    - Sort preferences
    - Cached list snapshots (recipes, folders, friends)
    - Local storage keys are namespaced per-user.


## Project Structure

```txt
recipes/
├── App.js
├── lib/
│   ├── supabase.js
│   ├── auth-context.js
│   ├── storage.js
│   ├── cache.js
│   └── api/
├── screens/
├── components/
├── styles/
├── constants/
├── assets/
└── docs/
```


## Authentication Flow

The app conditionally renders navigators based on session state:

```txt
No session  -> AuthStack
Session     -> AppStack
```


### AuthStack
- Landing
- Login
- SignUp
- PrivacyPolicy

### AppStack
- Home
- RecipeCard
- EditRecipe
- Folders
- FolderDetail
- Friends
- FriendProfile
- Profile
- Settings


## Setup

These environment variables are required to connect to the Supabase database. See .env.examples for an example .env file.

```env
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```


## Running Locally

Install dependencies:

```bash
npx expo install
```

Run the app:

```bash
npx expo start --tunnel
```

Run on iOS using the Expo Go app.


## Future Plans
- [ ] Apple app store deployment
- [ ] Recipe sharing
- [ ] Collaborative folders
- [ ] Re-enable Supabase email authentication on sign up
- [ ] AI-assisted recipe import
- [ ] Image-based recipe parsing


## Development Notes

### Package Management

Always install Expo-compatible packages using:

```bash
npx expo install <package>
```

Do not use:

```bash
npm install <package>
```

for Expo-managed dependencies.


### Security

- Row Level Security (RLS) is enabled on all tables
- All rows are scoped to the authenticated user
- Friend-code lookup is handled through a restricted RPC
- email


### Sorting

Three screens render sortable grids — Home (recipes), Folders (folders),
and FolderDetail (recipes inside a folder). They all share the same
architecture so the sort UI, persistence, and ordering behave
identically across the app:

- **[`lib/sort.js`](lib/sort.js)** owns the sort options
  (`RECIPE_SORT_OPTIONS`, `FOLDER_SORT_OPTIONS`), the defaults, a
  `normalizeSort()` back-compat shim, and the pure `sortRecipes` /
  `sortFolders` helpers. Sort math lives here; screens just call into it.
- **[`components/SortMenu.js`](components/SortMenu.js)** is a stateless
  pop-down: a radio list of options plus an asc/desc direction toggle.
  Used by all three screens with different `options` arrays.
- **AsyncStorage keys** persist each screen's selection per-user:
  - `KEYS.homeSort(userId)` — Home recipes
  - `KEYS.foldersSort(userId)` — Folders grid
  - `KEYS.folderRecipesSort(userId)` — recipes inside any folder

Each screen holds the `sort` state, hydrates it from AsyncStorage on
mount (via `normalizeSort()` so any legacy bare-string entries upgrade
cleanly to the `{ by, dir }` shape), saves on change, and feeds the
result through `sortRecipes` / `sortFolders` before rendering. A small
primary-colored dot on the sort icon signals a non-default selection.

To add a sort key, add an entry to the relevant options array in
`lib/sort.js` and a branch in `recipeKey()` / `folderKey()` — every
consumer screen picks it up automatically. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#sorting-home-folders-folderdetail)
for the full pattern.
