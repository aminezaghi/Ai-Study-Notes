"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModernHeader } from "@/components/layout/modern-header"
import { apiService } from "@/services/api"
import { useAuthStore } from "@/store/auth-store"
import { useDocumentStore } from "@/store/document-store"
import { Plus, FileText, Calendar, TrendingUp, BookOpen, Brain, Zap } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { isAuthenticated } = useAuthStore()
  const { documents, setDocuments } = useDocumentStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const { data, isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiService.getDocuments(),
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (data) {
      setDocuments(data)
    }
  }, [data, setDocuments])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "processing":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "pending":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const stats = [
    {
      title: "Total Documents",
      value: documents.length.toString(),
      icon: <FileText className="h-5 w-5" />,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Study Notes",
      value: documents.reduce((acc, doc) => acc + (doc.study_notes?.length || 0), 0).toString(),
      icon: <BookOpen className="h-5 w-5" />,
      change: "+23%",
      changeType: "positive" as const,
    },
    {
      title: "Flashcards",
      value: documents.reduce((acc, doc) => acc + (doc.flashcards?.length || 0), 0).toString(),
      icon: <Brain className="h-5 w-5" />,
      change: "+5%",
      changeType: "positive" as const,
    },
    {
      title: "Quiz Questions",
      value: documents.reduce((acc, doc) => acc + (doc.quiz_questions?.length || 0), 0).toString(),
      icon: <Zap className="h-5 w-5" />,
      change: "+18%",
      changeType: "positive" as const,
    },
  ]

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-900">
      <ModernHeader />
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back! 👋</h1>
          <p className="text-gray-400">Here's what's happening with your studies today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className="text-purple-400">{stat.icon}</div>
                </div>
                <div className="flex items-center mt-4">
                  <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-sm text-green-400">{stat.change}</span>
                  <span className="text-sm text-gray-400 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Documents Section */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Documents</h2>
                <p className="text-gray-400">Manage and access your study materials</p>
              </div>
              <Button onClick={() => router.push("/documents/upload")} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48 bg-gray-700" />
                          <Skeleton className="h-4 w-32 bg-gray-700" />
                        </div>
                        <Skeleton className="h-6 w-20 bg-gray-700" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-24 bg-gray-700" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <p className="text-center text-gray-400">Failed to load documents. Please try again.</p>
                </CardContent>
              </Card>
            ) : documents.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No documents yet</h3>
                    <p className="text-gray-400 mb-6">
                      Upload your first PDF to get started with AI-generated study materials
                    </p>
                    <Button
                      onClick={() => router.push("/documents/upload")}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <Card
                    key={document.id}
                    className="bg-gray-800 border-gray-700 hover:border-purple-500/50 cursor-pointer transition-all duration-300 group"
                    onClick={() => router.push(`/documents/${document.id}`)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                            {document.title}
                          </CardTitle>
                          <CardDescription className="text-gray-400 line-clamp-2 mt-1">
                            {document.description}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(document.status)}>{document.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(document.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => router.push("/documents/upload")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload New Document
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => router.push("/documents")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Documents
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => router.push("/flashcards")}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Practice Flashcards
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-400">No recent activity</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
