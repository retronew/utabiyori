export const audioPlaybackEvent = 'utabiyori:audio-play'

export interface AudioPlaybackTarget {
  pause(): void
  deactivate?(): void
}

export function announceAudio(audio: AudioPlaybackTarget | null = null) {
  window.dispatchEvent(new CustomEvent(audioPlaybackEvent, { detail: audio }))
  window.speechSynthesis?.cancel()
}
