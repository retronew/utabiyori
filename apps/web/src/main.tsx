import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '#index.css'
import App from '#App'
import { ThemeProvider } from '#components/ThemeProvider'
import { PlayerProvider } from '#components/PlayerSlot'
import { AccountProvider } from '#components/AccountProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccountProvider>
      <ThemeProvider>
        <PlayerProvider>
          <App />
        </PlayerProvider>
      </ThemeProvider>
    </AccountProvider>
  </StrictMode>,
)
