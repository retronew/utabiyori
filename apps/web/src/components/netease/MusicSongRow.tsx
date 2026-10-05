import { AudioLines, Heart } from 'lucide-react'
import { Button } from '#components/ui/button'
import { Artwork } from '#components/Artwork'
import { formatTime } from '#lib/media'
import { cn } from '#lib/utils'
import type { FavoriteSong } from '#lib/music-favorites'

export function MusicSongRow({
  song,
  selected,
  playing,
  favorite,
  onSelect,
  onFavorite,
}: {
  song: FavoriteSong
  selected: boolean
  playing: boolean
  favorite: boolean
  onSelect: () => void
  onFavorite: () => void
}) {
  return (
    <div
      className={cn(
        'group flex min-w-0 items-center rounded-xl hover:bg-muted',
        selected && 'bg-primary/8',
      )}
    >
      <Button
        variant="ghost"
        aria-label={`练习 ${song.name} · ${song.artists}`}
        onClick={onSelect}
        className={cn(
          'h-auto min-w-0 flex-1 justify-start gap-3 rounded-xl px-2.5 py-2.5 text-left sm:h-auto',
          selected && 'text-primary',
        )}
      >
        <Artwork src={song.cover} className="size-11 shrink-0 rounded-md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">
            {song.name}
          </span>
          <span className="mt-1 block truncate text-[11px] text-muted-foreground">
            {song.artists}
          </span>
        </span>
        {selected && playing ? (
          <AudioLines className="size-4 shrink-0" />
        ) : (
          <time className="text-[10px] tabular-nums text-muted-foreground">
            {formatTime(song.duration / 1000)}
          </time>
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(
          'mr-1 shrink-0',
          favorite ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-label={`${favorite ? '取消收藏' : '收藏'} ${song.name} · ${song.artists}`}
        aria-pressed={favorite}
        onClick={onFavorite}
      >
        <Heart className={cn('size-4', favorite && 'fill-current')} />
      </Button>
    </div>
  )
}
