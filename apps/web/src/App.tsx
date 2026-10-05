import { lazy, Suspense, useState } from 'react'
import type { AppTab } from '#lib/navigation'
import { useLessonPractice } from '#hooks/use-lesson-practice'
import { AppSidebar } from '#components/layout/AppSidebar'
import { AppHeader } from '#components/layout/AppHeader'
import { PlayerDock } from '#components/PlayerSlot'
import { usePlayerContext } from '#hooks/use-player-slot'
import { cn } from '#lib/utils'
import { Spinner } from '#components/ui/spinner'
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
        'grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] overflow-clip bg-sidebar p-2 md:grid-cols-[188px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:p-3',
        fullscreen.active &&
          'grid-cols-[minmax(0,1fr)]! grid-rows-[minmax(0,1fr)]! p-0!',
      )}
    >
      <div className={fullscreen.active ? 'hidden' : 'contents'}>
        <AppSidebar
          tab={tab}
          songCount={practice.songs.length}
          learned={practice.learned}
          onTabChange={navigate}
        />
      </div>
      <main
        className={cn(
          'relative isolate flex min-h-0 min-w-0 flex-col overflow-clip rounded-[18px] bg-card shadow-[var(--shadow-workspace)]',
          fullscreen.active && 'rounded-none shadow-none',
        )}
      >
        <div hidden={fullscreen.active}>
          <AppHeader
            tab={tab}
            learned={practice.learned}
            total={practice.total}
          />
        </div>
        {fullscreen.active && <h1 className="sr-only">全屏播放</h1>}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-clip">
          <NeteasePractice visible={visibleTab === 'music'} />
          <div
            hidden={visibleTab !== 'local'}
            className="min-h-0 flex-1 overflow-auto"
          >
            <AudioPractice />
          </div>
          <Suspense
            fallback={
              <div
                role="status"
                className="flex flex-1 items-center justify-center gap-2 text-xs text-muted-foreground"
              >
                <Spinner />
                正在加载练习…
              </div>
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
            <p
              role="status"
              className="absolute inset-x-4 bottom-4 z-20 mx-auto max-w-lg rounded-xl border bg-card/95 px-4 py-3 text-xs shadow-lg backdrop-blur"
            >
              {practice.message}
            </p>
          )}
        </div>
        <PlayerDock
          id="player-dock"
          aria-label="播放器"
          className={cn(
            'z-30 mx-3 mt-2 mb-2 shrink-0 pb-[env(safe-area-inset-bottom)] lg:mr-4 lg:ml-0',
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
