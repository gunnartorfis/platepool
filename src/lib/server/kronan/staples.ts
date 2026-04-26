// Curated list of common pantry staples we DO NOT auto-add to a Krónan cart
// when extracting ingredients from a meal plan. The user can still add these
// manually from the confirm dialog.
//
// Each entry is a lowercase substring matched (with word-boundary semantics)
// against the AI-extracted ingredient name in either Icelandic or English.

export const STAPLE_TERMS: ReadonlyArray<string> = [
  // Salt & pepper
  'salt',
  'sjávarsalt',
  'pipar',
  'pepper',
  'svartur pipar',
  'black pepper',

  // Oils & fats
  'olía',
  'oil',
  'ólífuolía',
  'olive oil',
  'matarolía',
  'cooking oil',
  'smjör',
  'butter',

  // Sugars & sweeteners
  'sykur',
  'sugar',
  'púðursykur',
  'brown sugar',
  'flórsykur',
  'powdered sugar',
  'hunang',
  'honey',

  // Flours & starches
  'hveiti',
  'flour',
  'maíseni',
  'cornstarch',
  'maíssterkja',
  'kartöflumjöl',
  'potato starch',

  // Grains & pasta (assumed in pantry)
  'hrísgrjón',
  'rice',
  'pasta',
  'spaghetti',
  'macaroni',
  'núðlur',
  'noodles',

  // Dairy basics
  'mjólk',
  'milk',
  'rjómi',
  'cream',

  // Eggs
  'egg',
  'eggs',
  'egghvíta',
  'eggjarauða',

  // Common spices
  'kanill',
  'cinnamon',
  'kúmen',
  'cumin',
  'paprika',
  'paprikuduft',
  'paprika powder',
  'chili',
  'chilli',
  'oregano',
  'basil',
  'basilíka',
  'timian',
  'thyme',
  'rosmarín',
  'rosemary',
  'lárviðarlauf',
  'bay leaf',
  'múskat',
  'nutmeg',
  'engifer',
  'ginger',
  'kúrkúma',
  'turmeric',
  'kanel',

  // Baking basics
  'lyftiduft',
  'baking powder',
  'matarsódi',
  'baking soda',
  'vanilla',
  'vanilluextrakt',
  'vanilla extract',

  // Vinegars & sauces
  'edik',
  'vinegar',
  'eplaedik',
  'apple cider vinegar',
  'soyasósa',
  'sojasósa',
  'soy sauce',
  'tómatpúrra',
  'tomato paste',
  'sinnep',
  'mustard',

  // Aromatics
  'hvítlaukur',
  'garlic',
  'laukur',
  'onion',
]

export function isStaple(ingredientName: string): boolean {
  const haystack = ingredientName.trim().toLowerCase()
  if (!haystack) return false
  return STAPLE_TERMS.some((term) => {
    const t = term.toLowerCase()
    if (haystack === t) return true
    const pattern = new RegExp(
      `(^|[^\\p{L}])${escapeRegExp(t)}([^\\p{L}]|$)`,
      'iu',
    )
    return pattern.test(haystack)
  })
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
