import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { progressKey } from '@jp-learn/shared'
import type { Song, Progress } from '@jp-learn/shared'
import { Button } from '#components/ui/button'
import { Switch } from '#components/ui/switch'
import { Artwork } from '#components/Artwork'
import { cn } from '#lib/utils'

interface LessonLyricsProps {
  song: Song
  lineIndex: number
  progress: Progress
  romaji: boolean
  translation: boolean
  onSelectLine: (index: number) => void
  onRomajiChange: (show: boolean) => void
  onTranslationChange: (show: boolean) => void
  children: ReactNode
}

export function LessonLyrics({
  song,
  lineIndex,
  progress,
  romaji,
  translation,
  onSelectLine,
  onRomajiChange,
  onTranslationChange,
  children,
}: LessonLyricsProps) {
  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Artwork
          title={song.title}
          theme={song.theme}
          className="size-20 shadow-sm"
        />
        <div className="min-w-0">
          <h2
            lang="ja"
            className="text-2xl leading-relaxed font-bold tracking-tight text-balance"
          >
            {song.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {song.subtitle}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-y py-2">
        <span className="text-xs text-muted-foreground">
          第 {lineIndex + 1} / {song.lines.length} 句
        </span>
        <div className="flex items-center gap-4">
          <label className="flex min-h-8 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Switch
              aria-label="罗马音"
              checked={romaji}
              onCheckedChange={onRomajiChange}
            />
            罗马音
          </label>
          <label className="flex min-h-8 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Switch
              aria-label="中文释义"
              checked={translation}
              onCheckedChange={onTranslationChange}
            />
            释义
          </label>
        </div>
      </div>
      <div className="my-4">{children}</div>
      <h3 className="mt-4 mb-2 text-base font-semibold">逐句阅读</h3>
      <div className="my-2 space-y-1">
        {song.lines.map((l, index) => (
          <Button
            key={l.id}
            variant="ghost"
            static
            aria-pressed={index === lineIndex}
            className={cn(
              'h-auto sm:h-auto whitespace-normal w-full justify-start gap-4 rounded-xl px-3 py-2.5 text-left',
              index === lineIndex && 'bg-primary/7 hover:bg-primary/10',
            )}
            onClick={() => onSelectLine(index)}
          >
            <span className="self-start pt-2 text-[10px] tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-xl leading-9 font-semibold',
                  index === lineIndex && 'text-primary',
                )}
                lang="ja"
              >
                {l.tokens.map((token, i) =>
                  token.reading ? (
                    <ruby key={i}>
                      {token.text}
                      <rt>{token.reading}</rt>
                    </ruby>
                  ) : (
                    <span key={i}>{token.text}</span>
                  ),
                )}
              </span>
              {romaji && (
                <span className="block text-base leading-relaxed font-normal text-muted-foreground">
                  {l.romaji}
                </span>
              )}
              {translation && (
                <span className="mt-1 block text-base leading-relaxed font-normal text-muted-foreground">
                  {l.translation}
                </span>
              )}
            </span>
            {progress[progressKey(song.id, l.id)] && (
              <Check className="size-4 text-primary" />
            )}
          </Button>
        ))}
      </div>
    </>
  )
}
