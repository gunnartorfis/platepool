import {
  HeadContent,
  Scripts,
  createRootRoute,
  redirect,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import appCss from '../styles.css?url'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import { getUser } from '@/lib/auth/get-user'

const fetchUser = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getUser()
  if (!user) return null
  const { passwordHash: _passwordHash, ...publicUser } = user
  return publicUser
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
    <html lang="is">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        <Scripts />
      </body>
    </html>
  )
}
