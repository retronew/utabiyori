import { Maximize, Minimize } from 'lucide-react'
import { Button } from '#components/ui/button'
import { usePlayerContext } from '#hooks/use-player-slot'

export function PlayerFullscreenButton({ disabled }: { disabled: boolean }) {
  const { fullscreen } = usePlayerContext()
  const label = fullscreen.active ? '退出全屏播放' : '全屏播放'
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={fullscreen.active}
      title={fullscreen.active ? '退出全屏播放（Esc）' : label}
      disabled={fullscreen.pending || (disabled && !fullscreen.active)}
      onClick={(event) => void fullscreen.toggle(event.currentTarget)}
    >
      {fullscreen.active ? <Minimize /> : <Maximize />}
    </Button>
  )
}
