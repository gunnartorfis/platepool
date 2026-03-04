import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RecipePreviewCard } from './recipe-preview-card'
import { DAY_FULL } from './types'
import type { Dispatch, SetStateAction } from 'react'
import type { Constraint } from '@/lib/db/schema'
import type { RecipeData } from '@/hooks/use-recipe-form'
import { useRecipeForm } from '@/hooks/use-recipe-form'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagSelector } from '@/components/ui/tag-selector'
import {
  ArrowLeftIcon,
  CheckIcon,
  LinkIcon,
  PlusIcon,
  SearchIcon,
  SparkleIcon,
  XIcon,
} from '@/components/ui/icons'

const URL_PREFIX = 'http'

export type DrawerFormProps = {
  editingDay: number
  weekStart: string
  /** Meal name derived from recipe selection (visible but read-only in form) */
  meal: string
  /** Recipe URL derived from recipe selection (visible but read-only in form) */
  recipeUrl: string
  editNotes: string
  setEditNotes: (v: string) => void
  editConstraintIds: Array<string>
  setEditConstraintIds: Dispatch<SetStateAction<Array<string>>>
  constraints: Array<Constraint>
  saving: boolean
  onSave: () => void
  onClose: () => void
  recipes: Array<RecipeData>
  recipesLoading: boolean
  selectedRecipeId: string | null
  setSelectedRecipeId: (id: string | null) => void
  onRecipeCreated: (id: string, title: string, url: string | null) => void
}

function getRecipeImage(recipe: RecipeData): string | null {
  const img = recipe.metadata?.image || recipe.metadata?.recipe?.image
  if (!img) return null
  return Array.isArray(img) ? img[0] : img
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function DrawerForm({
  editingDay,
  weekStart,
  meal,
  recipeUrl,
  editNotes,
  setEditNotes,
  editConstraintIds,
  setEditConstraintIds,
  constraints,
  saving,
  onSave,
  onClose,
  recipes,
  recipesLoading,
  selectedRecipeId,
  setSelectedRecipeId,
  onRecipeCreated,
}: DrawerFormProps) {
  const { t, i18n } = useTranslation()
  const [formMode, setFormMode] = useState<'search' | 'create'>('search')
  const [searchQuery, setSearchQuery] = useState('')

  const fullDate = (() => {
    const d = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + editingDay)
    return `${t(DAY_FULL[editingDay])}, ${d.toLocaleDateString(i18n.language === 'is' ? 'is-IS' : 'en-GB', { day: 'numeric', month: 'long' })}`
  })()

  const recipeForm = useRecipeForm({
    onSaved: (id) => {
      const title = recipeForm.title
      const url = recipeForm.url || null
      onRecipeCreated(id, title, url)
      setFormMode('search')
      recipeForm.reset()
    },
  })

  const selectedRecipe = selectedRecipeId
    ? (recipes.find((r) => r.id === selectedRecipeId) ?? null)
    : null

  const filteredRecipes = recipes.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      r.tags.some((tag) => tag.toLowerCase().includes(q))
    )
  })

  return (
    <>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-lg font-display font-semibold">{fullDate}</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5">
        {formMode === 'search' && (
          <div className="space-y-3">
            <label className="text-sm font-medium mb-1.5 block">
              {t('planner.selectRecipe')}
            </label>

            {/* Search input */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('planner.searchRecipes')}
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Selected recipe card */}
            {selectedRecipe ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                {getRecipeImage(selectedRecipe) && (
                  <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-muted">
                    <img
                      src={getRecipeImage(selectedRecipe)!}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedRecipe.title}
                  </p>
                  {selectedRecipe.url && (
                    <p className="text-xs text-muted-foreground truncate">
                      {safeHostname(selectedRecipe.url)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedRecipeId(null)}
                  className="text-xs text-amber-700 hover:text-amber-900 font-medium shrink-0"
                >
                  {t('planner.clearSelection')}
                </button>
              </div>
            ) : meal ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{meal}</p>
                  {recipeUrl && (
                    <p className="text-xs text-muted-foreground truncate">
                      {safeHostname(recipeUrl)}
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {/* Recipe list */}
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              {recipesLoading && recipes.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">{t('common.loading')}</p>
                </div>
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">
                    {recipes.length === 0
                      ? t('planner.noRecipesSaved')
                      : t('planner.noRecipesFound')}
                  </p>
                </div>
              ) : (
                filteredRecipes.map((recipe) => {
                  const imageUrl = getRecipeImage(recipe)
                  const isSelected = recipe.id === selectedRecipeId
                  return (
                    <button
                      key={recipe.id}
                      onClick={() =>
                        setSelectedRecipeId(isSelected ? null : recipe.id)
                      }
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                        isSelected
                          ? 'bg-amber-50 border border-amber-200'
                          : 'hover:bg-accent border border-transparent',
                      )}
                    >
                      {imageUrl && (
                        <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-muted">
                          <img
                            src={imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {recipe.title}
                        </p>
                        {recipe.url && (
                          <p className="text-xs text-muted-foreground truncate">
                            {safeHostname(recipe.url)}
                          </p>
                        )}
                        {recipe.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {recipe.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-[10px]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CheckIcon className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Create new recipe button */}
            <button
              onClick={() => {
                recipeForm.reset()
                setFormMode('create')
              }}
              className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('planner.createNewRecipe')}
              </span>
            </button>
          </div>
        )}

        {formMode === 'create' && (
          <div className="space-y-4">
            <button
              onClick={() => setFormMode('search')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {t('planner.backToSearch')}
            </button>

            {/* URL input */}
            <div className="space-y-2">
              <Label htmlFor="drawer-url">{t('recipes.urlLabel')}</Label>
              <div className="relative">
                <Input
                  id="drawer-url"
                  type="url"
                  value={recipeForm.url}
                  onChange={(e) => recipeForm.handleUrlChange(e.target.value)}
                  placeholder="https://..."
                  className={cn(
                    'pr-10',
                    recipeForm.fetchingMetadata &&
                      'border-amber-400 ring-2 ring-amber-100',
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {recipeForm.fetchingMetadata ? (
                    <div className="relative w-5 h-5">
                      <div className="absolute inset-0 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
                      <SparkleIcon className="absolute inset-0 w-5 h-5 text-amber-500 animate-pulse" />
                    </div>
                  ) : recipeForm.url.startsWith(URL_PREFIX) &&
                    recipeForm.metadata ? (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <LinkIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {recipeForm.fetchingMetadata
                  ? t('recipes.scanning')
                  : recipeForm.url.startsWith(URL_PREFIX)
                    ? t('recipes.pasteHint')
                    : t('recipes.urlHint')}
              </p>
            </div>

            {/* Loading indicator */}
            {(recipeForm.fetchingMetadata || recipeForm.generatingTags) && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
                  <SparkleIcon className="w-4 h-4 text-amber-500 animate-pulse" />
                </div>
                <span className="text-sm text-amber-800">
                  {recipeForm.generatingTags
                    ? t('recipes.generatingTags')
                    : t('recipes.scanning')}
                </span>
              </div>
            )}

            {/* Fetch error */}
            {recipeForm.fetchError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {recipeForm.fetchError}
              </div>
            )}

            {/* Metadata preview */}
            {recipeForm.metadata &&
              (recipeForm.metadata.recipe || recipeForm.metadata.image) && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <RecipePreviewCard
                    metadata={recipeForm.metadata}
                    onClear={() => recipeForm.setMetadata(null)}
                  />
                </div>
              )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="drawer-title">{t('recipes.titleLabel')}</Label>
              <Input
                id="drawer-title"
                value={recipeForm.title}
                onChange={(e) => {
                  recipeForm.setTitle(e.target.value)
                  recipeForm.setTitleDirty(true)
                }}
                onBlur={recipeForm.handleTitleBlur}
                required
                placeholder={t('recipes.titlePlaceholder')}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="drawer-description">
                {t('recipes.descriptionLabel')}
              </Label>
              <textarea
                id="drawer-description"
                value={recipeForm.description}
                onChange={(e) => recipeForm.setDescription(e.target.value)}
                placeholder={t('recipes.descriptionPlaceholder')}
                rows={2}
                className="flex w-full rounded-xl border border-input bg-input/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Tags */}
            <TagSelector
              selectedTags={recipeForm.selectedTags}
              onChange={recipeForm.setSelectedTags}
            />

            {/* Save recipe & assign */}
            <Button
              className="w-full"
              onClick={() => recipeForm.handleSave()}
              disabled={
                recipeForm.saving ||
                recipeForm.fetchingMetadata ||
                recipeForm.generatingTags ||
                !recipeForm.title.trim()
              }
            >
              {recipeForm.saving
                ? t('common.saving')
                : t('planner.saveAndAssign')}
            </Button>
          </div>
        )}

        {/* Notes — always visible */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            {t('planner.notes')}
          </label>
          <textarea
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            rows={2}
            placeholder={t('planner.anyNotes')}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />
        </div>

        {/* Constraints — always visible */}
        {constraints.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('settings.constraints')}
            </label>
            <div className="flex flex-wrap gap-2">
              {constraints.map((c) => {
                const active = editConstraintIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      setEditConstraintIds((prev) =>
                        active
                          ? prev.filter((id) => id !== c.id)
                          : [...prev, c.id],
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium border transition-all"
                    style={
                      active
                        ? {
                            backgroundColor: c.color + '22',
                            color: c.color,
                            borderColor: c.color,
                          }
                        : {}
                    }
                  >
                    {c.emoji && <span>{c.emoji}</span>}
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-border flex gap-2 shrink-0">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button className="flex-1" onClick={onSave} disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </>
  )
}
