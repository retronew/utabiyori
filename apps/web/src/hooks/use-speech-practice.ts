import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { announceAudio, audioPlaybackEvent } from '#lib/audio-events'

export function useSpeechPractice(onMessage: (message: string) => void) {
  const [speaking, setSpeaking] = useState(false)
  const utterance = useRef<SpeechSynthesisUtterance | null>(null)

  function stopSpeech() {
    utterance.current = null
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }

  const interrupt = useEffectEvent(stopSpeech)
  useEffect(() => {
    const listener = () => interrupt()
    window.addEventListener(audioPlaybackEvent, listener)
    return () => {
      window.removeEventListener(audioPlaybackEvent, listener)
      utterance.current = null
      window.speechSynthesis?.cancel()
    }
  }, [])

  function speak(text: string, rate = 0.75) {
    stopSpeech()
    if (!('speechSynthesis' in window)) {
      onMessage('浏览器不支持语音朗读，请使用本地音频练习。')
      return
    }
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => item.lang.startsWith('ja'))
    if (!voice) {
      onMessage('没有检测到日语语音，请在系统中安装日语语音，或选择本地音频。')
      return
    }
    announceAudio()
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
        onMessage('朗读未完成，请重试或使用本地音频。')
      }
    }
    utterance.current = next
    setSpeaking(true)
    onMessage('')
    window.speechSynthesis.speak(next)
  }

  return { speaking, speak, stopSpeech }
}
