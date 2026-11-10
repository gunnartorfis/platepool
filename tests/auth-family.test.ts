import { afterAll, beforeAll, expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { eq } from 'drizzle-orm'

const cookie = vi.hoisted(() => ({
  value: '',
  options: {} as Record<string, unknown>,
}))
// Exercise real handlers, password hashing, sessions and SQL without a framework
// request context. HTTP/proxy/CSRF and hydration still require browser staging tests.
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let parse = (data: unknown) => data
    const builder = {
      inputValidator(fn: (data: unknown) => unknown) {
        parse = fn
        return builder
      },
      handler(fn: (input: { data: unknown }) => unknown) {
        return (options?: { data?: unknown }) =>
          fn({ data: parse(options?.data) })
      },
    }
    return builder
  },
}))
vi.mock('@tanstack/react-start/server', () => ({
  getCookie: () => cookie.value || undefined,
  setCookie: (
    _name: string,
    value: string,
    options: Record<string, unknown>,
  ) => {
    cookie.value = value
    cookie.options = options
  },
  deleteCookie: () => {
    cookie.value = ''
  },
}))
let connected = false
beforeAll(async () => {
  const url = process.env.TEST_DATABASE_URL
  if (!url || !new URL(url).pathname.endsWith('_test')) {
    throw new Error(
      'TEST_DATABASE_URL must point to a dedicated PostgreSQL database ending in _test',
    )
  }
  vi.stubEnv('DATABASE_URL', url)
  vi.stubEnv('NODE_ENV', 'test')
  const target = new URL(url)
  const env = {
    ...process.env,
    DATABASE_URL: url,
    DB_DEPLOY_TARGET: `${target.hostname}:${target.port || '5432'}${target.pathname}`,
    DEPLOY_ENV: 'test',
  }
  execFileSync(process.execPath, ['scripts/db-deploy.mjs'], { env })
  execFileSync(process.execPath, ['scripts/db-deploy.mjs'], { env })
  connected = true
})
afterAll(async () => {
  if (connected) {
    const { pool } = await import('../src/lib/db')
    await pool.end()
  }
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

test('registration, secure session, database-backed persistence, logout, expiration and family denial', async () => {
  const auth = await import('../src/lib/server/auth')
  const families = await import('../src/lib/server/families')
  const plans = await import('../src/lib/server/family-meal-plans')
  const recipes = await import('../src/lib/server/recipes')
  const constraints = await import('../src/lib/server/constraints')
  const { validateSession } = await import('../src/lib/auth/session')
  const { db } = await import('../src/lib/db')
  const { sessions } = await import('../src/lib/db/schema')
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('Unexpected external request in isolated tests')
    }),
  )
  const password = 'synthetic-password-2026'
  const suffix = crypto.randomUUID()
  const emailA = `a-${suffix}@example.invalid`
  const emailB = `b-${suffix}@example.invalid`
  const a = await auth.register({
    data: { name: 'Synthetic A', email: emailA, password },
  })
  const aSession = cookie.value
  expect(cookie.options.httpOnly).toBe(true)
  expect(cookie.options.sameSite).toBe('lax')
  const home = await families.createFamily({
    data: { name: 'Synthetic A family' },
  })
  await plans.upsertFamilyDayPlan({
    data: {
      familyId: home.id,
      weekStart: '2026-11-09',
      dayOfWeek: 0,
      mealName: 'Synthetic soup',
    },
  })
  const recipeId = await recipes.saveRecipe({
    data: { title: 'Synthetic soup', tags: [] },
  })
  await constraints.saveConstraint({
    data: { name: 'Vegetarian', color: '#00ff00' },
  })
  expect((await recipes.getMyRecipes()).some((r) => r.id === recipeId)).toBe(
    true,
  )
  expect((await constraints.getMyConstraints()).length).toBe(1)
  expect((await validateSession(aSession))?.user.id).toBe(a.userId)
  await auth.logout()
  expect(await validateSession(aSession)).toBeNull()
  await expect(
    auth.login({ data: { email: emailA, password: 'wrong' } }),
  ).rejects.toThrow('Invalid email or password')
  // Cookie policy depends on deployed runtime, independent of proxy headers.
  vi.stubEnv('NODE_ENV', 'production')
  await auth.login({ data: { email: emailA, password } })
  expect(cookie.options.secure).toBe(true)
  vi.stubEnv('NODE_ENV', 'test')
  const persistedSession = cookie.value
  expect(
    (
      await plans.getFamilyMealPlan({
        data: { familyId: home.id, weekStart: '2026-11-09' },
      })
    ).days[0].mealName,
  ).toBe('Synthetic soup')
  cookie.value = ''
  await auth.register({
    data: { name: 'Synthetic B', email: emailB, password },
  })
  await expect(
    families.getFamily({ data: { familyId: home.id } }),
  ).rejects.toThrow('Not a member')
  await expect(
    plans.upsertFamilyDayPlan({
      data: {
        familyId: home.id,
        weekStart: '2026-11-09',
        dayOfWeek: 0,
        mealName: 'Attack',
      },
    }),
  ).rejects.toThrow('Not a member')
  expect(await recipes.getMyRecipes()).toEqual([])
  expect(await constraints.getMyConstraints()).toEqual([])
  await families.joinFamily({ data: { inviteCode: home.inviteCode } })
  expect(
    (
      await plans.getFamilyMealPlan({
        data: { familyId: home.id, weekStart: '2026-11-09' },
      })
    ).days[0].mealName,
  ).toBe('Synthetic soup')
  await expect(
    plans.shareFamilyMealPlan({
      data: {
        familyId: home.id,
        weekStart: '2026-11-09',
        shareWithFamilyId: 'other',
      },
    }),
  ).rejects.toThrow('Only admins can share')
  await db
    .update(sessions)
    .set({ expiresAt: new Date(0) })
    .where(eq(sessions.id, persistedSession))
  expect(await validateSession(persistedSession)).toBeNull()
  vi.unstubAllGlobals()
})
