import { useState } from 'react'
import { ListMusic } from 'lucide-react'
import { Button } from '#components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
} from '#components/ui/dialog'
import { LyricsTranscript } from '#components/netease/LyricsTranscript'
import type { LyricsTranscriptProps } from '#components/netease/LyricsTranscript'

export function LyricsTranscriptDialog(props: LyricsTranscriptProps) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-white/80 hover:bg-white/10"
          />
        }
      >
        <ListMusic className="size-4" />
        歌词列表
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>歌词列表</DialogTitle>
          <DialogDescription>
            阅读原文、罗马音和翻译，按 Tab 选择歌词，按 Enter 定位。
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <LyricsTranscript
            {...props}
            onSeekLine={(index) => {
              props.onSeekLine(index)
              setOpen(false)
            }}
          />
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  )
}
