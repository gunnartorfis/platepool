// Retired: this script targeted data/platepool.db and swallowed DDL errors.
throw new Error(
  'Use pnpm db:deploy with an explicitly reviewed database target. See docs/hosting.md.',
)
