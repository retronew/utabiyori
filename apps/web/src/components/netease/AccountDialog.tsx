import { RefreshCw } from 'lucide-react'
import type { MusicQr } from '#music'
import { Button } from '#components/ui/button'
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
  qr: MusicQr | null
  qrStatus: string
  error: string
  onOpenChange: (open: boolean) => void
  onLogin: (kind?: 'official' | 'web') => void
  onLogout: () => void
  onDisconnectWeb: () => void
}

export function AccountDialog({
  open,
  ready,
  loggedIn,
  webLoggedIn,
  hybrid,
  busy,
  qr,
  qrStatus,
  error,
  onOpenChange,
  onLogin,
  onLogout,
  onDisconnectWeb,
}: AccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup
        closeProps={{ 'aria-label': '关闭账号连接' }}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>连接网易云音乐</DialogTitle>
          <DialogDescription>
            使用网易云音乐 App 扫码，在这里练习你喜欢的歌。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-6">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-4">
            <div>
              <p className="text-sm font-semibold">曲库与歌词</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {loggedIn ? '已连接官方曲库' : '连接后搜索歌曲、获取歌词'}
              </p>
            </div>
            <Button
              size="sm"
              variant={loggedIn ? 'outline' : 'default'}
              disabled={busy || ready !== true}
              onClick={() => (loggedIn ? onLogout() : onLogin())}
            >
              {loggedIn ? '退出' : '扫码连接'}
            </Button>
          </div>
          {hybrid && loggedIn && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-4">
              <div>
                <p className="text-sm font-semibold">网页播放账号</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {webLoggedIn
                    ? '按当前账号的会员与购买权限播放'
                    : '再扫码一次，使用你的会员权限'}
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
                {webLoggedIn ? '断开' : '连接播放'}
              </Button>
            </div>
          )}
          {qr && (
            <div className="flex flex-col items-center rounded-xl border p-4">
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
              <p className="mt-2 text-sm font-medium">
                {qr.kind === 'web' ? '连接网页播放账号' : '用网易云 App 扫一扫'}
              </p>
              <p role="status" className="mt-2 text-xs text-muted-foreground">
                {qrStatus}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => onLogin(qr.kind)}
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
              网易云服务暂时不可用，请检查服务配置。
            </p>
          )}
          <p className="text-[11px] leading-6 text-muted-foreground">
            登录仅用于当前浏览器。可播放范围取决于账号订阅、购买记录及歌曲版权。
          </p>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
