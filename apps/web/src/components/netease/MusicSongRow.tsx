import { AudioLines, Heart } from 'lucide-react'
import { Button } from '#components/ui/button'
import { IconSwap } from '#components/ui/IconSwap'
import { MarqueeText } from '#components/ui/MarqueeText'
import { Skeleton } from '#components/ui/Skeleton'
import { Artwork } from '#components/Artwork'
import { formatTime } from '#lib/media'
import { cn } from '#lib/utils'
import type { FavoriteSong } from '#lib/music-favorites'

export function MusicSongRowSkeleton() {
  return (
    <div
      data-slot="song-row-skeleton"
      aria-hidden
      className="flex min-w-0 items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5">
        <Skeleton className="size-11 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-[19px] w-4/5" />
          <Skeleton className="mt-1 h-[18px] w-3/5" />
        </div>
        <Skeleton className="h-4 w-8 shrink-0" />
      </div>
      <Skeleton className="mr-1 size-8 shrink-0 rounded-full sm:size-7" />
    </div>
  )
}

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
        'group flex min-w-0 items-center rounded-xl transition-colors duration-(--duration-quick)',
        selected ? 'bg-primary/8 hover:bg-primary/12' : 'hover:bg-muted',
      )}
    >
      <Button
        variant="ghost"
        aria-label={`练习 ${song.name} · ${song.artists}`}
        aria-pressed={selected}
        static
        onClick={onSelect}
        className={cn(
          'h-auto min-w-0 flex-1 justify-start gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-transparent data-pressed:bg-transparent sm:h-auto',
          selected && 'text-primary',
        )}
      >
        <Artwork src={song.cover} className="size-11 shrink-0 rounded-md" />
        <span className="min-w-0 flex-1">
          <MarqueeText
            text={song.name}
            className="text-sm leading-snug font-semibold"
          />
          <MarqueeText
            text={song.artists}
            className="mt-1 text-xs leading-relaxed text-muted-foreground"
          />
        </span>
        {selected && playing ? (
          <AudioLines className="size-4 shrink-0" />
        ) : (
          <time className="text-xs tabular-nums text-muted-foreground">
            {formatTime(song.duration / 1000)}
          </time>
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(
          'mr-1 shrink-0 hover:bg-transparent data-pressed:bg-transparent',
          favorite ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-label={`${favorite ? '取消收藏' : '收藏'} ${song.name} · ${song.artists}`}
        aria-pressed={favorite}
        onClick={onFavorite}
      >
        <IconSwap
          active={favorite}
          initial={<Heart className="size-4" />}
          alternate={<Heart className="size-4 fill-current" />}
        />
      </Button>
    </div>
  )
}
