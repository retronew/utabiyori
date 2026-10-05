import { useState } from 'react'
import { songs as builtInSongs } from '@jp-learn/content'
import { progressKey } from '@jp-learn/shared'
import type { Progress } from '@jp-learn/shared'
import { readLibrary, importLesson } from '#library'
import { readProgress, progressStorageKey } from '#lib/progress'
import { useSpeechPractice } from '#hooks/use-speech-practice'

export function useLessonPractice(onSelectSong: () => void) {
  const [customSongs, setCustomSongs] = useState(readLibrary)
  const songs = [...builtInSongs, ...customSongs]
  const [songId, setSongId] = useState(songs[0].id)
  const [lineIndex, setLineIndex] = useState(0)
  const [romaji, setRomaji] = useState(true)
  const [translation, setTranslation] = useState(true)
  const [progress, setProgress] = useState<Progress>(readProgress)
  const [message, setMessage] = useState('')
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

  const { speaking, speak, stopSpeech } = useSpeechPractice(setMessage)
  function selectSong(id: string, index = 0) {
    stopSpeech()
    setSongId(id)
    setLineIndex(index)
    onSelectSong()
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
      localStorage.setItem(progressStorageKey, JSON.stringify(next))
    } catch {
      setMessage('浏览器无法保存进度，本次练习仍可继续。')
    }
  }

  async function importFile(file: File) {
    try {
      const next = await importLesson(file, customSongs)
      setCustomSongs(next)
      selectSong(next[next.length - 1].id)
      setMessage('练习已导入，可以开始逐句跟读。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导入失败，请重试。')
    }
  }
  return {
    songs,
    song,
    line,
    lineIndex,
    progress,
    romaji,
    translation,
    mastered,
    learned,
    total,
    message,
    speaking,
    setMessage,
    setRomaji,
    setTranslation,
    selectSong,
    selectLine,
    importFile,
    speak,
    stopSpeech,
    toggleMastered,
  }
}

export type LessonPracticeState = ReturnType<typeof useLessonPractice>
