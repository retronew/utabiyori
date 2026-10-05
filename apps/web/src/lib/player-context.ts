import { createContext } from 'react'
import type { usePlayerFullscreen } from '#hooks/use-player-fullscreen'

export type PlayerOwner = 'music' | 'local'
export const PlayerContext = createContext<{
  owner: PlayerOwner
  activate: (owner: PlayerOwner) => void
  target: HTMLElement | null
  setTarget: (target: HTMLElement | null) => void
  fullscreen: ReturnType<typeof usePlayerFullscreen>
} | null>(null)
