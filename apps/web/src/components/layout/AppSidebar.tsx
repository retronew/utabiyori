import { Music2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '#components/ui/button'
import { IconSwap } from '#components/ui/IconSwap'
import { navigationItems } from '#lib/navigation'
import type { AppTab } from '#lib/navigation'
import { cn } from '#lib/utils'

interface AppSidebarProps {
  tab: AppTab
  songCount: number
  learned: number
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  onTabChange: (tab: AppTab) => void
}

export function AppSidebar({
  tab,
  songCount,
  learned,
  collapsed,
  onCollapsedChange,
  onTabChange,
}: AppSidebarProps) {
  const tabs = navigationItems(songCount, learned)
  return (
    <aside
      className={cn(
        'flex h-full min-w-0 overflow-clip pb-2 transition-[width] duration-(--fullscreen-duration) ease-(--ease-smooth-out) motion-reduce:transition-none md:w-[188px] md:flex-col md:pr-3 md:pb-0',
        collapsed && 'md:w-16',
      )}
    >
      <a
        href="/"
        aria-label="歌日和首页"
        className={cn(
          'hidden shrink-0 items-center gap-2.5 p-2 transition-[padding,gap] duration-(--fullscreen-duration) ease-(--ease-smooth-out) motion-reduce:transition-none md:flex md:px-3 md:py-5',
          collapsed && 'md:gap-0 md:px-2.5',
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Music2 className="size-5" />
        </span>
        <span
          className={cn(
            'hidden max-w-32 overflow-hidden text-lg font-bold whitespace-nowrap tracking-tight transition-[max-width,opacity] duration-(--duration-fast) ease-(--ease-smooth-out) motion-reduce:transition-none sm:block',
            collapsed && 'md:max-w-0 md:opacity-0',
          )}
        >
          歌日和
          <span className="mt-0.5 block text-xs font-medium tracking-[0.17em] text-muted-foreground">
            UTABIYORI
          </span>
        </span>
      </a>
      <nav
        id="app-navigation"
        aria-label="主导航"
        className="grid min-w-0 flex-1 grid-cols-4 items-center gap-1 md:flex md:flex-none md:flex-col md:items-stretch"
      >
        {tabs.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            static
            onClick={() => {
              onTabChange(item.id)
            }}
            aria-label={item.label}
            title={collapsed ? item.label : undefined}
            aria-current={tab === item.id ? 'page' : undefined}
            className={cn(
              'h-9 min-w-0 justify-center gap-2 rounded-lg px-1 text-xs sm:text-sm md:h-9 md:justify-start md:px-3',
              'transition-[padding,gap,background-color,color] duration-(--duration-fast) ease-(--ease-smooth-out) motion-reduce:transition-none',
              collapsed && 'md:gap-0 md:px-5',
              tab === item.id &&
                'bg-primary/10 text-primary hover:bg-primary/15',
            )}
          >
            <item.icon className="size-4 shrink-0 max-sm:hidden" />
            <span
              className={cn(
                'max-w-32 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-(--duration-fast) ease-(--ease-smooth-out) motion-reduce:transition-none',
                collapsed && 'md:max-w-0 md:opacity-0',
              )}
            >
              {item.label}
            </span>
            {item.count !== undefined && (
              <span
                aria-hidden
                className={cn(
                  'ml-auto hidden max-w-10 overflow-hidden text-xs tabular-nums opacity-70 transition-[max-width,opacity] duration-(--duration-fast) motion-reduce:transition-none md:block',
                  collapsed && 'md:max-w-0 md:opacity-0',
                )}
              >
                {item.count}
              </span>
            )}
          </Button>
        ))}
      </nav>
      <Button
        variant="ghost"
        static
        aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
        title={collapsed ? '展开侧栏' : '收起侧栏'}
        aria-expanded={!collapsed}
        aria-controls="app-navigation"
        onClick={() => onCollapsedChange(!collapsed)}
        className={cn(
          'mt-auto mb-3 hidden h-9 shrink-0 justify-start gap-2 px-3 text-xs text-muted-foreground transition-[padding,gap,background-color,color] duration-(--duration-fast) ease-(--ease-smooth-out) motion-reduce:transition-none md:flex',
          collapsed && 'md:gap-0 md:px-5',
        )}
      >
        <IconSwap
          className="-mx-0.5 size-4"
          active={collapsed}
          initial={<PanelLeftClose className="size-4" />}
          alternate={<PanelLeftOpen className="size-4" />}
        />
        <span
          className={cn(
            'max-w-32 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-(--duration-fast) motion-reduce:transition-none',
            collapsed && 'max-w-0 opacity-0',
          )}
        >
          收起侧栏
        </span>
      </Button>
    </aside>
  )
}
