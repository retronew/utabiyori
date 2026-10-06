import {
  applyAccountOperation,
  emptyAccountData,
  parseAccountData,
  record,
} from '@jp-learn/shared'
import type {
  AccountData,
  AccountOperation,
  AccountSnapshot,
  AccountUser,
} from '@jp-learn/shared'
import {
  accountCacheKey,
  cacheData,
  freshCache,
  parseAccountCache,
  readGuestData,
  validateCloudLessons,
  writeGuestData,
} from '#lib/account-storage'
import type { AccountCache } from '#lib/account-storage'

interface AccountState {
  user: AccountUser | null
  data: AccountData
  ready: boolean
  configured: boolean | null
  syncing: boolean
  pending: number
  error: string
  guest: AccountData
  imported: boolean
}
function userData(value: unknown): AccountUser | null {
  if (value === null) return null
  if (
    !record(value) ||
    typeof value.id !== 'string' ||
    !/^[a-f\d-]{36}$/i.test(value.id) ||
    typeof value.name !== 'string'
  )
    throw new Error('账号信息不正确。')
  return { id: value.id, name: value.name }
}
function snapshotData(value: unknown): AccountSnapshot {
  if (
    !record(value) ||
    !Number.isSafeInteger(value.revision) ||
    Number(value.revision) < 0
  )
    throw new Error('同步版本不正确。')
  return {
    revision: Number(value.revision),
    data: validateCloudLessons(parseAccountData(value.data)),
  }
}
export class AccountStore {
  private state: AccountState
  private listeners = new Set<() => void>()
  private cache: AccountCache = freshCache()
  private epoch = 0
  private controller: AbortController | null = null
  private active = false
  private syncingEpoch: number | null = null
  constructor() {
    let guest = emptyAccountData(),
      error = ''
    try {
      guest = readGuestData()
    } catch {
      error = '本地数据暂时无法读取，原有数据未覆盖。'
    }
    this.state = {
      user: null,
      data: guest,
      guest,
      ready: false,
      configured: null,
      syncing: false,
      pending: 0,
      error,
      imported: false,
    }
  }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private publish(patch: Partial<AccountState>) {
    this.state = { ...this.state, ...patch }
    for (const listener of this.listeners) listener()
  }
  private readCache(id: string) {
    return parseAccountCache(localStorage.getItem(accountCacheKey(id)))
  }
  private saveCache(id: string, cache: AccountCache) {
    localStorage.setItem(accountCacheKey(id), JSON.stringify(cache))
  }
  private showCache(cache: AccountCache) {
    this.cache = cache
    this.publish({
      data: cacheData(cache),
      pending: cache.pending.length,
      imported: cache.imported,
    })
  }
  private async request(path: string, signal: AbortSignal, body?: unknown) {
    const response = await fetch(path, {
      signal,
      credentials: 'same-origin',
      cache: 'no-store',
      ...(body
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        : {}),
    })
    const value: unknown = await response.json()
    if (!record(value)) throw new Error('账号服务返回格式不正确。')
    return { response, value }
  }
  async refresh() {
    const epoch = ++this.epoch
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    this.publish({ syncing: false })
    try {
      const { response, value } = await this.request(
        '/api/auth/session',
        controller.signal,
      )
      if (!this.active || epoch !== this.epoch) return
      if (value.configured === false) {
        this.publish({ configured: false, ready: true })
        return
      }
      if (!response.ok) throw new Error('账号服务暂时不可用。')
      const user = userData(value.user)
      if (!user) {
        this.publish({
          user: null,
          data: this.state.guest,
          ready: true,
          configured: true,
          pending: 0,
          imported: false,
        })
        return
      }
      const cache = this.readCache(user.id) ?? freshCache()
      this.cache = cache
      this.publish({
        user,
        data: cacheData(cache),
        pending: cache.pending.length,
        imported: cache.imported,
        configured: true,
        ready: true,
      })
      const cloud = await this.request('/api/account', controller.signal)
      if (!this.active || epoch !== this.epoch) return
      if (!cloud.response.ok)
        throw new Error('云端数据暂时无法读取，本地修改会保留待同步。')
      if (userData(cloud.value.user)?.id !== user.id)
        throw new Error('账号已变化，请重新连接。')
      const disk = this.readCache(user.id) ?? this.cache
      const next = { ...disk, base: snapshotData(cloud.value) }
      this.saveCache(user.id, next)
      this.showCache(next)
      this.publish({ error: '' })
      void this.sync()
    } catch (error) {
      if (controller.signal.aborted || epoch !== this.epoch || !this.active)
        return
      this.publish({
        ready: true,
        error:
          error instanceof Error ? error.message : '账号连接失败，请重试。',
      })
    }
  }
  update(
    operation: AccountOperation,
    expectedUser: string | null = this.state.user?.id ?? null,
  ) {
    try {
      if (expectedUser !== (this.state.user?.id ?? null))
        throw new Error('账号已变化，请重新执行此操作。')
      if (!this.state.user) {
        const guest = applyAccountOperation(readGuestData(), operation)
        writeGuestData(guest)
        this.publish({ data: guest, guest, error: '' })
      } else {
        const id = this.state.user.id
        const existing = this.readCache(id) ?? this.cache
        if (existing.pending.length >= 200)
          throw new Error('待同步修改较多，请先联网同步。')
        const next = {
          ...existing,
          pending: [
            ...existing.pending,
            { id: crypto.randomUUID(), operation },
          ],
        }
        cacheData(next)
        this.saveCache(id, next)
        this.showCache(next)
        this.publish({ error: '' })
        void this.sync()
      }
      return true
    } catch (error) {
      this.publish({
        error:
          error instanceof Error
            ? error.message
            : '修改未保存，请检查浏览器存储权限。',
      })
      return false
    }
  }
  importGuest = () => {
    if (!this.state.user) return
    this.update({ kind: 'import', data: this.state.guest })
  }
  async sync() {
    const user = this.state.user
    const epoch = this.epoch
    if (
      !this.active ||
      !user ||
      this.syncingEpoch === epoch ||
      !this.controller ||
      this.controller.signal.aborted
    )
      return
    this.syncingEpoch = epoch
    const signal = this.controller.signal
    this.publish({ syncing: true })
    try {
      for (let count = 0; count < 20; count++) {
        if (!this.active || epoch !== this.epoch) return
        const cache = this.readCache(user.id) ?? this.cache
        const item = cache.pending[0]
        if (!item) break
        const data = applyAccountOperation(cache.base.data, item.operation)
        const { response, value } = await this.request('/api/account', signal, {
          userId: user.id,
          revision: cache.base.revision,
          mutationId: item.id,
          data,
        })
        if (!this.active || epoch !== this.epoch) return
        if (response.status === 401) {
          await this.refresh()
          return
        }
        if (response.status !== 409 && !response.ok)
          throw new Error(
            typeof value.error === 'string'
              ? value.error
              : '同步失败，请稍后重试。',
          )
        if (userData(value.user)?.id !== user.id) {
          await this.refresh()
          return
        }
        const latest = this.readCache(user.id) ?? this.cache
        const base = snapshotData(value)
        const next = {
          ...latest,
          base: base.revision >= latest.base.revision ? base : latest.base,
          pending: response.ok
            ? latest.pending.filter((x) => x.id !== item.id)
            : latest.pending,
          imported:
            latest.imported ||
            (response.ok && item.operation.kind === 'import'),
        }
        this.saveCache(user.id, next)
        this.showCache(next)
      }
      this.publish({ error: '' })
    } catch (error) {
      if (!signal.aborted && epoch === this.epoch && this.active)
        this.publish({
          error:
            error instanceof Error
              ? error.message
              : '暂时离线，修改已保留待同步。',
        })
    } finally {
      if (this.syncingEpoch === epoch) this.syncingEpoch = null
      if (epoch === this.epoch && this.active) this.publish({ syncing: false })
    }
  }
  logout = async () => {
    const epoch = ++this.epoch
    this.controller?.abort()
    this.controller = new AbortController()
    this.publish({ syncing: true })
    try {
      const { response } = await this.request(
        '/api/auth/logout',
        this.controller.signal,
        {},
      )
      if (!response.ok) throw new Error('退出失败，请重试。')
      if (epoch !== this.epoch || !this.active) return
      this.publish({
        user: null,
        data: this.state.guest,
        pending: 0,
        imported: false,
        error: '',
      })
    } catch (error) {
      if (epoch === this.epoch && this.active)
        this.publish({
          error: error instanceof Error ? error.message : '退出失败。',
        })
    } finally {
      if (epoch === this.epoch && this.active) this.publish({ syncing: false })
    }
  }
  start() {
    this.active = true
    const refresh = () => {
      if (!this.state.syncing) void this.refresh()
    }
    const storage = (event: StorageEvent) => {
      try {
        if (
          this.state.user &&
          event.key === accountCacheKey(this.state.user.id)
        ) {
          const cache = this.readCache(this.state.user.id)
          if (cache) this.showCache(cache)
        } else if (
          !this.state.user &&
          [
            'jp-learn:progress:v1',
            'jp-learn:library:v1',
            'utabiyori:appearance:v1',
            'utabiyori:music-favorites:v1',
          ].includes(event.key || '')
        ) {
          const guest = readGuestData()
          this.publish({ guest, data: guest })
        }
      } catch {
        this.publish({ error: '另一页面的数据无法读取，原有数据未覆盖。' })
      }
    }
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', storage)
    const timer = window.setInterval(refresh, 30000)
    const url = new URL(window.location.href)
    if (url.searchParams.has('account')) {
      if (url.searchParams.get('account') === 'error')
        this.publish({ error: '登录未完成，请重新尝试。' })
      url.searchParams.delete('account')
      window.history.replaceState(null, '', url)
    }
    void this.refresh()
    return () => {
      this.active = false
      this.epoch++
      this.controller?.abort()
      clearInterval(timer)
      window.removeEventListener('online', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', storage)
    }
  }
}
