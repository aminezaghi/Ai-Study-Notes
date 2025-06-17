"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/services/api"
import { BookOpen, ArrowLeft } from "lucide-react"

interface ValidationErrors {
  [key: string]: string[]
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    // Clear error when field is edited
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: [] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: ["Passwords do not match"] })
      return
    }

    setIsLoading(true)

    try {
      await apiService.register(formData)
      toast({
        title: "Success",
        description: "Account created successfully. Please sign in.",
      })
      router.push("/login")
    } catch (error: any) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      } else {
      toast({
        title: "Error",
          description: error.message || "Failed to create account",
        variant: "destructive",
      })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/landing" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-12 w-12 text-purple-500" />
            </div>
            <CardTitle className="text-2xl text-white">Create Account</CardTitle>
            <CardDescription className="text-gray-400">Join StudyMate and start learning smarter</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 ${
                    errors.name ? "border-red-500" : ""
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Create a password"
                />
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirmation" className="text-gray-300">
                  Confirm Password
                </Label>
                <Input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 ${
                    errors.password_confirmation ? "border-red-500" : ""
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.password_confirmation && (
                  <p className="text-sm text-red-500 mt-1">{errors.password_confirmation[0]}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 hover:underline">
                  Sign in
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
