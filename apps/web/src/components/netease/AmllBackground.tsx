import { BackgroundRender } from '@applemusic-like-lyrics/react'
import { useReducedMotion } from '#hooks/use-reduced-motion'

export function AmllBackground({
  cover,
  playing,
}: {
  cover: string
  playing: boolean
}) {
  const reducedMotion = useReducedMotion()
  return (
    <BackgroundRender
      data-slot="amll-background"
      album={cover}
      playing={playing && !reducedMotion}
      staticMode={reducedMotion}
      fps={30}
      flowSpeed={2}
      renderScale={0.5}
      lowFreqVolume={0}
      hasLyric
    />
  )
}
