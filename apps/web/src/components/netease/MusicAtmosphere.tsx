import { useEffect, useRef, useState } from 'react'
import { cn } from '#lib/utils'

export function MusicAtmosphere({
  cover,
  playing,
}: {
  cover?: string
  playing: boolean
}) {
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    )
    if (container.current) observer.observe(container.current)
    return () => observer.disconnect()
  }, [])
  const animate = playing && visible
  return (
    <div
      ref={container}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-20 overflow-hidden bg-[#28232e]"
    >
      <div
        className={cn(
          'absolute -inset-1/3 bg-radial from-primary/50 via-primary/10 to-transparent blur-3xl motion-safe:animate-[music-drift_24s_ease-in-out_infinite_alternate]',
          !animate && '[animation-play-state:paused]!',
        )}
      />
      {cover &&
        [0, 1].map((layer) => (
          <img
            key={layer}
            src={cover}
            alt=""
            className={cn(
              'absolute -inset-1/3 size-[166%] max-w-none object-cover opacity-55 blur-[80px] saturate-150 motion-safe:animate-[music-drift_28s_ease-in-out_infinite_alternate]',
              layer === 1 &&
                'mix-blend-screen opacity-30 [animation-direction:alternate-reverse]! [animation-delay:-14s]!',
              !animate && '[animation-play-state:paused]!',
            )}
          />
        ))}
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/35 to-black/60" />
    </div>
  )
}
