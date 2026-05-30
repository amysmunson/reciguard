import { supabase } from '../supabase';
import { colors } from '../../styles/theme';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

const shapeAllergy = (row) => ({
  id: row.id,
  name: row.name,
  severity: row.severity,
  userCustom: row.user_custom ?? false,
  friendId: row.friend_id ?? null,
  createdAt: row.created_at,
});

// ---------------------------------------------------------------------------
// Severity model
// ---------------------------------------------------------------------------

export const SEVERITY_RANK = { unknown: 0, mild: 1, moderate: 2, severe: 3 };

export const normalizeSeverity = (s) => {
  const lc = (s ?? '').toLowerCase().trim();
  if (lc === 'severe' || lc === 'moderate' || lc === 'mild') return lc;
  return 'unknown';
};

// Foreground dot color
export const severityColor = (severity) => {
  switch (normalizeSeverity(severity)) {
    case 'severe':   return colors.severityHigh;
    case 'moderate': return colors.severityMedium;
    case 'mild':     return colors.severityLow;
    default:         return colors.severityNone;
  }
};

// Translucent background used to highlight matching ingredient text
export const severityBackground = (severity) => {
  switch (normalizeSeverity(severity)) {
    case 'severe':   return colors.severityHighBg;
    case 'moderate': return colors.severityMediumBg;
    case 'mild':     return colors.severityLowBg;
    default:         return colors.severityNoneBg;
  }
};

export const severityLabel = (severity) => {
  const s = normalizeSeverity(severity);
  return s === 'unknown' ? 'Unspecified' : s.charAt(0).toUpperCase() + s.slice(1);
};

// ---------------------------------------------------------------------------
// Personal-allergy CRUD
// ---------------------------------------------------------------------------

export const getMyAllergies = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('allergies')
    .select('*')
    .eq('user_id', user.id)
    .is('friend_id', null);
  if (error) throw error;
  return (data ?? []).map(shapeAllergy);
};

export const getFriendAllergies = async (friendId) => {
  const { data, error } = await supabase
    .from('allergies')
    .select('*')
    .eq('friend_id', friendId);
  if (error) throw error;
  return (data ?? []).map(shapeAllergy);
};

export const getLinkedUserAllergies = async (linkedUserId) => {
  const { data, error } = await supabase
    .from('allergies')
    .select('*')
    .eq('user_id', linkedUserId)
    .is('friend_id', null);
  if (error) throw error;
  return (data ?? []).map(shapeAllergy);
};

export const addAllergy = async ({ name, severity = null, userCustom = true, friendId = null }) => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('allergies')
    .insert({
      user_id: user.id,
      name,
      severity,
      user_custom: userCustom,
      friend_id: friendId,
    })
    .select()
    .single();
  if (error) throw error;
  return shapeAllergy(data);
};

export const updateAllergySeverity = async (allergyId, severity) => {
  const { data, error } = await supabase
    .from('allergies')
    .update({ severity })
    .eq('id', allergyId)
    .select()
    .single();
  if (error) throw error;
  return shapeAllergy(data);
};

export const deleteAllergy = async (allergyId) => {
  const { error } = await supabase.from('allergies').delete().eq('id', allergyId);
  if (error) throw error;
};

// ---------------------------------------------------------------------------
// Active filter — returns per-(profile, allergy) records so the UI can
// compute one indicator per person and resolve highest-severity per ingredient.
//
// Returns: [{ profileId, profileName, name (lowercased), severity }, ...]
//   - profileId is 'self' for the current user, otherwise the friendship id
//   - Per-friend "profileName" prefers the linked profile name, falls back
//     to the snapshot in friendships.friend_name
// ---------------------------------------------------------------------------
export const getActiveAllergyDetails = async ({
  includeSelf,
  friendshipIds = [],
  myName = 'Me',
}) => {
  const user = await requireUser();
  const out = [];

  if (includeSelf) {
    const { data, error } = await supabase
      .from('allergies')
      .select('name, severity')
      .eq('user_id', user.id)
      .is('friend_id', null);
    if (error) throw error;
    for (const r of data ?? []) {
      if (!r.name) continue;
      out.push({
        profileId: 'self',
        profileName: myName,
        name: r.name.toLowerCase(),
        severity: normalizeSeverity(r.severity),
      });
    }
  }

  if (friendshipIds.length) {
    const { data: friendships, error: fErr } = await supabase
      .from('friendships')
      .select('id, friend_name, existing_friend_id, linked_profile:existing_friend_id(name)')
      .in('id', friendshipIds);
    if (fErr) throw fErr;

    const friendshipById = new Map();
    const friendshipByLinkedUser = new Map();
    for (const f of friendships ?? []) {
      const displayName = f.linked_profile?.name || f.friend_name || 'Unnamed';
      const meta = {
        id: f.id,
        name: displayName,
        linkedUserId: f.existing_friend_id,
      };
      friendshipById.set(f.id, meta);
      if (f.existing_friend_id) friendshipByLinkedUser.set(f.existing_friend_id, meta);
    }

    // Local notes about each friendship (friend_id = friendship.id)
    const { data: local, error: e1 } = await supabase
      .from('allergies')
      .select('name, severity, friend_id')
      .in('friend_id', friendshipIds);
    if (e1) throw e1;
    for (const r of local ?? []) {
      const f = friendshipById.get(r.friend_id);
      if (!f || !r.name) continue;
      out.push({
        profileId: f.id,
        profileName: f.name,
        name: r.name.toLowerCase(),
        severity: normalizeSeverity(r.severity),
      });
    }

    // For linked friendships, the friend's own personal allergies
    const linkedUserIds = Array.from(friendshipByLinkedUser.keys());
    if (linkedUserIds.length) {
      const { data: theirs, error: e2 } = await supabase
        .from('allergies')
        .select('name, severity, user_id')
        .in('user_id', linkedUserIds)
        .is('friend_id', null);
      if (e2) throw e2;
      for (const r of theirs ?? []) {
        const f = friendshipByLinkedUser.get(r.user_id);
        if (!f || !r.name) continue;
        out.push({
          profileId: f.id,
          profileName: f.name,
          name: r.name.toLowerCase(),
          severity: normalizeSeverity(r.severity),
        });
      }
    }
  }

  return out;
};

// ---------------------------------------------------------------------------
// Pure UI helpers (no DB) — match recipes/ingredients against active allergies
// ---------------------------------------------------------------------------

const matchHits = (text, activeAllergies) => {
  if (!text || !activeAllergies?.length) return [];
  const lower = text.toLowerCase();
  return activeAllergies.filter((a) => a.name && lower.includes(a.name));
};

// Collapse per-profile, taking max severity for each. Returns array
// suitable for rendering a row of colored dots on a recipe tile.
//   [{ profileId, profileName, severity }, ...]
// Sorted severe → mild and capped at `maxDots` (default 5) since the tile
// has no room for unbounded dots and no names are displayed — the lowest-
// severity people drop off when there are too many to show.
export const MAX_TILE_DOTS = 5;

export const dotsForRecipe = (recipe, activeAllergies, maxDots = MAX_TILE_DOTS) => {
  if (!recipe?.ingredients?.length || !activeAllergies?.length) return [];
  const byProfile = new Map();
  for (const ingredient of recipe.ingredients) {
    for (const h of matchHits(ingredient, activeAllergies)) {
      const existing = byProfile.get(h.profileId);
      if (!existing || SEVERITY_RANK[h.severity] > SEVERITY_RANK[existing.severity]) {
        byProfile.set(h.profileId, {
          profileId: h.profileId,
          profileName: h.profileName,
          severity: h.severity,
        });
      }
    }
  }
  return Array.from(byProfile.values())
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
    .slice(0, maxDots);
};

// For an ingredient in RecipeCard: returns the highlight color (max severity)
// and every matching person with their individual severity. The UI uses the
// max severity to color the ingredient highlight, then renders each name in
// the person's own severity color.
//   null when nothing matches.
//   { severity, color, background, people: [{ name, severity }] }
//   `severity` / `color` / `background` reflect the highest severity across
//   all matching people (drives the ingredient's tint).
//   `people` is sorted severe → mild so the most concerning name reads first.
export const ingredientAllergyInfo = (ingredient, activeAllergies) => {
  const hits = matchHits(ingredient, activeAllergies);
  if (!hits.length) return null;

  // Collapse per profile so each person appears once with their max severity
  // for this ingredient.
  const byProfile = new Map();
  for (const h of hits) {
    const existing = byProfile.get(h.profileId);
    if (!existing || SEVERITY_RANK[h.severity] > SEVERITY_RANK[existing.severity]) {
      byProfile.set(h.profileId, { name: h.profileName, severity: h.severity });
    }
  }
  const people = Array.from(byProfile.values()).sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
  );

  const maxSeverity = people[0].severity;

  return {
    severity: maxSeverity,
    color: severityColor(maxSeverity),
    background: severityBackground(maxSeverity),
    people,
  };
};
