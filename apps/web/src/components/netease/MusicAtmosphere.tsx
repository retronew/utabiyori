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
      data-slot="music-atmosphere"
      className="pointer-events-none absolute inset-0 -z-20 overflow-hidden bg-[#28232e]"
    >
      <div
        className={cn(
          'absolute -inset-1/3 bg-radial from-primary/65 via-primary/20 to-transparent blur-3xl motion-safe:animate-[music-flow_14s_ease-in-out_infinite_alternate]',
          !animate && '[animation-play-state:paused]!',
        )}
      />
      {cover && (
        <img
          src={cover}
          alt=""
          className="absolute -inset-1/4 size-[150%] max-w-none object-cover opacity-65 blur-[55px] saturate-200"
        />
      )}
      {cover &&
        [
          '-top-1/3 -left-1/4 [object-position:20%_30%]',
          'top-1/4 -right-1/3 [object-position:80%_60%] [animation-direction:alternate-reverse]! [animation-delay:-7s]!',
          '-bottom-1/3 left-1/4 [object-position:50%_90%] [animation-delay:-4s]!',
        ].map((position, layer) => (
          <img
            key={layer}
            src={cover}
            alt=""
            className={cn(
              'absolute h-[110%] w-[100%] max-w-none rounded-full object-cover opacity-70 blur-[48px] saturate-[2.4] mix-blend-screen [mask-image:radial-gradient(ellipse,#000_15%,transparent_68%)] motion-safe:animate-[music-flow_16s_ease-in-out_infinite_alternate]',
              position,
              layer === 2 && 'opacity-50 [animation-duration:12s]!',
              !animate && '[animation-play-state:paused]!',
            )}
          />
        ))}
      <div className="absolute inset-0 bg-linear-to-b from-black/45 via-black/40 to-black/55" />
    </div>
  )
}
