import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserInfo } from '../api'

interface AuthState {
  user: UserInfo | null
  token: string | null
  login: (token: string, user: UserInfo) => void
  logout: () => void
  hasPerm: (perm: string) => boolean
}

// 持久化到 localStorage（key: yt-auth，与 http.ts 拦截器读取一致）
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      hasPerm: (perm) => (get().user?.permissions ?? []).includes(perm)
    }),
    { name: 'yt-auth' }
  )
)
