import {
  Search,
  Link2,
  ChevronLeft,
  ChevronRight,
  AudioLines,
  ArrowUpRight,
} from 'lucide-react'
import type { MusicSong } from '#music'
import { Button } from '#components/ui/button'
import { Input } from '#components/ui/input'
import { ScrollArea } from '#components/ui/scroll-area'
import { Artwork } from '#components/Artwork'
import { cn } from '#lib/utils'
import { formatTime } from '#lib/media'

interface MusicLibraryPanelProps {
  className?: string
  ready: boolean | null
  loggedIn: boolean
  webLoggedIn: boolean
  busy: boolean
  query: string
  searched: string
  songs: MusicSong[]
  selectedId?: string
  playing: boolean
  total: number
  offset: number
  onQueryChange: (query: string) => void
  onSearch: (keyword?: string, offset?: number) => void
  onSelect: (song: MusicSong) => void
  onAccountOpen: () => void
}

export function MusicLibraryPanel({
  className,
  ready,
  loggedIn,
  webLoggedIn,
  busy,
  query,
  searched,
  songs,
  selectedId,
  playing,
  total,
  offset,
  onQueryChange,
  onSearch,
  onSelect,
  onAccountOpen,
}: MusicLibraryPanelProps) {
  return (
    <div className={cn('flex min-h-0 flex-col border-r', className)}>
      <div className="space-y-4 border-b p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">
              YOUR MUSIC LIBRARY
            </p>
            <h2 className="mt-1 text-lg font-bold">网易云音乐</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="账号连接"
            onClick={() => onAccountOpen()}
            className={loggedIn ? 'text-primary' : ''}
          >
            <Link2 />
          </Button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSearch()
          }}
          className="flex gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3 z-10 size-4 text-muted-foreground" />
            <Input
              aria-label="搜索歌曲或歌手"
              placeholder="歌曲、歌手或专辑"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            aria-label="搜索"
            disabled={!loggedIn || busy || !query.trim()}
            loading={busy}
          >
            <ArrowUpRight />
          </Button>
        </form>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              'size-1.5 rounded-full',
              loggedIn ? 'bg-emerald-500' : 'bg-muted-foreground/50',
            )}
          />
          {ready === null
            ? '正在检查连接…'
            : ready === false
              ? '服务暂时不可用'
              : loggedIn
                ? webLoggedIn
                  ? '曲库与播放账号已连接'
                  : '曲库已连接'
                : '连接账号，开始找歌'}
          {!loggedIn && ready && (
            <button
              className="ml-auto text-primary"
              onClick={() => onAccountOpen()}
            >
              连接
            </button>
          )}
        </p>
      </div>
      <ScrollArea className="flex-1" scrollFade>
        <div className="p-3">
          {searched && (
            <p className="px-2 pt-2 pb-3 text-xs text-muted-foreground">
              “{searched}” · {total} 首结果
            </p>
          )}
          {songs.map((song) => (
            <button
              key={song.id}
              onClick={() => onSelect(song)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary',
                selectedId === song.id && 'bg-primary/8 text-primary',
              )}
            >
              <Artwork
                src={song.cover}
                className="size-11 shrink-0 rounded-md"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">
                  {song.name}
                </span>
                <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                  {song.artists}
                </span>
              </span>
              {selectedId === song.id && playing ? (
                <AudioLines className="size-4 shrink-0" />
              ) : (
                <time className="text-[10px] tabular-nums text-muted-foreground">
                  {formatTime(song.duration / 1000)}
                </time>
              )}
            </button>
          ))}
          {!songs.length && (
            <div className="px-3 py-8">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <Search className="size-5" />
              </span>
              <h3 className="mt-5 text-sm font-semibold">
                {searched ? '还没有找到这首歌' : '今天，想唱哪首歌？'}
              </h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {searched
                  ? '试试更短的歌名，或搜索歌手。'
                  : '从熟悉的旋律开始，一句一句积累日语。'}
              </p>
              {!searched && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {['spiral', '米津玄師', 'ヨルシカ'].map((keyword) => (
                    <Button
                      key={keyword}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      disabled={!loggedIn || busy}
                      onClick={() => {
                        onQueryChange(keyword)
                        onSearch(keyword)
                      }}
                    >
                      {keyword}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      {songs.length > 0 && (
        <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
          <span>
            {offset + 1}–{offset + songs.length} / {total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="上一页"
              disabled={busy || offset === 0}
              onClick={() => onSearch(searched, Math.max(0, offset - 12))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="下一页"
              disabled={busy || offset + songs.length >= total}
              onClick={() => onSearch(searched, offset + 12)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
