import { createContext } from 'react'
import type { AccountStore } from '#lib/account-store'
export const AccountContext = createContext<AccountStore | null>(null)
