CREATE TABLE "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "password_hash" text NOT NULL,
  "avatar_url" text,
  "home_setup_completed" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "users_email_unique" UNIQUE ("email")
);
--> statement-breakpoint
CREATE TABLE "constraints" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "color" text NOT NULL DEFAULT '#6b7280',
  "emoji" text,
  "type" text NOT NULL DEFAULT 'regular',
  "frequency" text,
  CONSTRAINT "constraints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "week_start" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "day_plans" (
  "id" text PRIMARY KEY NOT NULL,
  "meal_plan_id" text NOT NULL,
  "day_of_week" integer NOT NULL,
  "meal_name" text,
  "notes" text,
  "recipe_url" text,
  "constraint_ids" text NOT NULL DEFAULT '[]',
  CONSTRAINT "day_plans_meal_plan_id_meal_plans_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "day_templates" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "day_of_week" integer NOT NULL,
  "constraint_ids" text NOT NULL DEFAULT '[]',
  CONSTRAINT "day_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "families" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "created_by" text NOT NULL,
  "invite_code" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "families_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "families_invite_code_unique" UNIQUE ("invite_code")
);
--> statement-breakpoint
CREATE TABLE "family_meal_plans" (
  "id" text PRIMARY KEY NOT NULL,
  "family_id" text NOT NULL,
  "week_start" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "family_meal_plans_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "family_day_plans" (
  "id" text PRIMARY KEY NOT NULL,
  "family_meal_plan_id" text NOT NULL,
  "day_of_week" integer NOT NULL,
  "meal_name" text,
  "notes" text,
  "recipe_url" text,
  "constraint_ids" text NOT NULL DEFAULT '[]',
  CONSTRAINT "family_day_plans_family_meal_plan_id_family_meal_plans_id_fk" FOREIGN KEY ("family_meal_plan_id") REFERENCES "family_meal_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "family_members" (
  "family_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role" text NOT NULL DEFAULT 'member',
  "joined_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "family_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "family_members_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "family_shares" (
  "family_meal_plan_id" text NOT NULL,
  "shared_with_family_id" text NOT NULL,
  "shared_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "family_shares_shared_with_family_id_families_id_fk" FOREIGN KEY ("shared_with_family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "family_shares_family_meal_plan_id_family_meal_plans_id_fk" FOREIGN KEY ("family_meal_plan_id") REFERENCES "family_meal_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "family_subscriptions" (
  "family_id" text NOT NULL,
  "user_id" text NOT NULL,
  "subscribed_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "family_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "family_subscriptions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "kronan_credentials" (
  "user_id" text PRIMARY KEY NOT NULL,
  "access_token" text NOT NULL,
  "identity_name" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "kronan_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "recipe_links" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "title" text NOT NULL,
  "url" text,
  "description" text,
  "metadata" text,
  "tags" text NOT NULL DEFAULT '[]',
  "stars" integer NOT NULL DEFAULT 0,
  "curated" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "recipe_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
