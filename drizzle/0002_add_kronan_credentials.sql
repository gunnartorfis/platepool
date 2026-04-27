CREATE TABLE IF NOT EXISTS `kronan_credentials` (
	`user_id` text PRIMARY KEY NOT NULL,
	`access_token` text NOT NULL,
	`identity_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
