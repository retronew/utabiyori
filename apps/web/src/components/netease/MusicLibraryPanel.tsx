import { useState } from 'react'
import type { RefObject } from 'react'
import { Search, Link2, ChevronLeft, ChevronRight } from 'lucide-react'

import type { MusicSong } from '#music'
import type { FavoriteSong } from '#lib/music-favorites'
import {
  MusicSongRow,
  MusicSongRowSkeleton,
} from '#components/netease/MusicSongRow'
import { Skeleton } from '#components/ui/Skeleton'
import { Button } from '#components/ui/button'
import { Input } from '#components/ui/input'
import { ScrollArea } from '#components/ui/scroll-area'
import { Tabs, TabsList, TabsTab, TabsPanel } from '#components/ui/tabs'
import { cn } from '#lib/utils'

interface MusicLibraryPanelProps {
  accountTrigger: RefObject<HTMLButtonElement | null>
  className?: string
  ready: boolean | null
  loggedIn: boolean
  webLoggedIn: boolean
  busy: boolean
  query: string
  searched: string
  songs: MusicSong[]
  favorites: FavoriteSong[]
  favoritesError: string
  error: string
  onFavorite: (song: FavoriteSong) => void
  onSelectFavorite: (song: FavoriteSong) => void
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
  accountTrigger,
  className,
  ready,
  loggedIn,
  webLoggedIn,
  busy,
  query,
  searched,
  songs,
  favorites,
  favoritesError,
  error,
  onFavorite,
  onSelectFavorite,
  selectedId,
  playing,
  total,
  offset,
  onQueryChange,
  onSearch,
  onSelect,
  onAccountOpen,
}: MusicLibraryPanelProps) {
  const [view, setView] = useState<'search' | 'favorites'>('search')
  const connectionStatus =
    ready === null
      ? '检查连接中'
      : ready === false
        ? '服务不可用'
        : loggedIn
          ? webLoggedIn
            ? '曲库与播放账号已连接'
            : '曲库已连接'
          : '未连接账号'
  const favoriteIds = new Set(favorites.map((song) => song.id))
  return (
    <Tabs
      value={view}
      onValueChange={(value) => {
        if (value === 'search' || value === 'favorites') setView(value)
      }}
      className={cn('min-h-0 gap-0 overflow-clip', className)}
    >
      <div className="space-y-2 px-4 pt-2 pb-1 lg:px-5 lg:pt-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="music-search" className="text-sm font-medium">
            搜索歌曲或歌手
          </label>
          <Button
            ref={accountTrigger}
            variant="ghost"
            size="sm"
            aria-label="账号连接"
            aria-describedby="music-connection-status"
            title={connectionStatus}
            onClick={onAccountOpen}
            className={cn(
              'w-22 shrink-0 gap-1.5 text-xs',
              loggedIn ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {ready === null ? (
              <Skeleton className="h-4 w-14" />
            ) : (
              <>
                <Link2 className="size-3.5" />
                {ready === false ? '不可用' : loggedIn ? '已连接' : '连接账号'}
              </>
            )}
          </Button>
          <span id="music-connection-status" role="status" className="sr-only">
            {connectionStatus}
          </span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setView('search')
            onSearch()
          }}
          className="flex gap-2"
          role="search"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="搜索歌曲或歌手"
              id="music-search"
              type="search"
              name="song-query"
              placeholder="歌名或歌手"
              aria-describedby="music-connection-status"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="[&_input]:pl-9"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            aria-label="搜索"
            disabled={!loggedIn || busy || !query.trim()}
            loading={busy}
          >
            <Search />
          </Button>
        </form>
        <TabsList className="w-full" aria-label="曲库视图">
          {(['search', 'favorites'] as const).map((tab) => (
            <TabsTab key={tab} value={tab}>
              {tab === 'search' ? '搜索结果' : `收藏 · ${favorites.length}`}
            </TabsTab>
          ))}
        </TabsList>
        {(favoritesError || error) && (
          <p role="alert" className="text-xs leading-5 text-destructive">
            {favoritesError || error}
          </p>
        )}
      </div>
      <TabsPanel
        value={view}
        aria-busy={busy}
        className="flex min-h-0 flex-col"
      >
        <p role="status" className="sr-only">
          {busy ? '加载中…' : searched ? `“${searched}” · ${total} 首结果` : ''}
        </p>
        <ScrollArea className="flex-1" scrollFade>
          <div className="px-3 pt-1 pb-3">
            {view === 'search' && busy
              ? Array.from({ length: songs.length || 6 }, (_, index) => (
                  <MusicSongRowSkeleton key={index} />
                ))
              : view === 'search'
                ? songs.map((song) => (
                    <MusicSongRow
                      key={song.id}
                      song={song}
                      selected={selectedId === song.id}
                      playing={playing}
                      favorite={favoriteIds.has(song.id)}
                      onSelect={() => onSelect(song)}
                      onFavorite={() => onFavorite(song)}
                    />
                  ))
                : favorites.map((song) => (
                    <MusicSongRow
                      key={song.id}
                      song={song}
                      selected={selectedId === song.id}
                      playing={playing}
                      favorite
                      onSelect={() => onSelectFavorite(song)}
                      onFavorite={() => onFavorite(song)}
                    />
                  ))}
            {view === 'favorites' && !favorites.length && (
              <div className="px-3 py-4 text-sm leading-7 text-muted-foreground">
                暂无收藏，选择歌曲旁的爱心即可收藏。
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setView('search')}
                >
                  搜索歌曲
                </Button>
              </div>
            )}
            {view === 'search' && !songs.length && !busy && (
              <div className="px-3 py-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <Search className="size-5" />
                </span>
                <h3 className="mt-5 text-sm font-semibold">
                  {searched ? '暂无结果' : '搜索歌曲'}
                </h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {searched
                    ? `未找到“${searched}”，请更换关键词。`
                    : !loggedIn && ready === true
                      ? '先在上方连接账号，再搜索歌曲。'
                      : '输入歌名或歌手。'}
                </p>
                {searched && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      onQueryChange('')
                      document.getElementById('music-search')?.focus()
                    }}
                  >
                    修改搜索
                  </Button>
                )}
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
        {view === 'search' && (songs.length > 0 || busy) && (
          <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
            <span className="flex h-4 items-center">
              {busy ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <>
                  {offset + 1}–{offset + songs.length} / {total}
                </>
              )}
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
      </TabsPanel>
    </Tabs>
  )
}
