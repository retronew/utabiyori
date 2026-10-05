export const formatTime = (value: number) => {
  const seconds = Number.isFinite(value) ? Math.max(0, value) : 0
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`
}
