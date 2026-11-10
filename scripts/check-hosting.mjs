// Against a running built Node server; never Vite preview. No authenticated writes.
import assert from 'node:assert/strict'
const base = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000'
for (const path of ['/health', '/login', '/register']) {
  const response = await fetch(new URL(path, base), {
    signal: AbortSignal.timeout(15000),
  })
  assert.equal(response.status, 200, path)
  if (path === '/health') {
    assert.equal((await response.json()).status, 'ok')
  } else {
    const html = await response.text()
    assert.match(html, /<html/)
    assert.doesNotMatch(
      html,
      /passwordHash|password_hash|TURSO_AUTH_TOKEN|GEMINI_API_KEY/,
    )
    const asset = html.match(/(?:src|href)="([^" ]*\/assets\/[^" ]+)"/)
    assert.ok(asset, `Built static asset on ${path}`)
    const assetResponse = await fetch(new URL(asset[1], base))
    assert.equal(assetResponse.status, 200)
  }
}
for (const path of [
  '/',
  '/recipes',
  '/constraints',
  '/settings',
  '/subscriptions',
]) {
  const response = await fetch(new URL(path, base), { redirect: 'manual' })
  assert.ok(
    [301, 302, 303, 307, 308].includes(response.status),
    `${path}: ${response.status}`,
  )
  assert.match(response.headers.get('location') ?? '', /\/login/)
}
console.log(JSON.stringify({ event: 'hosting.smoke', status: 'passed', base }))
