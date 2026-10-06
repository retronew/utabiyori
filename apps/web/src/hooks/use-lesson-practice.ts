import { useState } from 'react'
import { songs as builtInSongs } from '@jp-learn/content'
import { progressKey } from '@jp-learn/shared'
import { importLesson } from '#library'
import { useAccount } from '#hooks/use-account'
import { useSpeechPractice } from '#hooks/use-speech-practice'

export function useLessonPractice(onSelectSong: () => void) {
  const account = useAccount()
  const customSongs = account.data.lessons
  const songs = [...builtInSongs, ...customSongs]
  const [songId, setSongId] = useState(songs[0].id)
  const [lineIndex, setLineIndex] = useState(0)
  const [romaji, setRomaji] = useState(true)
  const [translation, setTranslation] = useState(true)
  const progress = account.data.progress
  const [message, setMessage] = useState('')
  const song = songs.find((item) => item.id === songId) || songs[0]
  const currentLineIndex = Math.min(lineIndex, song.lines.length - 1)
  const line = song.lines[currentLineIndex]
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
    if (
      !account.update({
        kind: 'progress',
        key: progressKey(song.id, line.id),
        mastered: !mastered,
      })
    ) {
      setMessage('进度未保存，请在账号面板查看原因后重试。')
      return
    }
    setMessage(
      mastered
        ? '已放回待练习。'
        : '这一句已经学会了，试着关掉罗马音再唱一次。',
    )
  }

  async function importFile(file: File) {
    try {
      const next = await importLesson(file, customSongs)
      if (!account.update({ kind: 'lesson', song: next }))
        throw new Error('课程未保存，请在账号面板查看原因后重试。')
      selectSong(next.id)
      setMessage('练习已导入，可以开始逐句跟读。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导入失败，请重试。')
    }
  }
  return {
    songs,
    song,
    line,
    lineIndex: currentLineIndex,
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
