import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  homeSetupCompleted: boolean('home_setup_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
})

export const families = pgTable('families', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
})

export const familyMembers = pgTable('family_members', {
  familyId: text('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['admin', 'member'] })
    .notNull()
    .default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
})

export const familyMealPlans = pgTable('family_meal_plans', {
  id: text('id').primaryKey(),
  familyId: text('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  weekStart: text('week_start').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
})

export const familyDayPlans = pgTable('family_day_plans', {
  id: text('id').primaryKey(),
  familyMealPlanId: text('family_meal_plan_id')
    .notNull()
    .references(() => familyMealPlans.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  mealName: text('meal_name'),
  notes: text('notes'),
  recipeUrl: text('recipe_url'),
  constraintIds: text('constraint_ids').notNull().default('[]'),
})

export const familyShares = pgTable('family_shares', {
  familyMealPlanId: text('family_meal_plan_id')
    .notNull()
    .references(() => familyMealPlans.id, { onDelete: 'cascade' }),
  sharedWithFamilyId: text('shared_with_family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  sharedAt: timestamp('shared_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
})

export const familySubscriptions = pgTable('family_subscriptions', {
  familyId: text('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
})

export const constraints = pgTable('constraints', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6b7280'),
  emoji: text('emoji'),
  type: text('type', { enum: ['regular', 'new'] })
    .notNull()
    .default('regular'),
  frequency: text('frequency'),
})

export const dayTemplates = pgTable('day_templates', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  constraintIds: text('constraint_ids').notNull().default('[]'),
})

export const recipeLinks = pgTable('recipe_links', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url'),
  description: text('description'),
  metadata: text('metadata'),
  tags: text('tags').notNull().default('[]'),
  stars: integer('stars').notNull().default(0),
  curated: integer('curated').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
})

export const mealPlans = pgTable('meal_plans', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  weekStart: text('week_start').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
})

export const dayPlans = pgTable('day_plans', {
  id: text('id').primaryKey(),
  mealPlanId: text('meal_plan_id')
    .notNull()
    .references(() => mealPlans.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  mealName: text('meal_name'),
  notes: text('notes'),
  recipeUrl: text('recipe_url'),
  constraintIds: text('constraint_ids').notNull().default('[]'),
})

export const kronanCredentials = pgTable('kronan_credentials', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  identityName: text('identity_name'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
})

// Types
export type User = typeof users.$inferSelect
export type Session = typeof sessions.$inferSelect
export type Constraint = typeof constraints.$inferSelect
export type DayTemplate = typeof dayTemplates.$inferSelect
export type RecipeLink = typeof recipeLinks.$inferSelect
export type MealPlan = typeof mealPlans.$inferSelect
export type DayPlan = typeof dayPlans.$inferSelect
export type Family = typeof families.$inferSelect
export type FamilyMember = typeof familyMembers.$inferSelect
export type FamilyMealPlan = typeof familyMealPlans.$inferSelect
export type FamilyDayPlan = typeof familyDayPlans.$inferSelect
export type FamilyShare = typeof familyShares.$inferSelect
export type FamilySubscription = typeof familySubscriptions.$inferSelect
export type KronanCredential = typeof kronanCredentials.$inferSelect
