import { useMarquee } from '#hooks/use-marquee'
import { cn } from '#lib/utils'

export function MarqueeText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const { outerRef, innerRef } = useMarquee(text)
  return (
    <span
      ref={outerRef}
      title={text}
      className={cn(
        'block min-w-0 overflow-hidden whitespace-nowrap data-[scrolling=true]:[mask-image:linear-gradient(to_right,transparent,#000_var(--marquee-fade-l),#000_calc(100%_-_var(--marquee-fade-r)),transparent)] motion-reduce:text-ellipsis motion-reduce:mask-none',
        className,
      )}
    >
      <span ref={innerRef} className="inline-block motion-reduce:inline">
        {text}
      </span>
    </span>
  )
}
