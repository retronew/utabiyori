import { AudioLines, CircleAlert, Headphones } from 'lucide-react'
import { Skeleton } from '#components/ui/Skeleton'
import type { PlaybackQuality } from '#lib/audio-transport'
import { Button } from '#components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#components/ui/dialog'
import { cn } from '#lib/utils'

interface PlayerStatusProps {
  loading?: boolean
  disabled?: boolean
  quality?: PlaybackQuality
  activeQuality?: PlaybackQuality
  qualityNotice?: string
  streamQualityNotice?: string
}

export function PlayerStatus({
  loading,
  disabled,
  quality,
  activeQuality,
  qualityNotice,
  streamQualityNotice,
}: PlayerStatusProps) {
  const fallback =
    !loading && Boolean(qualityNotice) && quality !== activeQuality
  const label = loading
    ? '准备中'
    : disabled
      ? '待播放'
      : fallback
        ? '已回退'
        : activeQuality === 'dsp'
          ? '保音高'
          : '原生'
  const StatusIcon = fallback
    ? CircleAlert
    : activeQuality === 'dsp'
      ? AudioLines
      : Headphones
  const description = [
    qualityNotice,
    streamQualityNotice,
    disabled ? '选择音频后开始播放。' : '',
    activeQuality === 'dsp' ? '高品质保音高变速' : '浏览器原生播放',
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            static
            aria-label={`播放状态：${label}，查看详情`}
            className={cn(
              'h-5! w-18 gap-1 rounded-full bg-muted/70 px-2 text-xs! text-muted-foreground',
              fallback && 'bg-primary/10 text-primary',
            )}
          />
        }
      >
        {loading ? (
          <>
            <Skeleton className="size-3 rounded-full bg-foreground/10" />
            <Skeleton className="h-3 w-9 bg-foreground/10" />
          </>
        ) : (
          <>
            <StatusIcon className="size-3" aria-hidden />
            <span>{label}</span>
          </>
        )}
      </DialogTrigger>
      <DialogPopup closeProps={{ 'aria-label': '关闭播放状态' }}>
        <DialogHeader>
          <DialogTitle>播放状态</DialogTitle>
          <DialogDescription className={loading ? 'sr-only' : undefined}>
            {description}
          </DialogDescription>
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          )}
        </DialogHeader>
      </DialogPopup>
    </Dialog>
  )
}
