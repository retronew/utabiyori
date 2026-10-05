import { lazy, Suspense } from 'react'
import { AudioLines, Music2, RefreshCw, Heart } from 'lucide-react'

import type { MusicSong, TimedLine, MusicPlayback, MusicLyrics } from '#music'
import type { LineRange } from '#lib/music-playback'
import { Button } from '#components/ui/button'
import { Switch } from '#components/ui/switch'
import { Label } from '#components/ui/label'
import { LyricsTranscript } from '#components/netease/LyricsTranscript'
import type { LyricsTranscriptProps } from '#components/netease/LyricsTranscript'
import { LyricsTranscriptDialog } from '#components/netease/LyricsTranscriptDialog'
import { MusicVisualBoundary } from '#components/netease/MusicVisualBoundary'
import { ScrollArea } from '#components/ui/scroll-area'
import { Artwork } from '#components/Artwork'
import { MusicAtmosphere } from '#components/netease/MusicAtmosphere'
import { cn } from '#lib/utils'
import { formatTime } from '#lib/media'

const AmllLyrics = lazy(() =>
  import('#components/netease/AmllLyrics').then((module) => ({
    default: module.AmllLyrics,
  })),
)

interface LyricsPanelProps {
  className?: string
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
        'relative isolate flex min-h-0 flex-1 flex-col overflow-clip rounded-[14px] bg-[#3b343b] text-white',
        className,
      )}
    >
      <MusicAtmosphere cover={selected?.cover} playing={playing && visible} />
      {selected ? (
        <>
          <div className="flex shrink-0 items-center gap-4 px-5 py-4 md:px-6 md:pt-6 md:pb-5 xl:gap-5 xl:px-8">
            <Artwork
              src={selected.cover}
              className="size-16 shrink-0 rounded-xl shadow-xl md:size-20 xl:size-24"
            />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[9px] font-medium tracking-[0.2em] text-white/45">
                NOW PRACTICING
              </p>
              <h2 className="truncate text-xl font-bold tracking-tight xl:text-2xl">
                {selected.name}
              </h2>
              <p className="mt-1 truncate text-sm text-white/65">
                {selected.artists}
              </p>
              <p className="mt-1 truncate text-[11px] text-white/40">
                {selected.album}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={favorite ? '取消收藏当前歌曲' : '收藏当前歌曲'}
              aria-pressed={favorite}
              onClick={onFavorite}
              className="shrink-0 text-white hover:bg-white/10"
            >
              <Heart className={cn('size-5', favorite && 'fill-current')} />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2 text-xs text-white/80 md:px-6 xl:px-8">
            <Label className="text-white/80">
              <Switch
                checked={showRomaji}
                onCheckedChange={onRomajiChange}
                aria-label="显示罗马音"
              />
              罗马音
            </Label>
            <Label className="text-white/80">
              <Switch
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
                className="text-[11px]"
              >
                {focused.words?.length ? '逐字进度' : '句级近似进度'}
              </span>
            )}
            <LyricsTranscriptDialog {...transcriptProps} />
            <span>
              {playback?.trial
                ? '试听 ' +
                  formatTime(playback.trial.start) +
                  '–' +
                  formatTime(playback.trial.end)
                : playback
                  ? '完整歌曲'
                  : '等待音频'}
            </span>
          </div>
          <div className="px-6 pt-3 xl:px-8">
            {favoritesError && (
              <p role="alert" className="mb-2 text-xs leading-5 text-rose-100">
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
                  className="ml-1 h-6 text-rose-100 hover:bg-white/10"
                >
                  <RefreshCw className="size-3" />
                  重试
                </Button>
              </div>
            ) : (
              <p role="status" className="text-[11px] text-white/70">
                {notice}
              </p>
            )}
          </div>
          <div className="min-h-0 flex-1">
            {lines.some((line) => line.text) ? (
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
                <Suspense
                  fallback={
                    <p role="status" className="p-6 text-sm text-white/70">
                      正在加载歌词动效…
                    </p>
                  }
                >
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
              <p role="status" className="px-6 py-14 text-sm text-white/70">
                {notice || '正在载入歌词…'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 px-5 py-3 text-[10px] text-white/65 md:px-6 xl:px-8">
            <AudioLines className="size-3.5" />
            <a
              href="https://github.com/retronew/utabiyori"
              target="_blank"
              rel="noreferrer"
              title="项目源码与 AMLL AGPL-3.0-only 许可说明"
              className="shrink-0 rounded text-white/65 hover:text-white focus-visible:ring-white/60"
            >
              AMLL · 源码
            </a>
            {loop && focused?.text
              ? '逐句循环 · ' +
                formatTime(range.start) +
                '–' +
                formatTime(range.end)
              : '点击歌词定位 · 底部开启逐句循环'}
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
        <div className="flex h-full flex-col items-center justify-center px-8 py-10 text-center">
          <Artwork className="size-36 rounded-[28px] shadow-2xl xl:size-44" />
          <p className="mt-8 text-[10px] font-medium tracking-[0.24em] text-white/45">
            A LITTLE JAPANESE, EVERY DAY
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight xl:text-3xl">
            从一首喜欢的歌开始
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/50">
            不必等学完五十音。
            <br />
            听一句、放慢一点，让旋律带你记住日语。
          </p>
          <div className="mt-8 flex gap-6 text-[11px] text-white/55">
            <span className="flex items-center gap-2">
              <Music2 className="size-4" />
              同步歌词
            </span>
            <span className="flex items-center gap-2">
              <AudioLines className="size-4" />
              慢速跟唱
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
