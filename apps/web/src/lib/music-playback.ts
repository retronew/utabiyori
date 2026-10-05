import type { MusicPlayback, TimedLine } from '#music'

export interface LineRange {
  start: number
  end: number
  available: boolean
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
