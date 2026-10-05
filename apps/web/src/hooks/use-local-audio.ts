import { useEffect, useRef, useState } from 'react'
import type { ComponentPropsWithRef } from 'react'
import { validLoop } from '@jp-learn/shared'
import type { PlayerControlsProps } from '#components/PlayerControls'
import { usePlayerSlot } from '#hooks/use-player-slot'
import { useExclusiveAudio } from '#hooks/use-exclusive-audio'
import { announceAudio } from '#lib/audio-events'

export function useLocalAudio() {
  const slot = usePlayerSlot('local')
  const audio = useRef<HTMLAudioElement>(null)
  const [source, setSource] = useState('')
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [loop, setLoop] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [volume, setVolume] = useState(0.7)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState('')
  useExclusiveAudio(audio)
  useEffect(() => {
    const player = audio.current
    return () => {
      player?.pause()
      if (source) URL.revokeObjectURL(source)
    }
  }, [source])
  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed
  }, [speed, source])
  useEffect(() => {
    if (audio.current) audio.current.volume = volume
  }, [volume, source])
  const isValid = validLoop(start, end, duration)
  async function togglePlay() {
    if (!audio.current) return
    if (!audio.current.paused) {
      audio.current.pause()
      return
    }
    try {
      await audio.current.play()
      setError('')
    } catch {
      setError('音频暂时无法播放，请重新选择文件。')
    }
  }
  async function toggleLoop() {
    if (loop) {
      setLoop(false)
      return
    }
    if (!audio.current || !isValid) return
    audio.current.currentTime = start
    setCurrent(start)
    try {
      await audio.current.play()
      setLoop(true)
      setError('')
    } catch {
      setError('音频暂时无法播放，请重新选择文件。')
    }
  }
  function seek(value: number) {
    if (audio.current) {
      audio.current.currentTime = value
      setCurrent(value)
    }
  }

  function selectFile(file: File) {
    announceAudio()
    slot.activate()
    setSource(URL.createObjectURL(file))
    setName(file.name)
    setDuration(0)
    setCurrent(0)
    setStart(0)
    setEnd(0)
    setLoop(false)
    setPlaying(false)
    setBuffering(false)
    setError('')
  }
  const mediaProps = {
    ref: audio,
    src: source,
    onLoadedMetadata: () => {
      const media = audio.current
      if (!media) return
      const value = Number.isFinite(media.duration) ? media.duration : 0
      setDuration(value)
      setEnd(value)
      media.playbackRate = speed
      media.volume = volume
    },
    onError: () => {
      setPlaying(false)
      setBuffering(false)
      setDuration(0)
      setError('浏览器无法解码此音频，请尝试 MP3 或 WAV 文件。')
    },
    onPlay: () => {
      if (audio.current) announceAudio(audio.current)
      slot.activate()
      setPlaying(true)
    },
    onPlaying: () => {
      setPlaying(true)
      setBuffering(false)
    },
    onWaiting: () => setBuffering(true),
    onPause: () => {
      setPlaying(false)
      setBuffering(false)
    },
    onTimeUpdate: () => {
      const media = audio.current
      if (!media) return
      if (
        loop &&
        isValid &&
        (media.currentTime >= end || media.currentTime < start)
      )
        media.currentTime = start
      setCurrent(media.currentTime)
    },
    onEnded: () => {
      if (loop && isValid && audio.current) {
        audio.current.currentTime = start
        void audio.current.play().catch(() => {
          setPlaying(false)
          setError('片段无法继续播放，请重试。')
        })
      } else setPlaying(false)
    },
    className: 'hidden',
    preload: 'metadata',
  } satisfies ComponentPropsWithRef<'audio'>
  const playerProps = {
    title: name,
    current,
    duration,
    playing,
    loading: buffering,
    disabled: !duration,
    loop,
    loopDisabled: !isValid,
    loopLabel: loop ? '停止片段循环' : '循环片段',
    rate: speed,
    volume,
    onToggle: () => void togglePlay(),
    onSeek: seek,
    onRate: setSpeed,
    onVolume: setVolume,
    onLoop: () => void toggleLoop(),
    subtitle: '本地音频 · 片段练习',
  } satisfies PlayerControlsProps

  const loopEditorProps = {
    start,
    end,
    current,
    duration,
    loop,
    isValid,
    onStartChange: (value: number) => {
      setStart(value)
      setLoop(false)
    },
    onEndChange: (value: number) => {
      setEnd(value)
      setLoop(false)
    },
    onToggleLoop: () => void toggleLoop(),
  }
  return {
    slot,
    source,
    name,
    duration,
    error,
    selectFile,
    mediaProps,
    playerProps,
    loopEditorProps,
  }
}
