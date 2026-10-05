import { useEffect, useRef, useState } from 'react'
import type { ComponentPropsWithRef } from 'react'
import { mergeLyrics } from '#music'
import type { MusicSong, TimedLine, MusicPlayback, MusicLyrics } from '#music'
import type { PlayerControlsProps } from '#components/PlayerControls'
import { usePlayerSlot } from '#hooks/use-player-slot'
import { useExclusiveAudio } from '#hooks/use-exclusive-audio'
import { useNeteaseAccount } from '#hooks/use-netease-account'
import { usePlaybackReport } from '#hooks/use-playback-report'
import { announceAudio } from '#lib/audio-events'
import { getLineRange } from '#lib/music-playback'

export function useNeteasePractice() {
  const slot = usePlayerSlot('music')
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileView, setMobileView] = useState<'library' | 'lyrics'>('library')
  const [playing, setPlaying] = useState(false)
  const [mediaReady, setMediaReady] = useState(false)
  const [mediaDuration, setMediaDuration] = useState(0)
  const [buffering, setBuffering] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [query, setQuery] = useState('')
  const [songs, setSongs] = useState<MusicSong[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [searched, setSearched] = useState('')
  const [searchBusy, setSearchBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<MusicSong | null>(null)
  const [lines, setLines] = useState<TimedLine[]>([])
  const [playback, setPlayback] = useState<MusicPlayback | null>(null)
  const [current, setCurrent] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)
  const [loop, setLoop] = useState(false)
  const [rate, setRate] = useState(1)
  const [showRomaji, setShowRomaji] = useState(true)
  const [showTranslation, setShowTranslation] = useState(true)
  const audio = useRef<HTMLAudioElement>(null)
  useExclusiveAudio(audio)
  useEffect(() => {
    if (audio.current) audio.current.volume = volume
  }, [volume, playback])
  const requestVersion = useRef(0)
  const activeRequest = useRef<AbortController | null>(null)
  const searchRequest = useRef<AbortController | null>(null)
  const searchVersion = useRef(0)

  const account = useNeteaseAccount({
    onError: setError,
    onNotice: setNotice,
    onDisconnect: () => {
      finishReport()
      audio.current?.pause()
      activeRequest.current?.abort()
      searchRequest.current?.abort()
      requestVersion.current++
      searchVersion.current++
      setSearchBusy(false)
      setPlayback(null)
      setLoop(false)
    },
    onWebConnected: () => {
      if (selected) void selectSong(selected)
    },
  })
  const { requestMusic } = account
  const {
    updateElapsed,
    finishReport,
    startReport,
    suspendReport,
    updateRate,
  } = usePlaybackReport({ audio, request: requestMusic, onNotice: setNotice })
  const busy = searchBusy || account.busy
  useEffect(
    () => () => {
      activeRequest.current?.abort()
      searchRequest.current?.abort()
    },
    [],
  )
  useEffect(() => {
    const media = audio.current
    if (media) media.playbackRate = rate
  }, [rate, playback])
  async function search(keyword = query, start = 0) {
    if (!keyword.trim()) return
    searchRequest.current?.abort()
    const controller = new AbortController()
    searchRequest.current = controller
    const version = ++searchVersion.current
    setSearchBusy(true)
    setError('')
    try {
      const result = await requestMusic<{ songs: MusicSong[]; total: number }>(
        {
          action: 'search',
          keyword: keyword.trim(),
          offset: start,
        },
        controller.signal,
      )
      if (controller.signal.aborted || version !== searchVersion.current) return
      setSongs(result.songs)
      setTotal(result.total)
      setOffset(start)
      setSearched(keyword.trim())
    } catch (e) {
      if (!controller.signal.aborted && version === searchVersion.current)
        setError(e instanceof Error ? e.message : '搜索失败。')
    } finally {
      if (version === searchVersion.current) setSearchBusy(false)
    }
  }
  async function selectSong(song: MusicSong) {
    finishReport()
    audio.current?.pause()
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    const version = ++requestVersion.current
    announceAudio()
    slot.activate()
    setMobileView('lyrics')
    setMediaReady(false)
    setMediaDuration(0)
    setBuffering(false)
    setPlaying(false)
    setSelected(song)
    setLines([])
    setPlayback(null)
    setCurrent(0)
    setLineIndex(0)
    setLoop(false)
    setError('')
    setNotice('正在获取歌词和播放权限…')
    const results = await Promise.allSettled([
      requestMusic<MusicLyrics>(
        { action: 'lyrics', songId: song.id },
        controller.signal,
      ),
      requestMusic<MusicPlayback>(
        { action: 'playback', songId: song.id, ticket: song.ticket },
        controller.signal,
      ),
    ])
    if (version !== requestVersion.current || controller.signal.aborted) return
    const [lyric, stream] = results
    if (lyric.status === 'fulfilled') {
      const data = lyric.value
      const merged = mergeLyrics(data.lyric, data.translation, data.romaji)
      setLines(merged)
      setNotice(
        data.pureMusic
          ? '这是一首纯音乐。'
          : merged.some((l) => l.text)
            ? '点选一句歌词，从这一句开始练习。'
            : '网易云没有提供带时间轴的歌词，可以直接听歌。',
      )
    } else setNotice('歌词暂时无法获取，可以先听歌。')
    if (stream.status === 'fulfilled') setPlayback(stream.value)
    else
      setError(
        stream.reason instanceof Error
          ? stream.reason.message
          : '播放地址获取失败。',
      )
  }
  function lineRange(index: number) {
    return getLineRange(
      lines,
      index,
      (selected?.duration || 0) / 1000,
      playback?.trial,
    )
  }
  function seekLine(index: number) {
    const range = lineRange(index)
    setLineIndex(index)
    if (!audio.current || !playback || !range.available) {
      setLoop(false)
      return
    }
    updateElapsed()
    audio.current.currentTime = range.start
    setCurrent(range.start)
  }
  function trackTime() {
    const media = audio.current
    if (!media || !playback) return
    updateElapsed()
    const lower = playback.trial?.start ?? 0,
      upper = playback.trial?.end ?? Infinity
    if (media.currentTime < lower) media.currentTime = lower
    if (media.currentTime >= upper) {
      media.pause()
      media.currentTime = lower
      finishReport('playend')
    }
    const range = lineRange(lineIndex)
    if (loop && range.available && media.currentTime >= range.end)
      media.currentTime = range.start
    setCurrent(media.currentTime)
    if (!loop) {
      let found = 0
      lines.forEach((line, i) => {
        if (line.time <= media.currentTime) found = i
      })
      setLineIndex(found)
    }
  }
  const focused = lines[lineIndex]
  const range = lineRange(lineIndex)

  const candidates = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line, index }) => line.text && lineRange(index).available)
  const previous = candidates
    .filter(({ index }) => index < lineIndex)
    .at(-1)?.index
  const next = candidates.find(({ index }) => index > lineIndex)?.index
  async function togglePlay() {
    const media = audio.current
    if (!media || !playback) return
    if (!media.paused) {
      media.pause()
      return
    }
    try {
      await media.play()
    } catch {
      setError('暂时无法播放，请重试或重新选择这首歌。')
    }
  }
  function seekCurrent(value: number) {
    if (!audio.current || !mediaReady) return
    updateElapsed()
    audio.current.currentTime = Math.max(
      playback?.trial?.start ?? 0,
      Math.min(value, playback?.trial?.end ?? mediaDuration),
    )
    trackTime()
  }
  const mediaProps = {
    ref: audio,
    src: playback?.url,
    onLoadedMetadata: () => {
      const media = audio.current
      if (!media || !playback || !selected) return
      media.currentTime = playback.trial?.start ?? 0
      media.playbackRate = rate
      media.volume = volume
      setMediaDuration(
        Number.isFinite(media.duration)
          ? media.duration
          : selected.duration / 1000,
      )
      setCurrent(media.currentTime)
      setMediaReady(true)
    },
    onTimeUpdate: trackTime,
    onSeeking: () => {
      updateElapsed()
      trackTime()
    },
    onRateChange: () => {
      if (!audio.current) return
      updateRate(audio.current.playbackRate)
      setRate(audio.current.playbackRate)
    },
    onPlay: () => {
      if (!playback) return
      if (Date.now() >= playback.expires) {
        audio.current?.pause()
        setError('播放地址已过期，请重新选择这首歌。')
        return
      }
      if (audio.current) announceAudio(audio.current)
      slot.activate()
      setPlaying(true)
    },
    onPlaying: () => {
      setPlaying(true)
      setBuffering(false)
      if (playback?.source === 'official' && selected) startReport(selected.id)
    },
    onWaiting: () => {
      setBuffering(true)
      suspendReport()
    },
    onPause: () => {
      setPlaying(false)
      setBuffering(false)
      suspendReport()
    },
    onEnded: () => {
      setPlaying(false)
      setBuffering(false)
      finishReport('playend')
    },
    onError: () => {
      setMediaReady(false)
      setPlaying(false)
      setBuffering(false)
      finishReport('exception')
      setError('音频加载失败或地址已过期，请重新选择歌曲。')
    },
    preload: 'metadata',
    className: 'hidden',
  } satisfies ComponentPropsWithRef<'audio'>
  const playerProps = {
    title: selected?.name,
    subtitle: selected?.artists,
    cover: selected?.cover,
    current,
    duration: mediaDuration || (selected?.duration || 0) / 1000,
    lower: playback?.trial?.start,
    upper: playback?.trial?.end,
    playing,
    loading: buffering,
    disabled: !playback || !mediaReady,
    loop,
    loopDisabled: !focused?.text || !range.available,
    rate,
    volume,
    onToggle: () => void togglePlay(),
    onSeek: seekCurrent,
    onRate: (value) => {
      updateElapsed()
      setRate(value)
    },
    onVolume: setVolume,
    onLoop: () => {
      setLoop(!loop)
      seekLine(lineIndex)
    },
    previousDisabled: previous === undefined,
    nextDisabled: next === undefined,
    onPrevious: () => {
      if (previous !== undefined) seekLine(previous)
    },
    onNext: () => {
      if (next !== undefined) seekLine(next)
    },
  } satisfies PlayerControlsProps

  function changeAccountOpen(open: boolean) {
    setAccountOpen(open)
    if (!open) account.cancelQr()
  }
  return {
    slot,
    account,
    accountOpen,
    changeAccountOpen,
    mobileView,
    setMobileView,
    busy,
    query,
    setQuery,
    searched,
    songs,
    total,
    offset,
    selected,
    playing,
    playback,
    lines,
    lineIndex,
    showRomaji,
    showTranslation,
    setShowRomaji,
    setShowTranslation,
    loop,
    error,
    notice,
    search,
    selectSong,
    seekLine,
    lineRange,
    mediaProps,
    playerProps,
  }
}
