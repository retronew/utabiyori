import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { AudioRange } from '#lib/audio-clock'
import type {
  AudioHandlers,
  AudioQualityState,
  AudioTransport,
} from '#lib/audio-transport'

interface AudioPlaybackOptions {
  source: string
  bounds?: AudioRange
  loop: AudioRange | null
  rate: number
  volume: number
}

export function useAudioPlayback(
  audio: RefObject<AudioTransport>,
  handlers: AudioHandlers,
  options: AudioPlaybackOptions,
) {
  const transport = audio.current
  const element = useRef<HTMLAudioElement | null>(null)
  const [quality, setQuality] = useState<AudioQualityState>({
    quality: 'dsp',
    activeQuality: 'native',
    qualityNotice: '',
  })
  useLayoutEffect(() => {
    transport.bind(handlers, setQuality)
    transport.configure(options)
  }, [transport, handlers, options])
  useLayoutEffect(() => {
    transport.attach(element.current)
    return () => {
      transport.bind({}, () => {})
      transport.dispose()
    }
  }, [transport])
  const ref = useCallback(
    (media: HTMLAudioElement | null) => {
      element.current = media
      transport.attach(media)
    },
    [transport],
  )
  return {
    mediaProps: {
      ref,
      src: options.source || undefined,
      preload: 'metadata',
      className: 'hidden',
    },
    qualityProps: {
      ...quality,
      onQualityChange: (value: 'dsp' | 'native') => {
        void transport
          .setQuality(value)
          .catch(() => transport.handlers.onError?.())
      },
    },
  }
}
