import { useContext } from 'react'
import { PlayerContext } from '#lib/player-context'
import type { PlayerOwner } from '#lib/player-context'

export function usePlayerContext() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('PlayerProvider is required')
  return context
}

export function usePlayerSlot(owner: PlayerOwner) {
  const context = usePlayerContext()
  return {
    active: context.owner === owner,
    activate: () => context.activate(owner),
  }
}
