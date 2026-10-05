import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { musicRequest, MusicRequestError } from '#music'
import type { MusicQr } from '#music'

interface NeteaseAccountOptions {
  onError: (message: string) => void
  onNotice: (message: string) => void
  onDisconnect: () => void
  onWebConnected: () => void
}

export function useNeteaseAccount({
  onError,
  onNotice,
  onDisconnect,
  onWebConnected,
}: NeteaseAccountOptions) {
  const [ready, setReady] = useState<boolean | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [hybrid, setHybrid] = useState(false)
  const [webLoggedIn, setWebLoggedIn] = useState(false)
  const [qrBusy, setQrBusy] = useState(false)
  const [disconnectBusy, setDisconnectBusy] = useState(false)
  const [qr, setQr] = useState<MusicQr | null>(null)
  const [qrStatus, setQrStatus] = useState('')
  const qrVersion = useRef(0)
  const qrRequest = useRef<AbortController | null>(null)

  async function accountStatus(signal?: AbortSignal) {
    const response = await fetch('/api/netease', { signal })
    const data = await response.json()
    setReady(Boolean(data.configured))
    setLoggedIn(Boolean(data.loggedIn))
    setHybrid(Boolean(data.hybrid))
    setWebLoggedIn(Boolean(data.webLoggedIn))
  }

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

  const checkAccount = useEffectEvent(async (signal: AbortSignal) => {
    try {
      await accountStatus(signal)
    } catch {
      if (!signal.aborted) setReady(false)
    }
  })
  const disposeQr = useEffectEvent(() => {
    qrRequest.current?.abort()
    qrVersion.current++
  })
  useEffect(() => {
    const controller = new AbortController()
    // oxlint-disable-next-line react/set-state-in-effect -- Status updates occur after the asynchronous fetch.
    void checkAccount(controller.signal)
    return () => {
      controller.abort()
      disposeQr()
    }
  }, [])

  const webConnected = useEffectEvent(onWebConnected)
  const reportError = useEffectEvent(onError)
  const reportNotice = useEffectEvent(onNotice)
  useEffect(() => {
    if (!qr) return
    const activeQr = qr
    const controller = new AbortController()
    const version = qrVersion.current
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      if (Date.now() >= activeQr.expires) {
        setQrStatus('二维码已过期，请重新生成。')
        return
      }
      try {
        const data = await requestMusic<{ status: number }>(
          { action: activeQr.kind === 'web' ? 'webPoll' : 'poll' },
          controller.signal,
        )
        if (controller.signal.aborted || version !== qrVersion.current) return
        if (data.status === 803) {
          if (activeQr.kind === 'web') setWebLoggedIn(true)
          else setLoggedIn(true)
          setQr(null)
          reportError('')
          reportNotice(
            activeQr.kind === 'web'
              ? '网页播放账号已连接，将使用该账号的会员和购买权限。'
              : '网易云登录成功，开始找一首喜欢的日语歌吧。',
          )
          if (activeQr.kind === 'web') webConnected()
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
      } catch (error) {
        if (!controller.signal.aborted && version === qrVersion.current)
          setQrStatus(
            error instanceof Error
              ? error.message
              : '登录查询失败，请重新生成二维码。',
          )
      }
    }
    timer = setTimeout(poll, 3000)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [qr])

  function cancelQr() {
    qrVersion.current++
    qrRequest.current?.abort()
    setQr(null)
    setQrStatus('')
    setQrBusy(false)
  }

  async function login(kind: 'official' | 'web' = 'official') {
    cancelQr()
    const version = qrVersion.current
    const controller = new AbortController()
    qrRequest.current = controller
    setQrBusy(true)
    onError('')
    try {
      const data = await requestMusic<{ url: string; expires: number }>(
        { action: kind === 'web' ? 'webQr' : 'qr' },
        controller.signal,
      )
      const { default: QRCode } = await import('qrcode')
      const image = await QRCode.toDataURL(data.url, { width: 208, margin: 2 })
      if (!controller.signal.aborted && version === qrVersion.current) {
        setQr({ image, expires: data.expires, kind })
        setQrStatus('使用网易云音乐 App 扫码授权。')
      }
    } catch (error) {
      if (!controller.signal.aborted && version === qrVersion.current)
        onError(error instanceof Error ? error.message : '二维码生成失败。')
    } finally {
      if (version === qrVersion.current) setQrBusy(false)
    }
  }

  async function disconnect(kind: 'official' | 'web') {
    cancelQr()
    setDisconnectBusy(true)
    onError('')
    onDisconnect()
    try {
      await requestMusic({
        action: kind === 'official' ? 'logout' : 'webLogout',
      })
      if (kind === 'official') setLoggedIn(false)
      setWebLoggedIn(false)
      onNotice(
        kind === 'official'
          ? '已退出网易云。'
          : '已断开当前浏览器的网页播放账号。',
      )
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : kind === 'official'
            ? '退出失败。'
            : '断开失败。',
      )
    } finally {
      setDisconnectBusy(false)
    }
  }

  return {
    ready,
    loggedIn,
    hybrid,
    webLoggedIn,
    busy: qrBusy || disconnectBusy,
    qrBusy,
    qr,
    qrStatus,
    requestMusic,
    login,
    cancelQr,
    logout: () => disconnect('official'),
    disconnectWeb: () => disconnect('web'),
  }
}
