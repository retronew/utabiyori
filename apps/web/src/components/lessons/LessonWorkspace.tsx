import { useRef, useState } from 'react'
import type { LessonPracticeState } from '#hooks/use-lesson-practice'
import { useDesktopLayout } from '#hooks/use-desktop-layout'
import { Tabs, TabsList, TabsTab, TabsPanel } from '#components/ui/tabs'
import { ScrollArea } from '#components/ui/scroll-area'
import { LessonLibraryPanel } from '#components/lessons/LessonLibraryPanel'
import { LessonLyrics } from '#components/lessons/LessonLyrics'
import { LessonLinePractice } from '#components/lessons/LessonLinePractice'

export function LessonWorkspace({
  practice,
}: {
  practice: LessonPracticeState
}) {
  const desktop = useDesktopLayout()
  const [view, setView] = useState<'library' | 'practice'>('practice')
  const practiceTab = useRef<HTMLButtonElement>(null)
  const {
    songs,
    song,
    line,
    lineIndex,
    progress,
    romaji,
    translation,
    mastered,
    speaking,
    selectSong,
    selectLine,
    importFile,
    setRomaji,
    setTranslation,
    speak,
    stopSpeech,
    toggleMastered,
  } = practice
  return (
    <Tabs
      value={view}
      onValueChange={(value) => {
        if (value === 'library' || value === 'practice') setView(value)
      }}
      className="min-h-0 flex-1 gap-0"
    >
      <TabsList
        aria-label="课程工作区"
        className="mx-4 mb-3 w-auto shrink-0 lg:hidden"
      >
        <TabsTab value="library">选择课程</TabsTab>
        <TabsTab value="practice" ref={practiceTab}>
          逐句练习
        </TabsTab>
      </TabsList>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <TabsPanel
          value="library"
          keepMounted
          hidden={!desktop && view !== 'library'}
          inert={!desktop && view !== 'library'}
          className="flex min-h-0 flex-col"
        >
          <LessonLibraryPanel
            songs={songs}
            selectedId={song.id}
            progress={progress}
            onSelect={(id) => {
              selectSong(id)
              setView('practice')
              if (!desktop) practiceTab.current?.focus()
            }}
            onImport={importFile}
          />
        </TabsPanel>
        <TabsPanel
          value="practice"
          keepMounted
          hidden={!desktop && view !== 'practice'}
          inert={!desktop && view !== 'practice'}
          className="flex min-h-0 flex-col"
        >
          <ScrollArea className="min-h-0 flex-1">
            <section className="mx-auto max-w-4xl p-4 md:p-5">
              <LessonLyrics
                song={song}
                lineIndex={lineIndex}
                progress={progress}
                romaji={romaji}
                translation={translation}
                onSelectLine={selectLine}
                onRomajiChange={setRomaji}
                onTranslationChange={setTranslation}
              >
                <LessonLinePractice
                  line={line}
                  lineIndex={lineIndex}
                  lineCount={song.lines.length}
                  mastered={mastered}
                  speaking={speaking}
                  onSpeak={speak}
                  onStopSpeech={stopSpeech}
                  onToggleMastered={toggleMastered}
                  onSelectLine={selectLine}
                />
              </LessonLyrics>
            </section>
          </ScrollArea>
        </TabsPanel>
      </div>
    </Tabs>
  )
}
