import { lazy, Suspense, useState } from 'react'
import type { AppTab } from '#lib/navigation'
import { useLessonPractice } from '#hooks/use-lesson-practice'
import { AppSidebar } from '#components/layout/AppSidebar'
import { AppHeader } from '#components/layout/AppHeader'
import { PlayerProvider, PlayerDock } from '#components/PlayerSlot'
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
  function navigate(next: AppTab) {
    practice.stopSpeech()
    practice.setMessage('')
    setTab(next)
  }
  return (
    <PlayerProvider>
      <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)_auto] overflow-clip bg-background md:grid-cols-[188px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)_auto]">
        <AppSidebar
          tab={tab}
          songCount={practice.songs.length}
          learned={practice.learned}
          onTabChange={navigate}
        />
        <main className="flex min-h-0 min-w-0 flex-col overflow-clip">
          <AppHeader
            tab={tab}
            learned={practice.learned}
            total={practice.total}
          />
          <div className="relative flex min-h-0 flex-1 flex-col">
            <NeteasePractice visible={tab === 'music'} />
            <div
              hidden={tab !== 'local'}
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
              {tab === 'review' && (
                <ReviewPanel
                  songs={practice.songs}
                  progress={practice.progress}
                  learned={practice.learned}
                  onSelect={practice.selectSong}
                  onStart={() => navigate('songs')}
                />
              )}
              {tab === 'songs' && <LessonWorkspace practice={practice} />}
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
        </main>
        <PlayerDock
          id="player-dock"
          aria-label="播放器"
          className="z-30 min-h-[92px] border-t bg-player/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:col-span-2"
        />
      </div>
    </PlayerProvider>
  )
}
