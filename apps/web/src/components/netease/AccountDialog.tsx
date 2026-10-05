import { RefreshCw } from 'lucide-react'
import type { RefObject } from 'react'
import type { MusicQr } from '#music'
import { Button } from '#components/ui/button'
import { Skeleton } from '#components/ui/Skeleton'
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#components/ui/dialog'

interface AccountDialogProps {
  open: boolean
  ready: boolean | null
  loggedIn: boolean
  webLoggedIn: boolean
  hybrid: boolean
  busy: boolean
  qrBusy: boolean
  qr: MusicQr | null
  qrStatus: string
  error: string
  onOpenChange: (open: boolean) => void
  onLogin: (kind?: 'official' | 'web') => void
  onLogout: () => void
  onDisconnectWeb: () => void
  returnFocus: RefObject<HTMLButtonElement | null>
}

export function AccountDialog({
  open,
  ready,
  loggedIn,
  webLoggedIn,
  hybrid,
  busy,
  qrBusy,
  qr,
  qrStatus,
  error,
  onOpenChange,
  onLogin,
  onLogout,
  onDisconnectWeb,
  returnFocus,
}: AccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup
        finalFocus={returnFocus}
        closeProps={{ 'aria-label': '关闭账号连接' }}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>连接网易云音乐</DialogTitle>
          <DialogDescription>使用网易云音乐 App 扫码。</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
            <div>
              <p className="text-sm font-semibold">曲库与歌词</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {loggedIn ? '已连接' : '搜索歌曲与歌词'}
              </p>
            </div>
            <Button
              size="sm"
              variant={loggedIn ? 'outline' : 'default'}
              disabled={busy || ready !== true}
              onClick={() => (loggedIn ? onLogout() : onLogin())}
            >
              {loggedIn ? '退出账号' : '扫码连接'}
            </Button>
          </div>
          {hybrid && loggedIn && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
              <div>
                <p className="text-sm font-semibold">网页播放账号</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {webLoggedIn
                    ? '已连接，使用账号播放权限'
                    : '连接以使用会员播放权限'}
                </p>
              </div>
              <Button
                size="sm"
                variant={webLoggedIn ? 'outline' : 'default'}
                disabled={busy}
                onClick={() =>
                  webLoggedIn ? onDisconnectWeb() : onLogin('web')
                }
              >
                {webLoggedIn ? '断开播放' : '连接播放'}
              </Button>
            </div>
          )}
          {(qr || qrBusy) && (
            <div
              data-slot="account-qr"
              aria-busy={qrBusy}
              className="flex flex-col items-center rounded-xl border p-4"
            >
              {qrBusy ? (
                <Skeleton className="size-52" />
              ) : (
                qr && (
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
                )
              )}
              <p className="mt-2 h-5 text-sm font-medium">
                {qrBusy ? (
                  <Skeleton className="h-5 w-36" />
                ) : qr?.kind === 'web' ? (
                  '连接网页播放账号'
                ) : (
                  '用网易云 App 扫一扫'
                )}
              </p>
              <p
                role="status"
                className="mt-2 h-4 text-xs text-muted-foreground"
              >
                {qrBusy ? (
                  <>
                    <span className="sr-only">正在生成二维码</span>
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  qrStatus
                )}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => qr && onLogin(qr.kind)}
                disabled={busy}
              >
                <RefreshCw />
                重新生成
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="text-xs leading-6 text-destructive">
              {error}
            </p>
          )}
          {ready === false && (
            <p role="alert" className="text-xs text-destructive">
              连接失败，请稍后重试。
            </p>
          )}
          <p className="text-xs leading-6 text-muted-foreground">
            登录仅用于当前浏览器。可播放范围取决于账号订阅、购买记录及歌曲版权。
          </p>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
