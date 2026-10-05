import type { TimedWord } from '@jp-learn/shared'

export type LyricCharacter = TimedWord

export function lyricProgress(current: number, start: number, end: number) {
  if (![current, start, end].every(Number.isFinite) || end <= start) return 0
  return Math.min(1, Math.max(0, (current - start) / (end - start)))
}

export function lyricCharacters(text: string): string[] {
  return Array.from(
    new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(text),
    (part) => part.segment,
  )
}

export function lyricCharacterTimings(
  text: string,
  start: number,
  end: number,
  words?: TimedWord[],
): LyricCharacter[] {
  const segments = words?.length ? words : [{ text, start, end }]
  return segments.flatMap((word) => {
    const characters = lyricCharacters(word.text)
    return characters.map((text, index) => ({
      text,
      start: word.start + ((word.end - word.start) * index) / characters.length,
      end:
        word.start +
        ((word.end - word.start) * (index + 1)) / characters.length,
    }))
  })
}

export function lyricCharacterProgress(
  current: number,
  character: LyricCharacter,
) {
  if (!Number.isFinite(current)) return { fill: 0, glow: 0 }
  const fill = lyricProgress(current, character.start, character.end)
  const glow =
    fill * Math.max(0, 1 - Math.max(0, current - character.end) / 0.7)
  return { fill, glow }
}
