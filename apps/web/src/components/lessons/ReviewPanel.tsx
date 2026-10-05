import { BookOpen, RotateCcw, ChevronRight } from 'lucide-react'
import type { Song, Progress } from '@jp-learn/shared'
import { progressKey } from '@jp-learn/shared'
import { Button } from '#components/ui/button'
import { ScrollArea } from '#components/ui/scroll-area'

interface ReviewPanelProps {
  songs: Song[]
  progress: Progress
  learned: number
  onSelect: (id: string, index: number) => void
  onStart: () => void
}

export function ReviewPanel({
  songs,
  progress,
  learned,
  onSelect,
  onStart,
}: ReviewPanelProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <section className="mx-auto max-w-4xl p-5 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RotateCcw className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              熟悉的句子，再唱一遍
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              关掉罗马音，试着只看假名读出来。
            </p>
          </div>
        </div>
        {learned === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40 text-center">
            <BookOpen className="mb-4 size-9 text-muted-foreground/50" />
            <h3 className="text-base font-semibold">第一句，等你来唱</h3>
            <p className="mt-2 max-w-64 text-xs leading-6 text-muted-foreground">
              在歌曲练习里标记「这句我会了」，它就会出现在这里。
            </p>
            <Button className="mt-5" onClick={() => onStart()}>
              开始练习
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            {songs.flatMap((item) =>
              item.lines.map(
                (l, index) =>
                  progress[progressKey(item.id, l.id)] && (
                    <Button
                      key={progressKey(item.id, l.id)}
                      variant="ghost"
                      className="h-auto sm:h-auto whitespace-normal w-full justify-between gap-4 rounded-none border-b p-4 text-left last:border-b-0"
                      onClick={() => onSelect(item.id, index)}
                    >
                      <span>
                        <strong
                          lang="ja"
                          className="block text-base font-semibold"
                        >
                          {l.kana}
                        </strong>
                        <small className="mt-1 block text-xs font-normal text-muted-foreground">
                          {item.title} · {l.translation}
                        </small>
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Button>
                  ),
              ),
            )}
          </div>
        )}
      </section>
    </ScrollArea>
  )
}
