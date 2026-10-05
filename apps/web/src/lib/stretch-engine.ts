import type factory from 'signalsmith-stretch'
import {
  assertAudioMemory,
  maxEncodedBytes,
  sourceTime,
} from '#lib/audio-clock'
import type { AudioRange } from '#lib/audio-clock'

type StretchNode = Awaited<ReturnType<typeof factory>>

async function readAudio(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal, mode: 'cors' })
  if (!response.ok || !response.body)
    throw new Error('音频不支持 DSP 读取，已改用原生播放。')
  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let size = 0
  try {
    if (Number(response.headers.get('content-length')) > maxEncodedBytes) {
      throw new Error('音频文件较大，已改用原生播放以减少内存占用。')
    }
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxEncodedBytes)
        throw new Error('音频文件较大，已改用原生播放以减少内存占用。')
      chunks.push(value)
    }
    const data = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      data.set(chunk, offset)
      offset += chunk.length
    }
    return data.buffer
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

export class StretchEngine {
  readonly context: AudioContext
  readonly bounds: AudioRange
  private node: StretchNode | null = null
  private gain: GainNode
  private position: number
  private anchor = 0
  private rate = 1
  private loop: AudioRange | null = null
  private active = false
  private disposed = false
  private latency = 0
  private heard = 0
  private heardAnchor = 0

  constructor(
    bounds: AudioRange,
    onFailure: () => void,
    onInterrupted: () => void,
  ) {
    // Create/resume on the play gesture, before fetching or importing WASM.
    this.context = new AudioContext()
    this.bounds = bounds
    this.position = bounds.start
    this.gain = this.context.createGain()
    this.gain.connect(this.context.destination)
    this.context.onstatechange = () => {
      if (this.active && this.context.state !== 'running') onInterrupted()
    }
    this.onFailure = onFailure
  }

  private onFailure: () => void

  async load(url: string, signal: AbortSignal, duration: number) {
    assertAudioMemory(duration, this.context.sampleRate, 2)
    const resume = this.context.resume()
    try {
      const [encoded, { default: create }, { default: workletUrl }] =
        await Promise.all([
          readAudio(url, signal),
          import('signalsmith-stretch'),
          import('signalsmith-stretch?url'),
          resume,
        ])
      signal.throwIfAborted()
      const decoded = await this.context.decodeAudioData(encoded)
      signal.throwIfAborted()
      if (this.disposed) throw new DOMException('Disposed', 'AbortError')
      assertAudioMemory(
        decoded.duration,
        decoded.sampleRate,
        decoded.numberOfChannels,
      )
      create.moduleUrl = workletUrl
      const node = await create(this.context, {
        // Keep an unconnected input: v1.3.2's idle branch expects inputList[0].
        // Feeding a live source would bypass buffer-based time stretching.
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [decoded.numberOfChannels],
      })
      if (this.disposed || signal.aborted) {
        node.disconnect()
        throw new DOMException('Disposed', 'AbortError')
      }
      this.node = node
      node.onprocessorerror = this.onFailure
      await node.configure({ preset: 'default' })
      const start = Math.ceil(this.bounds.start * decoded.sampleRate)
      const end = Math.min(
        decoded.length,
        Math.floor(this.bounds.end * decoded.sampleRate),
      )
      if (end <= start)
        throw new Error('此播放片段无法进行 DSP 处理，已改用原生播放。')
      // Transfer only the authorised region. Samples outside a trial never reach the worklet.
      const channels = Array.from(
        { length: decoded.numberOfChannels },
        (_, i) => decoded.getChannelData(i).slice(start, end),
      )
      await node.addBuffers(
        channels,
        channels.map((channel) => channel.buffer),
      )
      this.latency = await node.latency()
      signal.throwIfAborted()
      node.connect(this.gain)
    } catch (error) {
      this.dispose()
      throw error
    }
  }

  get currentTime() {
    return sourceTime(
      this.position,
      this.active ? this.context.currentTime - this.anchor : 0,
      this.rate,
      this.bounds,
      this.loop,
    )
  }

  get paused() {
    return !this.active
  }

  get playedSeconds() {
    if (!this.active) return this.heard
    const advance =
      Math.max(0, this.context.currentTime - this.heardAnchor) * this.rate
    return (
      this.heard +
      (this.loop ? advance : Math.min(advance, this.bounds.end - this.position))
    )
  }

  async play() {
    await this.context.resume()
    if (this.disposed) throw new DOMException('Disposed', 'AbortError')
    this.active = true
    this.schedule()
  }

  pause() {
    this.heard = this.playedSeconds
    this.position = this.currentTime
    this.active = false
    this.schedule()
    // Leave the context running briefly so the worklet can render its fade-out.
    this.suspendLater()
  }

  private suspendTimer: ReturnType<typeof setTimeout> | undefined
  private suspendLater() {
    clearTimeout(this.suspendTimer)
    this.suspendTimer = setTimeout(() => {
      if (!this.active && !this.disposed)
        void this.context.suspend().catch(() => {})
    }, 100)
  }

  seek(position: number) {
    this.heard = this.playedSeconds
    this.position = Math.max(
      this.bounds.start,
      Math.min(position, this.bounds.end),
    )
    this.schedule()
  }

  setRate(rate: number) {
    this.heard = this.playedSeconds
    this.position = this.currentTime
    this.rate = rate
    this.schedule()
  }

  setVolume(volume: number) {
    this.gain.gain.setTargetAtTime(volume, this.context.currentTime, 0.01)
  }

  setLoop(loop: AudioRange | null) {
    this.heard = this.playedSeconds
    this.position = this.currentTime
    this.loop = loop
    if (loop && (this.position < loop.start || this.position >= loop.end))
      this.position = loop.start
    this.schedule()
  }

  private schedule() {
    if (!this.node || this.disposed) return
    // The worklet schedules audible output, with input/output look-ahead handled internally.
    const output =
      this.context.currentTime + (this.active ? this.latency + 0.01 : 0)
    this.anchor = output
    this.heardAnchor = output
    const offset = this.bounds.start
    // v1.3.2 uses outputTime to replace future segments and output to place them.
    void this.node
      .schedule({
        output,
        outputTime: output,
        input: this.position - offset,
        active: this.active,
        rate: this.rate,
        semitones: 0,
        loopStart: this.loop ? this.loop.start - offset : 0,
        loopEnd: this.loop ? this.loop.end - offset : 0,
      })
      .catch(this.onFailure)
    // Do not enqueue a future stop: v1.3.2's schedule() also advances its current
    // segment to outputTime. Beyond the clipped buffer it renders silence;
    // the transport stops at the end using the audible source clock.
  }

  dispose() {
    this.disposed = true
    this.active = false
    clearTimeout(this.suspendTimer)
    this.context.onstatechange = null
    if (this.node) this.node.onprocessorerror = null
    this.node?.disconnect()
    this.node?.port.close()
    this.gain.disconnect()
    void this.context.close().catch(() => {})
  }
}
