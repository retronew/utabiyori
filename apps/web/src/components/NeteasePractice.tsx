import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { mergeLyrics, musicRequest, MusicRequestError } from '../music'
import type { MusicSong, TimedLine } from '../music'
import './NeteasePractice.css'

interface Playback {
  url: string
  expires: number
  source: 'official' | 'web'
  trial?: { start: number; end: number }
}
interface Lyrics {
  lyric: string
  translation: string
  romaji: string
  pureMusic: boolean
  noLyric: boolean
}
const timeLabel = (time: number) =>
  `${Math.floor(time / 60)}:${Math.floor(time % 60)
    .toString()
    .padStart(2, '0')}`

export default function NeteasePractice() {
  const [ready, setReady] = useState<boolean | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [hybrid, setHybrid] = useState(false)
  const [webLoggedIn, setWebLoggedIn] = useState(false)
  const [query, setQuery] = useState('')
  const [songs, setSongs] = useState<MusicSong[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [searched, setSearched] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [qr, setQr] = useState<{
    image: string
    expires: number
    kind: 'official' | 'web'
  } | null>(null)
  const [qrStatus, setQrStatus] = useState('')
  const [selected, setSelected] = useState<MusicSong | null>(null)
  const [lines, setLines] = useState<TimedLine[]>([])
  const [playback, setPlayback] = useState<Playback | null>(null)
  const [current, setCurrent] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)
  const [loop, setLoop] = useState(false)
  const [rate, setRate] = useState(1)
  const [showRomaji, setShowRomaji] = useState(true)
  const [showTranslation, setShowTranslation] = useState(true)
  const audio = useRef<HTMLAudioElement>(null)
  const selectedSong = useRef<MusicSong | null>(null)
  const requestVersion = useRef(0)
  const qrVersion = useRef(0)
  const activeRequest = useRef<AbortController | null>(null)
  const report = useRef<{
    songId: string
    start: number
    seconds: number
    last: number
    playing: boolean
    rate: number
  } | null>(null)
  async function requestMusic<T>(
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    try {
      return await musicRequest<T>(body, signal)
    } catch (error) {
      if (error instanceof MusicRequestError && error.status === 401)
        setLoggedIn(false)
      if (error instanceof MusicRequestError && error.status === 403)
        void accountStatus().catch(() => {})
      throw error
    }
  }

  function accountStatus(signal?: AbortSignal) {
    return fetch('/api/netease', { signal }).then(async (response) => {
      const data = await response.json()
      setReady(Boolean(data.configured))
      setLoggedIn(Boolean(data.loggedIn))
      setHybrid(Boolean(data.hybrid))
      setWebLoggedIn(Boolean(data.webLoggedIn))
    })
  }
  function updateElapsed() {
    const media = audio.current,
      record = report.current
    if (!media || !record) return
    const now = performance.now()
    if (record.playing)
      record.seconds += Math.max(0, (now - record.last) / 1000) * record.rate
    record.last = now
  }
  function finishReport(end = 'ui') {
    updateElapsed()
    const record = report.current
    report.current = null
    if (record && record.seconds > 0)
      void requestMusic({
        action: 'report',
        songId: record.songId,
        event: 'play',
        start: record.start,
        seconds: record.seconds,
        end,
      }).catch(() => setNotice('播放记录回传未完成，稍后可重新选择歌曲。'))
  }
  useEffect(() => {
    const controller = new AbortController()
    void accountStatus(controller.signal).catch((e) => {
      if (e.name !== 'AbortError') setReady(false)
    })
    return () => {
      controller.abort()
      activeRequest.current?.abort()
    }
  }, [])
  useEffect(() => {
    if (!qr) return
    const controller = new AbortController()
    const version = qrVersion.current
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      if (Date.now() >= qr!.expires) {
        setQrStatus('二维码已过期，请重新生成。')
        return
      }
      try {
        const data = await requestMusic<{ status: number }>(
          { action: qr!.kind === 'web' ? 'webPoll' : 'poll' },
          controller.signal,
        )
        if (controller.signal.aborted || version !== qrVersion.current) return
        if (data.status === 803) {
          if (qr!.kind === 'web') setWebLoggedIn(true)
          else setLoggedIn(true)
          setQr(null)
          setError('')
          setNotice(
            qr!.kind === 'web'
              ? '网页播放账号已连接，将使用该账号的会员和购买权限。'
              : '网易云登录成功，开始找一首喜欢的日语歌吧。',
          )
          if (qr!.kind === 'web' && selectedSong.current)
            void selectSong(selectedSong.current)
          return
        }
        if (data.status === 800) {
          setQrStatus('二维码已过期，请重新生成。')
          return
        }
        if (data.status === 804) {
          setQrStatus('登录暂时未完成，请重新生成二维码。')
          return
        }
        setQrStatus(
          data.status === 802
            ? '已扫码，请在网易云 App 中确认。'
            : '使用网易云音乐 App 扫码授权。',
        )
        timer = setTimeout(poll, 3000)
      } catch (e) {
        if (!controller.signal.aborted)
          setQrStatus(
            e instanceof Error ? e.message : '登录查询失败，请重新生成二维码。',
          )
      }
    }
    timer = setTimeout(poll, 3000)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [qr])
  useEffect(() => {
    const media = audio.current
    if (media) media.playbackRate = rate
  }, [rate, playback])
  useEffect(() => {
    const onHide = () => {
      updateElapsed()
      const record = report.current
      if (record) {
        void fetch('/api/netease', {
          method: 'POST',
          keepalive: true,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'report',
            songId: record.songId,
            event: 'play',
            start: record.start,
            seconds: record.seconds,
            end: 'interrupt',
          }),
        })
        report.current = null
      }
    }
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      finishReport()
    }
  }, [])

  async function login(kind: 'official' | 'web' = 'official') {
    const version = ++qrVersion.current
    setBusy(true)
    setError('')
    setQr(null)
    setQrStatus('')
    try {
      const data = await requestMusic<{ url: string; expires: number }>({
        action: kind === 'web' ? 'webQr' : 'qr',
      })
      const image = await QRCode.toDataURL(data.url, { width: 208, margin: 2 })
      if (version === qrVersion.current) {
        setQr({ image, expires: data.expires, kind })
        setQrStatus('使用网易云音乐 App 扫码授权。')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '二维码生成失败。')
    } finally {
      setBusy(false)
    }
  }
  async function logout() {
    setBusy(true)
    setError('')
    finishReport()
    audio.current?.pause()
    setPlayback(null)
    setLoop(false)
    try {
      await requestMusic({ action: 'logout' })
      setLoggedIn(false)
      setWebLoggedIn(false)
      setQr(null)
      setNotice('已退出网易云。')
    } catch (e) {
      setError(e instanceof Error ? e.message : '退出失败。')
    } finally {
      setBusy(false)
    }
  }
  async function disconnectWeb() {
    setBusy(true)
    setError('')
    finishReport()
    audio.current?.pause()
    setPlayback(null)
    setLoop(false)
    qrVersion.current++
    setQr(null)
    try {
      await requestMusic({ action: 'webLogout' })
      setWebLoggedIn(false)
      setNotice('已断开当前浏览器的网页播放账号。')
    } catch (e) {
      setError(e instanceof Error ? e.message : '断开失败。')
    } finally {
      setBusy(false)
    }
  }
  async function search(keyword = query, start = 0) {
    if (!keyword.trim()) return
    setBusy(true)
    setError('')
    try {
      const result = await requestMusic<{ songs: MusicSong[]; total: number }>({
        action: 'search',
        keyword: keyword.trim(),
        offset: start,
      })
      setSongs(result.songs)
      setTotal(result.total)
      setOffset(start)
      setSearched(keyword.trim())
    } catch (e) {
      setError(e instanceof Error ? e.message : '搜索失败。')
    } finally {
      setBusy(false)
    }
  }
  async function selectSong(song: MusicSong) {
    finishReport()
    audio.current?.pause()
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    const version = ++requestVersion.current
    setSelected(song)
    selectedSong.current = song
    setLines([])
    setPlayback(null)
    setCurrent(0)
    setLineIndex(0)
    setLoop(false)
    setError('')
    setNotice('正在获取歌词和播放权限…')
    const results = await Promise.allSettled([
      requestMusic<Lyrics>(
        { action: 'lyrics', songId: song.id },
        controller.signal,
      ),
      requestMusic<Playback>(
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
    const start = lines[index]?.time ?? 0
    const next =
      lines.find((line, i) => i > index && line.time > start)?.time ??
      (selected?.duration || 0) / 1000
    const lower = playback?.trial?.start ?? 0,
      upper = playback?.trial?.end ?? (selected?.duration || 0) / 1000
    return {
      start: Math.max(start, lower),
      end: Math.min(next, upper),
      available: start >= lower && start < upper && next > start,
    }
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
  return (
    <section className="netease-practice">
      <div className="music-heading">
        <div>
          <div className="eyebrow">YOUR MUSIC, YOUR PRACTICE</div>
          <h1>把喜欢的歌，唱成自己的日语。</h1>
          <p>搜索网易云曲库，听一句、唱一句，按自己的节奏练习。</p>
        </div>
        <span className="music-source">网易云音乐</span>
      </div>
      <div className="music-account">
        <div>
          <strong>{loggedIn ? '网易云已连接' : '连接你的网易云音乐'}</strong>
          <p>
            {loggedIn
              ? hybrid
                ? webLoggedIn
                  ? '曲库和网页播放账号已连接，音频按网页登录账号的会员、购买记录和版权获取。'
                  : '官方曲库已连接。连接网页播放账号后，备用音频可使用该账号的会员或购买权限。'
                : '播放范围由你的会员、购买记录和歌曲版权决定。'
              : '使用网易云 App 扫码登录，访问歌曲和播放权限。'}
          </p>
        </div>
        <button
          className={loggedIn ? 'secondary' : 'primary'}
          disabled={busy || ready !== true}
          onClick={() => void (loggedIn ? logout() : login())}
        >
          {loggedIn ? '退出登录' : qr ? '重新生成二维码' : '扫码登录'}
        </button>
      </div>
      {hybrid && loggedIn && (
        <div className="music-account">
          <div>
            <strong>
              {webLoggedIn ? '网页播放已连接' : '连接网页播放账号'}
            </strong>
            <p>
              {webLoggedIn
                ? '登录信息仅保存在当前浏览器的加密会话中。部分歌曲仍可能受地区和版权限制。'
                : '再用网易云 App 扫码一次，按你自己的账号权限播放。登录不会让账号没有权限的歌曲变为可播放。'}
            </p>
          </div>
          <button
            className={webLoggedIn ? 'secondary' : 'primary'}
            disabled={busy || ready !== true}
            onClick={() => void (webLoggedIn ? disconnectWeb() : login('web'))}
          >
            {webLoggedIn ? '断开网页播放' : '扫码连接网页播放'}
          </button>
        </div>
      )}
      {ready === null && <p role="status">正在检查网易云连接…</p>}
      {ready === false && (
        <p role="alert" className="music-error">
          网易云服务暂时不可用，请联系应用维护者检查配置。
        </p>
      )}
      {qr && (
        <div className="music-qr">
          <img
            src={qr.image}
            width="208"
            height="208"
            alt={
              qr.kind === 'web'
                ? '网易云网页播放登录二维码'
                : '网易云音乐登录二维码'
            }
          />
          <div>
            <h3>
              {qr.kind === 'web' ? '连接网页播放账号' : '用网易云 App 扫一扫'}
            </h3>
            <p role="status">{qrStatus}</p>
            <small>有效期 5 分钟。授权仅用于当前浏览器。</small>
            <button
              className="secondary"
              onClick={() => {
                qrVersion.current++
                setQr(null)
              }}
            >
              关闭二维码
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="music-error">
          {error}
        </p>
      )}
      <form
        className="music-search"
        onSubmit={(e) => {
          e.preventDefault()
          void search()
        }}
      >
        <label htmlFor="music-query">找一首想学的日语歌</label>
        <div>
          <input
            id="music-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="歌曲名或歌手，例如 宇多田ヒカル"
            maxLength={100}
          />
          <button
            className="primary"
            disabled={busy || !loggedIn || !query.trim()}
          >
            {busy ? '正在连接…' : '搜索歌曲'}
          </button>
        </div>
      </form>
      {songs.length > 0 && (
        <div className="music-results">
          <div className="music-result-heading">
            <h2>「{searched}」的搜索结果</h2>
            <small>共 {total} 首</small>
          </div>
          {songs.map((song) => (
            <button
              key={song.id}
              className={`music-result ${selected?.id === song.id ? 'selected' : ''}`}
              disabled={(!song.visible && !hybrid) || !loggedIn || busy}
              onClick={() => void selectSong(song)}
            >
              {song.cover ? (
                <img
                  src={song.cover}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="music-cover">♫</span>
              )}
              <span>
                <strong>{song.name}</strong>
                <small>
                  {song.artists} · {song.album}
                </small>
              </span>
              <span className="music-permission">
                {!song.visible
                  ? hybrid
                    ? '按网页播放权限获取'
                    : '当前应用无版权'
                  : song.vip
                    ? 'VIP / 以播放权限为准'
                    : song.trial
                      ? '可试听'
                      : '查看播放权限'}
              </span>
              <small>{timeLabel(song.duration / 1000)}</small>
            </button>
          ))}
          <div className="music-pagination">
            <button
              className="secondary"
              disabled={busy || offset === 0}
              onClick={() => void search(searched, offset - 12)}
            >
              上一页
            </button>
            <span>
              {offset + 1}–{offset + songs.length}
            </span>
            <button
              className="secondary"
              disabled={busy || offset + songs.length >= total || offset >= 996}
              onClick={() => void search(searched, offset + 12)}
            >
              下一页
            </button>
          </div>
        </div>
      )}
      {searched && !songs.length && !busy && (
        <p className="empty-state">没有找到歌曲，换个歌名或歌手试试。</p>
      )}
      {selected && (
        <section className="music-player">
          <div className="music-player-title">
            <div>
              <span className="eyebrow">NOW PRACTICING</span>
              <h2>{selected.name}</h2>
              <p>{selected.artists}</p>
            </div>
            <span>{timeLabel(current)}</span>
          </div>
          <p role="status">{notice}</p>
          {playback && (
            <>
              <p className="music-source-note">
                {playback.source === 'web'
                  ? '音频：网易云网页接口（游客权限）；歌词和搜索：官方接口。'
                  : '音频、歌词和搜索均来自网易云官方接口。'}
              </p>
              <audio
                ref={audio}
                controls
                preload="metadata"
                src={playback.url}
                onLoadedMetadata={() => {
                  if (audio.current)
                    audio.current.currentTime = playback.trial?.start ?? 0
                }}
                onTimeUpdate={trackTime}
                onSeeking={() => {
                  updateElapsed()
                  trackTime()
                }}
                onRateChange={() => {
                  updateElapsed()
                  if (audio.current) {
                    setRate(audio.current.playbackRate)
                    if (report.current)
                      report.current.rate = audio.current.playbackRate
                  }
                }}
                onPlay={() => {
                  if (Date.now() >= playback.expires) {
                    audio.current?.pause()
                    setError('播放地址已过期，请重新选择这首歌。')
                    return
                  }
                }}
                onPlaying={() => {
                  if (playback.source === 'web') return
                  if (!report.current) {
                    const record = {
                      songId: selected.id,
                      start: Date.now(),
                      seconds: 0,
                      last: performance.now(),
                      playing: true,
                      rate: audio.current?.playbackRate || 1,
                    }
                    report.current = record
                    void requestMusic({
                      action: 'report',
                      songId: selected.id,
                      event: 'startplay',
                      start: record.start,
                    }).catch(() => setNotice('播放记录回传未完成。'))
                  } else {
                    report.current.last = performance.now()
                    report.current.playing = true
                  }
                }}
                onWaiting={() => {
                  updateElapsed()
                  if (report.current) report.current.playing = false
                }}
                onPause={() => {
                  updateElapsed()
                  if (report.current) {
                    report.current.last = performance.now()
                    report.current.playing = false
                  }
                }}
                onEnded={() => finishReport('playend')}
                onError={() => {
                  finishReport('exception')
                  setError('音频加载失败或地址已过期，请重新选择歌曲。')
                }}
              />
              {playback.trial && (
                <p className="music-trial">
                  当前可试听 {timeLabel(playback.trial.start)}–
                  {timeLabel(playback.trial.end)}，练习范围限于此片段。
                </p>
              )}
              <div className="music-tools">
                <label>
                  播放速度{' '}
                  <select
                    value={rate}
                    onChange={(e) => {
                      updateElapsed()
                      setRate(Number(e.target.value))
                    }}
                  >
                    {[0.6, 0.75, 0.9, 1].map((value) => (
                      <option key={value} value={value}>
                        {value}×
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className={loop ? 'primary' : 'secondary'}
                  disabled={!focused?.text || !range.available}
                  onClick={() => {
                    setLoop(!loop)
                    seekLine(lineIndex)
                  }}
                >
                  {loop ? '停止逐句循环' : '循环当前句'}
                </button>
                <label>
                  <input
                    type="checkbox"
                    checked={showRomaji}
                    onChange={(e) => setShowRomaji(e.target.checked)}
                  />
                  罗马音
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showTranslation}
                    onChange={(e) => setShowTranslation(e.target.checked)}
                  />
                  翻译
                </label>
              </div>
            </>
          )}
          {focused?.text && (
            <div className="music-focus">
              <small>这一句 · {timeLabel(focused.time)}</small>
              <p lang="ja">{focused.text}</p>
              {showRomaji && focused.romaji && (
                <p className="music-romaji">{focused.romaji}</p>
              )}
              {showTranslation && focused.translation && (
                <p className="music-translation">{focused.translation}</p>
              )}
            </div>
          )}
          {lines.some((line) => line.text) && (
            <>
              <p className="music-lyric-note">
                罗马音和翻译仅在网易云提供时显示。点击歌词可跳到对应片段。
              </p>
              <div className="music-lyrics">
                {lines.map(
                  (line, index) =>
                    line.text && (
                      <button
                        key={`${line.time}-${index}`}
                        className={index === lineIndex ? 'active' : ''}
                        onClick={() => seekLine(index)}
                      >
                        <time>{timeLabel(line.time)}</time>
                        <span lang="ja">{line.text}</span>
                        {playback?.trial && !lineRange(index).available && (
                          <small>试听范围外</small>
                        )}
                      </button>
                    ),
                )}
              </div>
            </>
          )}
        </section>
      )}
      {!selected && !songs.length && (
        <div className="music-invitation">
          <span>♫</span>
          <h2>从一首你已经喜欢的歌开始</h2>
          <p>
            先连接网易云，再找一首熟悉的日语歌。
            <br />
            不必一次学完，今天先唱好一句。
          </p>
        </div>
      )}
    </section>
  )
}
