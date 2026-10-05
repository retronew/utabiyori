import {
  Headphones,
  Pause,
  Play,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Button } from '#components/ui/button'
import { Slider } from '#components/ui/slider'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '#components/ui/select'
import { Artwork } from '#components/Artwork'
import { formatTime } from '#lib/media'
import { cn } from '#lib/utils'
import type { PlaybackQuality } from '#lib/audio-transport'
import { usePlaybackShortcut } from '#hooks/use-playback-shortcut'

export interface PlayerControlsProps {
  title?: string
  subtitle?: string
  cover?: string
  current: number
  duration: number
  lower?: number
  upper?: number
  playing: boolean
  loading?: boolean
  disabled?: boolean
  loop?: boolean
  loopDisabled?: boolean
  loopLabel?: string
  rate: number
  volume: number
  onToggle: () => void
  onSeek: (value: number) => void
  onRate: (value: number) => void
  onVolume: (value: number) => void
  onLoop?: () => void
  onPrevious?: () => void
  onNext?: () => void
  previousDisabled?: boolean
  nextDisabled?: boolean
  compact?: boolean
  quality?: PlaybackQuality
  activeQuality?: PlaybackQuality
  qualityNotice?: string
  onQualityChange?: (value: PlaybackQuality) => void
}
export function PlayerControls({
  title,
  subtitle,
  cover,
  current,
  duration,
  lower = 0,
  upper,
  playing,
  loading,
  disabled,
  loop,
  loopDisabled,
  loopLabel,
  rate,
  volume,
  onToggle,
  onSeek,
  onRate,
  onVolume,
  onLoop,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  compact,
  quality,
  activeQuality,
  qualityNotice,
  onQualityChange,
}: PlayerControlsProps) {
  usePlaybackShortcut(onToggle, Boolean(disabled || (loading && !playing)))
  const maximum = upper ?? duration
  const rates = [0.6, 0.75, 0.9, 1].map((value) => ({
    value,
    label: `${value}×`,
  }))
  return (
    <div
      className={cn(
        'grid min-w-0 grid-cols-[minmax(0,1fr)] items-center gap-3 px-4 py-3 lg:grid-cols-[minmax(140px,1fr)_minmax(322px,1.6fr)_minmax(140px,1fr)] lg:gap-6 lg:px-6',
        compact && 'grid-cols-1! px-0! py-0!',
      )}
    >
      {!compact && (
        <div className="flex min-w-0 items-center gap-3 max-lg:hidden">
          <Artwork src={cover} className="size-11 rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">
              {title || '还没有正在播放的歌曲'}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {subtitle || '找到喜欢的声音，从一句开始'}
            </p>
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        {title && (
          <p className="max-w-full truncate text-[10px] text-muted-foreground lg:hidden">
            {title}
            {subtitle ? ` · ${subtitle}` : ''}
          </p>
        )}
        <div className="flex items-center justify-center gap-1 sm:gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={loopLabel || (loop ? '停止逐句循环' : '循环当前句')}
            aria-pressed={loop || false}
            className={cn(
              'text-muted-foreground',
              loop && 'bg-primary/10 text-primary',
            )}
            disabled={disabled || loopDisabled || !onLoop}
            onClick={onLoop}
          >
            <Repeat1 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="上一句"
            disabled={disabled || previousDisabled || !onPrevious}
            onClick={onPrevious}
          >
            <SkipBack className="size-4 fill-current" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={playing ? '暂停播放' : '播放歌曲'}
            aria-keyshortcuts="Space"
            title="播放 / 暂停（空格）"
            onClick={onToggle}
            disabled={disabled}
            aria-busy={loading || undefined}
            className="rounded-full text-foreground [&_svg]:opacity-100"
          >
            {loading ? (
              <span
                className="absolute inset-1.5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground"
                aria-hidden
              />
            ) : null}
            {playing ? (
              <Pause className="size-6 fill-current" />
            ) : (
              <Play className="size-6 fill-current" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="下一句"
            disabled={disabled || nextDisabled || !onNext}
            onClick={onNext}
          >
            <SkipForward className="size-4 fill-current" />
          </Button>
          <Select
            items={rates}
            value={rate}
            onValueChange={(value) => {
              if (value !== null) onRate(value)
            }}
            disabled={disabled}
          >
            <SelectTrigger
              size="sm"
              aria-label="播放速度"
              className="h-7 min-h-0 w-[60px] min-w-0 gap-1 border-0 bg-transparent px-1.5 text-[11px] shadow-none sm:w-[66px] sm:gap-1.5 sm:text-xs [&_svg]:size-3"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              {rates.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          {onQualityChange && (
            <Select
              items={[
                { value: 'dsp', label: '高品质' },
                { value: 'native', label: '原生' },
              ]}
              value={quality}
              onValueChange={(value) => {
                if (value === 'dsp' || value === 'native')
                  onQualityChange(value)
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="变速音质"
                className="h-7 min-h-0 w-[68px] min-w-0 gap-1 border-0 bg-transparent px-1.5 text-[11px] shadow-none sm:w-[76px] sm:gap-1.5 sm:text-xs [&_svg]:size-3"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectPopup alignItemWithTrigger={false}>
                <SelectItem value="dsp">高品质 · 保音高</SelectItem>
                <SelectItem value="native">原生 · 浏览器</SelectItem>
              </SelectPopup>
            </Select>
          )}
        </div>
        {qualityNotice ? (
          <p
            role="status"
            className="max-w-lg text-center text-[10px] text-muted-foreground"
          >
            {qualityNotice}
          </p>
        ) : activeQuality === 'dsp' ? (
          <p className="text-[10px] text-muted-foreground">保音高变速</p>
        ) : null}
        <div className="flex w-full max-w-lg items-center gap-2.5 text-[10px] tabular-nums text-muted-foreground">
          <span className="w-8 shrink-0 text-right">{formatTime(current)}</span>
          <Slider
            aria-label="播放进度"
            min={lower}
            max={Math.max(lower + 0.01, maximum)}
            step={0.1}
            value={Math.min(Math.max(current, lower), Math.max(lower, maximum))}
            disabled={disabled || maximum <= lower}
            onValueChange={(value) =>
              onSeek(Array.isArray(value) ? value[0]! : value)
            }
            className="py-2 [&_[data-slot=slider-control]]:min-w-0 [&_[data-slot=slider-thumb]]:size-2.5 [&_[data-slot=slider-indicator]]:bg-foreground/65"
          />
          <span className="w-8 shrink-0">{formatTime(maximum)}</span>
        </div>
      </div>
      {!compact && (
        <div className="flex items-center justify-end gap-3 max-lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={volume === 0 ? '取消静音' : '静音'}
            onClick={() => onVolume(volume === 0 ? 0.7 : 0)}
            disabled={disabled}
          >
            {volume === 0 ? <VolumeX /> : <Volume2 />}
          </Button>
          <Slider
            aria-label="音量"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onValueChange={(value) =>
              onVolume(Array.isArray(value) ? value[0]! : value)
            }
            disabled={disabled}
            className="w-20! [&_[data-slot=slider-control]]:min-w-0 [&_[data-slot=slider-thumb]]:size-2.5 [&_[data-slot=slider-indicator]]:bg-foreground/65"
          />
          <Headphones
            className="ml-1 size-4 text-muted-foreground"
            aria-hidden
          />
        </div>
      )}
    </div>
  )
}
