import { createMiddleware, createStart } from '@tanstack/react-start'

// The installed Start version predates its built-in CSRF middleware. Railway
// terminates TLS, so compare public hosts while requiring HTTPS in production.
const sameOrigin = createMiddleware({ type: 'request' }).server(
  ({ request, pathname, next }) => {
    if (pathname.startsWith('/_serverFn/') && request.method !== 'GET') {
      const origin = request.headers.get('origin')
      let valid = false
      try {
        const source = new URL(origin ?? '')
        const target = new URL(request.url)
        valid =
          source.host === target.host &&
          (process.env.NODE_ENV !== 'production' ||
            source.protocol === 'https:')
      } catch {
        valid = false
      }
      if (!valid || request.headers.get('sec-fetch-site') === 'cross-site') {
        return new Response('Forbidden', { status: 403 })
      }
    }
    return next()
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [sameOrigin],
}))
