export const MUSIC_QUALITIES = [
  { value: 'standard', label: '标准' },
  { value: 'exhigh', label: '极高' },
  { value: 'lossless', label: '无损' },
  { value: 'hires', label: 'Hi-Res' },
] as const

export type MusicQuality = (typeof MUSIC_QUALITIES)[number]['value']

export function isMusicQuality(value: unknown): value is MusicQuality {
  return MUSIC_QUALITIES.some((quality) => quality.value === value)
}
