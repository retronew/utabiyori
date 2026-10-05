import { Music2, Sparkles } from 'lucide-react'
import { Button } from '#components/ui/button'
import { navigationItems } from '#lib/navigation'
import type { AppTab } from '#lib/navigation'
import { cn } from '#lib/utils'

interface AppSidebarProps {
  tab: AppTab
  songCount: number
  learned: number
  onTabChange: (tab: AppTab) => void
}

export function AppSidebar({
  tab,
  songCount,
  learned,
  onTabChange,
}: AppSidebarProps) {
  const tabs = navigationItems(songCount, learned)
  return (
    <aside className="flex min-w-0 overflow-clip pb-2 md:flex-col md:pr-3 md:pb-0">
      <a
        href="/"
        aria-label="歌日和首页"
        className="flex shrink-0 items-center gap-2.5 p-2 md:px-3 md:py-5"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Music2 className="size-5" />
        </span>
        <span className="hidden text-lg font-bold tracking-tight sm:block">
          歌日和
          <span className="mt-0.5 block text-[9px] font-medium tracking-[0.17em] text-muted-foreground">
            UTABIYORI
          </span>
        </span>
      </a>
      <div className="hidden px-3 pt-4 pb-2 text-[10px] font-semibold tracking-widest text-muted-foreground md:block">
        我的学习空间
      </div>
      <nav
        aria-label="主导航"
        className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1 md:flex-none md:flex-col md:items-stretch md:px-0"
      >
        {tabs.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => {
              onTabChange(item.id)
            }}
            aria-label={item.label}
            aria-current={tab === item.id ? 'page' : undefined}
            className={cn(
              'h-10 justify-start gap-2 rounded-lg px-2 text-xs sm:text-sm md:px-3',
              tab === item.id &&
                'bg-primary/10 text-primary hover:bg-primary/15',
            )}
          >
            <item.icon className="size-4 shrink-0 max-sm:hidden" />
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="ml-auto hidden text-[10px] tabular-nums opacity-70 md:block">
                {item.count}
              </span>
            )}
          </Button>
        ))}
      </nav>
      <div className="mt-auto hidden px-3 py-4 md:block">
        <div className="mb-6 pt-5">
          <Sparkles className="mb-2 size-4 text-primary" />
          <p className="text-xs font-medium">今天，先唱好一句。</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            从喜欢的声音开始，
            <br />
            慢慢认识眼前的假名。
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-card text-xs font-semibold">
            初
          </span>
          <span className="text-xs font-medium">
            日语学习者
            <small className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
              学习进度保存在本机
            </small>
          </span>
        </div>
      </div>
    </aside>
  )
}
