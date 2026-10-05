import { useEffect } from 'react'
import type { RefObject } from 'react'
import { audioPlaybackEvent } from '#lib/audio-events'
import type { AudioPlaybackTarget } from '#lib/audio-events'
export function useExclusiveAudio(ref: RefObject<AudioPlaybackTarget | null>) {
  useEffect(() => {
    const listener = (event: Event) => {
      if ((event as CustomEvent<AudioPlaybackTarget>).detail !== ref.current) {
        const target = ref.current
        if (target?.deactivate) target.deactivate()
        else target?.pause()
      }
    }
    window.addEventListener(audioPlaybackEvent, listener)
    return () => window.removeEventListener(audioPlaybackEvent, listener)
  }, [ref])
}
