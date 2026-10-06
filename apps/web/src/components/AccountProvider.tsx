import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AccountContext } from '#lib/account-context'
import { AccountStore } from '#lib/account-store'
export function AccountProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new AccountStore())
  useEffect(() => store.start(), [store])
  return (
    <AccountContext.Provider value={store}>{children}</AccountContext.Provider>
  )
}
