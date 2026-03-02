import {
  HeadContent,
  Scripts,
  createRootRoute,
  redirect,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import appCss from '../styles.css?url'
import '@/lib/i18n'
import { getUser } from '@/lib/auth/get-user'

const fetchUser = createServerFn({ method: 'GET' }).handler(async () => {
  return getUser()
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'PlatePool' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),

  beforeLoad: async ({ location }) => {
    const user = await fetchUser()
    const publicPaths = ['/login', '/register']
    const isPublic = publicPaths.some((p) => location.pathname.startsWith(p))

    if (!user && !isPublic) {
      throw redirect({ to: '/login' })
    }
    if (user && isPublic) {
      throw redirect({ to: '/' })
    }

    return { user: user }
  },

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
