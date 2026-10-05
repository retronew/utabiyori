import { AudioLines, Music2, RefreshCw } from 'lucide-react'
import type { MusicSong, TimedLine, MusicPlayback } from '#music'
import type { LineRange } from '#lib/music-playback'
import { Button } from '#components/ui/button'
import { Switch } from '#components/ui/switch'
import { ScrollArea } from '#components/ui/scroll-area'
import { Artwork } from '#components/Artwork'
import { useLyricFollow } from '#hooks/use-lyric-follow'
import { cn } from '#lib/utils'
import { formatTime } from '#lib/media'

interface LyricsPanelProps {
  className?: string
  visible: boolean
  selected: MusicSong | null
  playback: MusicPlayback | null
  lines: TimedLine[]
  lineIndex: number
  showRomaji: boolean
  showTranslation: boolean
  webLoggedIn: boolean
  loop: boolean
  error: string
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
  selected,
  playback,
  lines,
  lineIndex,
  showRomaji,
  showTranslation,
  webLoggedIn,
  loop,
  error,
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
  return (
    <div
      className={cn(
        'relative isolate flex min-h-0 flex-1 flex-col overflow-clip bg-[#3b343b] text-white',
        className,
      )}
    >
      {selected?.cover && (
        <img
          src={selected.cover}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 size-full scale-125 object-cover opacity-35 blur-[70px]"
        />
      )}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-black/10 via-black/25 to-black/50" />
      {selected ? (
        <>
          <div className="flex shrink-0 items-center gap-4 px-5 py-4 md:px-6 md:pt-6 md:pb-5 xl:gap-5 xl:px-8">
            <Artwork
              src={selected.cover}
              className="size-16 shrink-0 rounded-xl shadow-xl md:size-20 xl:size-24"
            />
            <div className="min-w-0">
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
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-white/10 px-6 py-3 text-[11px] text-white/60 xl:px-8">
            <label className="flex items-center gap-2">
              <Switch
                checked={showRomaji}
                onCheckedChange={onRomajiChange}
                aria-label="显示罗马音"
              />
              罗马音
            </label>
            <label className="flex items-center gap-2">
              <Switch
                checked={showTranslation}
                onCheckedChange={onTranslationChange}
                aria-label="显示翻译"
              />
              翻译
            </label>
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
            <div className="space-y-1 px-3 pt-5 pb-[25vh] xl:px-5">
              {lines.map(
                (line, index) =>
                  line.text && (
                    <button
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
                        'group block w-full rounded-xl px-3 py-4 text-left transition-colors duration-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-white/60 xl:px-3',
                        index === lineIndex ? 'text-white' : 'text-white/35',
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
                        className="block text-[24px] leading-[1.55] font-bold tracking-tight xl:text-[30px]"
                      >
                        {line.text}
                      </span>
                      {showRomaji && line.romaji && (
                        <span className="mt-2 block text-[12px] leading-5 font-medium opacity-60">
                          {line.romaji}
                        </span>
                      )}
                      {showTranslation && line.translation && (
                        <span className="mt-1 block text-[13px] leading-6 opacity-60">
                          {line.translation}
                        </span>
                      )}
                    </button>
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
