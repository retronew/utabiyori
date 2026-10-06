import { LyricPlayer } from '@applemusic-like-lyrics/core'

export class MediaClockLyricPlayer extends LyricPlayer {
  // AMLL's CSS mask path reads the supplied media clock, including slow playback.
  override supportMaskImage = false

  // Keep LRC as one timed phrase, but allow its approximate gradient mask.
  protected override get isNonDynamic() {
    return false
  }

  override rebuildLyricView(initialTime?: number) {
    super.rebuildLyricView(initialTime)
    // Bind detached lines too: AMLL virtualizes the visible DOM while scrolling.
    for (const group of this.currentLyricGroups) {
      for (const row of [group.mainLine, group.bgLine]) {
        if (!row) continue
        const line = row.getLine()
        const duration = Math.max(1, line.endTime - line.startTime)
        row
          .getElement()
          .style.setProperty(
            '--aux-progress',
            `clamp(0%, calc((var(--amll-player-time, 0) - ${line.startTime}) / ${duration} * 100%), 100%)`,
          )
      }
    }
  }
}
