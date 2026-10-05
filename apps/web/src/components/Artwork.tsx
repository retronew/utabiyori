import { useState } from 'react'
import { Music2 } from 'lucide-react'
import { cn } from '#lib/utils'

export function Artwork({
  src,
  title,
  className,
  theme = 'rose',
}: {
  src?: string
  title?: string
  className?: string
  theme?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string>()
  return (
    <div
      className={cn(
        'relative isolate shrink-0 overflow-hidden rounded-xl outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 bg-linear-to-br from-primary/25 via-primary/10 to-primary/5',
        theme === 'sage' && 'from-emerald-200 via-teal-100 to-lime-50',
        theme === 'peach' && 'from-orange-200 via-amber-100 to-rose-100',
        theme === 'lavender' && 'from-violet-200 via-purple-100 to-blue-100',
        className,
      )}
    >
      {src && failedSrc !== src ? (
        <img
          src={src}
          alt={title ? `${title} 专辑封面` : ''}
          className="size-full object-cover"
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <>
          <div className="absolute -right-1/4 -bottom-1/4 size-full rounded-full border-[24px] border-white/30" />
          <div className="absolute -top-1/4 -left-1/4 size-3/4 rounded-full bg-white/30 blur-2xl" />
          <Music2
            className={cn(
              'absolute top-1/2 left-1/2 size-[38%] -translate-1/2 text-foreground/25',
              theme !== 'rose' && 'text-black/20',
            )}
            strokeWidth={1.2}
          />
        </>
      )}
    </div>
  )
}
