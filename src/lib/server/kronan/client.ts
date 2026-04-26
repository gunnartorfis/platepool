import { eq } from 'drizzle-orm'
import { getDbWithSchema } from '../../db'
import { kronanCredentials } from '../../db/schema'

const KRONAN_BASE_URL = 'https://api.kronan.is/api/v1'

export class KronanNotConnectedError extends Error {
  constructor() {
    super('Krónan account not connected')
    this.name = 'KronanNotConnectedError'
  }
}

export class KronanApiError extends Error {
  status: number
  body: string
  constructor(status: number, body: string) {
    super(`Krónan API error ${status}: ${body.slice(0, 200)}`)
    this.name = 'KronanApiError'
    this.status = status
    this.body = body
  }
}

export async function getKronanToken(userId: string): Promise<string | null> {
  const db = await getDbWithSchema()
  const rows = await db
    .select()
    .from(kronanCredentials)
    .where(eq(kronanCredentials.userId, userId))
    .limit(1)
  return rows[0]?.accessToken ?? null
}

export async function requireKronanToken(userId: string): Promise<string> {
  const token = await getKronanToken(userId)
  if (!token) throw new KronanNotConnectedError()
  return token
}

type KronanRequest = {
  path: string
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  token: string
}

export async function kronanFetch<T = unknown>({
  path,
  method = 'GET',
  query,
  body,
  token,
}: KronanRequest): Promise<T> {
  const url = new URL(KRONAN_BASE_URL + path)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue
      url.searchParams.set(key, String(value))
    }
  }

  const headers: Record<string, string> = {
    Authorization: `AccessToken ${token}`,
    Accept: 'application/json',
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!response.ok) throw new KronanApiError(response.status, text)
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export type KronanRecipeSummary = {
  token: string
  slug: string
  name: string
  isFeatured?: boolean
  preparationMinutes?: number
  cookingMinutes?: number
  totalMinutes?: number
  servings?: number
  difficulty?: string
  mainImage?: string | null
  tags?: Array<string>
  ingredientTags?: Array<string>
  cuisineTags?: Array<string>
  occasionTags?: Array<string>
  hasVideo?: boolean
}

export type KronanRecipeDetail = KronanRecipeSummary & {
  directions?: string
  ingredients?: Array<KronanRecipeIngredient>
  items?: Array<KronanRecipeItem>
  essentials?: Array<KronanRecipeItem>
  recommendations?: Array<KronanRecipeItem>
  images?: Array<string>
  directionSteps?: Array<{ step: number; text: string }>
  favorited?: boolean
}

export type KronanRecipeIngredient = {
  text?: string
  name?: string
  amount?: string
  quantity?: number | string
  unit?: string
  product?: KronanProductMini | null
}

export type KronanRecipeItem = {
  product?: KronanProductMini
  quantity?: number
}

export type KronanProductMini = {
  sku: string
  name: string
  thumbnail?: string | null
  price?: number | null
}

export type KronanProductSearchHit = {
  sku: string
  name: string
  thumbnail?: string | null
  price?: number | null
  tags?: Array<string>
}

export type KronanProductSearchResponse = {
  count: number
  page: number
  pageCount: number
  hasNextPage: boolean
  hits: Array<KronanProductSearchHit>
}

export type KronanIdentity = {
  id?: string
  name?: string
  email?: string
  type?: string
}

export async function fetchKronanIdentity(
  token: string,
): Promise<KronanIdentity> {
  return kronanFetch<KronanIdentity>({ path: '/me/', token })
}
