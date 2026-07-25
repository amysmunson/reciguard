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
  { id: 'sour-cream', name: 'sour cream' },
  { id: 'yogurt',     name: 'yogurt' },
  { id: 'lactose',    name: 'lactose' },
  { id: 'ice-cream',  name: 'ice cream' },
  { id: 'gelato',     name: 'gelato' },

  // Cheese varieties
  { id: 'cheddar',        name: 'cheddar' },
  { id: 'mozzarella',     name: 'mozzarella' },
  { id: 'brie',           name: 'brie' },
  { id: 'goat-cheese',    name: 'goat cheese' },
  { id: 'parmesan',       name: 'parmesan' },
  { id: 'feta',           name: 'feta' },
  { id: 'swiss-cheese',   name: 'swiss cheese' },
  { id: 'gouda',          name: 'gouda' },
  { id: 'blue-cheese',    name: 'blue cheese' },
  { id: 'ricotta',        name: 'ricotta' },
  { id: 'cream-cheese',   name: 'cream cheese' },
  { id: 'provolone',      name: 'provolone' },
  { id: 'cottage-cheese', name: 'cottage cheese' },
  { id: 'mascarpone',     name: 'mascarpone' },
  { id: 'halloumi',       name: 'halloumi' },

  // Eggs
  { id: 'egg',        name: 'egg' },

  // Fish
  { id: 'fish',       name: 'fish' },
  { id: 'salmon',     name: 'salmon' },
  { id: 'tuna',       name: 'tuna' },
  { id: 'cod',        name: 'cod' },
  { id: 'halibut',    name: 'halibut' },
  { id: 'tilapia',    name: 'tilapia' },
  { id: 'trout',      name: 'trout' },
  { id: 'catfish',    name: 'catfish' },
  { id: 'mahi-mahi',  name: 'mahi mahi' },
  { id: 'snapper',    name: 'snapper' },
  { id: 'bass',       name: 'bass' },
  { id: 'sole',       name: 'sole' },
  { id: 'anchovy',    name: 'anchovy' },
  { id: 'sardine',    name: 'sardine' },
  { id: 'mackerel',   name: 'mackerel' },
  { id: 'herring',    name: 'herring' },
  { id: 'swordfish',  name: 'swordfish' },
  { id: 'haddock',    name: 'haddock' },

  // Shellfish
  { id: 'shrimp',     name: 'shrimp' },
  { id: 'crab',       name: 'crab' },
  { id: 'lobster',    name: 'lobster' },
  { id: 'clam',       name: 'clam' },
  { id: 'mussel',     name: 'mussel' },
  { id: 'oyster',     name: 'oyster' },
  { id: 'scallop',    name: 'scallop' },
  { id: 'squid',      name: 'squid' },

  // Meat
  { id: 'beef',       name: 'beef' },
  { id: 'pork',       name: 'pork' },
  { id: 'chicken',    name: 'chicken' },
  { id: 'turkey',     name: 'turkey' },
  { id: 'duck',       name: 'duck' },
  { id: 'lamb',       name: 'lamb' },
  { id: 'goat',       name: 'goat' },
  { id: 'veal',       name: 'veal' },
  { id: 'venison',    name: 'venison' },
  { id: 'bison',      name: 'bison' },
  { id: 'rabbit',     name: 'rabbit' },
  { id: 'bacon',      name: 'bacon' },
  { id: 'ham',        name: 'ham' },
  { id: 'sausage',    name: 'sausage' },
  { id: 'prosciutto', name: 'prosciutto' },
  { id: 'salami',     name: 'salami' },

  // Berries
  { id: 'strawberry', name: 'strawberry' },
  { id: 'blueberry',  name: 'blueberry' },
  { id: 'raspberry',  name: 'raspberry' },
  { id: 'blackberry', name: 'blackberry' },
  { id: 'cranberry',  name: 'cranberry' },

  // Stone fruits
  { id: 'peach',      name: 'peach' },
  { id: 'plum',       name: 'plum' },
  { id: 'cherry',     name: 'cherry' },
  { id: 'apricot',    name: 'apricot' },
  { id: 'nectarine',  name: 'nectarine' },

  // Melons
  { id: 'watermelon', name: 'watermelon' },
  { id: 'cantaloupe', name: 'cantaloupe' },
  { id: 'honeydew',   name: 'honeydew' },

  // Citrus
  { id: 'orange',     name: 'orange' },
  { id: 'lemon',      name: 'lemon' },
  { id: 'lime',       name: 'lime' },
  { id: 'grapefruit', name: 'grapefruit' },

  // Pome fruits
  { id: 'apple',      name: 'apple' },
  { id: 'pear',       name: 'pear' },

  // Tropical & other fruits
  { id: 'pineapple',    name: 'pineapple' },
  { id: 'mango',        name: 'mango' },
  { id: 'papaya',       name: 'papaya' },
  { id: 'grape',        name: 'grape' },
  { id: 'fig',          name: 'fig' },
  { id: 'pomegranate',  name: 'pomegranate' },
  { id: 'coconut',      name: 'coconut' },
  { id: 'medjool-date', name: 'medjool date' },
  { id: 'kiwi',         name: 'kiwi' },
  { id: 'banana',       name: 'banana' },
  { id: 'avocado',      name: 'avocado' },

  // Leafy greens
  { id: 'spinach',    name: 'spinach' },
  { id: 'kale',       name: 'kale' },
  { id: 'lettuce',    name: 'lettuce' },
  { id: 'arugula',    name: 'arugula' },
  { id: 'chard',      name: 'chard' },

  // Cruciferous vegetables
  { id: 'broccoli',        name: 'broccoli' },
  { id: 'cauliflower',     name: 'cauliflower' },
  { id: 'cabbage',         name: 'cabbage' },
  { id: 'brussels-sprout', name: 'brussels sprout' },
  { id: 'kohlrabi',        name: 'kohlrabi' },

  // Root vegetables
  { id: 'carrot',       name: 'carrot' },
  { id: 'beet',         name: 'beet' },
  { id: 'radish',       name: 'radish' },
  { id: 'turnip',       name: 'turnip' },
  { id: 'potato',       name: 'potato' },
  { id: 'sweet-potato', name: 'sweet potato' },
  { id: 'celery',       name: 'celery' },

  // Alliums
  { id: 'onion',    name: 'onion' },
  { id: 'garlic',   name: 'garlic' },
  { id: 'shallot',  name: 'shallot' },
  { id: 'leek',     name: 'leek' },
  { id: 'scallion', name: 'scallion' },

  // Squash & gourds
  { id: 'zucchini',         name: 'zucchini' },
  { id: 'pumpkin',          name: 'pumpkin' },
  { id: 'butternut-squash', name: 'butternut squash' },
  { id: 'cucumber',         name: 'cucumber' },

  // Legumes & pods
  { id: 'green-bean',    name: 'green bean' },
  { id: 'pea',           name: 'pea' },
  { id: 'lentil',        name: 'lentil' },
  { id: 'chickpea',      name: 'chickpea' },
  { id: 'garbanzo-bean', name: 'garbanzo bean' },
  { id: 'black-bean',    name: 'black bean' },
  { id: 'kidney-bean',   name: 'kidney bean' },

  // Nightshades (tomato/eggplant/peppers — potato also cross-referenced under Root vegetables)
  { id: 'tomato',       name: 'tomato' },
  { id: 'eggplant',     name: 'eggplant' },
  { id: 'bell-pepper',  name: 'bell pepper' },
  { id: 'chili-pepper', name: 'chili pepper' },

  // Fungi
  { id: 'mushroom', name: 'mushroom' },

  // Grains
  { id: 'wheat',      name: 'wheat' },
  { id: 'gluten',     name: 'gluten' },
  { id: 'rye',        name: 'rye' },
  { id: 'barley',     name: 'barley' },
  { id: 'oat',        name: 'oat' },
  { id: 'oatmeal',    name: 'oatmeal' },
  { id: 'spelt',      name: 'spelt' },
  { id: 'farro',      name: 'farro' },
  { id: 'triticale',  name: 'triticale' },
  { id: 'kamut',      name: 'kamut' },
  { id: 'rice',       name: 'rice' },
  { id: 'quinoa',     name: 'quinoa' },
  { id: 'millet',     name: 'millet' },
  { id: 'sorghum',    name: 'sorghum' },
  { id: 'buckwheat',  name: 'buckwheat' },
  { id: 'amaranth',   name: 'amaranth' },
  { id: 'teff',       name: 'teff' },

  // Flour & baking staples
  { id: 'flour',             name: 'flour' },
  { id: 'all-purpose-flour', name: 'all-purpose flour' },
  { id: 'whole-wheat-flour', name: 'whole wheat flour' },
  { id: 'bread-flour',       name: 'bread flour' },
  { id: 'cake-flour',        name: 'cake flour' },
  { id: 'self-rising-flour', name: 'self-rising flour' },
  { id: 'almond-flour',      name: 'almond flour' },
  { id: 'coconut-flour',     name: 'coconut flour' },
  { id: 'rice-flour',        name: 'rice flour' },
  { id: 'oat-flour',         name: 'oat flour' },
  { id: 'cornmeal',          name: 'cornmeal' },
  { id: 'cornstarch',        name: 'cornstarch' },
  { id: 'breadcrumb',        name: 'breadcrumb' },
  { id: 'panko',             name: 'panko' },
  { id: 'baking-powder',     name: 'baking powder' },
  { id: 'baking-soda',       name: 'baking soda' },
  { id: 'cream-of-tartar',   name: 'cream of tartar' },
  { id: 'yeast',             name: 'yeast' },

  // Pasta & noodles
  { id: 'pasta',         name: 'pasta' },
  { id: 'spaghetti',     name: 'spaghetti' },
  { id: 'macaroni',      name: 'macaroni' },
  { id: 'penne',         name: 'penne' },
  { id: 'lasagna',       name: 'lasagna' },
  { id: 'fettuccine',    name: 'fettuccine' },
  { id: 'egg-noodle',    name: 'egg noodle' },
  { id: 'ramen-noodle',  name: 'ramen noodle' },
  { id: 'udon-noodle',   name: 'udon noodle' },
  { id: 'rice-noodle',   name: 'rice noodle' },
  { id: 'soba-noodle',   name: 'soba noodle' },

  // Soy products
  { id: 'soy',        name: 'soy' },
  { id: 'tofu',       name: 'tofu' },
  { id: 'tempeh',     name: 'tempeh' },
  { id: 'edamame',    name: 'edamame' },

  // Sesame (all forms)
  { id: 'sesame',              name: 'sesame' },
  { id: 'sesame-seed',         name: 'sesame seed' },
  { id: 'toasted-sesame-seed', name: 'toasted sesame seed' },
  { id: 'sesame-oil',          name: 'sesame oil' },
  { id: 'sesame-paste',        name: 'sesame paste' },
  { id: 'tahini',              name: 'tahini' },

  // Corn products
  { id: 'corn',       name: 'corn' },
  { id: 'corn-syrup', name: 'corn syrup' },
  { id: 'corn-oil',   name: 'corn oil' },
  { id: 'corn-flour', name: 'corn flour' },
  { id: 'popcorn',    name: 'popcorn' },

  // Sauces & condiments
  { id: 'mustard',        name: 'mustard' },
  { id: 'mayonnaise',     name: 'mayonnaise' },
  { id: 'ketchup',        name: 'ketchup' },
  { id: 'soy-sauce',      name: 'soy sauce' },
  { id: 'bbq-sauce',      name: 'barbecue sauce' },
  { id: 'hot-sauce',      name: 'hot sauce' },
  { id: 'ranch',          name: 'ranch' },
  { id: 'vinaigrette',    name: 'vinaigrette' },
  { id: 'worcestershire', name: 'worcestershire sauce' },
  { id: 'hoisin-sauce',   name: 'hoisin sauce' },
  { id: 'teriyaki-sauce', name: 'teriyaki sauce' },
  { id: 'salsa',          name: 'salsa' },
  { id: 'pesto',          name: 'pesto' },

  // Fats & oils
  { id: 'oil',           name: 'oil' },
  { id: 'olive-oil',     name: 'olive oil' },
  { id: 'vegetable-oil', name: 'vegetable oil' },
  { id: 'canola-oil',    name: 'canola oil' },
  { id: 'coconut-oil',   name: 'coconut oil' },
  { id: 'chili-oil',     name: 'chili oil' },
  { id: 'ghee',          name: 'ghee' },
  { id: 'margarine',     name: 'margarine' },
  { id: 'lard',          name: 'lard' },
  { id: 'shortening',    name: 'shortening' },

  // Sweeteners
  { id: 'sugar',          name: 'sugar' },
  { id: 'brown-sugar',    name: 'brown sugar' },
  { id: 'powdered-sugar', name: 'powdered sugar' },
  { id: 'maple-syrup',    name: 'maple syrup' },
  { id: 'agave',          name: 'agave' },
  { id: 'molasses',       name: 'molasses' },
  { id: 'honey',          name: 'honey' },

  // Chocolate & cocoa
  { id: 'chocolate',       name: 'chocolate' },
  { id: 'dark-chocolate',  name: 'dark chocolate' },
  { id: 'milk-chocolate',  name: 'milk chocolate' },
  { id: 'white-chocolate', name: 'white chocolate' },
  { id: 'cocoa',           name: 'cocoa' },
  { id: 'cocoa-powder',    name: 'cocoa powder' },

  // Gelatin
  { id: 'gelatin',     name: 'gelatin' },
  { id: 'marshmallow', name: 'marshmallow' },
  { id: 'jello',       name: 'jello' },
  { id: 'gummy-candy', name: 'gummy candy' },

  // Herbs & seasonings
  { id: 'ginger',       name: 'ginger' },
  { id: 'cumin',        name: 'cumin' },
  { id: 'cayenne',      name: 'cayenne' },
  { id: 'chili-powder', name: 'chili powder' },
  { id: 'chili',        name: 'chili' },
  { id: 'cinnamon',     name: 'cinnamon' },
  { id: 'vanilla',      name: 'vanilla' },
  { id: 'rosemary',     name: 'rosemary' },
  { id: 'cilantro',     name: 'cilantro' },
  { id: 'salt',         name: 'salt' },
  { id: 'pepper',       name: 'pepper' },

  // Alcohol
  { id: 'wine',    name: 'wine' },
  { id: 'beer',    name: 'beer' },
  { id: 'rum',     name: 'rum' },
  { id: 'whiskey', name: 'whiskey' },
  { id: 'scotch',  name: 'scotch' },
  { id: 'vodka',   name: 'vodka' },
  { id: 'tequila', name: 'tequila' },
  { id: 'brandy',  name: 'brandy' },
  { id: 'sherry',  name: 'sherry' },

  // Caffeine
  { id: 'caffeine', name: 'caffeine' },
  { id: 'coffee',   name: 'coffee' },
  { id: 'tea',      name: 'tea' },
  { id: 'matcha',   name: 'matcha' },
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
    description: 'Milk, cheese, butter, cream, yogurt, lactose, ice cream, etc.',
    memberIds: [
      'milk', 'cheese', 'butter', 'cream', 'yogurt', 'lactose',
      'ice-cream', 'gelato',
      'cheddar', 'mozzarella', 'brie', 'goat-cheese', 'parmesan', 'feta',
      'swiss-cheese', 'gouda', 'blue-cheese', 'ricotta', 'cream-cheese',
      'provolone', 'cottage-cheese', 'mascarpone', 'halloumi',
    ],
  },
  {
    id: 'cheeses',
    name: 'Cheeses',
    description: 'Cheddar, mozzarella, brie, goat cheese, parmesan, feta, swiss, gouda, blue cheese, ricotta, cream cheese, provolone, cottage cheese, mascarpone, halloumi',
    memberIds: [
      'cheese', 'cheddar', 'mozzarella', 'brie', 'goat-cheese', 'parmesan',
      'feta', 'swiss-cheese', 'gouda', 'blue-cheese', 'ricotta', 'cream-cheese',
      'provolone', 'cottage-cheese', 'mascarpone', 'halloumi',
    ],
  },
  {
    id: 'sesame-all',
    name: 'Sesame (all forms)',
    description: 'Sesame, sesame seed, toasted sesame seed, sesame oil, sesame paste, tahini',
    memberIds: [
      'sesame', 'sesame-seed', 'toasted-sesame-seed',
      'sesame-oil', 'sesame-paste', 'tahini',
    ],
  },
  {
    id: 'pasta-and-noodles',
    name: 'Pasta & noodles',
    description: 'Pasta, spaghetti, macaroni, penne, lasagna, fettuccine, egg noodle, ramen, udon, rice noodle, soba',
    memberIds: [
      'pasta', 'spaghetti', 'macaroni', 'penne', 'lasagna', 'fettuccine',
      'egg-noodle', 'ramen-noodle', 'udon-noodle', 'rice-noodle', 'soba-noodle',
    ],
  },
  {
    id: 'fish-all',
    name: 'Fish',
    description: 'Salmon, tuna, cod, halibut, tilapia, trout, catfish, mahi mahi, snapper, bass, sole, anchovy, sardine, mackerel, herring, swordfish, haddock',
    memberIds: [
      'fish', 'salmon', 'tuna', 'cod', 'halibut', 'tilapia', 'trout',
      'catfish', 'mahi-mahi', 'snapper', 'bass', 'sole', 'anchovy',
      'sardine', 'mackerel', 'herring', 'swordfish', 'haddock',
    ],
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
    id: 'meat',
    name: 'Meat',
    description: 'Beef, pork, chicken, turkey, duck, lamb, goat, veal, venison, bison, rabbit, bacon, ham, sausage, prosciutto, salami',
    memberIds: [
      'beef', 'pork', 'chicken', 'turkey', 'duck', 'lamb', 'goat', 'veal',
      'venison', 'bison', 'rabbit', 'bacon', 'ham', 'sausage', 'prosciutto', 'salami',
    ],
  },
  {
    id: 'poultry',
    name: 'Poultry',
    description: 'Chicken, turkey, duck',
    memberIds: ['chicken', 'turkey', 'duck'],
  },
  {
    id: 'red-meat',
    name: 'Red meat',
    description: 'Beef, pork, lamb, goat, veal, venison, bison, rabbit, bacon, ham, sausage, prosciutto, salami',
    memberIds: [
      'beef', 'pork', 'lamb', 'goat', 'veal', 'venison', 'bison', 'rabbit',
      'bacon', 'ham', 'sausage', 'prosciutto', 'salami',
    ],
  },
  {
    id: 'gluten-grains',
    name: 'Gluten grains',
    description: 'Wheat, rye, barley, gluten',
    memberIds: ['wheat', 'rye', 'barley', 'gluten'],
  },
  {
    id: 'oats-all',
    name: 'Oats (all forms)',
    description: 'Oat, oatmeal, oat flour',
    memberIds: ['oat', 'oatmeal', 'oat-flour'],
  },
  {
    id: 'berries',
    name: 'Berries',
    description: 'Strawberry, blueberry, raspberry, blackberry, cranberry',
    memberIds: ['strawberry', 'blueberry', 'raspberry', 'blackberry', 'cranberry'],
  },
  {
    id: 'stone-fruits',
    name: 'Stone fruits',
    description: 'Peach, plum, cherry, apricot, nectarine',
    memberIds: ['peach', 'plum', 'cherry', 'apricot', 'nectarine'],
  },
  {
    id: 'melons',
    name: 'Melons',
    description: 'Watermelon, cantaloupe, honeydew',
    memberIds: ['watermelon', 'cantaloupe', 'honeydew'],
  },
  {
    id: 'citrus',
    name: 'Citrus',
    description: 'Orange, lemon, lime, grapefruit',
    memberIds: ['orange', 'lemon', 'lime', 'grapefruit'],
  },
  {
    id: 'pome-fruits',
    name: 'Pome fruits',
    description: 'Apple, pear',
    memberIds: ['apple', 'pear'],
  },
  {
    id: 'tropical-fruits',
    name: 'Tropical & other fruits',
    description: 'Pineapple, mango, papaya, grape, fig, pomegranate, coconut, medjool date, kiwi, banana, avocado',
    memberIds: [
      'pineapple', 'mango', 'papaya', 'grape', 'fig', 'pomegranate',
      'coconut', 'medjool-date', 'kiwi', 'banana', 'avocado',
    ],
  },
  {
    id: 'leafy-greens',
    name: 'Leafy greens',
    description: 'Spinach, kale, lettuce, arugula, chard',
    memberIds: ['spinach', 'kale', 'lettuce', 'arugula', 'chard'],
  },
  {
    id: 'cruciferous-vegetables',
    name: 'Cruciferous vegetables',
    description: 'Broccoli, cauliflower, cabbage, brussels sprout, kohlrabi',
    memberIds: ['broccoli', 'cauliflower', 'cabbage', 'brussels-sprout', 'kohlrabi'],
  },
  {
    id: 'root-vegetables',
    name: 'Root vegetables',
    description: 'Carrot, beet, radish, turnip, potato, sweet potato',
    memberIds: ['carrot', 'beet', 'radish', 'turnip', 'potato', 'sweet-potato'],
  },
  {
    id: 'alliums',
    name: 'Alliums',
    description: 'Onion, garlic, shallot, leek, scallion',
    memberIds: ['onion', 'garlic', 'shallot', 'leek', 'scallion'],
  },
  {
    id: 'squash-and-gourds',
    name: 'Squash & gourds',
    description: 'Zucchini, pumpkin, butternut squash, cucumber',
    memberIds: ['zucchini', 'pumpkin', 'butternut-squash', 'cucumber'],
  },
  {
    id: 'legumes-and-pods',
    name: 'Legumes & pods',
    description: 'Green bean, pea, lentil, chickpea, garbanzo bean, black bean, kidney bean',
    memberIds: ['green-bean', 'pea', 'lentil', 'chickpea', 'garbanzo-bean', 'black-bean', 'kidney-bean'],
  },
  {
    id: 'chickpea-all',
    name: 'Chickpea (garbanzo bean)',
    description: 'Chickpea, garbanzo bean — same food, different names recipes use',
    memberIds: ['chickpea', 'garbanzo-bean'],
  },
  {
    id: 'nightshades',
    name: 'Nightshades',
    description: 'Tomato, eggplant, bell pepper, chili pepper, potato',
    memberIds: ['tomato', 'eggplant', 'bell-pepper', 'chili-pepper', 'potato'],
  },
  {
    id: 'chili-all',
    name: 'Chili (all forms)',
    description: 'Chili, chili pepper, chili powder, chili oil',
    memberIds: ['chili', 'chili-pepper', 'chili-powder', 'chili-oil'],
  },
  {
    id: 'soy-products',
    name: 'Soy products',
    description: 'Soy, tofu, tempeh, edamame, soy sauce',
    memberIds: ['soy', 'tofu', 'tempeh', 'edamame', 'soy-sauce'],
  },
  {
    id: 'flour-and-baking-staples',
    name: 'Flour & baking staples',
    description: 'Flour, all-purpose, whole wheat, bread, cake, self-rising, almond, coconut, rice, oat flour, cornmeal, cornstarch, breadcrumb, panko, baking powder, baking soda, cream of tartar, yeast',
    memberIds: [
      'flour', 'all-purpose-flour', 'whole-wheat-flour', 'bread-flour', 'cake-flour',
      'self-rising-flour', 'almond-flour', 'coconut-flour', 'rice-flour', 'oat-flour',
      'cornmeal', 'cornstarch', 'breadcrumb', 'panko',
      'baking-powder', 'baking-soda', 'cream-of-tartar', 'yeast',
    ],
  },
  {
    id: 'sweeteners',
    name: 'Sweeteners',
    description: 'Sugar, brown sugar, powdered sugar, maple syrup, agave, molasses',
    memberIds: ['sugar', 'brown-sugar', 'powdered-sugar', 'maple-syrup', 'agave', 'molasses'],
  },
  {
    id: 'chocolate-and-cocoa',
    name: 'Chocolate & cocoa',
    description: 'Chocolate, dark chocolate, milk chocolate, white chocolate, cocoa, cocoa powder',
    memberIds: [
      'chocolate', 'dark-chocolate', 'milk-chocolate', 'white-chocolate',
      'cocoa', 'cocoa-powder',
    ],
  },
  {
    id: 'alcohol',
    name: 'Alcohol',
    description: 'Wine, beer, rum, whiskey, vodka, brandy, sherry',
    memberIds: ['wine', 'beer', 'rum', 'whiskey', 'vodka', 'brandy', 'sherry'],
  },
  {
    id: 'gelatin-containing',
    name: 'Gelatin',
    description: 'Gelatin, marshmallow, jello, gummy candy',
    memberIds: ['gelatin', 'marshmallow', 'jello', 'gummy-candy'],
  },
  {
    id: 'caffeine-sources',
    name: 'Caffeine',
    description: 'Caffeine, coffee, tea, matcha',
    memberIds: ['caffeine', 'coffee', 'tea', 'matcha'],
  },
  {
    id: 'corn-products',
    name: 'Corn products',
    description: 'Corn, corn syrup, corn oil, corn flour, cornmeal, cornstarch, popcorn',
    memberIds: ['corn', 'corn-syrup', 'corn-oil', 'corn-flour', 'cornmeal', 'cornstarch', 'popcorn'],
  },
];

export const presetById = (id) => ALLERGEN_PRESETS.find((p) => p.id === id);

// Returns the canonical name strings the picker would add for a given group.
export const namesForGroup = (group) =>
  group.memberIds.map((id) => presetById(id)?.name).filter(Boolean);
