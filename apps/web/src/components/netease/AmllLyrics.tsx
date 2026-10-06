import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { LyricPlayer } from '@applemusic-like-lyrics/react'
import type { LyricPlayerRef } from '@applemusic-like-lyrics/react'
import type { OptimizeLyricOptions } from '@applemusic-like-lyrics/core'
import { LayoutReason } from '@applemusic-like-lyrics/core'
import '@applemusic-like-lyrics/core/style.css'

import type { TimedLine } from '#music'
import { toAmllLyrics } from '#lib/amll-lyrics'
import { MediaClockLyricPlayer } from '#lib/amll-player'
import { useReducedMotion } from '#hooks/use-reduced-motion'
import { useDesktopLayout } from '#hooks/use-desktop-layout'
import { Button } from '#components/ui/button'

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
  const [manualScroll, setManualScroll] = useState(false)
  const reducedMotion = useReducedMotion()
  const desktop = useDesktopLayout()
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
    <div
      data-romaji={showRomaji}
      data-translation={showTranslation}
      className="relative h-full min-h-0 [&_[class$=lyricSubLine]]:text-base! [&_[class$=lyricSubLine]]:leading-relaxed! [&_[class$=lyricSubLine]]:opacity-50! [&_[class$=lyricSubLine]]:transition-opacity! [&_[class$=lyricSubLine]]:duration-(--duration-quick)! [&_[class$=lyricSubLine]]:delay-0! md:[&_[class$=lyricSubLine]]:text-xl! [&_[class*=active]>[class$=lyricSubLine]]:opacity-100! data-[translation=false]:[&_[class$=lyricSubLine]:nth-child(2)]:opacity-0! data-[romaji=false]:[&_[class$=lyricSubLine]:nth-child(3)]:opacity-0! motion-reduce:[&_[class$=lyricSubLine]]:transition-none!"
      onWheel={() => setManualScroll(true)}
      onTouchMove={() => setManualScroll(true)}
    >
      <LyricPlayer
        ref={setPlayer}
        lyricPlayer={MediaClockLyricPlayer}
        aria-hidden
        lang="ja"
        data-slot="amll-lyrics"
        className="h-full min-h-0 w-full font-bold [mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%-32px),transparent)] [--amll-lp-font-size:22px] sm:[--amll-lp-font-size:28px] md:[--amll-lp-font-size:32px] xl:[--amll-lp-font-size:36px] [&_.amll-lyric-player]:leading-[1.5]!"
        lyricLines={lyricLines}
        optimizeOptions={optimizeOptions}
        currentTime={Math.round(Math.max(0, current) * 1000)}
        playing={playing && visible && !reducedMotion}
        disabled={!visible}
        enableSpring={!reducedMotion}
        enableBlur={!reducedMotion && desktop}
        enableScale={!reducedMotion}
        alignPosition={desktop ? 0.4 : 0.25}
        onLyricLineClick={(event) => {
          const index = sourceIndexes[event.lineIndex]
          if (index === undefined) return
          player?.lyricPlayer?.resetScroll()
          setManualScroll(false)
          onSeekLine(index)
        }}
      />
      {manualScroll && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute end-3 bottom-3 bg-black/70 text-white hover:bg-black/90 data-pressed:bg-black/90 focus-visible:ring-white focus-visible:ring-offset-transparent"
          onClick={() => {
            const core = player?.lyricPlayer
            if (!core) return
            const seconds = readTime()
            if (Number.isFinite(seconds))
              core.setCurrentTime(Math.round(Math.max(0, seconds) * 1000))
            core.resetScroll()
            // Resetting scroll alone does not recalculate paused or unchanged lines.
            core.calcLayout(LayoutReason.ConfigChange)
            setManualScroll(false)
          }}
        >
          <LocateFixed className="size-4" />
          回到当前句
        </Button>
      )}
    </div>
  )
}
