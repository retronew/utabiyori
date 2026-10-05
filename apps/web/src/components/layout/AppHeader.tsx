import { lazy, Suspense } from 'react'
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
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4 md:px-7">
      <div>
        <h1 className="text-lg font-bold tracking-tight">
          {tabs.find((item) => item.id === tab)?.label}
        </h1>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {tab === 'music'
            ? '听一句，唱一句，让喜欢成为学习的开始。'
            : tab === 'local'
              ? '你的音频，你的节奏。'
              : '不用先背完五十音，从一句开始。'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Suspense fallback={<span className="size-7" aria-hidden />}>
          <AppearanceSettings />
        </Suspense>
        <span className="flex shrink-0 items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-[11px] text-muted-foreground">
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
