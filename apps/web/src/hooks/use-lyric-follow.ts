import { useEffect, useRef } from 'react'
import type { TimedLine } from '#music'

interface LyricFollowOptions {
  lineIndex: number
  visible: boolean
  lines: TimedLine[]
  layoutKey?: string
  showRomaji: boolean
  showTranslation: boolean
}

export function useLyricFollow({
  lineIndex,
  visible,
  lines,
  layoutKey,
  showRomaji,
  showTranslation,
}: LyricFollowOptions) {
  const lyricButtons = useRef(new Map<number, HTMLButtonElement>())
  const manualScroll = useRef(0)
  useEffect(() => {
    const button = lyricButtons.current.get(lineIndex)
    const viewport = button?.closest<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )
    if (!visible || !button || !viewport) return
    const alignLine = () => {
      if (Date.now() - manualScroll.current <= 6000) return
      viewport.scrollTo({
        top:
          viewport.scrollTop +
          button.getBoundingClientRect().top -
          viewport.getBoundingClientRect().top -
          (viewport.clientHeight - button.offsetHeight) / 2,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      })
    }
    alignLine()
    const observer = new ResizeObserver(alignLine)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [lineIndex, visible, lines, layoutKey, showRomaji, showTranslation])

  return {
    lyricButtons,
    onManualScroll: () => {
      manualScroll.current = Date.now()
    },
    resetManualScroll: () => {
      manualScroll.current = 0
    },
  }
}
