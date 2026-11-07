import { parseDuration, resolveTotalMinutes } from './recipeTimes';

// Fetch a recipe page and pull out the schema.org Recipe JSON-LD that
// nearly every major recipe site (AllRecipes, NYT Cooking, Food Network,
// Serious Eats, BBC Good Food, etc.) embeds for SEO.
//
// On success returns: { name, ingredients, steps, servings, prepMinutes,
// cookMinutes, totalMinutes, image?, description?, source, extLink }.
// ingredients / steps are { text, isHeader } items (see lib/recipeItems.js);
// header rows come from HowToSection (steps) and recipe-plugin HTML
// (ingredients — see ingredientSectionsFromHtml).
// On failure throws an Error with a user-facing message.

// Named entities recipe sites commonly emit beyond the XML-ish basics —
// mostly typographic punctuation (curly quotes, dashes, ellipsis, fractions).
const NAMED_ENTITIES = {
  nbsp: ' ',
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  deg: '°',
  frac12: '½',
  frac13: '⅓',
  frac14: '¼',
  frac23: '⅔',
  frac34: '¾',
};

// Decodes both named (&rsquo;) and numeric (&#8217; / &#x2019;) entities —
// JSON-LD text on recipe pages is full of numeric-encoded smart quotes and
// dashes that a fixed named-entity list alone won't catch.
const decodeEntities = (input) =>
  String(input ?? '').replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, ent) => {
    if (ent[0] === '#') {
      const code =
        ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      if (!Number.isFinite(code)) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const name = ent.toLowerCase();
    return name in NAMED_ENTITIES ? NAMED_ENTITIES[name] : match;
  });

const stripHtml = (input) =>
  decodeEntities(String(input ?? '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const findJsonLdBlocks = (html) => {
  const out = [];
  const re = /<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
};

const isType = (node, target) => {
  const t = node?.['@type'];
  if (!t) return false;
  if (Array.isArray(t)) return t.includes(target);
  return t === target;
};

// Recursively search a parsed JSON-LD value for a Recipe node.
const findRecipeNode = (node) => {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== 'object') return null;
  if (isType(node, 'Recipe')) return node;
  if (node['@graph']) {
    const found = findRecipeNode(node['@graph']);
    if (found) return found;
  }
  return null;
};

// Some WordPress recipe plugins wrap their
// metric-conversion shortcode output in parens AND publish the value with
// surrounding parens, producing `((100g))` in the JSON-LD. Collapse any
// `((X))` (where X contains no parens) back to `(X)`.
const collapseDoubleParens = (s) => s.replace(/\(\(([^()]+)\)\)/g, '($1)');

const normalizeIngredients = (raw) => {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .map((s) => collapseDoubleParens(stripHtml(s)))
    .filter((s) => s.length > 0);
};

// `recipeInstructions` can be:
//   - a single string (possibly with HTML)
//   - an array of strings
//   - an array of HowToStep objects (text|name)
//   - an array of HowToSection objects (name + itemListElement → HowToStep[])
// Returns { text, isHeader } items; a named HowToSection becomes a header row
// followed by its steps.
const step = (text) => ({ text, isHeader: false });
const normalizeInstructions = (raw) => {
  if (!raw) return [];
  if (typeof raw === 'string') {
    return stripHtml(raw)
      .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3)
      .map(step);
  }
  const arr = Array.isArray(raw) ? raw : [raw];
  const out = [];
  for (const item of arr) {
    if (typeof item === 'string') {
      const t = stripHtml(item);
      if (t) out.push(step(t));
      continue;
    }
    if (item && typeof item === 'object') {
      if (isType(item, 'HowToSection')) {
        const name = stripHtml(item.name ?? '');
        const children = normalizeInstructions(item.itemListElement);
        if (name && children.length) out.push({ text: name, isHeader: true });
        out.push(...children);
        continue;
      }
      // HowToStep or anything object-shaped — try text, name
      const text = stripHtml(item.text || item.name || '');
      if (text) out.push(step(text));
    }
  }
  return out;
};

// schema.org has no ingredient sections — recipeIngredient is a flat list —
// but the common WordPress recipe plugins render group names in the recipe
// card HTML. For each known plugin, scan its ingredients container for group
// headings and <li> rows, and record which ingredient index each heading
// precedes. Used only when the <li> count matches the JSON-LD ingredient
// count exactly, so a mismatched page never mislabels anything.
const INGREDIENT_CONTAINERS = [
  // WP Recipe Maker
  { start: /class="[^"]*\bwprm-recipe-ingredients-container\b/i, end: /class="[^"]*\bwprm-recipe-instructions-container\b/i },
  // Tasty Recipes
  { start: /class="[^"]*\btasty-recipes-ingredients\b/i, end: /class="[^"]*\btasty-recipes-instructions\b/i },
  // Mediavine Create
  { start: /class="[^"]*\bmv-create-ingredients\b/i, end: /class="[^"]*\bmv-create-instructions\b/i },
];
const SECTION_SCAN_LIMIT = 200000; // chars of HTML to scan past a container start
// Headings (capturing the opening tag's attributes and the inner HTML),
// class-named group titles, and list rows.
const SECTION_TOKEN_RE =
  /<h[2-6]\b([^>]*)>([\s\S]*?)<\/h[2-6]>|<(?:span|div|p|strong)\b[^>]*class="[^"]*group-(?:name|title)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|p|strong)>|<li\b/gi;
// The plugin's own card title ("Ingredients"), not a section. WPRM marks it
// with wprm-recipe-header; group names use wprm-recipe-group-name instead.
const CARD_TITLE_CLASS = /class="[^"]*\bwprm-recipe-header\b/i;
// Card titles often hold controls — a US Customary / Metric unit toggle or
// 1x/2x/3x scaling buttons (e.g. natashaskitchen.com). Their labels aren't
// part of the heading text.
const stripControls = (h) =>
  h
    .replace(
      /<(a|span|button)\b[^>]*class="[^"]*(?:unit-conversion|convert|scale|adjust)[^"]*"[^>]*>[\s\S]*?<\/\1>/gi,
      ' '
    )
    .replace(/<(button|select)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
// Container titles, not section names (after controls are stripped).
const NOT_A_SECTION = /^(ingredients?|ingredient list)\s*:?$/i;

const ingredientSectionsFromHtml = (html, count) => {
  for (const { start, end } of INGREDIENT_CONTAINERS) {
    const at = html.search(start);
    if (at < 0) continue;
    let chunk = html.slice(at, at + SECTION_SCAN_LIMIT);
    const stop = chunk.search(end);
    if (stop > 0) chunk = chunk.slice(0, stop);

    const sections = [];
    let seen = 0;
    SECTION_TOKEN_RE.lastIndex = 0;
    let m;
    while ((m = SECTION_TOKEN_RE.exec(chunk))) {
      const [, headingAttrs, headingHtml, groupHtml] = m;
      const heading = headingHtml ?? groupHtml;
      if (heading === undefined) {
        seen++;
        continue;
      }
      if (headingHtml !== undefined && CARD_TITLE_CLASS.test(headingAttrs)) continue;
      const name = stripHtml(stripControls(heading));
      if (name && !NOT_A_SECTION.test(name)) sections.push({ index: seen, name });
    }
    if (seen === count) return sections.filter((x) => x.index < count);
  }
  return [];
};

// Flat ingredient strings + section positions -> { text, isHeader } items.
const withSections = (ingredients, sections) => {
  const out = [];
  ingredients.forEach((text, i) => {
    for (const sct of sections) if (sct.index === i) out.push({ text: sct.name, isHeader: true });
    out.push({ text, isHeader: false });
  });
  return out;
};

const normalizeImage = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return normalizeImage(raw[0]);
  if (typeof raw === 'object') return raw.url || raw['@id'] || null;
  return null;
};

// `recipeYield` comes in many shapes: 4, "4", "4 servings", "Serves 4-6",
// ["4", "4 servings"], or a QuantitativeValue { value: 4 }. Returns the first
// count as a positive integer (a range uses its low end), or null. In an
// array, an entry that mentions servings/people beats one that doesn't, so
// ["24 cookies", "12 servings"] gives 12. No yield -> null (not filled in).
const SERVINGS_WORD_RE = /serv|people|person|portion/i;
const parseServings = (raw) => {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const preferred = raw.find((r) => typeof r === 'string' && SERVINGS_WORD_RE.test(r));
    for (const item of preferred !== undefined ? [preferred, ...raw] : raw) {
      const n = parseServings(item);
      if (n) return n;
    }
    return null;
  }
  if (typeof raw === 'object') return parseServings(raw.value ?? raw.name ?? null);
  const m = String(raw).match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Math.round(Number(m[0]));
  return n > 0 ? n : null;
};

const getHostname = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

// Bounds on a single import. Times out after 60s
const FETCH_TIMEOUT_MS = 60000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5MB — generous for any real recipe page

export const fetchRecipeFromUrl = async (rawUrl) => {
  const url = (rawUrl ?? '').trim();
  if (!url) throw new Error('Enter a recipe URL.');
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('URL must start with http:// or https://');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Some sites serve a stripped-down body to unknown UAs; a generic
        // browser-ish UA usually works.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('That website took too long to respond. Try again later.');
    }
    // fetch itself threw — almost always DNS lookup failure (typo / site
    // doesn't exist), the user being offline, or a CORS block. React
    // Native surfaces all three as the same generic "Network request
    // failed", so we surface one friendly catch-all.
    throw new Error("We can't reach that website. Double-check the link and your internet connection.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("We couldn't find that page — it may have moved or been deleted.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('That page is private or requires you to sign in.');
    }
    if (res.status >= 500) {
      throw new Error('That website is having trouble right now. Try again in a few minutes.');
    }
    throw new Error(`That website wouldn't show us the page (error ${res.status}).`);
  }

  // Bail before buffering the body at all if the server is upfront about a
  // huge size; falls through to the post-read length check below for
  // chunked responses or servers that omit/understate Content-Length.
  const contentLength = parseInt(res.headers?.get?.('content-length') ?? '', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new Error("That page is too large to import.");
  }

  let html;
  try {
    html = await res.text();
  } catch {
    throw new Error("We couldn't read that page.");
  }

  if (html.length > MAX_RESPONSE_BYTES) {
    throw new Error("That page is too large to import.");
  }

  const blocks = findJsonLdBlocks(html);
  if (!blocks.length) {
    throw new Error("No recipe data found on that page (no schema.org markup).");
  }

  let recipe = null;
  for (const raw of blocks) {
    try {
      // Many pages include trailing commas or comments; JSON.parse will reject
      // those. Trying as-is first is fast and works on ~99% of major sites.
      const parsed = JSON.parse(raw);
      const found = findRecipeNode(parsed);
      if (found) {
        recipe = found;
        break;
      }
    } catch {
      // skip malformed block
    }
  }

  if (!recipe) {
    throw new Error("That page doesn't seem to have a recipe.");
  }

  const name = stripHtml(recipe.name ?? '');
  const ingredientTexts = normalizeIngredients(recipe.recipeIngredient);
  const ingredients = withSections(
    ingredientTexts,
    ingredientSectionsFromHtml(html, ingredientTexts.length)
  );
  const steps = normalizeInstructions(recipe.recipeInstructions);
  const image = normalizeImage(recipe.image);
  const description = stripHtml(recipe.description ?? '');
  const servings = parseServings(recipe.recipeYield);
  const prepMinutes = parseDuration(recipe.prepTime);
  const cookMinutes = parseDuration(recipe.cookTime);
  const totalMinutes = resolveTotalMinutes({
    prepMinutes,
    cookMinutes,
    totalMinutes: parseDuration(recipe.totalTime),
  });

  if (!name && !ingredients.length && !steps.length) {
    throw new Error("Couldn't read the recipe on that page.");
  }

  return {
    name,
    ingredients,
    steps,
    servings,
    prepMinutes,
    cookMinutes,
    totalMinutes,
    image: image || null,
    description: description || null,
    source: getHostname(url),
    extLink: url,
  };
};
