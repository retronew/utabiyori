import { useState } from 'react'
import { Cloud, LogOut, RefreshCw, UserRound } from 'lucide-react'
import { useAccount } from '#hooks/use-account'
import { Button } from '#components/ui/button'
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '#components/ui/dialog'

export function AccountSettings() {
  const [open, setOpen] = useState(false)
  const account = useAccount()
  const guest = account.guest
  const guestItems = [
    guest.favorites.length ? `${guest.favorites.length} 首收藏` : '',
    guest.lessons.length ? `${guest.lessons.length} 份课程` : '',
    Object.keys(guest.progress).length
      ? `${Object.keys(guest.progress).length} 条进度`
      : '',
    guest.theme ? '外观设置' : '',
  ].filter(Boolean)
  const syncStatus = account.syncing
    ? '正在同步…'
    : account.error
      ? '同步待恢复'
      : account.pending
        ? `${account.pending} 项待同步`
        : '已同步'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={account.user ? '歌日和账号与同步' : '登录歌日和'}
          />
        }
      >
        <UserRound />
      </DialogTrigger>
      <DialogPopup
        closeProps={{ 'aria-label': '关闭歌日和账号' }}
        className="max-w-sm"
      >
        <DialogHeader className="gap-1.5 pb-4">
          <DialogTitle>歌日和账号</DialogTitle>
          <DialogDescription>
            进度、收藏、课程和外观随账号自动同步。
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto px-6 pb-5">
          {!account.ready ? (
            <p role="status" className="py-2 text-sm text-muted-foreground">
              正在连接账号…
            </p>
          ) : account.user ? (
            <>
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium"
                    title={account.user.name}
                  >
                    {account.user.name}
                  </p>
                  <p
                    role="status"
                    className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <Cloud
                      className="size-3.5"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    {syncStatus}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="立即同步"
                  title="立即同步"
                  disabled={account.syncing}
                  onClick={() => void account.refresh()}
                >
                  <RefreshCw
                    className={
                      account.syncing ? 'motion-safe:animate-spin' : ''
                    }
                  />
                </Button>
              </div>
              {guestItems.length > 0 && !account.imported && (
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">本机数据</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {guestItems.join(' · ')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={account.syncing || account.pending > 0}
                      onClick={account.importGuest}
                    >
                      合并到账号
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    合并到当前账号，保留本机原始数据。
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <Button
                className="w-full"
                disabled={!account.configured}
                onClick={() => window.location.assign('/api/auth/authorize')}
              >
                使用 Vercel 登录
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {account.configured === false
                  ? '同步服务尚未配置，可继续在本机练习。'
                  : '未登录时保存在本机，登录后可选择合并。'}
              </p>
            </div>
          )}
          {account.error && (
            <div className="space-y-2">
              <p role="alert" className="text-sm text-destructive">
                {account.error}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={account.syncing}
                onClick={() => void account.refresh()}
              >
                重试连接
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              网易云登录不随账号同步。
            </p>
            {account.user && (
              <Button
                variant="destructive"
                size="sm"
                disabled={account.syncing}
                onClick={() => void account.logout()}
              >
                <LogOut aria-hidden="true" />
                退出登录
              </Button>
            )}
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
