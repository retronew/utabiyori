import { useContext, useSyncExternalStore } from 'react'
import type { AccountOperation } from '@jp-learn/shared'
import { AccountContext } from '#lib/account-context'
export function useAccount() {
  const store = useContext(AccountContext)
  if (!store) throw new Error('AccountProvider is required')
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  return {
    ...state,
    update: (operation: AccountOperation) =>
      store.update(operation, state.user?.id ?? null),
    refresh: () => store.refresh(),
    sync: () => store.sync(),
    logout: store.logout,
    importGuest: store.importGuest,
  }
}
