import { create } from "zustand"
import { persist } from "zustand/middleware"
import Cookies from "js-cookie"

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        // Set auth cookie with 7 days expiry
        Cookies.set("auth_token", token, { expires: 7 })
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        // Remove auth cookie
        Cookies.remove("auth_token")
        set({ user: null, token: null, isAuthenticated: false })
      },
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token })
    }),
    {
      name: "auth-storage",
    },
  ),
)
