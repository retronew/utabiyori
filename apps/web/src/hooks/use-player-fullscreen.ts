import { useEffect, useEffectEvent, useRef, useState } from 'react'

function overlayVisible() {
  return Array.from(
    document.querySelectorAll(
      '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
    ),
  ).some((node) => node.getClientRects().length > 0)
}

export function usePlayerFullscreen() {
  const [mode, setMode] = useState<'windowed' | 'native' | 'page'>('windowed')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const trigger = useRef<HTMLButtonElement | null>(null)
  const busy = useRef(false)
  const mounted = useRef(false)

  function restoreFocus() {
    if (!overlayVisible()) trigger.current?.focus({ preventScroll: true })
  }

  const syncFullscreen = useEffectEvent(() => {
    if (document.fullscreenElement === document.documentElement) {
      setMode('native')
    } else if (mode === 'native') {
      setMode('windowed')
      setMessage('')
      restoreFocus()
    }
  })
  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    // Browsers may consume native Escape; delivered events defer to overlays.
    if (
      mode === 'windowed' ||
      event.key !== 'Escape' ||
      event.defaultPrevented ||
      event.isComposing ||
      event.repeat ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.shiftKey ||
      overlayVisible()
    )
      return
    event.preventDefault()
    if (mode === 'native') {
      if (trigger.current) void toggle(trigger.current)
      return
    }
    setMode('windowed')
    setMessage('')
    restoreFocus()
  })
  useEffect(() => {
    mounted.current = true
    document.addEventListener('fullscreenchange', syncFullscreen)
    window.addEventListener('keydown', handleEscape)
    return () => {
      mounted.current = false
      document.removeEventListener('fullscreenchange', syncFullscreen)
      window.removeEventListener('keydown', handleEscape)
      if (document.fullscreenElement === document.documentElement)
        void document.exitFullscreen().catch(() => {})
    }
  }, [])

  async function toggle(button: HTMLButtonElement) {
    if (busy.current) return
    setMessage('')
    if (mode === 'page') {
      setMode('windowed')
      restoreFocus()
      return
    }
    trigger.current = button
    if (mode === 'windowed' && !document.fullscreenEnabled) {
      setMode('page')
      setMessage('当前浏览器使用窗口内全屏，可通过退出按钮返回。')
      return
    }
    busy.current = true
    setPending(true)
    try {
      // Fullscreen the root so body portals (Select / Dialog) stay visible.
      if (mode === 'native') await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      if (!mounted.current) return
      if (mode === 'native') {
        setMessage('暂时无法退出全屏，请按 Esc 或使用浏览器的退出操作。')
      } else {
        setMode('page')
        setMessage('浏览器未允许系统全屏，已切换为窗口内全屏。')
      }
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
      else if (document.fullscreenElement === document.documentElement)
        void document.exitFullscreen().catch(() => {})
    }
  }

  return { active: mode !== 'windowed', pending, message, toggle }
}
