import type { TimedWord } from '@jp-learn/shared'

import { useLyricProgress } from '#hooks/use-lyric-progress'
import { lyricCharacterTimings } from '#lib/lyric-progress'

interface LyricProgressTextProps {
  text: string
  start: number
  end: number
  current: number
  playing: boolean
  visible: boolean
  readTime: () => number
  words?: TimedWord[]
}

export function LyricProgressText(props: LyricProgressTextProps) {
  const characters = lyricCharacterTimings(
    props.text,
    props.start,
    props.end,
    props.words,
  )
  const root = useLyricProgress({ ...props, characters })
  return (
    <span
      ref={root}
      data-slot="lyric-progress"
      data-timing={props.words?.length ? 'word' : 'line'}
      title={
        props.words?.length
          ? '根据网易云官方逐字时间轴显示进度。'
          : '根据句级时间轴近似显示进度，并非精确逐字对齐。'
      }
    >
      <span className="sr-only select-none">{props.text}</span>
      <span aria-hidden>
        {characters.map(({ text: character }, index) => (
          <span
            key={index}
            data-lyric-character
            className="relative inline-block whitespace-pre text-white/50 [--lyric-fill-opacity:0] [--lyric-glow:0px]"
          >
            {character}
            <span className="pointer-events-none absolute inset-0 text-white opacity-(--lyric-fill-opacity) select-none [mask-image:var(--lyric-mask)] motion-safe:[text-shadow:0_0_var(--lyric-glow)_#ffffffa0]">
              {character}
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}
