"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useQueryClient } from "@tanstack/react-query"
import { verifyEmail as apiVerifyEmail, resendVerificationCode as apiResendVerificationCode } from "@/lib/api-client"

interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<number>
  logout: () => Promise<void>
  isLoading: boolean
  verifyEmail: (user_id: number, verification_code: string) => Promise<any>
  resendVerificationCode: (user_id: number) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await apiClient.get("/user")
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem("auth_token")
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await apiClient.post("/login", { email, password })
    const { access_token } = response.data

    localStorage.setItem("auth_token", access_token)
    // Set cookie for middleware (expires in 7 days, path=/)
    document.cookie = `auth_token=${access_token}; path=/; max-age=${7 * 24 * 60 * 60}`
    await checkAuth()
    router.push("/dashboard")
  }

  const register = async (name: string, email: string, password: string, password_confirmation: string) => {
    const response = await apiClient.post("/register", {
      name,
      email,
      password,
      password_confirmation,
    })
    // Assume backend returns { message, user_id } or similar
    const user_id = response.data.user_id || response.data.id
    if (user_id) {
      localStorage.setItem("pending_verification_user_id", String(user_id))
    }
    return user_id
  }

  const logout = async () => {
    try {
      await apiClient.post("/logout")
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem("auth_token")
      setUser(null)
      // Remove the auth_token cookie
      document.cookie = "auth_token=; path=/; max-age=0"
      queryClient.clear() // Clear React Query cache
      router.push("/")
    }
  }

  const verifyEmail = async (user_id: number, verification_code: string) => {
    return apiVerifyEmail({ user_id, verification_code })
  }

  const resendVerificationCode = async (user_id: number) => {
    return apiResendVerificationCode({ user_id })
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading, verifyEmail, resendVerificationCode }}>{children}</AuthContext.Provider>
}
