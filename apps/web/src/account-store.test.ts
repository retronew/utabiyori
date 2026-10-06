import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyAccountData } from '@jp-learn/shared'
import { AccountStore } from '#lib/account-store'
import { accountCacheKey } from '#lib/account-storage'

class MemoryStorage implements Storage {
  private rows = new Map<string, string>()
  get length() {
    return this.rows.size
  }
  clear() {
    this.rows.clear()
  }
  getItem(key: string) {
    return this.rows.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.rows.set(key, value)
  }
  removeItem(key: string) {
    this.rows.delete(key)
  }
  key(index: number) {
    return [...this.rows.keys()][index] ?? null
  }
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
test('offline edits stay in the original account cache and conflict retries preserve remote edits', async () => {
  const previousFetch = globalThis.fetch
  const storage = new MemoryStorage()
  const target = new EventTarget()
  Object.assign(target, {
    location: { href: 'http://localhost:5173' },
    history: { replaceState() {} },
    setInterval: () => 1,
  })
  Object.defineProperty(globalThis, 'window', {
    value: target,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  })
  const first = { id: '11111111-1111-4111-8111-111111111111', name: 'first' }
  const second = { id: '22222222-2222-4222-8222-222222222222', name: 'second' }
  let user = first,
    offline = false,
    conflict = true,
    revision = 0,
    data = emptyAccountData()
  const writes: string[] = []
  globalThis.fetch = async (input, init) => {
    const path = String(input)
    if (path === '/api/auth/session')
      return Response.json({ user, configured: true })
    if (!init?.body) return Response.json({ user, revision, data })
    if (offline) throw new Error('offline')
    const body = JSON.parse(String(init.body))
    assert.equal(body.userId, user.id)
    writes.push(body.userId)
    if (conflict) {
      conflict = false
      revision++
      data = { ...data, progress: { 'remote:line': true } }
      return Response.json({ user, revision, data }, { status: 409 })
    }
    revision++
    data = body.data
    return Response.json({ user, revision, data })
  }
  const store = new AccountStore()
  const stop = store.start()
  try {
    for (let i = 0; i < 10 && !store.getSnapshot().user; i++) await tick()
    await tick()
    offline = true
    assert.equal(
      store.update({ kind: 'progress', key: 'local:line', mastered: true }),
      true,
    )
    await tick()
    assert.equal(store.getSnapshot().pending, 1)
    user = second
    await store.refresh()
    assert.equal(store.getSnapshot().pending, 0)
    assert.equal(store.getSnapshot().data.progress['local:line'], undefined)
    assert.equal(
      store.update(
        { kind: 'progress', key: 'stale:line', mastered: true },
        first.id,
      ),
      false,
    )
    assert.ok(
      storage.getItem(accountCacheKey(first.id))?.includes('local:line'),
    )
    assert.equal(writes.length, 0)
    user = first
    offline = false
    await store.refresh()
    for (let i = 0; i < 15 && store.getSnapshot().pending; i++) await tick()
    assert.equal(store.getSnapshot().pending, 0)
    assert.deepEqual(store.getSnapshot().data.progress, {
      'remote:line': true,
      'local:line': true,
    })
    assert.ok(writes.every((id) => id === first.id))
  } finally {
    stop()
    globalThis.fetch = previousFetch
    Reflect.deleteProperty(globalThis, 'window')
    Reflect.deleteProperty(globalThis, 'localStorage')
  }
})
