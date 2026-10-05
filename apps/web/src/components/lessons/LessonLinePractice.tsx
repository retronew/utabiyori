import {
  Play,
  Square,
  Check,
  ChevronLeft,
  ChevronRight,
  Volume2,
} from 'lucide-react'
import type { LyricLine } from '@jp-learn/shared'
import { Button } from '#components/ui/button'

interface LessonLinePracticeProps {
  line: LyricLine
  lineIndex: number
  lineCount: number
  mastered: boolean
  speaking: boolean
  onSpeak: (text: string, rate?: number) => void
  onStopSpeech: () => void
  onToggleMastered: () => void
  onSelectLine: (index: number) => void
}

export function LessonLinePractice({
  line,
  lineIndex,
  lineCount,
  mastered,
  speaking,
  onSpeak,
  onStopSpeech,
  onToggleMastered,
  onSelectLine,
}: LessonLinePracticeProps) {
  return (
    <>
      <div className="rounded-2xl border bg-muted/40 p-4">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground">
          正在练习 · 第 {lineIndex + 1} 句
        </p>
        <h3
          lang="ja"
          className="mt-2 break-words text-2xl leading-relaxed font-bold tracking-tight"
        >
          {line.kana}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{line.translation}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            onClick={() => (speaking ? onStopSpeech() : onSpeak(line.kana))}
          >
            {speaking ? (
              <Square className="size-3 fill-current" />
            ) : (
              <Play className="size-3 fill-current" />
            )}
            {speaking ? '停止朗读' : '听这一句'}
          </Button>
          <Button variant="outline" onClick={() => onSpeak(line.kana, 0.5)}>
            慢速朗读
          </Button>
          <Button
            variant={mastered ? 'secondary' : 'ghost'}
            className="sm:ml-auto"
            aria-pressed={mastered}
            onClick={onToggleMastered}
          >
            <Check className="size-4" />
            {mastered ? '取消掌握' : '标记已掌握'}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">系统日语语音</p>
        <div className="mt-3 border-t pt-3">
          <p className="mb-1 text-xs font-semibold">发音小提示</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {line.tip}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={lineIndex === 0}
            onClick={() => onSelectLine(lineIndex - 1)}
          >
            <ChevronLeft />
            上一句
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={lineIndex === lineCount - 1}
            onClick={() => onSelectLine(lineIndex + 1)}
          >
            下一句
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">假名</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {line.focus.map((k) => (
            <Button
              key={k.kana}
              variant="outline"
              className="h-auto sm:h-auto whitespace-normal justify-start gap-3 p-3 text-left"
              onClick={() => onSpeak(k.kana === 'っ' ? 'そっと' : k.kana)}
            >
              <span lang="ja" className="text-3xl font-medium text-primary">
                {k.kana}
              </span>
              <span className="min-w-0">
                <strong className="block text-sm">{k.romaji}</strong>
                <small className="mt-1 block text-xs leading-relaxed font-normal text-muted-foreground">
                  {k.example}
                </small>
              </span>
              <Volume2 className="ml-auto size-3.5 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </div>
    </>
  )
}
