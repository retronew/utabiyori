import { useEffect, useRef, useState } from 'react'
import { validLoop } from '@jp-learn/shared'

export default function AudioPractice() {
  const audio = useRef<HTMLAudioElement>(null)
  const [source, setSource] = useState('')
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [loop, setLoop] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState('')
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
  const isValid = validLoop(start, end, duration)
  async function playLoop() {
    if (!audio.current || !isValid) return
    audio.current.currentTime = start
    try {
      await audio.current.play()
      setLoop(true)
      setError('')
    } catch {
      setError('音频暂时无法播放，请重新选择文件。')
    }
  }
  return (
    <section className="audio-panel" aria-labelledby="audio-heading">
      <div className="section-label">
        <span className="mini-icon">♫</span>
        <h3 id="audio-heading">用你的歌曲练习</h3>
      </div>
      <p>选择本地音频，找到喜欢的一句，放慢、循环、跟唱。</p>
      <label className="upload">
        ＋ {name || '选择音频文件'}
        <input
          type="file"
          accept="audio/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            audio.current?.pause()
            setSource(URL.createObjectURL(file))
            setName(file.name)
            setDuration(0)
            setStart(0)
            setEnd(0)
            setLoop(false)
            setError('')
            event.target.value = ''
          }}
        />
      </label>
      {source && (
        <>
          <audio
            ref={audio}
            src={source}
            controls
            onLoadedMetadata={() => {
              const value = audio.current?.duration || 0
              setDuration(value)
              setEnd(Number.isFinite(value) ? value : 0)
              if (audio.current) audio.current.playbackRate = speed
            }}
            onError={() =>
              setError('浏览器无法解码此音频，请尝试 MP3 或 WAV 文件。')
            }
            onTimeUpdate={() => {
              if (
                loop &&
                isValid &&
                audio.current &&
                audio.current.currentTime >= end
              )
                audio.current.currentTime = start
            }}
            onEnded={() => {
              if (loop && isValid) void playLoop()
            }}
          />
          <div className="audio-settings">
            <label>
              速度
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value="0.6">0.6×</option>
                <option value="0.8">0.8×</option>
                <option value="1">1.0×</option>
              </select>
            </label>
            <label>
              起点 / 秒
              <input
                type="number"
                min="0"
                max={duration}
                step="0.1"
                value={start}
                onChange={(e) => {
                  setStart(Number(e.target.value))
                  setLoop(false)
                }}
              />
            </label>
            <label>
              终点 / 秒
              <input
                type="number"
                min="0"
                max={duration}
                step="0.1"
                value={end}
                onChange={(e) => {
                  setEnd(Number(e.target.value))
                  setLoop(false)
                }}
              />
            </label>
          </div>
          <div className="loop-actions">
            <button
              disabled={!isValid}
              aria-pressed={loop}
              onClick={() => (loop ? setLoop(false) : void playLoop())}
            >
              {loop ? '停止循环' : '循环这个片段'}
            </button>
            <button
              disabled={!duration}
              onClick={() => {
                setStart(Number((audio.current?.currentTime || 0).toFixed(1)))
                setLoop(false)
              }}
            >
              设为起点
            </button>
            <button
              disabled={!duration}
              onClick={() => {
                setEnd(Number((audio.current?.currentTime || 0).toFixed(1)))
                setLoop(false)
              }}
            >
              设为终点
            </button>
          </div>
          {!isValid && duration > 0 && (
            <p role="status">终点需要大于起点，并且在音频时长内。</p>
          )}
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <small>音频仅在本机播放，不会上传；刷新后需重新选择。</small>
    </section>
  )
}
