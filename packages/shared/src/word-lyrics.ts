export interface TimedWord {
  text: string
  start: number
  end: number
}

export interface WordLyricLine {
  start: number
  end: number
  words: TimedWord[]
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function milliseconds(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 86400000
  )
}

// The official `suspend` field is an absolute media timestamp, not a line offset.
export function parseWordLyrics(value: unknown): WordLyricLine[] {
  if (!Array.isArray(value) || value.length > 2000) return []
  const lines: WordLyricLine[] = []
  for (const row of value) {
    if (
      !record(row) ||
      !milliseconds(row.start) ||
      !milliseconds(row.duration) ||
      row.duration <= 0 ||
      !Array.isArray(row.words) ||
      !row.words.length ||
      row.words.length > 1000
    )
      continue
    const start = row.start / 1000
    const end = (row.start + row.duration) / 1000
    if (end > 86400) continue
    const words: TimedWord[] = []
    let length = 0
    for (const word of row.words) {
      if (
        !record(word) ||
        !milliseconds(word.suspend) ||
        !milliseconds(word.duration) ||
        word.duration <= 0 ||
        typeof word.words !== 'string' ||
        !word.words ||
        word.words.length > 2000
      )
        break
      const wordStart = word.suspend / 1000
      const wordEnd = (word.suspend + word.duration) / 1000
      length += word.words.length
      if (
        length > 6000 ||
        wordStart < start ||
        wordEnd > end + 0.001 ||
        (words.length && wordStart < words.at(-1)!.start)
      )
        break
      words.push({ text: word.words, start: wordStart, end: wordEnd })
    }
    if (words.length !== row.words.length) continue
    words[0].text = words[0].text.trimStart()
    words.at(-1)!.text = words.at(-1)!.text.trimEnd()
    if (words.some((word) => word.text)) lines.push({ start, end, words })
  }
  return lines.sort((a, b) => a.start - b.start)
}
