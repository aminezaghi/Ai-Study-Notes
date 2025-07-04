"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { gsap } from "gsap"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, BookOpen, Brain, Zap, Plus, TrendingUp, Clock, Target } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

interface Document {
  id: number
  title: string
  description: string
  status: string
  created_at: string
  files: Array<{
    id: number
    original_filename: string
    page_count: number
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const statsRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await apiClient.get("/documents")
      return response.data.documents as Document[]
    },
  })

  useEffect(() => {
    if (!isLoading) {
      // Animate stats cards
      gsap.set(".stat-card", { opacity: 0, y: 30 });
      const statsAnimation = gsap.to(".stat-card", {
        duration: 0.8,
        y: 0,
        opacity: 1,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2,
      });

      // Animate document cards only if present
      let documentsAnimation = null;
      if (documents && documents.length > 0 && document.querySelectorAll('.document-card').length > 0) {
        gsap.set(".document-card", { opacity: 0, x: -30 });
        documentsAnimation = gsap.to(".document-card", {
          duration: 0.8,
          x: 0,
          opacity: 1,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.5,
        });
      }

      return () => {
        statsAnimation.kill();
        if (documentsAnimation) documentsAnimation.kill();
      };
    }
  }, [documents, isLoading]);

  const stats = [
    {
      title: "Total Documents",
      value: documents?.length || 0,
      icon: <FileText className="h-6 w-6" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Study Sessions",
      value: "24",
      icon: <Clock className="h-6 w-6" />,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Flashcards Created",
      value: "156",
      icon: <Brain className="h-6 w-6" />,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Quizzes Completed",
      value: "12",
      icon: <Target className="h-6 w-6" />,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ]

  const quickActions = [
    {
      title: "Upload Document",
      description: "Add new PDF documents to generate study materials",
      icon: <Plus className="h-8 w-8" />,
      href: "/dashboard/upload",
      color: "from-blue-600 to-purple-600",
    },
    {
      title: "Browse Documents",
      description: "View and manage your uploaded documents",
      icon: <FileText className="h-8 w-8" />,
      href: "/dashboard/documents",
      color: "from-green-600 to-blue-600",
    },
    {
      title: "Study Notes",
      description: "Access AI-generated study notes",
      icon: <BookOpen className="h-8 w-8" />,
      href: "/dashboard/notes",
      color: "from-purple-600 to-pink-600",
    },
    {
      title: "Practice Quiz",
      description: "Test your knowledge with interactive quizzes",
      icon: <Zap className="h-8 w-8" />,
      href: "/dashboard/quizzes",
      color: "from-orange-600 to-red-600",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(" ")[0]}! 👋</h1>
            <p className="text-muted-foreground mt-2">
              Ready to continue your learning journey? Let's make today productive.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Learning streak: 5 days</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="stat-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link key={action.title} href={action.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${action.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className="text-white">{action.icon}</div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Documents */}
      <div ref={cardsRef}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Recent Documents</h2>
          <Link href="/dashboard/documents">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.slice(0, 6).map((document, index) => (
              <Link key={document.id} href={`/dashboard/documents/${document.id}`}>
                <Card className="document-card group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                          {document.title}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">{document.description}</CardDescription>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          document.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                        }`}
                      >
                        {document.status}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{document.files?.length || 0} files</span>
                      </div>
                      <span>{new Date(document.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-6">
                Upload your first PDF document to get started with AI-powered study materials.
              </p>
              <Link href="/dashboard/upload">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Learning Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>This Week's Progress</CardTitle>
            <CardDescription>Your learning activity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Documents Processed</span>
                <span className="text-sm text-muted-foreground">3/5</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-3/5"></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quiz Score Average</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-4/5"></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Study Time</span>
                <span className="text-sm text-muted-foreground">12h 30m</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full w-2/3"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Recommendations</CardTitle>
            <CardDescription>Personalized suggestions for you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Review Machine Learning flashcards</p>
                  <p className="text-xs text-muted-foreground">Last studied 3 days ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Complete Data Structures quiz</p>
                  <p className="text-xs text-muted-foreground">85% completion rate</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Generate notes for new document</p>
                  <p className="text-xs text-muted-foreground">Uploaded yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
