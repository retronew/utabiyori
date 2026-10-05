import { lazy, Suspense, useState } from 'react'
import { X } from 'lucide-react'
import type { AppTab } from '#lib/navigation'
import { useLessonPractice } from '#hooks/use-lesson-practice'
import { AppSidebar } from '#components/layout/AppSidebar'
import { AppHeader } from '#components/layout/AppHeader'
import { PlayerDock } from '#components/PlayerSlot'
import { usePlayerContext } from '#hooks/use-player-slot'
import { cn } from '#lib/utils'
import { PracticeSkeleton } from '#components/lessons/PracticeSkeleton'
import { Button } from '#components/ui/button'
import AudioPractice from '#components/AudioPractice'
import NeteasePractice from '#components/NeteasePractice'

const LessonWorkspace = lazy(() =>
  import('#components/lessons/LessonWorkspace').then((module) => ({
    default: module.LessonWorkspace,
  })),
)
const ReviewPanel = lazy(() =>
  import('#components/lessons/ReviewPanel').then((module) => ({
    default: module.ReviewPanel,
  })),
)

export default function App() {
  const [tab, setTab] = useState<AppTab>('music')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const practice = useLessonPractice(() => setTab('songs'))
  const { owner, fullscreen } = usePlayerContext()
  const visibleTab = fullscreen.active ? owner : tab
  function navigate(next: AppTab) {
    practice.stopSpeech()
    practice.setMessage('')
    setTab(next)
  }
  return (
    <div
      data-slot="app-workspace"
      data-fullscreen={fullscreen.active || undefined}
      className={cn(
        'grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[44px_minmax(0,1fr)] overflow-clip bg-sidebar p-2 [--fullscreen-duration:var(--duration-medium)] data-fullscreen:[--fullscreen-duration:var(--duration-slow)] transition-[grid-template-columns,grid-template-rows,padding] duration-(--fullscreen-duration) ease-(--ease-smooth-out) motion-reduce:transition-none md:grid-cols-[188px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:p-3',
        sidebarCollapsed && 'md:grid-cols-[64px_minmax(0,1fr)]',
        fullscreen.active &&
          'grid-rows-[0px_minmax(0,1fr)]! p-0! md:grid-cols-[0px_minmax(0,1fr)]! md:grid-rows-[minmax(0,1fr)]!',
      )}
    >
      <a
        href="#practice-workspace"
        className="fixed top-3 left-3 z-50 -translate-y-24 rounded-lg bg-card px-4 py-3 text-sm font-medium shadow-lg focus:translate-y-0"
      >
        跳到练习内容
      </a>
      <div
        inert={fullscreen.active}
        aria-hidden={fullscreen.active || undefined}
        className={cn(
          'min-h-0 min-w-0 overflow-clip transition-opacity duration-(--duration-fast) motion-reduce:transition-none',
          fullscreen.active && 'pointer-events-none opacity-0',
        )}
      >
        <AppSidebar
          tab={tab}
          songCount={practice.songs.length}
          learned={practice.learned}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          onTabChange={navigate}
        />
      </div>
      <main
        id="practice-workspace"
        tabIndex={-1}
        className={cn(
          'relative isolate flex min-h-0 min-w-0 flex-col overflow-clip rounded-[18px] bg-card shadow-[var(--shadow-workspace)] transition-[border-radius,box-shadow] duration-(--fullscreen-duration) ease-(--ease-smooth-out) motion-reduce:transition-none',
          fullscreen.active && 'rounded-none shadow-none',
        )}
      >
        <div
          inert={fullscreen.active}
          aria-hidden={fullscreen.active || undefined}
          className={cn(
            'grid shrink-0 grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-(--fullscreen-duration) ease-(--ease-smooth-out) motion-reduce:transition-none',
            fullscreen.active &&
              'pointer-events-none grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 overflow-clip">
            <AppHeader
              tab={tab}
              learned={practice.learned}
              total={practice.total}
            />
          </div>
        </div>
        {fullscreen.active && <h1 className="sr-only">全屏播放</h1>}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-clip">
          <NeteasePractice visible={visibleTab === 'music'} />
          <div
            hidden={visibleTab !== 'local'}
            className="min-h-0 flex-1 overflow-auto transition-opacity duration-(--duration-fast) starting:opacity-0"
          >
            <AudioPractice />
          </div>
          <Suspense
            fallback={
              <PracticeSkeleton
                review={visibleTab === 'review'}
                song={practice.song}
                songCount={practice.songs.length}
                learned={practice.learned}
                lineIndex={practice.lineIndex}
                romaji={practice.romaji}
                translation={practice.translation}
              />
            }
          >
            {visibleTab === 'review' && (
              <ReviewPanel
                songs={practice.songs}
                progress={practice.progress}
                learned={practice.learned}
                onSelect={practice.selectSong}
                onStart={() => navigate('songs')}
              />
            )}
            {visibleTab === 'songs' && <LessonWorkspace practice={practice} />}
          </Suspense>
          {practice.message && (
            <div className="absolute inset-x-4 bottom-4 z-20 mx-auto flex max-w-lg items-start gap-2 rounded-xl border bg-card px-4 py-3 text-sm shadow-lg transition-opacity duration-(--duration-fast) starting:opacity-0">
              <p role="status" className="min-w-0 flex-1 leading-relaxed">
                {practice.message}
              </p>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="关闭提示"
                onClick={() => practice.setMessage('')}
              >
                <X />
              </Button>
            </div>
          )}
        </div>
        <PlayerDock
          id="player-dock"
          aria-label="播放器"
          className={cn(
            'z-30 mx-3 mt-2 mb-2 shrink-0 pb-[env(safe-area-inset-bottom)] transition-[margin] duration-(--fullscreen-duration) ease-(--ease-smooth-out) motion-reduce:transition-none lg:mr-4 lg:ml-0',
            fullscreen.active && 'mx-3! lg:mx-5!',
          )}
        />
        <p
          role="status"
          className={
            fullscreen.message
              ? 'shrink-0 px-5 pb-2 text-center text-xs text-muted-foreground'
              : 'sr-only'
          }
        >
          {fullscreen.message}
        </p>
      </main>
    </div>
  )
}
