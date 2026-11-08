// Scales the leading amount of a free-text ingredient line, e.g.
//   scaleIngredient('1 1/2 cups flour', 2)  -> '3 cups flour'
//   scaleIngredient('½ tsp salt', 3)        -> '1½ tsp salt'
//   scaleIngredient('2-3 cloves garlic', 2) -> '4-6 cloves garlic'
// Only the quantity at the start of the line is touched; lines without one
// (e.g. "Salt, to taste") and amounts later in the text come back unchanged.

export const MULTIPLIERS = [
  { value: 0.5, label: '½×' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 3, label: '3×' },
];

const UNICODE_FRACTIONS = {
  '¼': 1 / 4, '½': 1 / 2, '¾': 3 / 4,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅕': 1 / 5, '⅖': 2 / 5, '⅗': 3 / 5, '⅘': 4 / 5,
  '⅙': 1 / 6, '⅚': 5 / 6,
  '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8,
};
const U = Object.keys(UNICODE_FRACTIONS).join('');

// One amount: "1 1/2", "1 ½", "1½", "1/2", "½", "1.5", ".5", "2".
const NUM = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\s*[${U}]|\\d+\\/\\d+|[${U}]|\\d*\\.\\d+|\\d+)`;
// Leading amount, optionally a range ("2-3", "2 to 3"), not followed by more
// digits (so "350°" style partial matches don't happen mid-number).
const LEADING_RE = new RegExp(
  `^(\\s*)(${NUM})(?:(\\s*(?:-|–|—|to)\\s*)(${NUM}))?(?![\\d/.])`
);

const parseAmount = (str) => {
  const s = str.trim();
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = s.match(new RegExp(`^(\\d+)\\s*([${U}])$`));
  if (m) return Number(m[1]) + UNICODE_FRACTIONS[m[2]];
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[2]) ? Number(m[1]) / Number(m[2]) : NaN;
  if (UNICODE_FRACTIONS[s] !== undefined) return UNICODE_FRACTIONS[s];
  return Number(s);
};

// Fractions cooks actually use, as unicode glyphs.
const FRACTION_GLYPHS = [
  [1 / 8, '⅛'], [1 / 6, '⅙'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
  [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [5 / 6, '⅚'], [7 / 8, '⅞'],
];

export const formatAmount = (n) => {
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  if (frac < 0.01) return String(whole);
  if (frac > 0.99) return String(whole + 1);
  const glyph = FRACTION_GLYPHS.find(([v]) => Math.abs(v - frac) < 0.01);
  if (glyph) return whole ? `${whole}${glyph[1]}` : glyph[1];
  // Not a common fraction (e.g. 0.6) — fall back to a trimmed decimal.
  return String(Math.round(n * 100) / 100);
};

export const scaleIngredient = (text, multiplier) => {
  if (!text || multiplier === 1) return text;
  const m = text.match(LEADING_RE);
  if (!m) return text;
  const [match, lead, first, sep, second] = m;
  const a = parseAmount(first);
  if (!Number.isFinite(a)) return text;
  let scaled = formatAmount(a * multiplier);
  if (second !== undefined) {
    const b = parseAmount(second);
    if (!Number.isFinite(b)) return text;
    scaled += sep + formatAmount(b * multiplier);
  }
  return lead + scaled + text.slice(match.length);
};
