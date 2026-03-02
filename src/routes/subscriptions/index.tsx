import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import {
  getMySubscriptions,
  subscribeToFamily,
  subscribeToFamilyByCode,
  unsubscribeFromFamily,
} from '@/lib/server/subscriptions'
import { getDiscoverableFamilies, getMyFamilies } from '@/lib/server/families'

interface Family {
  id: string
  name: string
  inviteCode?: string
}

export const Route = createFileRoute('/subscriptions/')({
  component: SubscriptionsPage,
  loader: async () => {
    const subscriptions = await getMySubscriptions()
    const discoverable = await getDiscoverableFamilies()
    const myFamilies = await getMyFamilies()
    return { subscriptions, discoverable, myFamilies }
  },
})

function SubscriptionsPage() {
  const { t } = useTranslation()
  const data = Route.useLoaderData()
  const [subscriptions, setSubscriptions] = useState<Array<Family>>(
    data.subscriptions,
  )
  const [discoverable, setDiscoverable] = useState<Array<Family>>(
    data.discoverable,
  )
  const [myFamilies] = useState<Array<Family>>(
    data.myFamilies.map((f: Family & { role: string }) => ({
      id: f.id,
      name: f.name,
      inviteCode: f.inviteCode,
    })),
  )
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

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

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setJoining(true)
    setJoinError(null)
    try {
      const result = await subscribeToFamilyByCode({
        data: { inviteCode: joinCode.trim() },
      })
      setSubscriptions([...subscriptions, result])
      setJoinCode('')
    } catch (err) {
      setJoinError(t('common.joinFailed'))
    } finally {
      setJoining(false)
    }
  }

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            {t('subscriptions.title')}
          </h1>
        </div>

        {myFamilies.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {t('subscriptions.myHomes')}
            </h2>
            <div className="space-y-2">
              {myFamilies.map((family) => (
                <div
                  key={family.id}
                  className="flex items-center justify-between bg-card border rounded-lg p-4"
                >
                  <div>
                    <span className="font-medium">{family.name}</span>
                    {family.inviteCode && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {t('subscriptions.code')}:
                        </span>
                        <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">
                          {family.inviteCode}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(family.inviteCode!, family.id)
                          }
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {copied === family.id
                            ? t('home.copied')
                            : t('common.share')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {t('subscriptions.mySubscriptions')}
          </h2>
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('subscriptions.noSubscriptions')}
            </p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((family) => (
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
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {t('subscriptions.discover')}
          </h2>

          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder={t('subscriptions.enterCode')}
              className="flex-1 h-10 px-3 rounded-lg border bg-input/30 text-sm uppercase tracking-wider"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={joining || joinCode.length < 6}
              className="px-4 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {joining ? '...' : t('subscriptions.join')}
            </button>
          </form>
          {joinError && <p className="text-sm text-destructive">{joinError}</p>}

          {discoverable.length > 0 && (
            <div className="space-y-2">
              {discoverable.map((family) => (
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
              ))}
            </div>
          )}
          {discoverable.length === 0 && joinCode.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              {t('subscriptions.nothingToDiscover')}
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
