import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { changePassword, logout, updateProfile } from '@/lib/server/auth'
import { getMyFamilies } from '@/lib/server/families'
import {
  connectKronan,
  disconnectKronan,
  getKronanStatus,
} from '@/lib/server/kronan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

type Family = { id: string; name: string; inviteCode: string; role: string }

function SettingsPage() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState<
    'profile' | 'password' | 'language' | 'homes' | 'kronan'
  >('language')

  const [families, setFamilies] = useState<Array<Family>>([])

  type KronanState =
    | { connected: false }
    | { connected: true; identityName?: string | null }
  const [kronanStatus, setKronanStatus] = useState<KronanState | null>(null)
  const [kronanToken, setKronanToken] = useState('')
  const [kronanSaving, setKronanSaving] = useState(false)
  const [kronanError, setKronanError] = useState('')

  const [pName, setPName] = useState('')
  const [pEmail, setPEmail] = useState('')
  const [pSaving, setPsaving] = useState(false)
  const [pError, setPError] = useState('')

  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setPError('')
    setPsaving(true)
    try {
      await updateProfile({ data: { name: pName, email: pEmail } })
      await router.invalidate()
    } catch (err) {
      setPError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setPsaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    setPwSaving(true)
    try {
      await changePassword({
        data: { currentPassword: pwCurrent, newPassword: pwNew },
      })
      setPwCurrent('')
      setPwNew('')
      setPwSuccess(true)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setPwSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    await router.invalidate()
    router.navigate({ to: '/login' })
  }

  useEffect(() => {
    async function loadFamilies() {
      const fs = await getMyFamilies()
      setFamilies(fs as Array<Family>)
    }
    async function loadKronan() {
      try {
        const status = (await getKronanStatus()) as KronanState
        setKronanStatus(status)
      } catch {
        setKronanStatus({ connected: false })
      }
    }
    loadFamilies()
    loadKronan()
  }, [])

  async function handleConnectKronan(e: React.FormEvent) {
    e.preventDefault()
    setKronanError('')
    setKronanSaving(true)
    try {
      const result = (await connectKronan({
        data: { token: kronanToken },
      })) as { connected: true; identityName: string | null }
      setKronanStatus({
        connected: true,
        identityName: result.identityName,
      })
      setKronanToken('')
    } catch (err) {
      setKronanError(
        err instanceof Error ? err.message : t('common.error'),
      )
    } finally {
      setKronanSaving(false)
    }
  }

  async function handleDisconnectKronan() {
    setKronanSaving(true)
    try {
      await disconnectKronan()
      setKronanStatus({ connected: false })
    } finally {
      setKronanSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-display font-bold tracking-tight mb-8">
          {t('settings.title')}
        </h1>

        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          {(
            ['profile', 'password', 'language', 'homes', 'kronan'] as const
          ).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {key === 'homes'
                ? t('settings.homes')
                : key === 'kronan'
                  ? t('settings.kronan.tab')
                  : t(`settings.${key}`)}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pname">{t('common.name')}</Label>
                <Input
                  id="pname"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pemail">{t('common.email')}</Label>
                <Input
                  id="pemail"
                  type="email"
                  value={pEmail}
                  onChange={(e) => setPEmail(e.target.value)}
                  required
                />
              </div>
              {pError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {pError}
                </p>
              )}
              <Button type="submit" disabled={pSaving}>
                {pSaving ? t('common.saving') : t('settings.updateProfile')}
              </Button>
            </form>

            <div className="pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-destructive hover:text-destructive"
              >
                {t('auth.signOut')}
              </Button>
            </div>
          </div>
        )}

        {tab === 'password' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pwcurrent">{t('auth.currentPassword')}</Label>
                <Input
                  id="pwcurrent"
                  type="password"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwnew">{t('auth.newPassword')}</Label>
                <Input
                  id="pwnew"
                  type="password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              {pwError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {pwError}
                </p>
              )}
              {pwSuccess && (
                <p className="text-sm text-primary bg-primary/10 px-3 py-2 rounded-md">
                  {t('settings.passwordChanged')}
                </p>
              )}
              <Button type="submit" disabled={pwSaving}>
                {pwSaving ? t('common.changing') : t('settings.changePassword')}
              </Button>
            </form>
          </div>
        )}

        {tab === 'language' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-base font-display font-semibold mb-4">
              {t('settings.title')}
            </h2>
            <div className="space-y-3">
              <Label htmlFor="language">{t('settings.selectLanguage')}</Label>
              <Select
                value={i18n.language || 'is'}
                onValueChange={(value) => value && i18n.changeLanguage(value)}
              >
                <SelectTrigger id="language" className="w-48">
                  <SelectValue placeholder={t('settings.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="is">{t('settings.icelandic')}</SelectItem>
                  <SelectItem value="en">{t('settings.english')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {tab === 'kronan' && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-base font-display font-semibold">
                {t('settings.kronan.title')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('settings.kronan.description')}
              </p>
            </div>

            {kronanStatus === null ? (
              <p className="text-sm text-muted-foreground">
                {t('common.loading')}
              </p>
            ) : kronanStatus.connected ? (
              <div className="space-y-3">
                <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm">
                  <p className="font-medium text-emerald-900">
                    {t('settings.kronan.connected')}
                  </p>
                  {kronanStatus.identityName && (
                    <p className="text-xs text-emerald-800/80 mt-0.5">
                      {kronanStatus.identityName}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnectKronan}
                  disabled={kronanSaving}
                >
                  {t('settings.kronan.disconnect')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleConnectKronan} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="kronan-token">
                    {t('settings.kronan.tokenLabel')}
                  </Label>
                  <Input
                    id="kronan-token"
                    type="password"
                    autoComplete="off"
                    value={kronanToken}
                    onChange={(e) => setKronanToken(e.target.value)}
                    placeholder={t('settings.kronan.tokenPlaceholder')}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.kronan.tokenHint')}
                  </p>
                </div>
                {kronanError && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                    {kronanError}
                  </p>
                )}
                <Button type="submit" disabled={kronanSaving}>
                  {kronanSaving
                    ? t('common.saving')
                    : t('settings.kronan.connect')}
                </Button>
              </form>
            )}
          </div>
        )}

        {tab === 'homes' && (
          <div className="space-y-3">
            {families.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">{t('settings.noHomes')}</p>
              </div>
            ) : (
              families.map((family) => (
                <div
                  key={family.id}
                  className="flex items-center justify-between bg-card border border-border rounded-lg p-4"
                >
                  <div>
                    <p className="font-medium">{family.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('families.code')}{' '}
                      <span className="font-mono">{family.inviteCode}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
