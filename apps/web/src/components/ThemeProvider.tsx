import { useLayoutEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from '#lib/theme-context'
import { parseTheme, themePalette } from '#lib/theme'
import { useAccount } from '#hooks/use-account'

const systemDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches
function subscribeSystem(listener: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const account = useAccount()
  const settings = parseTheme(account.data.theme)
  const [persistenceError, setPersistenceError] = useState(false)
  const prefersDark = useSyncExternalStore(subscribeSystem, systemDark)
  const dark =
    settings.mode === 'dark' || (settings.mode === 'system' && prefersDark)
  useLayoutEffect(() => {
    const root = document.documentElement
    const palette = themePalette(settings.color, dark)
    root.setAttribute('data-theme-changing', '')
    root.classList.toggle('dark', dark)
    root.style.setProperty('--primary', palette.primary)
    root.style.setProperty('--primary-foreground', palette.foreground)
    root.style.setProperty('--ring', palette.primary)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#18181c' : '#ffffff')
    // Flush the new palette before restoring interactive transitions.
    void root.offsetHeight
    const frame = requestAnimationFrame(() =>
      root.removeAttribute('data-theme-changing'),
    )
    return () => {
      cancelAnimationFrame(frame)
      root.removeAttribute('data-theme-changing')
    }
  }, [settings.color, dark])
  return (
    <ThemeContext.Provider
      value={{
        settings,
        dark,
        persistenceError,
        update: (patch) => {
          const next = parseTheme({ ...settings, ...patch })
          setPersistenceError(!account.update({ kind: 'theme', theme: next }))
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
