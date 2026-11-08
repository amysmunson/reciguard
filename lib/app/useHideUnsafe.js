import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadJson, KEYS } from './storage';
import { dotsForRecipe } from '../server/api/allergies';

// Settings → "Hide recipes with dietary conflicts". Re-read on every focus so
// flipping the switch in Settings applies as soon as you return to a list.
export const useHideUnsafe = (userId) => {
  const [hide, setHide] = useState(false);
  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;
      let cancelled = false;
      (async () => {
        const saved = await loadJson(KEYS.hideUnsafeRecipes(userId), false);
        if (!cancelled) setHide(!!saved);
      })();
      return () => {
        cancelled = true;
      };
    }, [userId])
  );
  return hide;
};

// Hide-or-warn for a recipe list. With the setting on and a dietary filter
// active, recipes that would show warning dots are left out; returns how many
// so the screen can say so. Otherwise the list passes through unchanged and
// the tiles show dots as before.
export const applyDietaryVisibility = (recipes, { hide, filterActive, activeAllergies }) => {
  if (!hide || !filterActive) return { visible: recipes, hiddenCount: 0 };
  const visible = recipes.filter((r) => dotsForRecipe(r, activeAllergies).length === 0);
  return { visible, hiddenCount: recipes.length - visible.length };
};
