import { lazy, Suspense } from 'react'
import { Skeleton } from '#components/ui/Skeleton'
import type { AppTab } from '#lib/navigation'
import { navigationItems } from '#lib/navigation'

const AppearanceSettings = lazy(() =>
  import('#components/AppearanceSettings').then((module) => ({
    default: module.AppearanceSettings,
  })),
)

interface AppHeaderProps {
  tab: AppTab
  learned: number
  total: number
}

export function AppHeader({ tab, learned, total }: AppHeaderProps) {
  const tabs = navigationItems()
  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 md:min-h-16 md:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold tracking-tight">
          {tabs.find((item) => item.id === tab)?.label}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Suspense fallback={<Skeleton className="size-8 sm:size-7" />}>
          <AppearanceSettings />
        </Suspense>
        <span
          aria-label={`已掌握 ${learned} / ${total} 句`}
          className="flex shrink-0 items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="max-sm:hidden">已掌握</span>
          <span className="font-semibold tabular-nums text-foreground">
            {learned} / {total}
          </span>
          <span className="max-sm:hidden">句</span>
        </span>
      </div>
    </header>
  )
}
