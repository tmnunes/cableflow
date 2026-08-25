import * as React from 'react'
import { cn } from '@/utils/cn'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[2.25rem] w-full min-w-0 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

interface AutoResizeTextareaProps extends React.ComponentProps<'textarea'> {
  minRows?: number
}

function AutoResizeTextarea({
  className,
  value,
  minRows = 1,
  onChange,
  ...props
}: AutoResizeTextareaProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  const resize = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, minRows * 24)}px`
  }, [minRows])

  React.useLayoutEffect(() => {
    resize()
  }, [value, resize])

  return (
    <Textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={(event) => {
        onChange?.(event)
        resize()
      }}
      className={cn('resize-none overflow-hidden', className)}
      {...props}
    />
  )
}

export { Textarea, AutoResizeTextarea }
