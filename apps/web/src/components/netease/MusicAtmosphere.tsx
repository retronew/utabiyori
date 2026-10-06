import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { MusicVisualBoundary } from '#components/netease/MusicVisualBoundary'

const AmllBackground = lazy(() =>
  import('#components/netease/AmllBackground').then((module) => ({
    default: module.AmllBackground,
  })),
)

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
  return (
    <div
      ref={container}
      aria-hidden
      data-slot="music-atmosphere"
      className="pointer-events-none absolute inset-0 -z-20 overflow-hidden bg-[#343438]"
    >
      {cover && (
        <img
          src={cover}
          alt=""
          className="absolute -inset-1/4 size-[150%] max-w-none object-cover opacity-70 blur-[55px]"
        />
      )}
      {cover && (
        <MusicVisualBoundary key={cover} fallback={null}>
          <Suspense fallback={null}>
            <AmllBackground cover={cover} playing={playing && visible} />
          </Suspense>
        </MusicVisualBoundary>
      )}
      <div className="absolute inset-0 bg-black/55" />
    </div>
  )
}
