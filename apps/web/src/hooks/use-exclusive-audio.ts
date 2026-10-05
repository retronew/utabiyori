import { useEffect, useEffectEvent } from 'react'
import type { RefObject } from 'react'
import { audioPlaybackEvent } from '#lib/audio-events'
import type { AudioPlaybackTarget } from '#lib/audio-events'
export function useExclusiveAudio(
  ref: RefObject<AudioPlaybackTarget | null>,
  onDeactivate?: () => void,
) {
  const deactivate = useEffectEvent(() => onDeactivate?.())
  useEffect(() => {
    const listener = (event: Event) => {
      if ((event as CustomEvent<AudioPlaybackTarget>).detail !== ref.current) {
        deactivate()
        const target = ref.current
        if (target?.deactivate) target.deactivate()
        else target?.pause()
      }
    }
    window.addEventListener(audioPlaybackEvent, listener)
    return () => window.removeEventListener(audioPlaybackEvent, listener)
  }, [ref])
}
