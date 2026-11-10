/* Health protocol values are machine readable, not UI copy. */
/* eslint-disable no-hardcoded-english/no-hardcoded-english */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          { status: 'ok' },
          { headers: { 'Cache-Control': 'no-store' } },
        ),
    },
  },
})
