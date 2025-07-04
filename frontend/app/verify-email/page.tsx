"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

export default function VerifyEmailPage() {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const { verifyEmail, resendVerificationCode } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check query param first
      const userIdFromQuery = searchParams.get("user_id")
      if (userIdFromQuery) {
        setUserId(parseInt(userIdFromQuery, 10))
        localStorage.setItem("pending_verification_user_id", userIdFromQuery)
        return
      }
      // Fallback to localStorage
      const userIdStr = localStorage.getItem("pending_verification_user_id")
      setUserId(userIdStr ? parseInt(userIdStr, 10) : null)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast({
        title: "No user to verify",
        description: "Please register first.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    try {
      await verifyEmail(userId, code)
      toast({
        title: "Email verified!",
        description: "You can now log in.",
      })
      localStorage.removeItem("pending_verification_user_id")
      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error?.message || "Invalid code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    console.log('Resend verification code for userId:', userId)
    if (!userId) {
      toast({
        title: "No user to resend code for",
        description: "Please register first.",
        variant: "destructive",
      })
      return
    }
    setIsResending(true)
    try {
      await resendVerificationCode(userId)
      toast({
        title: "Verification code sent!",
        description: "Check your email for the new code.",
      })
    } catch (error: any) {
      toast({
        title: "Resend failed",
        description: error?.message || "Could not resend code.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      <Card className="w-full max-w-md glass shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            Enter the verification code sent to your email address to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Button variant="link" type="button" onClick={handleResend} disabled={isResending}>
              {isResending ? "Resending..." : "Resend Verification Code"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 