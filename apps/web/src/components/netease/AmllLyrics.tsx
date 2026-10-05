import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { LyricPlayer } from '@applemusic-like-lyrics/react'
import type { LyricPlayerRef } from '@applemusic-like-lyrics/react'
import type { OptimizeLyricOptions } from '@applemusic-like-lyrics/core'
import '@applemusic-like-lyrics/core/style.css'

import type { TimedLine } from '#music'
import { toAmllLyrics } from '#lib/amll-lyrics'
import { useReducedMotion } from '#hooks/use-reduced-motion'
import { cn } from '#lib/utils'

const optimizeOptions = {
  tryAdvanceStartTime: false,
  resetLineTimestamps: false,
  cleanUnintentionalOverlaps: false,
  normalizeSpaces: false,
} satisfies OptimizeLyricOptions

interface AmllLyricsProps {
  lines: TimedLine[]
  duration: number
  current: number
  readTime: () => number
  visible: boolean
  playing: boolean
  showRomaji: boolean
  showTranslation: boolean
  onSeekLine: (index: number) => void
}

export function AmllLyrics({
  lines,
  duration,
  current,
  readTime,
  visible,
  playing,
  showRomaji,
  showTranslation,
  onSeekLine,
}: AmllLyricsProps) {
  // Sync when AMLL creates its core, including a paused first paint.
  const [player, setPlayer] = useState<LyricPlayerRef | null>(null)
  const reducedMotion = useReducedMotion()
  // AMLL rebuilds and freezes lyrics when the array identity changes.
  const { lyricLines, sourceIndexes } = useMemo(
    () => toAmllLyrics(lines, { duration }),
    [lines, duration],
  )
  const readClock = useEffectEvent(readTime)
  const pausedTime = playing ? 0 : current
  useEffect(() => {
    if (!visible || !player?.lyricPlayer) return
    let frame = 0
    const paint = () => {
      const seconds = readClock()
      if (Number.isFinite(seconds))
        player.lyricPlayer?.setCurrentTime(
          Math.round(Math.max(0, seconds) * 1000),
        )
      if (playing) frame = requestAnimationFrame(paint)
    }
    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [player, visible, playing, pausedTime])

  return (
    <LyricPlayer
      ref={setPlayer}
      aria-hidden
      lang="ja"
      data-slot="amll-lyrics"
      className={cn(
        'h-full min-h-0 w-full font-bold [--amll-lp-font-size:28px] md:[--amll-lp-font-size:32px] xl:[--amll-lp-font-size:36px] [&_[class$=_lyricSubLine]]:text-[18px]! [&_[class$=_lyricSubLine]]:leading-relaxed! [&_[class$=_lyricSubLine]]:opacity-70! md:[&_[class$=_lyricSubLine]]:text-xl! [&_.amll-lyric-player]:leading-[1.5]!',
        // AMLL 0.6 renders translation and romanization as children 2 and 3.
        // Retain their space so visibility toggles do not rebuild or reflow lyrics.
        !showTranslation && '[&_[class$=_lyricSubLine]:nth-child(2)]:invisible',
        !showRomaji && '[&_[class$=_lyricSubLine]:nth-child(3)]:invisible',
      )}
      lyricLines={lyricLines}
      optimizeOptions={optimizeOptions}
      currentTime={Math.round(Math.max(0, current) * 1000)}
      playing={playing && visible && !reducedMotion}
      disabled={!visible}
      enableSpring={!reducedMotion}
      enableBlur={!reducedMotion}
      enableScale={!reducedMotion}
      alignPosition={0.4}
      onLyricLineClick={(event) => {
        const index = sourceIndexes[event.lineIndex]
        if (index === undefined) return
        player?.lyricPlayer?.resetScroll()
        onSeekLine(index)
      }}
    />
  )
}
