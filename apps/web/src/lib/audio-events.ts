export const audioPlaybackEvent = 'utabiyori:audio-play'

export function announceAudio(audio: HTMLAudioElement | null = null) {
  window.dispatchEvent(new CustomEvent(audioPlaybackEvent, { detail: audio }))
  window.speechSynthesis?.cancel()
}
