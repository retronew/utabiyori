import type { Progress } from '@jp-learn/shared'

export const progressStorageKey = 'jp-learn:progress:v1'

export function parseProgress(value: unknown): Progress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, mastered]) => typeof mastered === 'boolean',
    ),
  )
}

export function readProgress(): Progress {
  try {
    return parseProgress(
      JSON.parse(localStorage.getItem(progressStorageKey) || '{}'),
    )
  } catch {
    return {}
  }
}
