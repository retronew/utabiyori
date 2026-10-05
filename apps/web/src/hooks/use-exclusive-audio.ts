import { useEffect } from 'react'
import type { RefObject } from 'react'
import { audioPlaybackEvent } from '#lib/audio-events'
export function useExclusiveAudio(ref: RefObject<HTMLAudioElement | null>) {
  useEffect(() => {
    const listener = (event: Event) => {
      if ((event as CustomEvent<HTMLAudioElement>).detail !== ref.current)
        ref.current?.pause()
    }
    window.addEventListener(audioPlaybackEvent, listener)
    return () => window.removeEventListener(audioPlaybackEvent, listener)
  }, [ref])
}
