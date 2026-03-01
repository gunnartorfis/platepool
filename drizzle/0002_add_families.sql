CREATE TABLE `families` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `created_by` text NOT NULL,
  `invite_code` text NOT NULL UNIQUE,
  `created_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `family_members` (
  `family_id` text NOT NULL,
  `user_id` text NOT NULL,
  `role` text NOT NULL DEFAULT 'member',
  `joined_at` integer NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (`family_id`, `user_id`),
  FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `family_meal_plans` (
  `id` text PRIMARY KEY NOT NULL,
  `family_id` text NOT NULL,
  `week_start` text NOT NULL,
  `created_at` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `family_day_plans` (
  `id` text PRIMARY KEY NOT NULL,
  `family_meal_plan_id` text NOT NULL,
  `day_of_week` integer NOT NULL,
  `meal_name` text,
  `notes` text,
  `recipe_url` text,
  `constraint_ids` text NOT NULL DEFAULT '[]',
  FOREIGN KEY (`family_meal_plan_id`) REFERENCES `family_meal_plans`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `family_shares` (
  `family_meal_plan_id` text NOT NULL,
  `shared_with_family_id` text NOT NULL,
  `shared_at` integer NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (`family_meal_plan_id`, `shared_with_family_id`),
  FOREIGN KEY (`family_meal_plan_id`) REFERENCES `family_meal_plans`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`shared_with_family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE
);
