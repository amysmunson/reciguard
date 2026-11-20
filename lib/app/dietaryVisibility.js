import { dotsForRecipe } from '../server/api/allergies';

// Settings → "Hide recipes with dietary conflicts" lives on the profile
// (profiles.hide_unsafe_recipes), so screens read it from the profile they
// already load (useCachedResource 'profile'): instant from the device cache,
// and it updates on every screen the moment the switch flips.
export const hidesUnsafeRecipes = (profile) => !!profile?.hide_unsafe_recipes;

// Hide-or-warn for a recipe list. With the setting on and a dietary filter
// active, recipes that would show warning dots are left out; returns how many
// so the screen can say so. Otherwise the list passes through unchanged and
// the tiles show dots as before.
export const applyDietaryVisibility = (recipes, { hide, filterActive, activeAllergies }) => {
  if (!hide || !filterActive) return { visible: recipes, hiddenCount: 0 };
  const visible = recipes.filter((r) => dotsForRecipe(r, activeAllergies).length === 0);
  return { visible, hiddenCount: recipes.length - visible.length };
};
