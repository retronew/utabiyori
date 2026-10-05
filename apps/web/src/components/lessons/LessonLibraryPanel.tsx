import { useRef } from 'react'
import { Download, Plus } from 'lucide-react'
import { songs as builtInSongs } from '@jp-learn/content'
import { completion } from '@jp-learn/shared'
import type { Song, Progress } from '@jp-learn/shared'
import { Button } from '#components/ui/button'
import { ScrollArea } from '#components/ui/scroll-area'
import { Artwork } from '#components/Artwork'
import { cn } from '#lib/utils'

interface LessonLibraryPanelProps {
  songs: Song[]
  selectedId: string
  progress: Progress
  onSelect: (id: string) => void
  onImport: (file: File) => Promise<void>
}

export function LessonLibraryPanel({
  songs,
  selectedId,
  progress,
  onSelect,
  onImport,
}: LessonLibraryPanelProps) {
  const lessonInput = useRef<HTMLInputElement>(null)
  return (
    <section className="flex min-h-0 flex-col border-b bg-muted/25 lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-sm font-semibold">我的练习曲</h2>
        <span className="text-xs text-muted-foreground">{songs.length} 首</span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-3 pb-3">
          {songs.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              aria-pressed={selectedId === item.id}
              className={cn(
                'mb-1 h-auto sm:h-auto whitespace-normal w-full justify-start gap-3 p-2.5 text-left',
                selectedId === item.id && 'bg-primary/8 hover:bg-primary/10',
              )}
              onClick={() => onSelect(item.id)}
            >
              <Artwork
                title={item.title}
                theme={item.theme}
                className="size-12 rounded-lg"
              />
              <span className="min-w-0 flex-1">
                <strong
                  className="block break-words text-sm leading-snug font-semibold"
                  lang="ja"
                >
                  {item.title}
                </strong>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {builtInSongs.some((s) => s.id === item.id)
                    ? '原创练习'
                    : '我的练习'}{' '}
                  · {item.lines.length} 句
                </span>
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {completion(item, progress)}%
              </span>
            </Button>
          ))}
        </div>
      </ScrollArea>
      <div className="flex shrink-0 items-center justify-between gap-1 border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          render={<a href="/lesson-template.json" download />}
        >
          <Download className="size-3.5" />
          下载示例
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => lessonInput.current?.click()}
        >
          <Plus className="size-3.5" />
          导入练习
        </Button>
        <input
          ref={lessonInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          aria-label="导入逐句练习"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void onImport(file)
          }}
        />
      </div>
    </section>
  )
}
