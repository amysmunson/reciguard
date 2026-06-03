// Fetch a recipe page and pull out the schema.org Recipe JSON-LD that
// nearly every major recipe site (AllRecipes, NYT Cooking, Food Network,
// Serious Eats, BBC Good Food, etc.) embeds for SEO.
//
// On success returns: { name, ingredients, steps, image?, description?, source, hostname }
// On failure throws an Error with a user-facing message.

const stripHtml = (input) =>
  String(input ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const findJsonLdBlocks = (html) => {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
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
//   - an array of HowToSection objects (itemListElement → HowToStep[])
const normalizeInstructions = (raw) => {
  if (!raw) return [];
  if (typeof raw === 'string') {
    return stripHtml(raw)
      .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);
  }
  const arr = Array.isArray(raw) ? raw : [raw];
  const out = [];
  for (const item of arr) {
    if (typeof item === 'string') {
      const t = stripHtml(item);
      if (t) out.push(t);
      continue;
    }
    if (item && typeof item === 'object') {
      if (isType(item, 'HowToSection')) {
        out.push(...normalizeInstructions(item.itemListElement));
        continue;
      }
      // HowToStep or anything object-shaped — try text, name
      const text = stripHtml(item.text || item.name || '');
      if (text) out.push(text);
    }
  }
  return out;
};

const normalizeImage = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return normalizeImage(raw[0]);
  if (typeof raw === 'object') return raw.url || raw['@id'] || null;
  return null;
};

const getHostname = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

export const fetchRecipeFromUrl = async (rawUrl) => {
  const url = (rawUrl ?? '').trim();
  if (!url) throw new Error('Enter a recipe URL.');
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('URL must start with http:// or https://');
  }

  let res;
  try {
    res = await fetch(url, {
      headers: {
        // Some sites serve a stripped-down body to unknown UAs; a generic
        // browser-ish UA usually works.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
  } catch {
    // fetch itself threw — almost always DNS lookup failure (typo / site
    // doesn't exist), the user being offline, or a CORS block. React
    // Native surfaces all three as the same generic "Network request
    // failed", so we surface one friendly catch-all.
    throw new Error("We can't reach that website. Double-check the link and your internet connection.");
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

  let html;
  try {
    html = await res.text();
  } catch {
    throw new Error("We couldn't read that page.");
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
  const ingredients = normalizeIngredients(recipe.recipeIngredient);
  const steps = normalizeInstructions(recipe.recipeInstructions);
  const image = normalizeImage(recipe.image);
  const description = stripHtml(recipe.description ?? '');

  if (!name && !ingredients.length && !steps.length) {
    throw new Error("Couldn't read the recipe on that page.");
  }

  return {
    name,
    ingredients,
    steps,
    image: image || null,
    description: description || null,
    source: getHostname(url),
    extLink: url,
  };
};
