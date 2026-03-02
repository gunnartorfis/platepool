import { db } from '../src/lib/db'
import { recipeLinks } from '../src/lib/db/schema'

const icelandicRecipes = [
  {
    title: 'Kjötsúpa',
    description:
      'Traditional Icelandic lamb soup with potatoes, carrots, cabbage, and fresh herbs. The ultimate comfort food.',
    url: '',
    tags: JSON.stringify([
      'lamb',
      'soup',
      'traditional',
      'comfort',
      'winter',
      'dinner',
    ]),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Plokkfiskur',
    description:
      'Traditional fish stew with cod or haddock, potatoes, onion, and butter. Served with dark rye bread.',
    url: '',
    tags: JSON.stringify([
      'fish',
      'seafood',
      'traditional',
      'comfort',
      'dinner',
    ]),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Fiskekaker',
    description:
      'Icelandic fish cakes - pan-fried with cod or haddock, potatoes, and fresh dill. Classic dinner.',
    url: '',
    tags: JSON.stringify([
      'fish',
      'seafood',
      'traditional',
      'dinner',
      'comfort',
    ]),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Lax með kartöflum',
    description:
      'Pan-seared or baked salmon with boiled potatoes and vegetables. Simple and healthy.',
    url: '',
    tags: JSON.stringify(['fish', 'seafood', 'healthy', 'dinner', 'quick']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Fiskur í grænmetisósa',
    description:
      'Baked cod or haddock with tomatoes, peppers, onions, and herbs. One-pan dinner.',
    url: '',
    tags: JSON.stringify(['fish', 'seafood', 'baked', 'dinner', 'healthy']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Kjötbagar',
    description:
      'Icelandic meat pastries - ground lamb wrapped in flaky dough and baked. Comfort food classic.',
    url: '',
    tags: JSON.stringify(['lamb', 'pastry', 'comfort', 'dinner', 'baked']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Kjötsósa og kartöflur',
    description:
      'Lamb in brown gravy with boiled potatoes and peas. Traditional Sunday dinner.',
    url: '',
    tags: JSON.stringify(['lamb', 'roast', 'traditional', 'sunday', 'dinner']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Steikur',
    description:
      'Simple roast steak - lamb or beef with potatoes, gravy, and greens. Family favorite.',
    url: '',
    tags: JSON.stringify(['lamb', 'beef', 'roast', 'dinner', 'sunday']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Línar súpa',
    description:
      'Creamy potato and leek soup with fresh herbs. Perfect for cold evenings.',
    url: '',
    tags: JSON.stringify(['soup', 'vegetarian', 'comfort', 'dinner', 'winter']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Sausages & beans',
    description:
      'Icelandic style baked beans with pylsur. Comfort dinner with rye bread.',
    url: '',
    tags: JSON.stringify(['comfort', 'dinner', 'quick', 'pork']),
    stars: 3,
    curated: 1,
  },
  {
    title: 'Kálakókur',
    description:
      'Traditional cabbage cakes with potatoes and herbs. Vegetarian comfort food.',
    url: '',
    tags: JSON.stringify(['vegetarian', 'traditional', 'vegetables', 'dinner']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Fiskur að hressa',
    description:
      'Pan-fried fish with potatoes and vegetables. Quick and easy dinner.',
    url: '',
    tags: JSON.stringify(['fish', 'seafood', 'quick', 'dinner', 'healthy']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Kartöflugratín',
    description:
      'Creamy potato gratin - scalloped potatoes with cream and cheese. Comfort side or main.',
    url: '',
    tags: JSON.stringify(['vegetarian', 'comfort', 'dinner', 'sides']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Bringuści',
    description:
      'Polish-style beef rolls in tomato sauce. Popular freezer-to-oven dinner.',
    url: '',
    tags: JSON.stringify(['beef', 'slow', 'dinner', 'comfort']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Kjúklingur með rósmarín',
    description:
      'Roast chicken with rosemary, potatoes, and vegetables. Sunday classic.',
    url: '',
    tags: JSON.stringify(['chicken', 'roast', 'sunday', 'dinner']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Kjúklingur að hressa',
    description:
      'Pan-fried chicken thighs with herbs and vegetables. Quick weeknight dinner.',
    url: '',
    tags: JSON.stringify(['chicken', 'quick', 'dinner', 'weeknight']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Pasta bolognese',
    description:
      'Spaghetti bolognese - classic comfort food. Ground beef in tomato sauce.',
    url: '',
    tags: JSON.stringify(['pasta', 'beef', 'comfort', 'dinner', 'quick']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Pasta með laukum ogosti',
    description:
      'Pasta with caramelized onions and cheese. Simple vegetarian dinner.',
    url: '',
    tags: JSON.stringify(['pasta', 'vegetarian', 'quick', 'dinner']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Lasagna',
    description: 'Classic meat lasagna with béchamel. Family dinner favorite.',
    url: '',
    tags: JSON.stringify(['pasta', 'beef', 'comfort', 'dinner', 'baked']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Kryddaður fiskur',
    description:
      'Seasoned baked fish with potatoes. Simple and healthy weeknight dinner.',
    url: '',
    tags: JSON.stringify(['fish', 'seafood', 'healthy', 'dinner', 'quick']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Súrmat',
    description:
      'Icelandic-style stir-fry with meat, vegetables, and soy sauce. Quick dinner.',
    url: '',
    tags: JSON.stringify(['beef', 'quick', 'dinner', 'asian']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Gulrótarsoð',
    description:
      'Glazed carrots with butter and brown sugar. Simple side or light dinner.',
    url: '',
    tags: JSON.stringify(['vegetarian', 'sides', 'dinner', 'simple']),
    stars: 3,
    curated: 1,
  },
  {
    title: 'Baunir í súpu',
    description: 'Bean soup with vegetables. Budget-friendly and filling.',
    url: '',
    tags: JSON.stringify(['vegetarian', 'soup', 'budget', 'dinner']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Ragú',
    description: 'Icelandic beef ragù with pasta. Hearty family dinner.',
    url: '',
    tags: JSON.stringify(['beef', 'pasta', 'comfort', 'dinner']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Kryddmjólkurkjur',
    description:
      'Spiced meatballs in creamy sauce with potatoes. Kids favorite.',
    url: '',
    tags: JSON.stringify(['beef', 'comfort', 'dinner', 'family']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Kálkjöt',
    description:
      'Cabbage rolls stuffed with ground lamb and rice. Traditional comfort food.',
    url: '',
    tags: JSON.stringify(['lamb', 'traditional', 'comfort', 'dinner']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Spenakóta',
    description: 'Spinach and feta pie. Vegetarian dinner or side dish.',
    url: '',
    tags: JSON.stringify(['vegetarian', 'baked', 'dinner', 'greek']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Mexíkóskur bollahringur',
    description:
      'Mexican-style cornbread with cheese and peppers. Easy one-pan dinner.',
    url: '',
    tags: JSON.stringify(['vegetarian', 'mexican', 'baked', 'dinner']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Pizzur',
    description:
      'Homemade pizza with various toppings. Family dinner activity.',
    url: '',
    tags: JSON.stringify(['vegetarian', 'pizza', 'family', 'dinner', 'fun']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Hamborgarar',
    description: 'Homemade beef burgers with fries. Classic family dinner.',
    url: '',
    tags: JSON.stringify(['beef', 'quick', 'dinner', 'family', 'grilling']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Tacos',
    description:
      'Ground beef tacos with tortillas, cheese, and fresh toppings.',
    url: '',
    tags: JSON.stringify(['beef', 'mexican', 'dinner', 'family', 'quick']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Kjúklinganuggets og kartöflur',
    description:
      'Homemade chicken nuggets with oven fries. Kid-friendly dinner.',
    url: '',
    tags: JSON.stringify(['chicken', 'kids', 'dinner', 'baked']),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Grænmetisúpa',
    description:
      'Hearty vegetable soup with seasonal vegetables. Light and healthy.',
    url: '',
    tags: JSON.stringify(['vegetarian', 'soup', 'healthy', 'dinner', 'winter']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Fiskatæta',
    description:
      'Fish stew with potatoes, carrots, and cream. Coastal classic.',
    url: '',
    tags: JSON.stringify([
      'fish',
      'seafood',
      'traditional',
      'comfort',
      'dinner',
    ]),
    stars: 5,
    curated: 1,
  },
  {
    title: 'Lambaeggi',
    description: 'Lamb and potato hash. Budget-friendly comfort dinner.',
    url: '',
    tags: JSON.stringify(['lamb', 'budget', 'comfort', 'dinner']),
    stars: 3,
    curated: 1,
  },
  {
    title: 'Kalkúnsnitslar',
    description: 'Turkey escalopes with mushroom sauce and potatoes.',
    url: '',
    tags: JSON.stringify(['turkey', 'quick', 'dinner', 'weeknight']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Gratineraður blómkál',
    description: 'Cauliflower cheese gratin. Vegetarian main or side.',
    url: '',
    tags: JSON.stringify(['vegetarian', 'baked', 'sides', 'dinner']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Bratwurst með kartöflum',
    description: 'German-style sausages with potatoes and mustard.',
    url: '',
    tags: JSON.stringify(['pork', 'german', 'dinner', 'quick']),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Linsubaunir',
    description:
      'Lentils with vegetables and spices. Healthy vegetarian dinner.',
    url: '',
    tags: JSON.stringify([
      'vegetarian',
      'healthy',
      'budget',
      'dinner',
      'indian',
    ]),
    stars: 4,
    curated: 1,
  },
  {
    title: 'Kaffi og kaka',
    description:
      'Coffee and cake night - varied Icelandic baked goods with coffee.',
    url: '',
    tags: JSON.stringify(['light', 'dinner', 'snack', 'baking']),
    stars: 3,
    curated: 1,
  },
]

async function seed() {
  console.log('Seeding Icelandic dinner recipes...')

  for (const recipe of icelandicRecipes) {
    await db.insert(recipeLinks).values({
      id: crypto.randomUUID(),
      userId: 'system-curated',
      ...recipe,
      createdAt: new Date(),
    })
  }

  console.log(`Seeded ${icelandicRecipes.length} Icelandic dinner recipes`)
}

seed()
