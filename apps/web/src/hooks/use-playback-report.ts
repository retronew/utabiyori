import { useEffect, useEffectEvent, useRef } from 'react'
import type { RefObject } from 'react'
import type { musicRequest } from '#music'
import type { AudioTransport } from '#lib/audio-transport'

interface PlaybackRecord {
  songId: string
  start: number
  seconds: number
  last: number
  playing: boolean
}

interface PlaybackReportOptions {
  audio: RefObject<AudioTransport | null>
  request: typeof musicRequest
  onNotice: (message: string) => void
}

export function usePlaybackReport({
  audio,
  request,
  onNotice,
}: PlaybackReportOptions) {
  const report = useRef<PlaybackRecord | null>(null)

  function updateElapsed() {
    const record = report.current
    if (!audio.current || !record) return
    const now = audio.current.playedSeconds
    if (record.playing) record.seconds += Math.max(0, now - record.last)
    record.last = now
  }

  function finishReport(end = 'ui') {
    updateElapsed()
    const record = report.current
    report.current = null
    if (record && record.seconds > 0)
      void request({
        action: 'report',
        songId: record.songId,
        event: 'play',
        start: record.start,
        seconds: record.seconds,
        end,
      }).catch(() => onNotice('播放记录回传未完成，稍后可重新选择歌曲。'))
  }

  function startReport(songId: string) {
    if (report.current) {
      report.current.last = audio.current?.playedSeconds ?? 0
      report.current.playing = true
      return
    }
    const record: PlaybackRecord = {
      songId,
      start: Date.now(),
      seconds: 0,
      last: audio.current?.playedSeconds ?? 0,
      playing: true,
    }
    report.current = record
    void request({
      action: 'report',
      songId,
      event: 'startplay',
      start: record.start,
    }).catch(() => onNotice('播放记录回传未完成。'))
  }

  function suspendReport() {
    updateElapsed()
    if (report.current) report.current.playing = false
  }

  const interrupt = useEffectEvent(() => {
    updateElapsed()
    const record = report.current
    report.current = null
    if (record)
      void fetch('/api/netease', {
        method: 'POST',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          songId: record.songId,
          event: 'play',
          start: record.start,
          seconds: record.seconds,
          end: 'interrupt',
        }),
      }).catch(() => {})
  })
  const finish = useEffectEvent(finishReport)
  useEffect(() => {
    const onHide = () => interrupt()
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      finish()
    }
  }, [])

  return { updateElapsed, finishReport, startReport, suspendReport }
}
