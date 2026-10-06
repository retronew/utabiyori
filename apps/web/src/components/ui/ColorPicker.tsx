import { HexColorPicker } from 'react-colorful'
import type { ComponentProps } from 'react'
import { cn } from '#lib/utils'

export function ColorPicker({
  className,
  ...props
}: ComponentProps<typeof HexColorPicker>) {
  return (
    <HexColorPicker
      data-slot="color-picker"
      className={cn(
        String.raw`h-44! w-full! gap-4 [&_.react-colorful\_\_saturation]:rounded-lg! [&_.react-colorful\_\_saturation]:border-b-0! [&_.react-colorful\_\_saturation]:ring-1! [&_.react-colorful\_\_saturation]:ring-inset! [&_.react-colorful\_\_saturation]:ring-black/10! dark:[&_.react-colorful\_\_saturation]:ring-white/10! [&_.react-colorful\_\_hue]:h-3! [&_.react-colorful\_\_hue]:shrink-0! [&_.react-colorful\_\_hue]:rounded-full! [&_.react-colorful\_\_pointer]:size-5! [&_.react-colorful\_\_pointer]:shadow-xs! [&_.react-colorful\_\_interactive:focus-visible_.react-colorful\_\_pointer]:ring-2! [&_.react-colorful\_\_interactive:focus-visible_.react-colorful\_\_pointer]:ring-ring! [&_.react-colorful\_\_interactive:focus-visible_.react-colorful\_\_pointer]:ring-offset-2! [&_.react-colorful\_\_interactive:focus-visible_.react-colorful\_\_pointer]:ring-offset-background!`,
        className,
      )}
      {...props}
    />
  )
}
