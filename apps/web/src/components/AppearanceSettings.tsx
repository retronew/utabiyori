import { useRef, useState } from 'react'
import { Sun, Moon, Monitor, Palette, Check, RotateCcw } from 'lucide-react'
import { Button } from '#components/ui/button'
import { Input } from '#components/ui/input'
import { ColorPicker } from '#components/ui/ColorPicker'
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog'
import { useTheme } from '#hooks/use-theme'
import { cn } from '#lib/utils'
import { defaultTheme, normalizeColor, themeColors } from '#lib/theme'
import type { ThemeMode } from '#lib/theme'

const modes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
]
export function AppearanceSettings() {
  const { settings, dark, update, persistenceError } = useTheme()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(settings.color)
  const customColor = normalizeColor(draft)
  const trigger = useRef<HTMLButtonElement>(null)
  return (
    <>
      <Button
        ref={trigger}
        variant="ghost"
        size="icon-sm"
        aria-label="外观设置"
        onClick={() => {
          setDraft(settings.color)
          setOpen(true)
        }}
      >
        <Palette className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup
          finalFocus={trigger}
          closeProps={{ 'aria-label': '关闭外观设置' }}
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle>外观设置</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold">明暗模式</legend>
              <div className="grid grid-cols-3 gap-2">
                {modes.map((mode) => (
                  <Button
                    key={mode.value}
                    variant="outline"
                    aria-pressed={settings.mode === mode.value}
                    onClick={() => update({ mode: mode.value })}
                    className={cn(
                      'h-auto flex-col gap-2 py-3 sm:h-auto',
                      settings.mode === mode.value &&
                        'border-primary/50 bg-primary/8 text-primary',
                    )}
                  >
                    <mode.icon className="size-5" />
                    <span className="text-xs">{mode.label}</span>
                  </Button>
                ))}
              </div>
              <p className="mt-2.5 text-xs text-muted-foreground">
                {settings.mode === 'system'
                  ? `当前跟随系统使用${dark ? '深色' : '浅色'}模式。`
                  : '切换后自动保存。'}
              </p>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold">主题颜色</legend>
              <div className="grid grid-cols-5 gap-1">
                {themeColors.map((item) => (
                  <Button
                    variant="ghost"
                    key={item.color}
                    aria-label={`${item.name}主题色`}
                    aria-pressed={settings.color === item.color}
                    onClick={() => {
                      setDraft(item.color)
                      update({ color: item.color })
                    }}
                    className="h-auto flex-col gap-1.5 rounded-lg p-1.5 sm:h-auto"
                  >
                    <span
                      style={{
                        backgroundColor: item.color,
                      }}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-full border border-black/10 text-white',
                        settings.color === item.color &&
                          'ring-2 ring-ring ring-offset-2 ring-offset-popover',
                      )}
                    >
                      {settings.color === item.color && (
                        <Check
                          aria-hidden
                          className="size-4 text-white opacity-100 drop-shadow-xs"
                          strokeWidth={2.5}
                        />
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.name}
                    </span>
                  </Button>
                ))}
              </div>
            </fieldset>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (customColor) {
                  setDraft(customColor)
                  update({ color: customColor })
                } else {
                  event.currentTarget
                    .querySelector<HTMLInputElement>('#theme-custom-hex')
                    ?.focus()
                }
              }}
            >
              <p id="theme-custom-label" className="mb-3 text-xs font-semibold">
                自定义颜色
              </p>
              <ColorPicker
                role="group"
                aria-labelledby="theme-custom-label"
                aria-describedby="theme-picker-help"
                color={customColor || settings.color}
                onChange={(color) => {
                  setDraft(color)
                  update({ color })
                }}
              />
              <p id="theme-picker-help" className="sr-only">
                拖动色板选择饱和度和明度，拖动下方色相条更换颜色，也可使用方向键调整。
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span
                  aria-hidden
                  style={{ backgroundColor: customColor || settings.color }}
                  className="size-8.5 shrink-0 rounded-lg border border-black/10 shadow-xs dark:border-white/10 sm:size-7.5"
                />
                <label htmlFor="theme-custom-hex" className="sr-only">
                  自定义颜色 HEX
                </label>
                <Input
                  id="theme-custom-hex"
                  aria-label="自定义颜色 HEX"
                  value={draft}
                  maxLength={7}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(event) => {
                    setDraft(event.target.value)
                  }}
                  aria-invalid={!customColor}
                  aria-describedby="theme-color-help"
                  className="font-mono"
                />
                <Button type="submit">应用</Button>
              </div>
              <p
                id="theme-color-help"
                role={!customColor ? 'alert' : undefined}
                className="mt-2 text-xs leading-5 text-muted-foreground"
              >
                {!customColor
                  ? '请输入 HEX 颜色，例如 #8b5cf6 或 #abc。'
                  : '拖动即可调整，颜色会自动适配明暗模式。'}
              </p>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p
                role="status"
                className="text-xs leading-relaxed text-muted-foreground"
              >
                {persistenceError
                  ? '暂时无法保存设置，本次仍可使用。'
                  : '设置保存在当前浏览器。'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(defaultTheme.color)
                  update(defaultTheme)
                }}
              >
                <RotateCcw className="size-3.5" />
                恢复默认
              </Button>
            </div>
          </div>
        </DialogPopup>
      </Dialog>
    </>
  )
}
