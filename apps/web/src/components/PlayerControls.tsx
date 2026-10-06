import {
  Headphones,
  Pause,
  Play,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Loader,
} from 'lucide-react'
import { useId, useState } from 'react'
import type { ComponentProps } from 'react'
import { MUSIC_QUALITIES, isMusicQuality } from '@jp-learn/shared'
import type { MusicQuality } from '@jp-learn/shared'
import { Button } from '#components/ui/button'
import { IconSwap } from '#components/ui/IconSwap'
import { MarqueeText } from '#components/ui/MarqueeText'
import { Slider } from '#components/ui/slider'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '#components/ui/select'
import { Artwork } from '#components/Artwork'
import { PlayerFullscreenButton } from '#components/PlayerFullscreenButton'
import { PlayerStatus } from '#components/PlayerStatus'
import { formatTime } from '#lib/media'
import { cn } from '#lib/utils'
import type { PlaybackQuality } from '#lib/audio-transport'
import { usePlaybackShortcut } from '#hooks/use-playback-shortcut'

const selectTriggerClassName = 'w-auto min-w-0 text-xs sm:text-xs'
const playbackSelectPopupProps = {
  side: 'top',
  align: 'start',
  sideOffset: 6,
  alignItemWithTrigger: false,
} satisfies ComponentProps<typeof SelectPopup>

export interface PlayerControlsProps {
  title?: string
  subtitle?: string
  cover?: string
  emptyCover?: string
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
  streamQuality?: MusicQuality
  streamQualityDisabled?: boolean
  streamQualityNotice?: string
  onStreamQualityChange?: (value: MusicQuality) => void
}
export function PlayerControls({
  title,
  subtitle,
  cover,
  emptyCover,
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
  streamQuality,
  streamQualityDisabled,
  streamQualityNotice,
  onStreamQualityChange,
}: PlayerControlsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsId = useId()
  usePlaybackShortcut(onToggle, Boolean(disabled || (loading && !playing)))
  const maximum = upper ?? duration
  const rates = [0.6, 0.75, 0.9, 1].map((value) => ({
    value,
    label: `${value}×`,
  }))
  const statusProps = {
    loading,
    disabled,
    quality,
    activeQuality,
    qualityNotice,
    streamQualityNotice,
  } satisfies ComponentProps<typeof PlayerStatus>
  return (
    <div
      data-slot="player-controls"
      className={cn(
        'grid min-w-0 grid-cols-[minmax(0,1fr)] items-center gap-2 px-2 py-2 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:gap-4 xl:px-5',
        compact && 'grid-cols-1! px-0! py-0!',
      )}
    >
      {!compact && (
        <div className="flex min-w-0 items-center gap-3 max-xl:hidden">
          {!title && emptyCover ? (
            <img
              src={emptyCover}
              alt=""
              aria-hidden
              width={44}
              height={44}
              className="size-11 shrink-0"
            />
          ) : (
            <Artwork src={cover} className="size-11 shrink-0 rounded-lg" />
          )}
          <div className="min-w-0 flex-1">
            <MarqueeText
              text={title || '未选择歌曲'}
              className="h-5 text-sm leading-5 font-semibold"
            />
            <MarqueeText
              text={subtitle || ''}
              className="mt-0.5 h-4 text-xs leading-4 text-muted-foreground"
            />
          </div>
          <PlayerStatus {...statusProps} />
        </div>
      )}
      <div className="flex min-w-0 flex-col items-center gap-1 xl:min-w-[432px]">
        <div
          className={cn(
            'flex h-5 w-full min-w-0 items-center gap-2 xl:hidden',
            compact && 'xl:flex',
          )}
        >
          <MarqueeText
            text={`${title || '未选择歌曲'}${subtitle ? ` · ${subtitle}` : ''}`}
            className="min-w-0 flex-1 text-xs leading-5 text-muted-foreground"
          />
          <PlayerStatus {...statusProps} />
        </div>
        <div className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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
              static
              aria-label={
                loading && !playing
                  ? '取消加载'
                  : playing
                    ? '暂停播放'
                    : '播放歌曲'
              }
              aria-keyshortcuts="Space"
              title="播放 / 暂停（空格）"
              onClick={onToggle}
              disabled={disabled}
              aria-busy={loading || undefined}
              className="rounded-full text-foreground [&_svg]:opacity-100"
            >
              <span className="relative size-6 shrink-0" aria-hidden>
                <Loader
                  data-slot="player-loading"
                  className={cn(
                    'pointer-events-none absolute inset-0 size-6',
                    loading ? 'animate-spin' : 'invisible',
                  )}
                />
                <IconSwap
                  active={playing}
                  className={cn('size-6', loading && 'invisible')}
                  initial={
                    <Play className="size-6 translate-x-0.5 fill-current" />
                  }
                  alternate={<Pause className="size-6 fill-current" />}
                />
              </span>
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
            <span className="max-sm:hidden">
              <PlayerFullscreenButton disabled={!title} />
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="sm:hidden"
              aria-label="播放设置"
              aria-expanded={settingsOpen}
              aria-controls={settingsId}
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <SlidersHorizontal />
            </Button>
          </div>
          <div
            id={settingsId}
            className={cn(
              'flex flex-wrap items-center justify-center gap-1.5 transition-opacity duration-(--duration-fast) starting:opacity-0 sm:gap-2',
              !settingsOpen && 'max-sm:hidden',
            )}
          >
            <span className="sm:hidden">
              <PlayerFullscreenButton disabled={!title} />
            </span>
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
                className={selectTriggerClassName}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectPopup {...playbackSelectPopupProps}>
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
                  aria-label="变速处理"
                  className={selectTriggerClassName}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup {...playbackSelectPopupProps}>
                  <SelectItem value="dsp">高品质 · 保音高</SelectItem>
                  <SelectItem value="native">原生 · 浏览器</SelectItem>
                </SelectPopup>
              </Select>
            )}
            {onStreamQualityChange && (
              <Select
                items={MUSIC_QUALITIES}
                value={streamQuality}
                disabled={streamQualityDisabled}
                onValueChange={(value) => {
                  if (isMusicQuality(value)) onStreamQualityChange(value)
                }}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="网易云音质"
                  className={selectTriggerClassName}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup {...playbackSelectPopupProps}>
                  {MUSIC_QUALITIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            )}
          </div>
        </div>
        <span role="status" className="sr-only">
          {qualityNotice}
        </span>
        <div className="flex w-full max-w-lg items-center gap-2.5 text-xs tabular-nums text-muted-foreground">
          <span className="w-10 shrink-0 text-right">
            {formatTime(current)}
          </span>
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
            className="py-1 [&_[data-slot=slider-control]]:min-w-0 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-indicator]]:bg-foreground/65"
          />
          <span className="w-10 shrink-0">{formatTime(maximum)}</span>
        </div>
      </div>
      {!compact && (
        <div className="flex items-center justify-end gap-3 max-xl:hidden">
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
            className="w-20! max-xl:hidden py-1 [&_[data-slot=slider-control]]:min-w-0 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-indicator]]:bg-foreground/65"
          />
          <Headphones
            className="ml-1 size-4 text-muted-foreground max-xl:hidden"
            aria-hidden
          />
        </div>
      )}
    </div>
  )
}
