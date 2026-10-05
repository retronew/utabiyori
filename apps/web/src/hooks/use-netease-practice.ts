import { useEffect, useRef, useState } from 'react'
import { MUSIC_QUALITIES } from '@jp-learn/shared'
import type { MusicQuality } from '@jp-learn/shared'
import { mergeLyrics } from '#music'
import type { MusicSong, TimedLine, MusicPlayback, MusicLyrics } from '#music'
import type { PlayerControlsProps } from '#components/PlayerControls'
import { usePlayerSlot } from '#hooks/use-player-slot'
import { useExclusiveAudio } from '#hooks/use-exclusive-audio'
import { useNeteaseAccount } from '#hooks/use-netease-account'
import { usePlaybackReport } from '#hooks/use-playback-report'
import { announceAudio } from '#lib/audio-events'
import { getLineRange, getPlaybackStep } from '#lib/music-playback'
import { AudioTransport } from '#lib/audio-transport'
import { useAudioPlayback } from '#hooks/use-audio-playback'
import { useMusicFavorites } from '#hooks/use-music-favorites'
import { resolveFavorite } from '#lib/music-favorites'
import type { FavoriteSong } from '#lib/music-favorites'

export function useNeteasePractice() {
  const favorites = useMusicFavorites()
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
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<MusicSong | null>(null)
  const [lines, setLines] = useState<TimedLine[]>([])
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [wordTiming, setWordTiming] = useState<MusicLyrics['wordTiming']>()
  const [playback, setPlayback] = useState<MusicPlayback | null>(null)
  const [streamQuality, setStreamQuality] = useState<MusicQuality>('standard')
  const [streamBusy, setStreamBusy] = useState(false)
  const resumeStream = useRef<{ time: number; playing: boolean } | null>(null)
  const playbackIntent = useRef(0)
  const [current, setCurrent] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)
  const [loop, setLoop] = useState(false)
  const [rate, setRate] = useState(1)
  const [showRomaji, setShowRomaji] = useState(true)
  const [showTranslation, setShowTranslation] = useState(true)
  const [transport] = useState(() => new AudioTransport())
  const audio = useRef(transport)
  useExclusiveAudio(audio, () => {
    resumeStream.current = null
    playbackIntent.current++
  })
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
      setLyricsLoading(false)
      setFavoriteBusy(false)
      setPlayback(null)
      setStreamBusy(false)
      resumeStream.current = null
      setLoop(false)
    },
    onWebConnected: () => {
      if (selected) void selectSong(selected)
    },
  })
  const { requestMusic } = account
  const { updateElapsed, finishReport, startReport, suspendReport } =
    usePlaybackReport({ audio, request: requestMusic, onNotice: setNotice })
  const busy = searchBusy || favoriteBusy || account.busy
  useEffect(
    () => () => {
      activeRequest.current?.abort()
      searchRequest.current?.abort()
    },
    [],
  )
  async function search(keyword = query, start = 0) {
    if (!keyword.trim()) return
    searchRequest.current?.abort()
    const controller = new AbortController()
    searchRequest.current = controller
    const version = ++searchVersion.current
    setSearchBusy(true)
    setSearchError('')
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
        setSearchError(
          e instanceof Error ? e.message : '搜索失败，请稍后重试。',
        )
    } finally {
      if (version === searchVersion.current) setSearchBusy(false)
    }
  }
  async function selectSong(song: MusicSong, autoPlay = true) {
    setStreamBusy(false)
    resumeStream.current = null
    setFavoriteBusy(false)
    finishReport()
    audio.current?.pause()
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    const version = ++requestVersion.current
    if (autoPlay) {
      announceAudio()
      slot.activate()
      resumeStream.current = { time: 0, playing: true }
    }
    setMobileView('lyrics')
    setMediaReady(false)
    setMediaDuration(0)
    setBuffering(false)
    setPlaying(false)
    setSelected(song)
    setLines([])
    setLyricsLoading(true)
    setWordTiming(undefined)
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
        {
          action: 'playback',
          songId: song.id,
          ticket: song.ticket,
          quality: streamQuality,
        },
        controller.signal,
      ),
    ])
    if (version !== requestVersion.current || controller.signal.aborted) return
    setLyricsLoading(false)
    const [lyric, stream] = results
    if (lyric.status === 'fulfilled') {
      const data = lyric.value
      setWordTiming(data.wordTiming)
      const merged = mergeLyrics(
        data.lyric,
        data.translation,
        data.romaji,
        data.wordLines,
        data.wordTranslation,
      )
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
    else {
      resumeStream.current = null
      setError(
        stream.reason instanceof Error
          ? stream.reason.message
          : '播放地址获取失败。',
      )
    }
  }
  async function changeStreamQuality(value: MusicQuality) {
    if (value === streamQuality) return
    const previousQuality = streamQuality
    setStreamQuality(value)
    if (!selected || !playback) return
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    const version = ++requestVersion.current
    setStreamBusy(true)
    setError('')
    try {
      const nextPlayback = await requestMusic<MusicPlayback>(
        {
          action: 'playback',
          songId: selected.id,
          ticket: selected.ticket,
          quality: value,
        },
        controller.signal,
      )
      if (controller.signal.aborted || version !== requestVersion.current)
        return
      if (nextPlayback.url === playback.url) {
        setPlayback(nextPlayback)
        return
      }
      resumeStream.current = {
        time: audio.current.currentTime,
        playing: !audio.current.paused,
      }
      finishReport()
      audio.current.pause()
      setMediaReady(false)
      setPlayback(nextPlayback)
    } catch (e) {
      if (!controller.signal.aborted && version === requestVersion.current) {
        setStreamQuality(previousQuality)
        setError(e instanceof Error ? e.message : '切换网易云音质失败。')
      }
    } finally {
      if (version === requestVersion.current) setStreamBusy(false)
    }
  }
  async function selectFavorite(song: FavoriteSong) {
    if (!account.loggedIn) {
      setAccountOpen(true)
      return
    }
    finishReport()
    audio.current.pause()
    announceAudio()
    const intent = playbackIntent.current
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    const version = ++requestVersion.current
    setFavoriteBusy(true)
    setError('')
    setNotice('正在重新获取收藏歌曲的播放权限…')
    try {
      const fresh = await resolveFavorite(
        song,
        (keyword, offset, signal) =>
          requestMusic<{ songs: MusicSong[]; total: number }>(
            { action: 'search', keyword, offset },
            signal,
          ),
        controller.signal,
      )
      if (version !== requestVersion.current || controller.signal.aborted)
        return
      await selectSong(fresh, intent === playbackIntent.current)
    } catch (error) {
      if (version === requestVersion.current && !controller.signal.aborted)
        setError(
          error instanceof Error ? error.message : '收藏歌曲暂时无法打开。',
        )
    } finally {
      if (version === requestVersion.current) setFavoriteBusy(false)
    }
  }
  function lineRange(index: number) {
    return getLineRange(
      lines,
      index,
      mediaDuration || (selected?.duration || 0) / 1000,
      playback?.trial,
    )
  }
  function seekLine(index: number, repeat = loop) {
    const range = lineRange(index)
    setLineIndex(index)
    if (!audio.current || !playback || !range.available) {
      setLoop(false)
      return
    }
    updateElapsed()
    audio.current.setLoop(
      repeat ? { start: range.start, end: range.end } : null,
    )
    audio.current.currentTime = range.start
    setCurrent(range.start)
  }
  function trackTime() {
    const media = audio.current
    if (!media || !playback) return
    updateElapsed()
    const step = getPlaybackStep(
      media.currentTime,
      lineRange(lineIndex),
      loop,
      playback.trial,
    )
    if (step.ended) {
      media.pause()
      finishReport('playend')
    }
    if (media.currentTime !== step.position) media.currentTime = step.position
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
  const { mediaProps, qualityProps } = useAudioPlayback(
    audio,
    {
      onLoadedMetadata: () => {
        const media = audio.current
        if (!media || !playback || !selected) return
        const resume = resumeStream.current
        resumeStream.current = null
        media.currentTime = Math.max(
          playback.trial?.start ?? 0,
          Math.min(resume?.time ?? 0, playback.trial?.end ?? media.duration),
        )
        media.playbackRate = rate
        media.volume = volume
        setMediaDuration(
          Number.isFinite(media.duration)
            ? media.duration
            : selected.duration / 1000,
        )
        setCurrent(media.currentTime)
        setMediaReady(true)
        if (resume?.playing) {
          const version = requestVersion.current
          void media.play().catch(() => {
            if (version === requestVersion.current) {
              setPlaying(false)
              setBuffering(false)
              setError('未能自动播放，请点击播放重试。')
            }
          })
        }
      },
      onTimeUpdate: trackTime,
      onSeeking: () => {
        updateElapsed()
        // A DSP seek is synchronous; React has not committed the target line yet.
        setCurrent(audio.current.currentTime)
      },
      onRateChange: () => {
        if (!audio.current) return
        updateElapsed()
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
        if (playback?.source === 'official' && selected)
          startReport(selected.id)
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
        const media = audio.current
        const range = lineRange(lineIndex)
        if (loop && playback && range.available) {
          media.currentTime = range.start
          setCurrent(range.start)
          void media.play().catch(() => {
            setPlaying(false)
            setBuffering(false)
            setError('单句循环未能继续，请点击播放重试。')
          })
          return
        }
        setPlaying(false)
        setBuffering(false)
        finishReport('playend')
      },
      onError: () => {
        resumeStream.current = null
        setMediaReady(false)
        setPlaying(false)
        setBuffering(false)
        finishReport('exception')
        setError('音频加载失败或地址已过期，请重新选择歌曲。')
      },
    },
    {
      source: playback?.url ?? '',
      rate,
      volume,
      bounds: playback?.trial
        ? { start: playback.trial.start, end: playback.trial.end }
        : undefined,
      loop:
        loop && range.available ? { start: range.start, end: range.end } : null,
    },
  )
  const playerProps = {
    ...qualityProps,
    streamQuality,
    streamQualityDisabled: streamBusy || !playback,
    streamQualityNotice: playback
      ? `实际：${MUSIC_QUALITIES.find((item) => item.value === playback.quality)?.label ?? '供应商未标注'}${playback.quality && playback.quality !== streamQuality ? '（已降级）' : ''}${playback.codec ? ` · ${playback.codec}` : ''}${playback.bitrate ? ` · ${Math.round(playback.bitrate)} kbps` : ''}`
      : '',
    onStreamQualityChange: (value) => void changeStreamQuality(value),
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
      seekLine(lineIndex, !loop)
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
    searchError,
    ...favorites,
    selectFavorite,
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
    readPlaybackTime: () => audio.current.currentTime,
    wordTiming,
    lyricsLoading,
  }
}
