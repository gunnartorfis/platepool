import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getMySubscriptions,
  subscribeToFamily,
  unsubscribeFromFamily,
  getSubscriptionFeed,
} from '@/lib/server/subscriptions'
import { getDiscoverableFamilies } from '@/lib/server/families'

interface Family {
  id: string
  name: string
}

export const Route = createFileRoute('/subscriptions/')({
  component: SubscriptionsPage,
  loader: async () => {
    const subscriptions = await getMySubscriptions()
    const discoverable = await getDiscoverableFamilies()
    const feed = await getSubscriptionFeed({ data: { limit: 10, offset: 0 } })
    return { subscriptions, discoverable, feed }
  },
})

function SubscriptionsPage() {
  const { t } = useTranslation()
  const data = Route.useLoaderData()
  const [subscriptions, setSubscriptions] = useState<Family[]>(
    data.subscriptions,
  )
  const [discoverable, setDiscoverable] = useState<Family[]>(data.discoverable)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [tab, setTab] = useState<'my' | 'discover'>('my')

  const handleSubscribe = async (familyId: string) => {
    setSubscribing(familyId)
    try {
      await subscribeToFamily({ data: { familyId } })
      const family = discoverable.find((f) => f.id === familyId)
      if (family) {
        setSubscriptions([...subscriptions, family])
        setDiscoverable(discoverable.filter((f) => f.id !== familyId))
      }
    } catch (err) {
      console.error('Failed to subscribe:', err)
    } finally {
      setSubscribing(null)
    }
  }

  const handleUnsubscribe = async (familyId: string) => {
    setSubscribing(familyId)
    try {
      await unsubscribeFromFamily({ data: { familyId } })
      const family = subscriptions.find((f) => f.id === familyId)
      if (family) {
        setSubscriptions(subscriptions.filter((f) => f.id !== familyId))
        setDiscoverable([...discoverable, family])
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err)
    } finally {
      setSubscribing(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('subscriptions.title')}</h1>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('my')}
          className={`px-4 py-2 -mb-px border-b-2 ${
            tab === 'my'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          {t('subscriptions.mySubscriptions')}
        </button>
        <button
          onClick={() => setTab('discover')}
          className={`px-4 py-2 -mb-px border-b-2 ${
            tab === 'discover'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          {t('subscriptions.discover')}
        </button>
      </div>

      {tab === 'my' && (
        <div className="space-y-3">
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('subscriptions.noSubscriptions')}
            </p>
          ) : (
            subscriptions.map((family) => (
              <div
                key={family.id}
                className="flex items-center justify-between bg-card border rounded-lg p-4"
              >
                <span className="font-medium">{family.name}</span>
                <button
                  onClick={() => handleUnsubscribe(family.id)}
                  disabled={subscribing === family.id}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {subscribing === family.id
                    ? '...'
                    : t('subscriptions.unsubscribe')}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'discover' && (
        <div className="space-y-3">
          {discoverable.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('subscriptions.nothingToDiscover')}
            </p>
          ) : (
            discoverable.map((family) => (
              <div
                key={family.id}
                className="flex items-center justify-between bg-card border rounded-lg p-4"
              >
                <span className="font-medium">{family.name}</span>
                <button
                  onClick={() => handleSubscribe(family.id)}
                  disabled={subscribing === family.id}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
                >
                  {subscribing === family.id
                    ? '...'
                    : t('subscriptions.subscribe')}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
