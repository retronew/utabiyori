declare module 'signalsmith-stretch' {
  interface StretchSchedule {
    output: number
    outputTime: number
    input?: number
    active?: boolean
    rate?: number
    semitones?: number
    loopStart?: number
    loopEnd?: number
  }
  interface StretchNode extends AudioWorkletNode {
    configure(options: { preset: 'default' }): Promise<void>
    latency(): Promise<number>
    addBuffers(
      buffers: Float32Array[],
      transfer: ArrayBuffer[],
    ): Promise<number>
    schedule(options: StretchSchedule): Promise<void>
  }
  interface StretchFactory {
    (
      context: AudioContext,
      options: AudioWorkletNodeOptions,
    ): Promise<StretchNode>
    moduleUrl?: string
  }
  const factory: StretchFactory
  export default factory
}
