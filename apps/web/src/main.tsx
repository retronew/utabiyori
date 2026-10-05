import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '#index.css'
import App from '#App'
import { ThemeProvider } from '#components/ThemeProvider'
import { PlayerProvider } from '#components/PlayerSlot'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PlayerProvider>
        <App />
      </PlayerProvider>
    </ThemeProvider>
  </StrictMode>,
)
