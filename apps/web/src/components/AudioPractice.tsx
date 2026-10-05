import { useRef } from 'react'
import { FileMusic, Upload } from 'lucide-react'
import { Button } from '#components/ui/button'
import { LoopEditor } from '#components/local/LoopEditor'
import { Artwork } from '#components/Artwork'
import { PlayerControls } from '#components/PlayerControls'
import { PlayerPortal } from '#components/PlayerSlot'
import { useLocalAudio } from '#hooks/use-local-audio'
import { formatTime } from '#lib/media'

export default function AudioPractice() {
  const input = useRef<HTMLInputElement>(null)
  const {
    slot,
    source,
    name,
    duration,
    error,
    selectFile,
    mediaProps,
    playerProps,
    loopEditorProps,
  } = useLocalAudio()
  return (
    <>
      <section
        className="mx-auto w-full max-w-4xl p-4 md:p-5"
        aria-labelledby="audio-heading"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="audio-heading" className="text-lg font-bold tracking-tight">
              音频文件
            </h2>
          </div>
          {source && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => input.current?.click()}
            >
              <Upload className="size-4" />
              更换音频
            </Button>
          )}
        </div>
        <input
          id="local-audio-file"
          ref={input}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) selectFile(file)
          }}
        />
        {source ? (
          <>
            <div className="flex flex-col items-start gap-5 rounded-2xl sm:flex-row sm:items-center border bg-linear-to-br from-muted/50 to-background p-5 md:gap-7 md:p-7">
              <Artwork
                theme="lavender"
                className="size-24 shrink-0 rounded-xl shadow-md md:size-32"
              />
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-lg leading-snug font-bold md:text-2xl">
                  {name}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  本地音频 · {formatTime(duration)}
                </p>
                <p className="mt-4 text-xs leading-6 text-muted-foreground">
                  设置 A–B 区间可循环播放。
                </p>
              </div>
            </div>

            <LoopEditor {...loopEditorProps} />
          </>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed bg-muted/40 px-6 py-14 text-center">
            <span className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileMusic className="size-9" />
            </span>
            <h3 className="mt-6 text-lg font-semibold">选择本地音频</h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
              支持 MP3、WAV 等格式。
            </p>
            <Button className="mt-6" onClick={() => input.current?.click()}>
              <Upload className="size-4" />
              选择音频
            </Button>
          </div>
        )}
        {error && (
          <p className="mt-4 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          音频仅在本机播放；刷新页面后重新选择。
        </p>
      </section>
      {source && <audio {...mediaProps} />}
      <PlayerPortal active={slot.active}>
        <PlayerControls {...playerProps} />
      </PlayerPortal>
    </>
  )
}
