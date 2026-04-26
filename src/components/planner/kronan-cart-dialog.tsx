import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  addToKronanCheckout,
  addToKronanShoppingNote,
  extractMealPlanIngredients,
} from '@/lib/server/kronan'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Item = {
  name: string
  quantity?: string
  source: 'kronan-recipe' | 'ai'
  sourceMeal: string
  sku?: string
  productName?: string
  isStaple: boolean
}

type Mode = 'shopping-list' | 'checkout'

export function KronanCartDialog({
  open,
  onClose,
  weekStart,
}: {
  open: boolean
  onClose: () => void
  weekStart: string
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Array<Item>>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<Mode | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function keyOf(item: Item) {
    return item.sku ? `sku:${item.sku}` : `name:${item.name.toLowerCase()}`
  }

  useEffect(() => {
    if (!open) {
      setItems([])
      setSelected(new Set())
      setError(null)
      setSuccess(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setSuccess(null)
    extractMealPlanIngredients({ data: { weekStart } })
      .then((response) => {
        if (cancelled) return
        const fetchedItems = (response as { items: Array<Item> }).items
        setItems(fetchedItems)
        const initial = new Set<string>()
        for (const item of fetchedItems) {
          if (!item.isStaple) initial.add(keyOf(item))
        }
        setSelected(initial)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : t('common.error'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, weekStart, t])

  function toggle(item: Item) {
    const key = keyOf(item)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function submit(mode: Mode) {
    setSubmitting(mode)
    setError(null)
    setSuccess(null)
    try {
      const chosen = items
        .filter((item) => selected.has(keyOf(item)))
        .map((item) => ({
          sku: item.sku,
          name: item.productName ?? item.name,
          quantity: 1,
        }))

      if (chosen.length === 0) {
        setError(t('kronan.cart.nothingSelected'))
        return
      }

      if (mode === 'shopping-list') {
        const res = (await addToKronanShoppingNote({
          data: { items: chosen },
        })) as { added: number }
        setSuccess(t('kronan.cart.addedToList', { count: res.added }))
      } else {
        const res = (await addToKronanCheckout({
          data: { items: chosen },
        })) as { added: number; skipped: number }
        if (res.skipped > 0) {
          setSuccess(
            t('kronan.cart.addedToCartPartial', {
              added: res.added,
              skipped: res.skipped,
            }),
          )
        } else {
          setSuccess(t('kronan.cart.addedToCart', { count: res.added }))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSubmitting(null)
    }
  }

  const essentials = items.filter((i) => !i.isStaple)
  const staples = items.filter((i) => i.isStaple)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('kronan.cart.title')}</DialogTitle>
          <DialogDescription>{t('kronan.cart.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-2">
          {loading && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t('kronan.cart.loading')}
            </p>
          )}

          {!loading && items.length === 0 && !error && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t('kronan.cart.empty')}
            </p>
          )}

          {!loading && essentials.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                {t('kronan.cart.essentialsHeading')}
              </h3>
              <ul className="space-y-1">
                {essentials.map((item) => (
                  <ItemRow
                    key={keyOf(item) + ':' + item.sourceMeal}
                    item={item}
                    checked={selected.has(keyOf(item))}
                    onToggle={() => toggle(item)}
                  />
                ))}
              </ul>
            </section>
          )}

          {!loading && staples.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                {t('kronan.cart.staplesHeading')}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {t('kronan.cart.staplesHint')}
              </p>
              <ul className="space-y-1">
                {staples.map((item) => (
                  <ItemRow
                    key={keyOf(item) + ':' + item.sourceMeal}
                    item={item}
                    checked={selected.has(keyOf(item))}
                    onToggle={() => toggle(item)}
                  />
                ))}
              </ul>
            </section>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-md">
              {success}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={!!submitting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="outline"
            onClick={() => submit('shopping-list')}
            disabled={loading || !!submitting || items.length === 0}
          >
            {submitting === 'shopping-list'
              ? t('common.saving')
              : t('kronan.cart.addToList')}
          </Button>
          <Button
            onClick={() => submit('checkout')}
            disabled={loading || !!submitting || items.length === 0}
          >
            {submitting === 'checkout'
              ? t('common.saving')
              : t('kronan.cart.addToCheckout')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ItemRow({
  item,
  checked,
  onToggle,
}: {
  item: Item
  checked: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <li>
      <label className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-medium">{item.productName ?? item.name}</span>
            {item.quantity && (
              <span className="text-muted-foreground ml-1.5">
                · {item.quantity}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.sourceMeal}
            {!item.sku && item.source === 'ai' && (
              <span className="ml-2 text-amber-700">
                · {t('kronan.cart.textOnly')}
              </span>
            )}
          </p>
        </div>
      </label>
    </li>
  )
}
