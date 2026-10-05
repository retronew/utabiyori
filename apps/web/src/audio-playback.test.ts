import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assertAudioMemory, sourceTime } from '#lib/audio-clock'
import { AudioTransport } from '#lib/audio-transport'
import type { StretchPlayback } from '#lib/audio-transport'
import type { AudioRange } from '#lib/audio-clock'

test('audible clock preserves source timestamps across rates, look-ahead and multiple loop wraps', () => {
  const bounds = { start: 30, end: 60 }
  assert.equal(sourceTime(30, -0.12, 0.6, bounds, null), 30)
  assert.equal(sourceTime(30, 10, 0.6, bounds, null), 36)
  assert.equal(sourceTime(30, 10, 0.75, bounds, null), 37.5)
  assert.equal(sourceTime(30, 10, 0.9, bounds, null), 39)
  assert.equal(sourceTime(58, 10, 1, bounds, null), 60)
  assert.equal(sourceTime(32, 100, 0.75, bounds, { start: 32, end: 36 }), 35)
  assert.equal(sourceTime(35, 2, 0.6, bounds, { start: 32, end: 36 }), 32.2)
})

test('decoded memory budget admits ordinary stereo songs and rejects long or multichannel files', () => {
  assert.doesNotThrow(() => assertAudioMemory(231.14, 48000, 2))
  assert.throws(() => assertAudioMemory(600, 48000, 2), /原生播放/)
  assert.throws(() => assertAudioMemory(231.14, 48000, 8), /原生播放/)
  assert.throws(() => assertAudioMemory(Infinity, 48000, 2), /原生播放/)
})

class NativeMedia extends EventTarget {
  duration = 100
  currentTime = 0
  playbackRate = 1
  volume = 0.7
  preservesPitch = false
  paused = true
  plays = 0
  async play() {
    this.paused = false
    this.plays++
    this.dispatchEvent(new Event('play'))
    this.dispatchEvent(new Event('playing'))
  }
  pause() {
    if (this.paused) return
    this.paused = true
    this.dispatchEvent(new Event('pause'))
  }
}

class TestStretch implements StretchPlayback {
  bounds: AudioRange
  currentTime = 0
  paused = true
  playedSeconds = 0
  disposed = false
  starts = 0
  load: () => Promise<void> = async () => {}
  constructor(bounds: AudioRange) {
    this.bounds = bounds
  }
  async play() {
    this.paused = false
    this.starts++
  }
  pause() {
    this.paused = true
  }
  seek(position: number) {
    this.currentTime = position
  }
  setRate() {}
  setVolume() {}
  loop: AudioRange | null = null
  setLoop(loop: AudioRange | null) {
    this.loop = loop
  }
  dispose() {
    this.disposed = true
    this.paused = true
  }
}

function setup(load?: () => Promise<void>) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      AudioContext: class {},
      AudioWorkletNode: class {},
      isSecureContext: true,
    },
  })
  const native = new NativeMedia()
  const engines: TestStretch[] = []
  const transport = new AudioTransport((bounds) => {
    const engine = new TestStretch(bounds)
    if (load) engine.load = load
    engines.push(engine)
    return engine
  })
  transport.attach(native as unknown as HTMLAudioElement)
  transport.setSource('test:authorised-track', null)
  return { transport, native, engines }
}

test('pausing while DSP loads cancels late playback and disposes its resources', async () => {
  let finish: () => void = () => {}
  const { transport, native, engines } = setup(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      }),
  )
  const loading = transport.play()
  assert.equal(transport.loading, true)
  transport.pause()
  finish()
  await loading
  assert.equal(transport.paused, true)
  assert.equal(engines[0]!.starts, 0)
  assert.equal(engines[0]!.disposed, true)
  assert.equal(native.plays, 0)
  transport.dispose()
})

test('replacing a source invalidates an old DSP request even if it resolves after the new one', async () => {
  let finish: () => void = () => {}
  const { transport, native, engines } = setup(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      }),
  )
  const old = transport.play()
  transport.setSource('test:new-track', { start: 20, end: 40 })
  finish()
  await old
  assert.equal(engines[0]!.disposed, true)
  assert.equal(native.plays, 0)
  assert.equal(transport.paused, true)
  transport.dispose()
})

test('DSP failure visibly falls back to native at the selected position with pitch preserved', async () => {
  const { transport, native } = setup(async () => {
    throw new TypeError('CORS')
  })
  let notice = ''
  transport.bind({}, (state) => {
    notice = state.qualityNotice
  })
  transport.currentTime = 24
  transport.playbackRate = 0.6
  await transport.play()
  assert.equal(native.plays, 1)
  assert.equal(native.currentTime, 24)
  assert.equal(native.playbackRate, 0.6)
  assert.equal(native.preservesPitch, true)
  assert.match(notice, /已改用原生播放/)
  transport.dispose()
})

test('expiry guard can cancel play before any DSP fetch or native playback', async () => {
  const { transport, native, engines } = setup()
  transport.bind({ onPlay: () => transport.pause() }, () => {})
  await transport.play()
  assert.equal(engines.length, 0)
  assert.equal(native.plays, 0)
  assert.equal(transport.paused, true)
  transport.dispose()
})

test('quality switch preserves source position and elapsed media time excludes seeks', async () => {
  const { transport, native, engines } = setup()
  await transport.play()
  engines[0]!.playedSeconds = 3.5
  transport.playbackRate = 0.75
  transport.currentTime = 90
  assert.equal(transport.playedSeconds, 3.5)
  await transport.setQuality('native')
  assert.equal(native.currentTime, 90)
  assert.equal(native.paused, false)
  assert.equal(native.playbackRate, 0.75)
  assert.equal(engines[0]!.disposed, true)
  assert.ok(transport.playedSeconds >= 3.5 && transport.playedSeconds < 3.6)
  transport.dispose()
})

test('exclusive playback releases decoded DSP buffers without losing the paused position', async () => {
  const { transport, native, engines } = setup()
  await transport.play()
  engines[0]!.currentTime = 12
  engines[0]!.playedSeconds = 5
  transport.deactivate()
  assert.equal(engines[0]!.disposed, true)
  assert.equal(native.currentTime, 12)
  assert.equal(transport.paused, true)
  assert.equal(transport.playedSeconds, 5)
  transport.dispose()
})

test('native loops poll boundaries without waiting for infrequent media timeupdate events', async () => {
  const { transport, native } = setup()
  await transport.setQuality('native')
  let updates = 0
  transport.bind(
    {
      onTimeUpdate: () => {
        updates++
        if (transport.currentTime >= 31) transport.currentTime = 30
      },
    },
    () => {},
  )
  transport.setLoop({ start: 30, end: 31 })
  await transport.play()
  native.currentTime = 31.05
  await new Promise((resolve) => setTimeout(resolve, 120))
  assert.equal(native.currentTime, 30)
  assert.ok(updates > 0)
  transport.setLoop(null)
  const stopped = updates
  await new Promise((resolve) => setTimeout(resolve, 120))
  assert.equal(updates, stopped)
  transport.dispose()
})

test('DSP line changes apply the new loop before synchronous seek notifications', async () => {
  const { transport, engines } = setup()
  transport.setLoop({ start: 14, end: 20 })
  await transport.play()
  const engine = engines[0]!
  assert.deepEqual(engine.loop, { start: 14, end: 20 })
  let notified = false
  transport.bind(
    {
      onSeeking: () => {
        notified = true
        assert.equal(transport.currentTime, 6)
        assert.deepEqual(engine.loop, { start: 6, end: 10 })
      },
    },
    () => {},
  )
  transport.setLoop({ start: 6, end: 10 })
  transport.currentTime = 6
  assert.equal(notified, true)
  transport.setLoop(null)
  assert.equal(engine.loop, null)
  transport.dispose()
})
