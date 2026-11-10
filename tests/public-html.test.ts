import { expect, test } from 'vitest'
import { fetchPublicHtml } from '../src/lib/server/public-html'

// These must fail before any network access, including IPv4-mapped IPv6 and
// credentials hidden in a URL. DNS pinning/redirects are enforced by the adapter.
test.each([
  'http://example.com/recipe',
  'https://127.0.0.1/',
  'https://[::1]/',
  'https://[::ffff:127.0.0.1]/',
  'https://example.com:5432/',
  'https://user:password@example.com/',
])('recipe imports reject unsafe destination %s', async (url) => {
  await expect(fetchPublicHtml(url)).rejects.toThrow('public HTTPS recipe URL')
})
