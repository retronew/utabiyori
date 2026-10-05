import { Skeleton } from '#components/ui/Skeleton'

export function LyricsSkeleton() {
  return (
    <div
      role="status"
      aria-label="正在加载歌词"
      data-slot="lyrics-skeleton"
      className="flex h-full min-h-0 flex-col justify-center gap-8 overflow-hidden px-3 [mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%-32px),transparent)] sm:px-5 md:px-6 xl:px-8"
    >
      {[0, 1, 2].map((line) => (
        <div key={line} className="space-y-2">
          <Skeleton className="h-[33px] w-3/4 bg-white/15 sm:h-[42px] md:h-12 xl:h-[54px]" />
          <Skeleton className="h-6 w-1/2 bg-white/10 md:h-[30px]" />
          <Skeleton className="h-6 w-2/3 bg-white/10 md:h-[30px]" />
        </div>
      ))}
    </div>
  )
}
