import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { setColorTokens } from '../styles/theme';
import { rebuildStyles } from '../styles/main_style';
import { loadJson, saveJson } from './storage';
import { useHasUnsavedChanges } from './unsavedChanges';

// Light / dark mode. The user picks System (follow the phone), Light, or Dark
// in Settings; the choice is per device and survives sign-out.
//
// How a scheme change reaches the UI: every component reads `colors` (styles/
// theme.js) and `styles` (styles/main_style.js) at render time, so
// applyColorScheme() swaps the tokens in place and rebuilds the stylesheet,
// and App.js remounts the navigator (keyed by scheme) so every screen
// re-renders with the new values. The navigation state is carried across the
// remount, so the user stays on the same screen. A remount would drop
// anything typed but not saved, so while any screen or modal has unsaved
// edits (lib/unsavedChanges.js) a scheme change — e.g. the phone switching to
// dark at sunset — is held back and applied once the edit is saved or
// discarded.

export const THEME_PREFERENCES = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const isPreference = (v) => THEME_PREFERENCES.some((p) => p.value === v);

// Device-wide (not per user), so it isn't in lib/storage.js's per-user KEYS.
const THEME_PREFERENCE_KEY = 'app.themePreference';

let appliedScheme = 'light';
export const applyColorScheme = (scheme) => {
  if (scheme === appliedScheme) return;
  setColorTokens(scheme);
  rebuildStyles();
  appliedScheme = scheme;
};

const ThemeContext = createContext({
  preference: 'system',
  scheme: 'light',
  setPreference: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [preference, setPreferenceState] = useState(null); // null until loaded
  const systemScheme = useColorScheme();
  const hasUnsaved = useHasUnsavedChanges();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadJson(THEME_PREFERENCE_KEY, 'system');
      if (!cancelled) setPreferenceState(isPreference(saved) ? saved : 'system');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Also tell the OS, so native UI (alerts, keyboards, pickers) matches a
  // manual choice. 'unspecified' hands control back to the system setting.
  useEffect(() => {
    if (preference === null) return;
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  const setPreference = (next) => {
    if (!isPreference(next)) return;
    setPreferenceState(next);
    saveJson(THEME_PREFERENCE_KEY, next);
  };

  // Hold the first paint until the saved preference is known, so a dark-mode
  // user never sees a flash of light mode.
  if (preference === null) return null;

  const wanted =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  // Keep the current scheme while something is unsaved; switch when clean.
  const scheme = hasUnsaved ? appliedScheme : wanted;
  // Swap tokens before any child renders this pass (idempotent).
  applyColorScheme(scheme);

  return (
    <ThemeContext.Provider value={{ preference, scheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
