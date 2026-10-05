import { LyricPlayer } from '@applemusic-like-lyrics/core'

export class MediaClockLyricPlayer extends LyricPlayer {
  // AMLL's CSS mask path reads the supplied media clock, including slow playback.
  override supportMaskImage = false

  // Keep LRC as one timed phrase, but allow its approximate gradient mask.
  protected override get isNonDynamic() {
    return false
  }
}
