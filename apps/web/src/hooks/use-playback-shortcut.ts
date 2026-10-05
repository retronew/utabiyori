import { useEffect, useEffectEvent } from 'react'
import { canTogglePlayback, shortcutExcluded } from '#lib/playback-shortcut'

export function usePlaybackShortcut(onToggle: () => void, disabled: boolean) {
  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    const blocked =
      disabled ||
      event
        .composedPath()
        .some(
          (node) =>
            node instanceof Element && Boolean(node.closest(shortcutExcluded)),
        ) ||
      Array.from(
        document.querySelectorAll(
          '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
        ),
      ).some((node) => node.getClientRects().length > 0)
    if (!canTogglePlayback(event, blocked)) return
    event.preventDefault()
    onToggle()
  })
  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])
}
