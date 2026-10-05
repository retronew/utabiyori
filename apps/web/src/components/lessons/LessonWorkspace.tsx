import type { LessonPracticeState } from '#hooks/use-lesson-practice'
import { ScrollArea } from '#components/ui/scroll-area'
import { LessonLibraryPanel } from '#components/lessons/LessonLibraryPanel'
import { LessonLyrics } from '#components/lessons/LessonLyrics'
import { LessonLinePractice } from '#components/lessons/LessonLinePractice'

export function LessonWorkspace({
  practice,
}: {
  practice: LessonPracticeState
}) {
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
    <div className="grid min-h-0 flex-1 grid-rows-[160px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] lg:grid-rows-1">
      <LessonLibraryPanel
        songs={songs}
        selectedId={song.id}
        progress={progress}
        onSelect={selectSong}
        onImport={importFile}
      />
      <ScrollArea className="min-h-0">
        <section className="mx-auto max-w-4xl p-5 md:p-7">
          <LessonLyrics
            song={song}
            lineIndex={lineIndex}
            progress={progress}
            romaji={romaji}
            translation={translation}
            onSelectLine={selectLine}
            onRomajiChange={setRomaji}
            onTranslationChange={setTranslation}
          />
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
        </section>
      </ScrollArea>
    </div>
  )
}
