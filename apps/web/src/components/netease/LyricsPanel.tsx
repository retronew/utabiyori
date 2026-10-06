import { lazy, Suspense } from 'react'
import { AudioLines, Music2, RefreshCw, Heart } from 'lucide-react'

import type { MusicSong, TimedLine, MusicPlayback, MusicLyrics } from '#music'
import type { LineRange } from '#lib/music-playback'
import { Button } from '#components/ui/button'
import { IconSwap } from '#components/ui/IconSwap'
import { Skeleton } from '#components/ui/Skeleton'
import { Switch } from '#components/ui/switch'
import { Label } from '#components/ui/label'
import { LyricsTranscript } from '#components/netease/LyricsTranscript'
import type { LyricsTranscriptProps } from '#components/netease/LyricsTranscript'
import { LyricsTranscriptDialog } from '#components/netease/LyricsTranscriptDialog'
import { MusicVisualBoundary } from '#components/netease/MusicVisualBoundary'
import { ScrollArea } from '#components/ui/scroll-area'
import { Artwork } from '#components/Artwork'
import { MusicAtmosphere } from '#components/netease/MusicAtmosphere'
import { LyricsSkeleton } from '#components/netease/LyricsSkeleton'
import { cn } from '#lib/utils'
import { formatTime } from '#lib/media'

const AmllLyrics = lazy(() =>
  import('#components/netease/AmllLyrics').then((module) => ({
    default: module.AmllLyrics,
  })),
)

interface LyricsPanelProps {
  className?: string
  loading: boolean
  visible: boolean
  playing: boolean
  current: number
  readTime: () => number
  wordTiming?: MusicLyrics['wordTiming']
  favorite: boolean
  onFavorite: () => void
  selected: MusicSong | null
  playback: MusicPlayback | null
  lines: TimedLine[]
  lineIndex: number
  showRomaji: boolean
  showTranslation: boolean
  webLoggedIn: boolean
  loop: boolean
  error: string
  favoritesError: string
  notice: string
  lineRange: (index: number) => LineRange
  onRomajiChange: (show: boolean) => void
  onTranslationChange: (show: boolean) => void
  onSeekLine: (index: number) => void
  onRetry: () => void
}

export function LyricsPanel({
  className,
  loading,
  visible,
  playing,
  current,
  readTime,
  wordTiming,
  favorite,
  onFavorite,
  selected,
  playback,
  lines,
  lineIndex,
  showRomaji,
  showTranslation,
  webLoggedIn,
  loop,
  error,
  favoritesError,
  notice,
  lineRange,
  onRomajiChange,
  onTranslationChange,
  onSeekLine,
  onRetry,
}: LyricsPanelProps) {
  const focused = lines[lineIndex]
  const range = lineRange(lineIndex)
  const transcriptProps = {
    lines,
    lineIndex,
    showRomaji,
    showTranslation,
    lineRange,
    onSeekLine,
  } satisfies LyricsTranscriptProps
  return (
    <div
      className={cn(
        'relative isolate flex min-h-0 flex-1 flex-col overflow-clip rounded-[14px] transition-[border-radius] duration-(--fullscreen-duration) ease-(--ease-smooth-out) motion-reduce:transition-none',
        selected
          ? 'bg-[#343438] text-white selection:bg-white/25 selection:text-white'
          : 'bg-linear-to-b from-muted to-background text-foreground',
        className,
      )}
    >
      {selected && (
        <MusicAtmosphere cover={selected.cover} playing={playing && visible} />
      )}
      {selected ? (
        <>
          <div className="relative isolate z-10 shrink-0 after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:-bottom-8 after:-z-10 after:bg-black/25 after:backdrop-blur-xl after:[mask-image:linear-gradient(to_bottom,black_calc(100%-32px),transparent)]">
            <div className="flex shrink-0 items-center gap-3 px-3 py-2 sm:gap-4 sm:px-5 sm:py-4 md:px-6 md:pt-6 md:pb-5 xl:gap-5 xl:px-8">
              <Artwork
                src={selected.cover}
                className="size-12 shrink-0 rounded-xl shadow-xl sm:size-16 md:size-20 xl:size-24"
              />
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl leading-snug font-bold tracking-tight xl:text-2xl">
                  {selected.name}
                </h2>
                <p className="mt-1 break-words text-sm leading-relaxed text-white/85">
                  {selected.artists}
                </p>
                <p className="mt-1 break-words text-xs leading-relaxed text-white/80 max-sm:hidden">
                  {selected.album}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={favorite ? '取消收藏当前歌曲' : '收藏当前歌曲'}
                aria-pressed={favorite}
                onClick={onFavorite}
                className="shrink-0 text-white hover:bg-white/15 data-pressed:bg-white/20 focus-visible:ring-white focus-visible:ring-offset-transparent"
              >
                <IconSwap
                  active={favorite}
                  initial={<Heart className="size-5" />}
                  alternate={<Heart className="size-5 fill-current" />}
                />
              </Button>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1 text-xs text-white/80 sm:px-5 md:px-6 xl:px-8">
              <Label className="text-white/80">
                <Switch
                  className="inset-ring inset-ring-white/60 data-checked:bg-white data-unchecked:bg-white/15 focus-visible:ring-white focus-visible:ring-offset-transparent [&_[data-slot=switch-thumb]]:bg-white [&_[data-slot=switch-thumb][data-checked]]:bg-[#343438]"
                  checked={showRomaji}
                  onCheckedChange={onRomajiChange}
                  aria-label="显示罗马音"
                />
                罗马音
              </Label>
              <Label className="text-white/80">
                <Switch
                  className="inset-ring inset-ring-white/60 data-checked:bg-white data-unchecked:bg-white/15 focus-visible:ring-white focus-visible:ring-offset-transparent [&_[data-slot=switch-thumb]]:bg-white [&_[data-slot=switch-thumb][data-checked]]:bg-[#343438]"
                  checked={showTranslation}
                  onCheckedChange={onTranslationChange}
                  aria-label="显示翻译"
                />
                翻译
              </Label>
              {focused?.text && (
                <span
                  title={
                    focused.words?.length
                      ? '网易云官方提供的逐字时间轴。'
                      : wordTiming === 'restricted'
                        ? '未获逐字歌词接口权限。按句起止时间线性显示近似进度，不代表真实字词演唱时间。'
                        : wordTiming === 'unavailable'
                          ? '逐字歌词暂时无法获取。按句起止时间线性显示近似进度，不代表真实字词演唱时间。'
                          : '按句起止时间线性显示近似进度，不代表真实字词演唱时间。'
                  }
                  className="text-xs max-sm:hidden"
                >
                  {focused.words?.length ? '逐字进度' : '句级近似进度'}
                </span>
              )}
              <LyricsTranscriptDialog
                {...transcriptProps}
                songInfo={`${selected.name} · ${selected.artists} · ${selected.album || ''}${playback?.trial ? ` · 试听 ${formatTime(playback.trial.start)}–${formatTime(playback.trial.end)}` : ''}`}
              />
              <span
                className={
                  playback?.trial ? 'w-full sm:w-auto' : 'max-sm:hidden'
                }
              >
                {loading ? (
                  <Skeleton className="h-4 w-12 bg-white/15" />
                ) : playback?.trial ? (
                  '试听 ' +
                  formatTime(playback.trial.start) +
                  '–' +
                  formatTime(playback.trial.end)
                ) : playback ? (
                  '完整歌曲'
                ) : (
                  '等待音频'
                )}
              </span>
            </div>
            <div
              className={cn(
                'shrink-0 px-3 sm:px-6 xl:px-8',
                (error || favoritesError) && 'pt-2',
              )}
            >
              {favoritesError && (
                <p
                  role="alert"
                  className="mb-2 text-xs leading-5 text-rose-100"
                >
                  {favoritesError}
                </p>
              )}
              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-white/15 bg-black/15 px-3 py-2 text-xs leading-5 text-rose-100"
                >
                  {error}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRetry()}
                    className="ml-1 text-rose-100 hover:bg-white/15 data-pressed:bg-white/20 focus-visible:ring-white focus-visible:ring-offset-transparent"
                  >
                    <RefreshCw className="size-3" />
                    重试
                  </Button>
                </div>
              ) : (
                <p
                  role="status"
                  className={cn(
                    'text-xs text-white/80',
                    (loading || lines.some((line) => line.text)) && 'sr-only',
                  )}
                >
                  {notice}
                </p>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1">
            {loading ? (
              <LyricsSkeleton />
            ) : lines.some((line) => line.text) ? (
              <MusicVisualBoundary
                key={selected.id}
                fallback={
                  <ScrollArea className="h-full">
                    <div className="bg-background p-5 text-foreground">
                      <p role="status" className="mb-4 text-sm">
                        歌词动效无法加载，已切换到可操作的歌词列表。
                      </p>
                      <LyricsTranscript {...transcriptProps} />
                    </div>
                  </ScrollArea>
                }
              >
                <Suspense fallback={<LyricsSkeleton />}>
                  <AmllLyrics
                    lines={lines}
                    duration={selected.duration / 1000}
                    current={current}
                    readTime={readTime}
                    visible={visible}
                    playing={playing}
                    showRomaji={showRomaji}
                    showTranslation={showTranslation}
                    onSeekLine={onSeekLine}
                  />
                </Suspense>
              </MusicVisualBoundary>
            ) : (
              <p role="status" className="px-6 py-14 text-sm text-white/80">
                {notice}
              </p>
            )}
          </div>
          <div className="relative isolate z-10 flex shrink-0 flex-wrap items-center gap-2 px-3 py-2 text-xs text-white/80 before:pointer-events-none before:absolute before:inset-x-0 before:-top-10 before:bottom-0 before:-z-10 before:bg-black/25 before:backdrop-blur-xl before:[mask-image:linear-gradient(to_bottom,transparent,black_40px)] sm:px-5 md:px-6 xl:px-8">
            <AudioLines className="size-3.5" />
            <a
              href="https://github.com/retronew/utabiyori"
              target="_blank"
              rel="noreferrer"
              title="项目源码与 AMLL AGPL-3.0-only 许可说明"
              className="shrink-0 rounded text-white/80 hover:text-white focus-visible:ring-white"
            >
              AMLL · 源码
            </a>
            <span className="max-sm:hidden">
              {loop && focused?.text
                ? '逐句循环 · ' +
                  formatTime(range.start) +
                  '–' +
                  formatTime(range.end)
                : ''}
            </span>
            <span className="ml-auto">
              {playback?.source === 'web'
                ? webLoggedIn
                  ? '账号网页播放'
                  : '网页试听'
                : playback
                  ? '官方音频'
                  : ''}
            </span>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center sm:px-8">
          <img
            src="/brand/netease-cloud-music.svg"
            alt=""
            aria-hidden
            width={96}
            height={96}
            className="size-20 shrink-0 sm:size-24"
          />
          <h2 className="mt-6 text-xl font-semibold tracking-tight sm:text-2xl">
            选择歌曲
          </h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
            从曲库选择歌曲，查看歌词并练习。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Music2 aria-hidden className="size-4" strokeWidth={1.5} />
              同步歌词
            </span>
            <span className="flex items-center gap-2">
              <AudioLines aria-hidden className="size-4" strokeWidth={1.5} />
              慢速跟唱
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
