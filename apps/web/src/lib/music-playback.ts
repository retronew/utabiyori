import type { MusicPlayback, TimedLine } from '#music'

export interface LineRange {
  start: number
  end: number
  available: boolean
}

export function getPlaybackStep(
  current: number,
  range: LineRange,
  loop: boolean,
  trial?: MusicPlayback['trial'],
) {
  if (
    loop &&
    range.available &&
    (current < range.start || current >= range.end)
  )
    return { position: range.start, ended: false }
  const lower = trial?.start ?? 0
  if (current >= (trial?.end ?? Infinity))
    return { position: lower, ended: true }
  return { position: Math.max(current, lower), ended: false }
}

export function getLineRange(
  lines: TimedLine[],
  index: number,
  duration: number,
  trial?: MusicPlayback['trial'],
): LineRange {
  const start = lines[index]?.time ?? 0
  const next =
    lines.find((line, i) => i > index && line.time > start)?.time ?? duration
  const lower = trial?.start ?? 0
  const upper = trial?.end ?? duration
  return {
    start: Math.max(start, lower),
    end: Math.min(next, upper),
    available: start >= lower && start < upper && next > start,
  }
}
