"use client"

import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, LogOut, BookOpen, Settings, Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/services/api"

export function ModernHeader() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await apiService.logout()
      logout()
      router.push("/landing")
    } catch (error) {
      console.error("Logout failed:", error)
      // Still logout locally even if API call fails
      logout()
      router.push("/landing")
    }
  }

  if (!isAuthenticated) return null

  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-purple-500" />
            <span className="text-2xl font-bold text-white">StudyMate</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
              Dashboard
            </Button>
          </Link>
          <Link href="/documents/upload">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
              Upload
            </Button>
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-white">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-purple-600 text-xs">3</Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden md:block">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-gray-700">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
