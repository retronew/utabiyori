import type { LyricLine } from '@applemusic-like-lyrics/core'
import type { TimedLine } from '#music'

interface AmllLyricsOptions {
  duration: number
  showRomaji: boolean
  showTranslation: boolean
}

export function toAmllLyrics(lines: TimedLine[], options: AmllLyricsOptions) {
  const lyricLines: LyricLine[] = []
  const sourceIndexes: number[] = []
  if (!Number.isFinite(options.duration) || options.duration <= 0)
    return { lyricLines, sourceIndexes }
  const ordered = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => Number.isFinite(line.time) && line.time >= 0)
    .sort((a, b) => a.line.time - b.line.time)
  for (const { line, index } of ordered) {
    if (!line.text.trim()) continue
    const next = ordered.find(({ line: row }) => row.time > line.time)?.line
      .time
    const end = Math.min(line.end ?? next ?? options.duration, options.duration)
    const startTime = Math.round(line.time * 1000)
    const endTime = Math.round(end * 1000)
    if (!Number.isFinite(endTime) || endTime <= startTime) continue
    const words = line.words?.map((word) => ({
      word: word.text,
      startTime: Math.round(word.start * 1000),
      endTime: Math.round(word.end * 1000),
    }))
    const validWords =
      words?.length &&
      words.every(
        (word, i) =>
          word.word.length > 0 &&
          Number.isFinite(word.startTime) &&
          Number.isFinite(word.endTime) &&
          word.startTime >= startTime &&
          word.endTime <= endTime &&
          word.endTime > word.startTime &&
          (!i || word.startTime >= words[i - 1].endTime),
      ) &&
      words.map((word) => word.word).join('') === line.text
    lyricLines.push({
      startTime,
      endTime,
      // A single word represents LRC; no syllable timing is invented.
      words: validWords ? words : [{ word: line.text, startTime, endTime }],
      translatedLyric: options.showTranslation ? (line.translation ?? '') : '',
      romanLyric: options.showRomaji ? (line.romaji ?? '') : '',
      isBG: false,
      isDuet: false,
    })
    sourceIndexes.push(index)
  }
  return { lyricLines, sourceIndexes }
}
