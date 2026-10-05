import { useRef } from 'react'
import { FileMusic, Upload, Check } from 'lucide-react'
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
        className="mx-auto w-full max-w-4xl p-5 md:p-8"
        aria-labelledby="audio-heading"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">
              YOUR OWN SOUND
            </p>
            <h2
              id="audio-heading"
              className="mt-1.5 text-2xl font-bold tracking-tight"
            >
              用你的歌曲练习
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => input.current?.click()}
          >
            <Upload className="size-4" />
            {source ? '更换音频' : '选择音频'}
          </Button>
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
            <div className="flex items-center gap-5 rounded-2xl border bg-linear-to-br from-muted/50 to-background p-5 md:gap-7 md:p-7">
              <Artwork
                theme="lavender"
                className="size-24 shrink-0 rounded-xl shadow-md md:size-32"
              />
              <div className="min-w-0">
                <p className="mb-2 text-[10px] font-semibold tracking-widest text-primary">
                  LOCAL TRACK
                </p>
                <h3 className="truncate text-lg font-bold md:text-2xl">
                  {name}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  本地音频 · {formatTime(duration)}
                </p>
                <p className="mt-4 text-xs leading-6 text-muted-foreground">
                  找到想唱的一句，设置起点与终点，反复听、跟着唱。
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
            <h3 className="mt-6 text-lg font-semibold">把熟悉的旋律带进来</h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
              选择本机的 MP3、WAV 等音频文件。
              <br />
              放慢速度，循环一小段，练习会轻松很多。
            </p>
            <Button className="mt-6" onClick={() => input.current?.click()}>
              <Upload className="size-4" />
              选择音频文件
            </Button>
          </div>
        )}
        {error && (
          <p className="mt-4 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        <p className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Check className="size-3.5" />
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
