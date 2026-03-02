You are an expert in Icelandic cuisine. Your task is to generate a list of authentic Icelandic dinner recipes.

## Requirements

1. **Only authentic Icelandic dishes** — dishes that are actually eaten in Iceland, not Norwegian, Swedish, or made-up words
2. **Icelandic titles only** — titles must be proper Icelandic (e.g., "Kjötsúpa", "Plokkfiskur", NOT "Fiskekaker" or English)
3. **Accurate descriptions** — describe the dish correctly in English (for the description field)
4. **Variety** — include lamb, fish/seafood, chicken, beef, pork, and vegetarian options
5. **Family-friendly** — focus on meals families with kids actually eat in Iceland

## Format

Output a JSON array where each recipe has:

- `title`: Proper Icelandic name
- `description`: English description (1-2 sentences)
- `tags`: Array of relevant tags (lowercase, English)
- `stars`: Rating 3-5
- `curated`: Always 1

## Real Icelandic dishes to include (reference):

- Kjötsúpa (lamb soup)
- Plokkfiskur (fish stew)
- Kjöt í karrý
- Mexíkósk kjúklingasúpa

## Output format (TypeScript):

```typescript
const icelandicRecipes = [
  {
    title: 'Kjötsúpa',
    description:
      'Traditional Icelandic lamb soup with potatoes, carrots, cabbage, and fresh herbs.',
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
  // ... more recipes
]
```

Generate 40-50 diverse, authentic Icelandic dinner recipes. Avoid: English titles, Norwegian/Swedish dishes, made-up words, anglicized versions.
