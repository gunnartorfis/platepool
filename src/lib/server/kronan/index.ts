import { createServerFn } from '@tanstack/react-start'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDbWithSchema } from '../../db'
import {
  familyDayPlans,
  familyMealPlans,
  familyMembers,
  kronanCredentials,
  recipeLinks,
} from '../../db/schema'
import { getUser } from '../../auth/get-user'
import {
  KronanApiError,
  KronanNotConnectedError,
  ensureKronanCredentialsTable,
  fetchKronanIdentity,
  kronanFetch,
  requireKronanToken,
} from './client'
import { isStaple } from './staples'
import type {
  KronanProductSearchResponse,
  KronanRecipeDetail,
  KronanRecipeSummary,
} from './client'

function uid() {
  return crypto.randomUUID()
}

function toUserMessage(err: unknown, fallback: string): string {
  if (err instanceof KronanNotConnectedError) return err.message
  if (err instanceof KronanApiError) {
    if (err.status === 401 || err.status === 403) {
      return 'Krónan token is invalid or expired'
    }
    if (err.status === 429) return 'Too many requests to Krónan, try again soon'
    return `Krónan: ${err.status}`
  }
  return err instanceof Error ? err.message : fallback
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

export const getKronanStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')
    await ensureKronanCredentialsTable()
    const db = await getDbWithSchema()
    const rows = await db
      .select({
        identityName: kronanCredentials.identityName,
        updatedAt: kronanCredentials.updatedAt,
      })
      .from(kronanCredentials)
      .where(eq(kronanCredentials.userId, user.id))
      .limit(1)
    if (!rows[0]) return { connected: false as const }
    return {
      connected: true as const,
      identityName: rows[0].identityName,
      updatedAt: rows[0].updatedAt,
    }
  },
)

export const connectKronan = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string().min(8) }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const trimmed = data.token.trim()
    let identityName: string | null = null
    try {
      const identity = await fetchKronanIdentity(trimmed)
      identityName = identity.name ?? null
    } catch (err) {
      throw new Error(toUserMessage(err, 'Could not verify Krónan token'))
    }

    const db = await getDbWithSchema()
    await ensureKronanCredentialsTable()
    const existing = await db
      .select({ userId: kronanCredentials.userId })
      .from(kronanCredentials)
      .where(eq(kronanCredentials.userId, user.id))
      .limit(1)

    if (existing[0]) {
      await db
        .update(kronanCredentials)
        .set({
          accessToken: trimmed,
          identityName,
          updatedAt: new Date(),
        })
        .where(eq(kronanCredentials.userId, user.id))
    } else {
      await db.insert(kronanCredentials).values({
        userId: user.id,
        accessToken: trimmed,
        identityName,
      })
    }

    return { connected: true as const, identityName }
  })

export const disconnectKronan = createServerFn({ method: 'POST' }).handler(
  async () => {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')
    await ensureKronanCredentialsTable()
    const db = await getDbWithSchema()
    await db
      .delete(kronanCredentials)
      .where(eq(kronanCredentials.userId, user.id))
    return { connected: false as const }
  },
)

// ---------------------------------------------------------------------------
// Recipes from Krónan ("flýtiviðbót" parallel)
// ---------------------------------------------------------------------------

const KRONAN_RECIPE_PAGE_SIZE = 12

export const getKronanRecipeQuickAdds = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')
    const token = await requireKronanToken(user.id)

    const response = await kronanFetch<{
      results?: Array<KronanRecipeSummary>
      count?: number
    }>({
      path: '/recipes/',
      query: { limit: KRONAN_RECIPE_PAGE_SIZE, offset: 0 },
      token,
    })

    const recipes = response.results ?? []

    const db = await getDbWithSchema()
    const myRows = await db
      .select({ url: recipeLinks.url, metadata: recipeLinks.metadata })
      .from(recipeLinks)
      .where(eq(recipeLinks.userId, user.id))

    const importedSlugs = new Set<string>()
    for (const row of myRows) {
      if (!row.metadata) continue
      try {
        const meta = JSON.parse(row.metadata) as { kronanSlug?: string }
        if (meta.kronanSlug) importedSlugs.add(meta.kronanSlug)
      } catch {
        // ignore non-JSON metadata
      }
    }

    return recipes
      .filter((r) => !importedSlugs.has(r.slug))
      .slice(0, 8)
      .map((r) => ({
        slug: r.slug,
        title: r.name,
        description: r.totalMinutes
          ? `~${r.totalMinutes} min · ${r.servings ?? '?'} skammtar`
          : null,
        image: r.mainImage ?? null,
        tags: [
          ...(r.cuisineTags ?? []),
          ...(r.occasionTags ?? []),
          ...(r.tags ?? []),
        ].slice(0, 3),
      }))
  })

export const importKronanRecipe = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')
    const token = await requireKronanToken(user.id)

    let detail: KronanRecipeDetail
    try {
      detail = await kronanFetch<KronanRecipeDetail>({
        path: `/recipes/${encodeURIComponent(data.slug)}/`,
        token,
      })
    } catch (err) {
      throw new Error(toUserMessage(err, 'Could not load Krónan recipe'))
    }

    const db = await getDbWithSchema()

    // Avoid duplicates by Krónan slug.
    const existingRows = await db
      .select({ id: recipeLinks.id, metadata: recipeLinks.metadata })
      .from(recipeLinks)
      .where(eq(recipeLinks.userId, user.id))

    for (const row of existingRows) {
      if (!row.metadata) continue
      try {
        const meta = JSON.parse(row.metadata) as { kronanSlug?: string }
        if (meta.kronanSlug === data.slug) {
          return { id: row.id, created: false }
        }
      } catch {
        continue
      }
    }

    const ingredientNames =
      detail.ingredients
        ?.map((ing) => ing.text ?? ing.name ?? '')
        .filter(Boolean) ?? []

    const metadata = {
      kronanSlug: data.slug,
      kronanToken: detail.token,
      source: 'kronan',
      image: detail.mainImage ?? null,
      preparationMinutes: detail.preparationMinutes ?? null,
      cookingMinutes: detail.cookingMinutes ?? null,
      totalMinutes: detail.totalMinutes ?? null,
      servings: detail.servings ?? null,
      ingredients: ingredientNames,
      // Pre-mapped products so we never have to fuzzy-match these later.
      kronanItems: [
        ...(detail.items ?? []),
        ...(detail.essentials ?? []),
      ]
        .map((item) =>
          item.product
            ? {
                sku: item.product.sku,
                name: item.product.name,
                quantity: item.quantity ?? 1,
              }
            : null,
        )
        .filter((x): x is { sku: string; name: string; quantity: number } =>
          Boolean(x),
        ),
    }

    const tags = [
      ...(detail.cuisineTags ?? []),
      ...(detail.occasionTags ?? []),
      ...(detail.tags ?? []),
    ]

    const id = uid()
    await db.insert(recipeLinks).values({
      id,
      userId: user.id,
      title: detail.name,
      url: `https://kronan.is/uppskriftir/${data.slug}`,
      description: null,
      tags: JSON.stringify(tags),
      metadata: JSON.stringify(metadata),
      stars: 0,
      curated: 0,
    })

    return { id, created: true }
  })

// ---------------------------------------------------------------------------
// Ingredient extraction from a meal plan
// ---------------------------------------------------------------------------

type ExtractedIngredient = {
  name: string
  quantity?: string
  source: 'kronan-recipe' | 'ai'
  sourceMeal: string
  sku?: string
  productName?: string
  isStaple: boolean
}

export const extractMealPlanIngredients = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z.object({ weekStart: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')
    const token = await requireKronanToken(user.id)

    const db = await getDbWithSchema()

    // 1. Load the user's home meal plan for this week.
    const membership = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, user.id))
      .limit(1)
    if (!membership[0]) throw new Error('Not a member of any home')

    const plan = await db
      .select()
      .from(familyMealPlans)
      .where(
        and(
          eq(familyMealPlans.familyId, membership[0].familyId),
          eq(familyMealPlans.weekStart, data.weekStart),
        ),
      )
      .limit(1)
    if (!plan[0]) return { items: [] as Array<ExtractedIngredient> }

    const days = await db
      .select()
      .from(familyDayPlans)
      .where(eq(familyDayPlans.familyMealPlanId, plan[0].id))

    const meals = days
      .map((d) => d.mealName?.trim())
      .filter((m): m is string => Boolean(m))

    if (meals.length === 0)
      return { items: [] as Array<ExtractedIngredient> }

    // 2. Pull ingredients from any imported Krónan recipes that match meals.
    const userRecipes = await db
      .select()
      .from(recipeLinks)
      .where(eq(recipeLinks.userId, user.id))

    type KronanRecipeMeta = {
      kronanSlug?: string
      ingredients?: Array<string>
      kronanItems?: Array<{ sku: string; name: string; quantity: number }>
    }

    const items: Array<ExtractedIngredient> = []
    const mealsCoveredByKronan = new Set<string>()

    for (const meal of meals) {
      const match = userRecipes.find((r) => {
        if (!r.metadata) return false
        try {
          const meta = JSON.parse(r.metadata) as KronanRecipeMeta
          if (!meta.kronanSlug) return false
          return r.title.trim().toLowerCase() === meal.toLowerCase()
        } catch {
          return false
        }
      })

      if (!match || !match.metadata) continue
      const meta = JSON.parse(match.metadata) as KronanRecipeMeta

      if (meta.kronanItems) {
        for (const item of meta.kronanItems) {
          items.push({
            name: item.name,
            source: 'kronan-recipe',
            sourceMeal: meal,
            sku: item.sku,
            productName: item.name,
            isStaple: isStaple(item.name),
          })
        }
        mealsCoveredByKronan.add(meal)
      }
    }

    // 3. For meals not covered by Krónan recipes, ask the AI for ingredients.
    const aiMeals = meals.filter((m) => !mealsCoveredByKronan.has(m))
    if (aiMeals.length > 0) {
      const apiKey = process.env['GEMINI_API_KEY']
      if (apiKey) {
        const google = createGoogleGenerativeAI({ apiKey })
        const prompt = `You are an ingredient extractor. For each dinner meal name below, list the main ingredients a home cook needs to BUY. Skip pantry staples (salt, pepper, oil, butter, sugar, flour, common spices, rice, pasta, eggs, milk).

For each ingredient include a realistic quantity for a family of 4.

Meals:
${aiMeals.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Respond ONLY with a JSON array, no other text. Each entry: {"meal": "<meal name>", "ingredients": [{"name": "ingredient", "quantity": "500g"}]}`

        try {
          const { text } = await generateText({
            model: google('gemini-3.1-flash-lite-preview'),
            prompt,
          })
          const jsonMatch = text.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as Array<{
              meal: string
              ingredients: Array<{ name: string; quantity?: string }>
            }>
            for (const entry of parsed) {
              for (const ing of entry.ingredients) {
                if (!ing.name) continue
                items.push({
                  name: ing.name,
                  quantity: ing.quantity,
                  source: 'ai',
                  sourceMeal: entry.meal,
                  isStaple: isStaple(ing.name),
                })
              }
            }
          }
        } catch {
          // Fall through — we'll still return whatever we have from Krónan.
        }
      }
    }

    // 4. Try to resolve AI-extracted ingredients to Krónan SKUs (best-effort).
    const aiItemsToResolve = items.filter(
      (i) => i.source === 'ai' && !i.isStaple && !i.sku,
    )

    // Limit external calls — we have a 200 req / 200s budget per user.
    const MAX_LOOKUPS = 12
    const uniqueNames = [
      ...new Set(aiItemsToResolve.map((i) => i.name.toLowerCase())),
    ].slice(0, MAX_LOOKUPS)

    const resolved = new Map<string, { sku: string; productName: string }>()
    await Promise.all(
      uniqueNames.map(async (query) => {
        try {
          const r = await kronanFetch<KronanProductSearchResponse>({
            path: '/products/search/',
            method: 'POST',
            body: { query, page: 1, pageSize: 1 },
            token,
          })
          if (r.hits.length > 0) {
            const hit = r.hits[0]
            resolved.set(query, { sku: hit.sku, productName: hit.name })
          }
        } catch {
          // Ignore individual lookup failures.
        }
      }),
    )

    for (const item of items) {
      if (item.source !== 'ai' || item.sku) continue
      const hit = resolved.get(item.name.toLowerCase())
      if (hit) {
        item.sku = hit.sku
        item.productName = hit.productName
      }
    }

    // 5. De-duplicate by sku-or-lowercased-name across meals, keep first.
    const seen = new Set<string>()
    const deduped: Array<ExtractedIngredient> = []
    for (const item of items) {
      const key = item.sku
        ? `sku:${item.sku}`
        : `name:${item.name.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(item)
    }

    return { items: deduped }
  })

// ---------------------------------------------------------------------------
// Add to cart targets
// ---------------------------------------------------------------------------

const AddToCartInput = z.object({
  items: z.array(
    z.object({
      sku: z.string().optional(),
      name: z.string(),
      quantity: z.number().min(1).max(99).default(1),
    }),
  ),
})

export const addToKronanShoppingNote = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => AddToCartInput.parse(data))
  .handler(async ({ data }) => {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')
    const token = await requireKronanToken(user.id)

    if (data.items.length === 0) return { added: 0 }

    // Krónan caps add-lines at 30 per call.
    const CHUNK = 30
    let added = 0
    for (let i = 0; i < data.items.length; i += CHUNK) {
      const chunk = data.items.slice(i, i + CHUNK)
      const lines = chunk.map((it) =>
        it.sku
          ? { sku: it.sku, quantity: it.quantity }
          : { text: it.name, quantity: it.quantity },
      )
      try {
        await kronanFetch({
          path: '/shopping-notes/add-lines/',
          method: 'POST',
          body: { lines },
          token,
        })
        added += chunk.length
      } catch (err) {
        throw new Error(toUserMessage(err, 'Could not update Krónan list'))
      }
    }
    return { added }
  })

export const addToKronanCheckout = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => AddToCartInput.parse(data))
  .handler(async ({ data }) => {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')
    const token = await requireKronanToken(user.id)

    const skuItems = data.items.filter(
      (it): it is { sku: string; name: string; quantity: number } =>
        Boolean(it.sku),
    )
    if (skuItems.length === 0) return { added: 0, skipped: data.items.length }

    try {
      await kronanFetch({
        path: '/checkout/lines/',
        method: 'POST',
        body: {
          lines: skuItems.map((it) => ({
            sku: it.sku,
            quantity: it.quantity,
          })),
          replace: false,
        },
        token,
      })
    } catch (err) {
      throw new Error(toUserMessage(err, 'Could not update Krónan cart'))
    }
    return { added: skuItems.length, skipped: data.items.length - skuItems.length }
  })
