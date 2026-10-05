import { AudioLines, Music2, RefreshCw, Heart } from 'lucide-react'

import type { MusicSong, TimedLine, MusicPlayback, MusicLyrics } from '#music'
import { getLineRange } from '#lib/music-playback'
import type { LineRange } from '#lib/music-playback'
import { Button } from '#components/ui/button'
import { Switch } from '#components/ui/switch'
import { Label } from '#components/ui/label'
import { LyricProgressText } from '#components/netease/LyricProgressText'
import { ScrollArea } from '#components/ui/scroll-area'
import { Artwork } from '#components/Artwork'
import { MusicAtmosphere } from '#components/netease/MusicAtmosphere'
import { useLyricFollow } from '#hooks/use-lyric-follow'
import { cn } from '#lib/utils'
import { formatTime } from '#lib/media'

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
  const { lyricButtons, onManualScroll, resetManualScroll } = useLyricFollow({
    lineIndex,
    visible,
    lines,
    layoutKey: className,
    showRomaji,
    showTranslation,
  })
  const focused = lines[lineIndex]
  const range = lineRange(lineIndex)
  const sweepRange = getLineRange(
    lines,
    lineIndex,
    (selected?.duration ?? 0) / 1000,
  )
  return (
    <div
      className={cn(
        'relative isolate flex min-h-0 flex-1 flex-col overflow-clip bg-[#3b343b] text-white',
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-white/10 px-6 py-3 text-xs text-white/65 xl:px-8">
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
                      ? '当前开放应用未获逐字歌词接口权限，按句级时间轴近似推进。'
                      : wordTiming === 'unavailable'
                        ? '逐字歌词暂时无法获取，按句级时间轴近似推进。'
                        : '歌曲没有可用的逐字时间，按句级时间轴近似推进。'
                }
                className="text-[11px]"
              >
                {focused.words?.length ? '逐字进度' : '句级近似进度'}
              </span>
            )}
            <span className="ml-auto">
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
              <p role="status" className="text-[10px] text-white/40">
                {notice}
              </p>
            )}
          </div>
          <ScrollArea
            className="flex-1"
            scrollFade
            onWheel={onManualScroll}
            onTouchMove={onManualScroll}
          >
            <div className="space-y-1 px-3 py-[var(--lyric-edge-space,25vh)] xl:px-5">
              {lines.map(
                (line, index) =>
                  line.text && (
                    <Button
                      variant="ghost"
                      key={line.time + '-' + index}
                      ref={(node) => {
                        if (node) lyricButtons.current.set(index, node)
                        else lyricButtons.current.delete(index)
                      }}
                      data-line-index={index}
                      aria-current={index === lineIndex ? 'true' : undefined}
                      onClick={() => {
                        resetManualScroll()
                        onSeekLine(index)
                      }}
                      className={cn(
                        'group block h-auto w-full origin-left rounded-xl px-3 py-5 text-left whitespace-normal transition-[color,transform,filter,background-color] duration-500 hover:bg-white/5 focus-visible:ring-white/60 sm:h-auto xl:px-3 motion-reduce:transform-none',
                        index === lineIndex
                          ? 'scale-100 text-white'
                          : 'scale-[0.97] text-white/50',
                        playback?.trial &&
                          !lineRange(index).available &&
                          'opacity-60',
                      )}
                    >
                      <time className="mb-1.5 block text-[9px] font-medium tabular-nums opacity-50">
                        {formatTime(line.time)}
                        {playback?.trial &&
                          !lineRange(index).available &&
                          ' · 试听范围外'}
                      </time>
                      <span
                        lang="ja"
                        className={cn(
                          'block text-[28px] leading-[1.5] font-bold tracking-tight md:text-[32px] xl:text-[36px]',
                          index !== lineIndex &&
                            'blur-[0.3px] group-hover:blur-none',
                        )}
                      >
                        {index === lineIndex ? (
                          <LyricProgressText
                            key={index}
                            text={line.text}
                            words={line.words}
                            start={sweepRange.start}
                            end={line.end ?? sweepRange.end}
                            current={current}
                            playing={playing}
                            visible={visible}
                            readTime={readTime}
                          />
                        ) : (
                          line.text
                        )}
                      </span>
                      {showRomaji && line.romaji && (
                        <span
                          className={cn(
                            'mt-3 block text-base leading-relaxed font-medium md:text-lg xl:text-xl',
                            index === lineIndex
                              ? 'text-white/90'
                              : 'text-white/65',
                          )}
                        >
                          {line.romaji}
                        </span>
                      )}
                      {showTranslation && line.translation && (
                        <span
                          className={cn(
                            'mt-1.5 block text-[17px] leading-relaxed md:text-lg xl:text-xl',
                            index === lineIndex
                              ? 'text-white/85'
                              : 'text-white/65',
                          )}
                        >
                          {line.translation}
                        </span>
                      )}
                    </Button>
                  ),
              )}
              {!lines.some((line) => line.text) && (
                <div className="px-3 py-14 text-sm text-white/50">
                  {notice || '正在载入歌词…'}
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex items-center gap-2 border-t border-white/10 px-6 py-3 text-[10px] text-white/40 xl:px-8">
            <AudioLines className="size-3.5" />
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
