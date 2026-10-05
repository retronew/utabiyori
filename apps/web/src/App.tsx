import { useEffect, useRef, useState } from 'react'
import { songs as builtInSongs } from '@jp-learn/content'
import { completion, progressKey } from '@jp-learn/shared'
import type { Progress } from '@jp-learn/shared'
import './App.css'
import AudioPractice from './components/AudioPractice'
import NeteasePractice from './components/NeteasePractice'
import { importLesson, readLibrary } from './library'

const storageKey = 'jp-learn:progress:v1'
function readProgress(): Progress {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(
      Object.entries(value).filter(([, v]) => typeof v === 'boolean'),
    )
  } catch {
    return {}
  }
}

export default function App() {
  const [customSongs, setCustomSongs] = useState(readLibrary)
  const songs = [...builtInSongs, ...customSongs]
  const [songId, setSongId] = useState(songs[0].id)
  const [lineIndex, setLineIndex] = useState(0)
  const [romaji, setRomaji] = useState(true)
  const [translation, setTranslation] = useState(true)
  const [tab, setTab] = useState<'songs' | 'review' | 'music'>('songs')
  const [progress, setProgress] = useState<Progress>(readProgress)
  const [message, setMessage] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const utterance = useRef<SpeechSynthesisUtterance | null>(null)
  const song = songs.find((item) => item.id === songId) || songs[0]
  const line = song.lines[lineIndex]
  const mastered = !!progress[progressKey(song.id, line.id)]
  const learned = songs.reduce(
    (sum, item) =>
      sum +
      item.lines.filter((l) => progress[progressKey(item.id, l.id)]).length,
    0,
  )
  const total = songs.reduce((sum, item) => sum + item.lines.length, 0)
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel()
    },
    [],
  )
  function stopSpeech() {
    utterance.current = null
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }
  function speak(text: string, rate = 0.75) {
    stopSpeech()
    if (!('speechSynthesis' in window)) {
      setMessage('浏览器不支持语音朗读，请使用本地音频练习。')
      return
    }
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith('ja'))
    if (!voice) {
      setMessage('没有检测到日语语音，请在系统中安装日语语音，或选择本地音频。')
      return
    }
    const next = new SpeechSynthesisUtterance(text)
    next.lang = 'ja-JP'
    next.voice = voice
    next.rate = rate
    next.onend = () => {
      if (utterance.current === next) setSpeaking(false)
    }
    next.onerror = () => {
      if (utterance.current === next) {
        setSpeaking(false)
        setMessage('朗读未完成，请重试或使用本地音频。')
      }
    }
    utterance.current = next
    setSpeaking(true)
    setMessage('')
    window.speechSynthesis.speak(next)
  }
  function selectSong(id: string, index = 0) {
    stopSpeech()
    setSongId(id)
    setLineIndex(index)
    setTab('songs')
    setMessage('')
  }
  function selectLine(index: number) {
    stopSpeech()
    setLineIndex(index)
    setMessage('')
  }
  function toggleMastered() {
    const next = { ...progress, [progressKey(song.id, line.id)]: !mastered }
    setProgress(next)
    setMessage(
      mastered
        ? '已放回待练习。'
        : '这一句已经学会了，试着关掉罗马音再唱一次。',
    )
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      setMessage('浏览器无法保存进度，本次练习仍可继续。')
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="歌日和首页">
          <span className="brand-icon">う</span>
          <span>
            歌日和<small>UTABIYORI</small>
          </span>
        </a>
        <div className="nav-label">我的学习空间</div>
        <nav>
          <button
            className={tab === 'music' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              stopSpeech()
              setMessage('')
              setTab('music')
            }}
          >
            <span>♪</span>网易云练习
          </button>
          <button
            className={tab === 'songs' ? 'nav-item active' : 'nav-item'}
            onClick={() => setTab('songs')}
            aria-label="歌曲练习"
          >
            <span>♫</span>歌曲练习
            <span className="nav-count">
              {songs.length.toString().padStart(2, '0')}
            </span>
          </button>
          <button
            className={tab === 'review' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              stopSpeech()
              setTab('review')
            }}
            aria-label="我的复习"
          >
            <span>▧</span>我的复习
            <span className="nav-count">
              {learned.toString().padStart(2, '0')}
            </span>
          </button>
        </nav>
        <div className="sidebar-note">
          <span>一首歌，一点进步。</span>
          <p>
            不必先背完五十音。
            <br />
            从喜欢的声音开始。
          </p>
          <div className="note-flower">✳</div>
        </div>
        <div className="profile">
          <div className="avatar">初</div>
          <div>
            日语学习者<small>今天也慢慢来</small>
          </div>
          <span className="online-dot" />
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            我的学习空间 <span className="crumb">/</span>{' '}
            {tab === 'music'
              ? '网易云练习'
              : tab === 'songs'
                ? '歌曲练习'
                : '我的复习'}
          </span>
          <span className="local-badge">
            <i />
            进度保存在本机
          </span>
        </header>
        <div className="workspace">
          {tab !== 'music' && (
            <section className="welcome">
              <div>
                <div className="eyebrow">LET'S SING IN JAPANESE</div>
                <h1>
                  {tab === 'songs' ? (
                    <>
                      让日语，从一首歌开始<span>。</span>
                    </>
                  ) : (
                    <>
                      把会唱的句子，再唱一遍<span>。</span>
                    </>
                  )}
                </h1>
                <p>听得懂一点，就已经是很好的开始。今天，只学会一句也可以。</p>
              </div>
              <div className="daily-progress">
                <span className="progress-number">
                  {learned}
                  <small> / {total}</small>
                </span>
                <span>已学会的句子</span>
              </div>
            </section>
          )}
          {tab === 'music' ? (
            <NeteasePractice />
          ) : tab === 'review' ? (
            <section className="review-panel">
              <h2>我的复习</h2>
              <p>关掉罗马音，试着只看假名读出这些句子。</p>
              {learned === 0 ? (
                <div className="empty-state">
                  <span>♫</span>
                  <h3>第一句，等你来唱</h3>
                  <p>在歌曲练习里标记「这句我会了」，它就会出现在这里。</p>
                  <button className="primary" onClick={() => setTab('songs')}>
                    开始练习
                  </button>
                </div>
              ) : (
                songs.flatMap((item) =>
                  item.lines.map(
                    (l, index) =>
                      progress[progressKey(item.id, l.id)] && (
                        <button
                          className="review-line"
                          key={progressKey(item.id, l.id)}
                          onClick={() => selectSong(item.id, index)}
                        >
                          <span>
                            <strong lang="ja">{l.kana}</strong>
                            <small>
                              {item.title} · {l.translation}
                            </small>
                          </span>
                          <span>再练一次 →</span>
                        </button>
                      ),
                  ),
                )
              )}
            </section>
          ) : (
            <>
              <div className="section-heading">
                <h2>选一首，慢慢唱</h2>
                <span>逐句练习 · 入门</span>
              </div>
              <div className="song-grid">
                {songs.map((item, index) => (
                  <button
                    className={`song-card ${item.theme} ${songId === item.id ? 'selected' : ''}`}
                    key={item.id}
                    onClick={() => selectSong(item.id)}
                    aria-pressed={songId === item.id}
                  >
                    <div className="song-art">
                      <span className="art-circle" />
                      <span className="art-stem" />
                      <span className="art-leaf" />
                      <span className="art-title" lang="ja">
                        {item.title}
                      </span>
                      <span className="art-number">0{index + 1}</span>
                    </div>
                    <div className="song-info">
                      <span className="song-category">
                        {builtInSongs.some((song) => song.id === item.id)
                          ? '原创练习'
                          : '我的练习'}{' '}
                        · {item.lines.length} 句
                      </span>
                      <h3>
                        {item.title}
                        <span>{songId === item.id ? '↗' : '→'}</span>
                      </h3>
                      <p>{item.subtitle}</p>
                      <div className="song-progress">
                        <span
                          style={{ width: `${completion(item, progress)}%` }}
                        />
                      </div>
                      <small>{completion(item, progress)}% 已掌握</small>
                    </div>
                  </button>
                ))}
              </div>
              <div className="import-bar">
                <span>也可以练习你喜欢的歌</span>
                <div>
                  <a href="/lesson-template.json" download>
                    下载逐句练习示例
                  </a>
                  <label className="import-button">
                    ＋ 导入逐句练习
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={async (event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ''
                        if (!file) return
                        try {
                          const next = await importLesson(file, customSongs)
                          setCustomSongs(next)
                          selectSong(next[next.length - 1].id)
                          setMessage(
                            '练习已导入。选择对应的本地歌曲音频，就可以开始跟唱了。',
                          )
                        } catch (error) {
                          setMessage(
                            error instanceof Error
                              ? error.message
                              : '导入失败，请重试。',
                          )
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <section className="lesson">
                <div className="lesson-top">
                  <div>
                    <div className="eyebrow">LINE BY LINE</div>
                    <h2>一句一句，把它唱会</h2>
                  </div>
                  <span className="lesson-badge">
                    {song.title} <span>·</span> {lineIndex + 1} /{' '}
                    {song.lines.length}
                  </span>
                </div>
                <div className="lesson-layout">
                  <div className="lyrics-column">
                    <div className="lesson-controls">
                      <span>歌词辅助</span>
                      <label>
                        <input
                          type="checkbox"
                          checked={romaji}
                          onChange={(e) => setRomaji(e.target.checked)}
                        />
                        罗马音
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={translation}
                          onChange={(e) => setTranslation(e.target.checked)}
                        />
                        中文释义
                      </label>
                    </div>
                    <div className="lyric-list">
                      {song.lines.map((l, index) => (
                        <button
                          key={l.id}
                          className={`lyric-line ${index === lineIndex ? 'current' : ''}`}
                          onClick={() => selectLine(index)}
                          aria-pressed={index === lineIndex}
                        >
                          <span className="line-number">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="line-content">
                            <span className="japanese" lang="ja">
                              {l.tokens.map((token, i) =>
                                token.reading ? (
                                  <ruby key={i}>
                                    {token.text}
                                    <rt>{token.reading}</rt>
                                  </ruby>
                                ) : (
                                  <span key={i}>{token.text}</span>
                                ),
                              )}
                            </span>
                            {romaji && (
                              <span className="romaji">{l.romaji}</span>
                            )}
                            {translation && (
                              <span className="translation">
                                {l.translation}
                              </span>
                            )}
                          </span>
                          <span className="line-state">
                            {progress[progressKey(song.id, l.id)]
                              ? '✓'
                              : index === lineIndex
                                ? '♪'
                                : '·'}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="lesson-footer">
                      <span>小目标：听 → 跟读 → 不看罗马音</span>
                      <span>每句都算数 ✧</span>
                    </div>
                  </div>
                  <div className="practice-column">
                    <span className="practice-label">
                      正在练习 · 第 {lineIndex + 1} 句
                    </span>
                    <h3 lang="ja">{line.kana}</h3>
                    <p className="practice-translation">{line.translation}</p>
                    <div className="speech-buttons">
                      <button
                        className="primary"
                        onClick={() =>
                          speaking ? stopSpeech() : speak(line.kana)
                        }
                      >
                        {speaking ? '■ 停止朗读' : '▶ 听这一句'}
                      </button>
                      <button onClick={() => speak(line.kana, 0.5)}>
                        慢速朗读
                      </button>
                    </div>
                    <small className="speech-note">
                      系统日语语音朗读，用于发音练习
                    </small>
                    <div className="pronunciation-tip">
                      <span>✧ 发音小提示</span>
                      <p>{line.tip}</p>
                    </div>
                    <button
                      className={`master-button ${mastered ? 'mastered' : ''}`}
                      onClick={toggleMastered}
                    >
                      {mastered ? '✓ 已学会 · 点击重新练习' : '✓ 这句我会了'}
                    </button>
                    <div className="line-navigation">
                      <button
                        disabled={lineIndex === 0}
                        onClick={() => selectLine(lineIndex - 1)}
                      >
                        ← 上一句
                      </button>
                      <button
                        disabled={lineIndex === song.lines.length - 1}
                        onClick={() => selectLine(lineIndex + 1)}
                      >
                        下一句 →
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              <div className="bottom-grid">
                <section className="kana-panel">
                  <div className="section-label">
                    <span className="mini-icon">あ</span>
                    <h3>在这一句里，认识假名</h3>
                  </div>
                  <p>不用一次记住五十个。先认识眼前这两个。</p>
                  <div className="kana-cards">
                    {line.focus.map((k) => (
                      <button
                        key={k.kana}
                        onClick={() =>
                          speak(k.kana === 'っ' ? 'そっと' : k.kana)
                        }
                      >
                        <span lang="ja">{k.kana}</span>
                        <div>
                          <strong>{k.romaji}</strong>
                          <small>{k.example}</small>
                        </div>
                        <span className="kana-play">▷</span>
                      </button>
                    ))}
                  </div>
                </section>
                <AudioPractice />
              </div>
            </>
          )}
          {message && (
            <p className="status-message" role="status">
              {message}
            </p>
          )}
          <footer className="page-footer">
            <span>歌日和 · 让喜欢的声音，成为学习的开始</span>
            <span>每天一点，慢慢就会了。</span>
          </footer>
        </div>
      </main>
    </div>
  )
}
