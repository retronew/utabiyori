import { useContext, useState } from 'react'
import type { ReactNode, ComponentProps } from 'react'
import { createPortal } from 'react-dom'
import { PlayerContext } from '#lib/player-context'
import type { PlayerOwner } from '#lib/player-context'
import { usePlayerFullscreen } from '#hooks/use-player-fullscreen'

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [owner, activate] = useState<PlayerOwner>('music')
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const fullscreen = usePlayerFullscreen()
  return (
    <PlayerContext.Provider
      value={{ owner, activate, target, setTarget, fullscreen }}
    >
      {children}
    </PlayerContext.Provider>
  )
}
export function PlayerDock(props: ComponentProps<'footer'>) {
  const context = useContext(PlayerContext)
  return <footer {...props} ref={context?.setTarget} />
}
export function PlayerPortal({
  active,
  children,
}: {
  active: boolean
  children: ReactNode
}) {
  const context = useContext(PlayerContext)
  return active && context?.target
    ? createPortal(children, context.target)
    : null
}
