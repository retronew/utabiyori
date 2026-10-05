export type ThemeMode = 'system' | 'light' | 'dark'
export interface ThemeSettings {
  mode: ThemeMode
  color: string
}
export const themeStorageKey = 'utabiyori:appearance:v1'
export const defaultTheme: ThemeSettings = { mode: 'system', color: '#e74762' }
export const themeColors = [
  { name: '玫瑰', color: '#e74762' },
  { name: '紫罗兰', color: '#8b5cf6' },
  { name: '海蓝', color: '#3b82f6' },
  { name: '森林', color: '#10b981' },
  { name: '琥珀', color: '#f59e0b' },
]
export function normalizeColor(value: string): string | null {
  const input = value.trim()
  if (/^#[a-f\d]{6}$/i.test(input)) return input.toLowerCase()
  if (/^#[a-f\d]{3}$/i.test(input))
    return (
      '#' +
      [...input.slice(1)]
        .map((char) => char + char)
        .join('')
        .toLowerCase()
    )
  return null
}
export function parseTheme(value: unknown): ThemeSettings {
  if (!value || typeof value !== 'object') return { ...defaultTheme }
  const settings = value as Partial<ThemeSettings>
  return {
    mode:
      settings.mode === 'light' || settings.mode === 'dark'
        ? settings.mode
        : 'system',
    color:
      typeof settings.color === 'string'
        ? (normalizeColor(settings.color) ?? defaultTheme.color)
        : defaultTheme.color,
  }
}
const channels = (hex: string) =>
  [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))
function luminance(color: string) {
  const rgb = channels(color).map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722
}
export function contrast(first: string, second: string) {
  const a = luminance(first),
    b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
export function themePalette(color: string, dark: boolean) {
  const background = dark ? '#303035' : '#f0f0f2'
  let primary = normalizeColor(color) ?? defaultTheme.color
  const rgb = channels(primary)
  for (
    let amount = 0.02;
    contrast(primary, background) < 4.5 && amount <= 1;
    amount += 0.02
  ) {
    primary =
      '#' +
      rgb
        .map((channel) =>
          Math.round(channel + ((dark ? 255 : 0) - channel) * amount)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
  }
  const foreground =
    contrast(primary, '#ffffff') >= contrast(primary, '#000000')
      ? '#ffffff'
      : '#000000'
  return { primary, foreground }
}
