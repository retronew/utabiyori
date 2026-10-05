import type { Song } from '@jp-learn/shared'
import { Skeleton } from '#components/ui/Skeleton'

export function PracticeSkeleton({
  review,
  song,
  songCount,
  learned,
  lineIndex,
  romaji,
  translation,
}: {
  review: boolean
  song: Song
  songCount: number
  learned: number
  lineIndex: number
  romaji: boolean
  translation: boolean
}) {
  const content = (
    <section className="mx-auto w-full max-w-4xl p-4 md:p-5">
      <div
        className={
          review
            ? 'mb-6 flex items-center gap-3'
            : 'mb-6 flex items-center gap-4'
        }
      >
        <Skeleton
          className={
            review
              ? 'size-11 shrink-0 rounded-xl'
              : 'size-20 shrink-0 rounded-xl'
          }
        />
        <div className="min-w-0 flex-1">
          {review ? (
            <Skeleton className="h-7 w-40" />
          ) : (
            <>
              <Skeleton className="text-2xl leading-relaxed font-bold text-transparent">
                {song.title}
              </Skeleton>
              <Skeleton className="mt-1 text-sm leading-relaxed text-transparent">
                {song.subtitle}
              </Skeleton>
            </>
          )}
        </div>
      </div>
      {review ? (
        learned === 0 ? (
          <Skeleton className="min-h-80 w-full rounded-2xl" />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            {Array.from({ length: learned }, (_, index) => (
              <div
                key={index}
                className="space-y-1 border-b p-4 last:border-b-0"
              >
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-y py-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="my-4 rounded-2xl border bg-muted/40 p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 text-2xl leading-relaxed font-bold text-transparent">
              {song.lines[lineIndex]?.kana}
            </Skeleton>
            <Skeleton className="mt-1 text-sm text-transparent">
              {song.lines[lineIndex]?.translation}
            </Skeleton>
            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-9 w-24 sm:h-8" />
              <Skeleton className="h-9 w-24 sm:h-8" />
              <Skeleton className="h-9 w-24 sm:h-8" />
            </div>
          </div>
          <Skeleton className="mt-4 mb-2 h-6 w-24" />
          <div className="my-2 space-y-1">
            {song.lines.map((line) => (
              <div
                key={line.id}
                className="flex items-start gap-4 rounded-xl border border-transparent px-3 py-2.5"
              >
                <Skeleton className="mt-2 h-[15px] w-3 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="text-xl leading-9 font-semibold text-transparent">
                    {line.kana}
                  </Skeleton>
                  {romaji && (
                    <Skeleton className="text-base leading-relaxed text-transparent">
                      {line.romaji}
                    </Skeleton>
                  )}
                  {translation && (
                    <Skeleton className="mt-1 text-base leading-relaxed text-transparent">
                      {line.translation}
                    </Skeleton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
  return (
    <div
      role="status"
      aria-label="正在加载练习"
      data-slot="practice-skeleton"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {!review && (
        <>
          <Skeleton className="mx-4 mb-3 h-[34px] shrink-0 sm:h-[30px] lg:hidden" />
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden min-h-0 overflow-hidden border-r bg-muted/25 lg:block">
              <div className="px-5 pt-5 pb-3">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="px-3 pb-3">
                {Array.from({ length: songCount }, (_, index) => (
                  <div
                    key={index}
                    className="mb-1 flex items-center gap-3 p-2.5"
                  >
                    <Skeleton className="size-12 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="mt-1 h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-h-0 overflow-hidden">{content}</div>
          </div>
        </>
      )}
      {review && content}
    </div>
  )
}
