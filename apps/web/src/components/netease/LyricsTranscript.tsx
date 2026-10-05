import type { TimedLine } from '#music'
import type { LineRange } from '#lib/music-playback'
import { Button } from '#components/ui/button'
import { formatTime } from '#lib/media'
import { cn } from '#lib/utils'

export interface LyricsTranscriptProps {
  lines: TimedLine[]
  lineIndex: number
  showRomaji: boolean
  showTranslation: boolean
  lineRange: (index: number) => LineRange
  onSeekLine: (index: number) => void
}

export function LyricsTranscript({
  lines,
  lineIndex,
  showRomaji,
  showTranslation,
  lineRange,
  onSeekLine,
}: LyricsTranscriptProps) {
  return (
    <div className="space-y-2">
      {lines.map((line, index) =>
        line.text ? (
          <Button
            key={`${line.time}-${index}`}
            variant="ghost"
            aria-current={index === lineIndex ? 'true' : undefined}
            disabled={!lineRange(index).available}
            onClick={() => onSeekLine(index)}
            className={cn(
              'block h-auto w-full px-3 py-4 text-left whitespace-normal sm:h-auto',
              index === lineIndex && 'bg-primary/10',
            )}
          >
            <time className="mb-2 block text-xs text-muted-foreground tabular-nums">
              {formatTime(line.time)}
              {!lineRange(index).available && ' · 播放范围外'}
            </time>
            <span
              lang="ja"
              className="block text-xl leading-relaxed font-semibold"
            >
              {line.text}
            </span>
            {showRomaji && line.romaji && (
              <span className="mt-2 block text-base leading-relaxed">
                {line.romaji}
              </span>
            )}
            {showTranslation && line.translation && (
              <span className="mt-1 block text-base leading-relaxed text-muted-foreground">
                {line.translation}
              </span>
            )}
          </Button>
        ) : null,
      )}
    </div>
  )
}
