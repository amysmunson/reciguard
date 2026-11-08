// Cooking-time helpers. Times are stored as whole minutes (prep_minutes,
// cook_minutes, total_minutes on recipes).

// schema.org prepTime / cookTime / totalTime are ISO 8601 durations, e.g.
// "PT15M", "PT1H30M", "P0DT1H", "PT90M". Some sites publish plain text
// ("1 hour 30 minutes") or a bare number of minutes instead. Returns whole
// minutes, or null when absent/unreadable. Zero counts as absent — many sites
// publish "PT0M" for a recipe with no cook time.
export const parseDuration = (raw) => {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return raw > 0 ? Math.round(raw) : null;
  const s = String(raw).trim();

  const iso = s.match(
    /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i
  );
  if (iso && (iso[1] || iso[2] || iso[3] || iso[4])) {
    const [, d = 0, h = 0, m = 0, sec = 0] = iso;
    const total = Number(d) * 1440 + Number(h) * 60 + Number(m) + Number(sec) / 60;
    return total > 0 ? Math.max(1, Math.round(total)) : null;
  }

  // Text fallback: "1 hour 30 minutes", "1 hr 15 mins", "45 min".
  const hours = s.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i);
  const mins = s.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/i);
  if (hours || mins) {
    const total = Math.round(Number(hours?.[1] ?? 0) * 60 + Number(mins?.[1] ?? 0));
    return total > 0 ? total : null;
  }
  if (/^\d+$/.test(s)) return Number(s) > 0 ? Number(s) : null;
  return null;
};

// 45 -> "45 min", 60 -> "1 hr", 90 -> "1 hr 30 min", 1500 -> "25 hr".
export const formatMinutes = (minutes) => {
  if (minutes == null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

// Fills in total when only prep and/or cook are known. A published or typed
// total wins, since it can include resting/marinating time.
export const resolveTotalMinutes = ({ prepMinutes, cookMinutes, totalMinutes }) => {
  if (totalMinutes != null) return totalMinutes;
  if (prepMinutes == null && cookMinutes == null) return null;
  return (prepMinutes ?? 0) + (cookMinutes ?? 0);
};
