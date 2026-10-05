import { createContext } from 'react'
import type { ThemeSettings } from '#lib/theme'

export const ThemeContext = createContext<{
  settings: ThemeSettings
  dark: boolean
  update: (settings: Partial<ThemeSettings>) => void
  persistenceError: boolean
} | null>(null)
