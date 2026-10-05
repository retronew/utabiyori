import { useEffect, useRef } from 'react'
import { useReducedMotion } from '#hooks/use-reduced-motion'

export function useMarquee(text: string) {
  const outerRef = useRef<HTMLSpanElement>(null)
  const innerRef = useRef<HTMLSpanElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner || reducedMotion) return
    let animation: Animation | undefined
    let maskAnimation: Animation | undefined
    let visible = true
    const syncVisibility = () => {
      for (const active of [animation, maskAnimation]) {
        if (visible && !document.hidden) active?.play()
        else active?.pause()
      }
    }
    const measure = () => {
      animation?.cancel()
      maskAnimation?.cancel()
      animation = undefined
      maskAnimation = undefined
      delete outer.dataset.scrolling
      if (outer.clientWidth === 0) return
      const overflow = Math.max(0, inner.scrollWidth - outer.clientWidth)
      if (overflow <= 1) return
      outer.dataset.scrolling = 'true'
      const timing = {
        duration: Math.max(2000, (overflow / 30 / 0.6) * 1000),
        easing: 'ease-in-out',
        iterations: Infinity,
        direction: 'alternate',
      } satisfies KeyframeAnimationOptions
      // Match PickIt's 30px/s travel and pauses at both ends.
      animation = inner.animate(
        [
          { transform: 'translateX(0)', offset: 0 },
          { transform: 'translateX(0)', offset: 0.2 },
          { transform: `translateX(-${overflow}px)`, offset: 0.8 },
          { transform: `translateX(-${overflow}px)`, offset: 1 },
        ],
        timing,
      )
      maskAnimation = outer.animate(
        [
          { '--marquee-fade-l': '0px', '--marquee-fade-r': '12px', offset: 0 },
          {
            '--marquee-fade-l': '0px',
            '--marquee-fade-r': '12px',
            offset: 0.2,
          },
          {
            '--marquee-fade-l': '12px',
            '--marquee-fade-r': '12px',
            offset: 0.3,
          },
          {
            '--marquee-fade-l': '12px',
            '--marquee-fade-r': '12px',
            offset: 0.7,
          },
          {
            '--marquee-fade-l': '12px',
            '--marquee-fade-r': '0px',
            offset: 0.8,
          },
          { '--marquee-fade-l': '12px', '--marquee-fade-r': '0px', offset: 1 },
        ],
        timing,
      )
      syncVisibility()
    }
    const resize = new ResizeObserver(measure)
    resize.observe(outer)
    resize.observe(inner)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      syncVisibility()
    })
    intersection.observe(outer)
    document.addEventListener('visibilitychange', syncVisibility)
    measure()
    return () => {
      animation?.cancel()
      maskAnimation?.cancel()
      delete outer.dataset.scrolling
      resize.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', syncVisibility)
    }
  }, [text, reducedMotion])

  return { outerRef, innerRef }
}
