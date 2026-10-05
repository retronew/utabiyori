import type { ComponentProps } from 'react'
import { cn } from '#lib/utils'

export function Skeleton({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      {...props}
      aria-hidden
      data-slot="skeleton"
      className={cn(
        'block animate-pulse rounded-md bg-muted motion-reduce:animate-none',
        className,
      )}
    />
  )
}
