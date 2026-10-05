import { Scissors, Repeat2 } from 'lucide-react'
import { Button } from '#components/ui/button'
import { Input } from '#components/ui/input'
import { formatTime } from '#lib/media'

interface LoopEditorProps {
  start: number
  end: number
  current: number
  duration: number
  loop: boolean
  isValid: boolean
  onStartChange: (value: number) => void
  onEndChange: (value: number) => void
  onToggleLoop: () => void
}

export function LoopEditor({
  start,
  end,
  current,
  duration,
  loop,
  isValid,
  onStartChange,
  onEndChange,
  onToggleLoop,
}: LoopEditorProps) {
  return (
    <div className="mt-4 rounded-2xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Scissors className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">截取练习片段</h3>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {formatTime(start)} — {formatTime(end)}
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="loop-start"
            className="mb-2 block text-xs text-muted-foreground"
          >
            起点 / 秒
          </label>
          <div className="flex gap-2">
            <Input
              id="loop-start"
              type="number"
              min={0}
              max={duration}
              step={0.1}
              value={start}
              aria-invalid={!isValid && duration > 0}
              aria-describedby="loop-range-help"
              onChange={(event) => {
                onStartChange(Number(event.target.value))
              }}
            />
            <Button
              variant="outline"
              disabled={!duration}
              onClick={() => {
                onStartChange(Number(current.toFixed(1)))
              }}
            >
              设为起点
            </Button>
          </div>
        </div>
        <div>
          <label
            htmlFor="loop-end"
            className="mb-2 block text-xs text-muted-foreground"
          >
            终点 / 秒
          </label>
          <div className="flex gap-2">
            <Input
              id="loop-end"
              type="number"
              min={0}
              max={duration}
              step={0.1}
              value={end}
              aria-invalid={!isValid && duration > 0}
              aria-describedby="loop-range-help"
              onChange={(event) => {
                onEndChange(Number(event.target.value))
              }}
            />
            <Button
              variant="outline"
              disabled={!duration}
              onClick={() => {
                onEndChange(Number(current.toFixed(1)))
              }}
            >
              设为终点
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Button
          disabled={!isValid}
          variant={loop ? 'secondary' : 'default'}
          aria-pressed={loop}
          onClick={() => onToggleLoop()}
        >
          <Repeat2 className="size-4" />
          {loop ? '停止片段循环' : '循环这个片段'}
        </Button>
        <p
          id="loop-range-help"
          role="status"
          className="text-sm leading-relaxed text-muted-foreground"
        >
          {!isValid && duration > 0
            ? '终点需大于起点，且在音频时长内。'
            : loop
              ? '正在循环片段，底部可调整播放速度。'
              : '播放时也可以标记起点与终点。'}
        </p>
      </div>
    </div>
  )
}
