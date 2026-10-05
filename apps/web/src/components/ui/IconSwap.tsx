import type { ReactNode } from 'react'
import { cn } from '#lib/utils'

export function IconSwap({
  active,
  initial,
  alternate,
  className,
}: {
  active: boolean
  initial: ReactNode
  alternate: ReactNode
  className?: string
}) {
  const stateClass =
    'absolute inset-0 flex items-center justify-center transition-[opacity,scale,filter] duration-(--duration-quick) ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:filter-none'
  return (
    <span
      aria-hidden
      className={cn('relative inline-flex size-5 shrink-0', className)}
    >
      <span
        className={cn(
          stateClass,
          active
            ? 'scale-[0.25] opacity-0 blur-[4px]'
            : 'scale-100 opacity-100 blur-none',
        )}
      >
        {initial}
      </span>
      <span
        className={cn(
          stateClass,
          active
            ? 'scale-100 opacity-100 blur-none'
            : 'scale-[0.25] opacity-0 blur-[4px]',
        )}
      >
        {alternate}
      </span>
    </span>
  )
}
