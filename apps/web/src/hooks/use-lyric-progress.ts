import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { lyricCharacterProgress } from '#lib/lyric-progress'
import type { LyricCharacter } from '#lib/lyric-progress'

interface LyricProgressOptions {
  characters: LyricCharacter[]
  current: number
  playing: boolean
  visible: boolean
  readTime: () => number
}

export function useLyricProgress({
  characters: timings,
  current,
  playing,
  visible,
  readTime,
}: LyricProgressOptions) {
  const root = useRef<HTMLSpanElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    )
    if (root.current) observer.observe(root.current)
    return () => observer.disconnect()
  }, [])
  const readClock = useEffectEvent(readTime)
  useLayoutEffect(() => {
    const characters = root.current?.querySelectorAll<HTMLElement>(
      '[data-lyric-character]',
    )
    if (!characters) return
    let frame = 0
    const paint = () => {
      const time = readClock()
      characters.forEach((character, index) => {
        const { fill, glow } = lyricCharacterProgress(time, timings[index])
        character.style.setProperty(
          '--lyric-mask',
          fill >= 1
            ? 'none'
            : `linear-gradient(to right, #000 ${Math.max(0, fill * 100 - 8)}%, transparent ${fill * 100}%)`,
        )
        character.style.setProperty('--lyric-glow', `${glow * 18}px`)
        character.style.setProperty(
          '--lyric-fill-opacity',
          fill > 0 ? '1' : '0',
        )
      })
      if (playing && visible && inView) frame = requestAnimationFrame(paint)
    }
    paint()
    return () => cancelAnimationFrame(frame)
  }, [timings, current, playing, visible, inView])
  return root
}
