// Static catalog of common food allergens used by the preset picker.
// Editing this file is the only place to add/remove options the user sees in
// "Browse common allergies." Nothing here hits the database — picks are
// converted into normal allergy rows at add time, indistinguishable from
// freeform entries except for the `user_custom = false` flag.
//
// Substring matching against ingredient text is forgiving (case-insensitive,
// "milk" matches "buttermilk"), so canonical names are kept short and
// lowercase-friendly. Don't add aliases to a single preset — instead, add
// multiple presets and bind them together in a group below.

export const ALLERGEN_PRESETS = [
  // Tree nuts
  { id: 'almond',     name: 'almond' },
  { id: 'cashew',     name: 'cashew' },
  { id: 'walnut',     name: 'walnut' },
  { id: 'pecan',      name: 'pecan' },
  { id: 'hazelnut',   name: 'hazelnut' },
  { id: 'pistachio',  name: 'pistachio' },
  { id: 'macadamia',  name: 'macadamia' },
  { id: 'brazil-nut', name: 'brazil nut' },
  { id: 'pine-nut',   name: 'pine nut' },

  // Other nut / legume
  { id: 'peanut',     name: 'peanut' },

  // Dairy
  { id: 'milk',       name: 'milk' },
  { id: 'cheese',     name: 'cheese' },
  { id: 'butter',     name: 'butter' },
  { id: 'cream',      name: 'cream' },
  { id: 'yogurt',     name: 'yogurt' },
  { id: 'lactose',    name: 'lactose' },

  // Eggs
  { id: 'egg',        name: 'egg' },

  // Fish / shellfish
  { id: 'fish',       name: 'fish' },
  { id: 'shrimp',     name: 'shrimp' },
  { id: 'crab',       name: 'crab' },
  { id: 'lobster',    name: 'lobster' },
  { id: 'clam',       name: 'clam' },
  { id: 'mussel',     name: 'mussel' },
  { id: 'oyster',     name: 'oyster' },
  { id: 'scallop',    name: 'scallop' },
  { id: 'squid',      name: 'squid' },

  // Grains
  { id: 'wheat',      name: 'wheat' },
  { id: 'gluten',     name: 'gluten' },
  { id: 'rye',        name: 'rye' },
  { id: 'barley',     name: 'barley' },
  { id: 'oat',        name: 'oat' },

  // Seeds / legumes / other
  { id: 'soy',        name: 'soy' },
  { id: 'sesame',     name: 'sesame' },
  { id: 'mustard',    name: 'mustard' },
  { id: 'sulfite',    name: 'sulfite' },
  { id: 'corn',       name: 'corn' },
  { id: 'celery',     name: 'celery' },

  // Fruits (less common but real)
  { id: 'kiwi',       name: 'kiwi' },
  { id: 'banana',     name: 'banana' },
  { id: 'avocado',    name: 'avocado' },
];

// Groups expand into their member presets on pick. The user gets one allergy
// row per member so ingredient matching stays naturally accurate.
export const ALLERGEN_GROUPS = [
  {
    id: 'tree-nuts',
    name: 'Tree nuts',
    description: 'Almond, cashew, walnut, pecan, hazelnut, pistachio, macadamia, brazil nut, pine nut',
    memberIds: [
      'almond', 'cashew', 'walnut', 'pecan', 'hazelnut',
      'pistachio', 'macadamia', 'brazil-nut', 'pine-nut',
    ],
  },
  {
    id: 'all-nuts',
    name: 'All nuts (peanut + tree nuts)',
    description: 'Peanut plus every tree nut',
    memberIds: [
      'peanut', 'almond', 'cashew', 'walnut', 'pecan', 'hazelnut',
      'pistachio', 'macadamia', 'brazil-nut', 'pine-nut',
    ],
  },
  {
    id: 'dairy',
    name: 'Dairy',
    description: 'Milk, cheese, butter, cream, yogurt, lactose',
    memberIds: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'lactose'],
  },
  {
    id: 'crustaceans',
    name: 'Crustacean shellfish',
    description: 'Shrimp, crab, lobster',
    memberIds: ['shrimp', 'crab', 'lobster'],
  },
  {
    id: 'molluscs',
    name: 'Molluscs',
    description: 'Clam, mussel, oyster, scallop, squid',
    memberIds: ['clam', 'mussel', 'oyster', 'scallop', 'squid'],
  },
  {
    id: 'all-shellfish',
    name: 'All shellfish',
    description: 'Crustaceans plus molluscs',
    memberIds: [
      'shrimp', 'crab', 'lobster',
      'clam', 'mussel', 'oyster', 'scallop', 'squid',
    ],
  },
  {
    id: 'gluten-grains',
    name: 'Gluten grains',
    description: 'Wheat, rye, barley, gluten',
    memberIds: ['wheat', 'rye', 'barley', 'gluten'],
  },
];

export const presetById = (id) => ALLERGEN_PRESETS.find((p) => p.id === id);

// Returns the canonical name strings the picker would add for a given group.
export const namesForGroup = (group) =>
  group.memberIds.map((id) => presetById(id)?.name).filter(Boolean);
