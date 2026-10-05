export interface AudioRange {
  start: number
  end: number
}

export function sourceTime(
  position: number,
  elapsed: number,
  rate: number,
  bounds: AudioRange,
  loop: AudioRange | null,
) {
  let time = position + Math.max(0, elapsed) * rate
  if (loop && time >= loop.end) {
    time = loop.start + ((time - loop.start) % (loop.end - loop.start))
  }
  return Math.max(bounds.start, Math.min(time, bounds.end))
}

export const maxEncodedBytes = 32 * 1024 * 1024
export const maxDecodedBytes = 128 * 1024 * 1024

export function assertAudioMemory(
  duration: number,
  sampleRate: number,
  channels: number,
) {
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration * sampleRate * channels * 4 > maxDecodedBytes
  ) {
    throw new Error('这段音频过长，已改用原生播放以减少内存占用。')
  }
}
