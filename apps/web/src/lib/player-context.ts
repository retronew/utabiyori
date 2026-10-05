import { createContext } from 'react'

export type PlayerOwner = 'music' | 'local'
export const PlayerContext = createContext<{
  owner: PlayerOwner
  activate: (owner: PlayerOwner) => void
  target: HTMLElement | null
  setTarget: (target: HTMLElement | null) => void
} | null>(null)
