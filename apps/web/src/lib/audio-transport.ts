import type { AudioRange } from '#lib/audio-clock'
import { StretchEngine } from '#lib/stretch-engine'

export type PlaybackQuality = 'dsp' | 'native'
export type AudioEvent =
  | 'onLoadedMetadata'
  | 'onError'
  | 'onPlay'
  | 'onPlaying'
  | 'onWaiting'
  | 'onPause'
  | 'onTimeUpdate'
  | 'onEnded'
  | 'onSeeking'
  | 'onRateChange'
export type AudioHandlers = Partial<Record<AudioEvent, () => void>>
export interface AudioQualityState {
  quality: PlaybackQuality
  activeQuality: PlaybackQuality
  qualityNotice: string
}

export interface StretchPlayback {
  readonly bounds: AudioRange
  readonly currentTime: number
  readonly paused: boolean
  readonly playedSeconds: number
  load(url: string, signal: AbortSignal, duration: number): Promise<void>
  play(): Promise<void>
  pause(): void
  seek(position: number): void
  setRate(rate: number): void
  setVolume(volume: number): void
  setLoop(loop: AudioRange | null): void
  dispose(): void
}

type EngineFactory = (
  bounds: AudioRange,
  onFailure: () => void,
  onInterrupted: () => void,
) => StretchPlayback

export class AudioTransport {
  handlers: AudioHandlers = {}
  onQuality: (state: AudioQualityState) => void = () => {}
  private media: HTMLAudioElement | null = null
  private engine: StretchPlayback | null = null
  private controller: AbortController | null = null
  private version = 0
  private source = ''
  private bounds: AudioRange | null = null
  private loop: AudioRange | null = null
  private rate = 1
  private level = 0.7
  private position = 0
  private preference: PlaybackQuality = 'dsp'
  private fallback = ''
  private pending = false
  private timer: ReturnType<typeof setInterval> | undefined
  private removeEvents: () => void = () => {}
  private completedSeconds = 0
  private nativeSeconds = 0
  private nativeAnchor = 0
  private nativePlaying = false
  private nativeRate = 1

  private createEngine: EngineFactory

  constructor(
    createEngine: EngineFactory = (bounds, failed, interrupted) =>
      new StretchEngine(bounds, failed, interrupted),
  ) {
    this.createEngine = createEngine
  }

  get playedSeconds() {
    return (
      this.completedSeconds +
      (this.engine?.playedSeconds ?? this.nativeElapsed())
    )
  }

  private nativeElapsed() {
    return (
      this.nativeSeconds +
      (this.nativePlaying
        ? (Math.max(0, performance.now() - this.nativeAnchor) / 1000) *
          this.nativeRate
        : 0)
    )
  }

  private captureNative(playing = this.nativePlaying) {
    this.nativeSeconds = this.nativeElapsed()
    this.nativeAnchor = performance.now()
    this.nativePlaying = playing
    this.nativeRate = this.media?.playbackRate ?? this.rate
  }

  private releaseEngine() {
    if (!this.engine) return
    this.completedSeconds += this.engine.playedSeconds
    this.engine.dispose()
    this.engine = null
  }

  bind(handlers: AudioHandlers, onQuality: (state: AudioQualityState) => void) {
    this.handlers = handlers
    this.onQuality = onQuality
  }

  configure(options: {
    source: string
    bounds?: AudioRange
    rate: number
    volume: number
    loop: AudioRange | null
  }) {
    this.setSource(options.source, options.bounds ?? null)
    this.playbackRate = options.rate
    this.volume = options.volume
    this.setLoop(options.loop)
  }

  attach(media: HTMLAudioElement | null) {
    this.removeEvents()
    this.media = media
    if (!media) return
    media.preservesPitch = true
    media.playbackRate = this.rate
    media.volume = this.level
    const events = {
      loadedmetadata: 'onLoadedMetadata',
      error: 'onError',
      play: 'onPlay',
      playing: 'onPlaying',
      waiting: 'onWaiting',
      pause: 'onPause',
      timeupdate: 'onTimeUpdate',
      ended: 'onEnded',
      seeking: 'onSeeking',
      ratechange: 'onRateChange',
    } as const
    const listeners = Object.entries(events).map(([event, handler]) => {
      const listener = () => {
        if (this.engine || this.pending) return
        if (handler === 'onPlaying') {
          this.captureNative(true)
          this.startTimer()
        }
        if (
          handler === 'onPause' ||
          handler === 'onWaiting' ||
          handler === 'onEnded' ||
          handler === 'onError'
        ) {
          this.captureNative(false)
          clearInterval(this.timer)
        }
        if (handler === 'onRateChange') this.captureNative()
        if (handler === 'onLoadedMetadata')
          media.currentTime = this.bounds?.start ?? 0
        this.handlers[handler]?.()
      }
      media.addEventListener(event, listener)
      return () => media.removeEventListener(event, listener)
    })
    this.removeEvents = () => listeners.forEach((remove) => remove())
  }

  setSource(source: string, bounds: AudioRange | null) {
    if (
      source === this.source &&
      bounds?.start === this.bounds?.start &&
      bounds?.end === this.bounds?.end
    )
      return
    this.pause()
    this.releaseEngine()
    this.completedSeconds = this.nativeSeconds = 0
    this.source = source
    this.bounds = bounds
    this.position = bounds?.start ?? 0
    this.loop = null
    this.fallback = ''
    this.publish()
  }

  get paused() {
    return (
      !this.pending &&
      (this.engine ? this.engine.paused : (this.media?.paused ?? true))
    )
  }
  get loading() {
    return this.pending
  }
  get duration() {
    return this.media?.duration ?? 0
  }
  get currentTime() {
    return this.engine?.currentTime ?? this.media?.currentTime ?? this.position
  }
  set currentTime(value: number) {
    const upper =
      this.bounds?.end ??
      (Number.isFinite(this.duration) ? this.duration : value)
    this.position = Math.max(this.bounds?.start ?? 0, Math.min(value, upper))
    if (this.engine) {
      this.engine.seek(this.position)
      this.handlers.onSeeking?.()
    } else if (this.media) this.media.currentTime = this.position
  }
  get playbackRate() {
    return this.rate
  }
  set playbackRate(value: number) {
    if (this.media && this.media.playbackRate !== value)
      this.media.playbackRate = value
    if (value === this.rate) return
    this.rate = value
    if (this.engine) {
      this.engine.setRate(value)
      this.handlers.onRateChange?.()
    }
  }
  set volume(value: number) {
    this.level = value
    this.engine?.setVolume(value)
    if (this.media) this.media.volume = value
  }

  setLoop(loop: AudioRange | null) {
    if (loop?.start === this.loop?.start && loop?.end === this.loop?.end) return
    this.loop = loop
    this.engine?.setLoop(loop)
    if (!this.engine && !this.paused) this.startTimer()
  }

  private publish() {
    this.onQuality({
      quality: this.preference,
      activeQuality: this.engine ? 'dsp' : 'native',
      qualityNotice:
        this.fallback || (this.pending ? '正在准备保音高音频…' : ''),
    })
  }

  async setQuality(quality: PlaybackQuality) {
    if (quality === this.preference) return
    const playing = !this.paused
    const position = this.currentTime
    this.pause()
    this.releaseEngine()
    this.preference = quality
    this.fallback = ''
    this.currentTime = position
    this.publish()
    if (playing) await this.play()
  }

  async play() {
    if (!this.media || !this.source || !this.paused) return
    if (this.preference === 'native' || this.fallback) {
      await this.media.play()
      return
    }
    if (
      !window.AudioContext ||
      !window.AudioWorkletNode ||
      !window.isSecureContext
    ) {
      this.fallback = '此浏览器不支持高品质变速，已改用原生播放。'
      this.publish()
      await this.media.play()
      return
    }
    const version = ++this.version
    const controller = new AbortController()
    this.controller = controller
    this.position = this.currentTime
    if (this.position >= (this.bounds?.end ?? this.duration))
      this.position = this.bounds?.start ?? 0
    this.pending = true
    // Business guards (expiry/rights) may pause synchronously from onPlay.
    this.handlers.onPlay?.()
    if (version !== this.version) return
    this.handlers.onWaiting?.()
    this.publish()
    const timeout = setTimeout(
      () => controller.abort(new Error('DSP 加载超时，已改用原生播放。')),
      45000,
    )
    let prepared = this.engine
    try {
      if (!prepared) {
        const bounds = this.bounds ?? { start: 0, end: this.duration }
        prepared = this.createEngine(
          bounds,
          () => void this.failEngine(),
          () => this.pause(),
        )
        await Promise.race([
          prepared.load(this.source, controller.signal, this.duration),
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener(
              'abort',
              () => reject(controller.signal.reason),
              { once: true },
            )
          }),
        ])
      }
      if (version !== this.version || controller.signal.aborted) {
        if (prepared !== this.engine) prepared.dispose()
        return
      }
      this.completedSeconds += this.nativeSeconds
      this.nativeSeconds = 0
      this.engine = prepared
      prepared.setRate(this.rate)
      prepared.setVolume(this.level)
      prepared.setLoop(this.loop)
      prepared.seek(this.position)
      await prepared.play()
      if (version !== this.version) {
        prepared.pause()
        return
      }
      this.pending = false
      this.controller = null
      this.publish()
      this.handlers.onPlaying?.()
      this.startTimer()
    } catch (error) {
      if (version !== this.version) {
        if (prepared !== this.engine) prepared?.dispose()
        return
      }
      if (prepared !== this.engine) prepared?.dispose()
      this.releaseEngine()
      this.pending = false
      this.controller = null
      this.fallback =
        error instanceof Error && error.message.includes('已改用')
          ? error.message
          : 'DSP 音频读取或解码失败，已改用原生播放。'
      this.publish()
      this.media.currentTime = this.position
      await this.media.play()
    } finally {
      clearTimeout(timeout)
    }
  }

  private async failEngine() {
    if (!this.engine) return
    const playing = !this.paused
    const position = this.currentTime
    this.pause()
    this.releaseEngine()
    this.fallback = '高品质变速中断，已改用原生播放。'
    this.currentTime = position
    this.publish()
    if (playing) {
      try {
        await this.media?.play()
      } catch {
        this.handlers.onError?.()
      }
    }
  }

  pause() {
    const active = !this.paused
    this.version++
    this.controller?.abort()
    this.controller = null
    this.pending = false
    this.engine?.pause()
    this.captureNative(false)
    this.media?.pause()
    clearInterval(this.timer)
    if (active) this.handlers.onPause?.()
    this.publish()
  }

  private startTimer() {
    clearInterval(this.timer)
    if (!this.engine && !this.loop && !this.bounds) return
    this.timer = setInterval(() => {
      if (!this.engine) {
        if (this.nativePlaying && !this.media?.paused)
          this.handlers.onTimeUpdate?.()
        return
      }
      if (this.engine.paused) return
      if (!this.loop && this.currentTime >= this.engine.bounds.end) {
        this.pause()
        this.handlers.onTimeUpdate?.()
        this.handlers.onEnded?.()
      } else this.handlers.onTimeUpdate?.()
    }, 80)
  }

  deactivate() {
    const position = this.currentTime
    this.pause()
    this.releaseEngine()
    if (this.media && Number.isFinite(position))
      this.media.currentTime = position
    this.publish()
  }

  dispose() {
    this.pause()
    this.releaseEngine()
    this.removeEvents()
    this.media = null
  }
}
