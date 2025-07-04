"use client"

import { useDocumentQuizzes } from "@/hooks/use-document-quizzes"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Brain } from "lucide-react"
import type { Quiz } from "@/types/quiz"
import { useEffect } from "react"

interface QuizTabProps {
  documentId: string
}

export function QuizTab({ documentId }: QuizTabProps) {
  const { data, isLoading, error, refetch } = useDocumentQuizzes(documentId)

  // Automatically retry once on mount if we have an error
  useEffect(() => {
    if (error) {
      refetch()
    }
  }, [error, refetch])

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Ensure we have data
  const quizzes = data?.quizzes || []
  const hasQuizzes = Array.isArray(quizzes) && quizzes.length > 0

  // Handle empty state
  if (!hasQuizzes) {
    return (
      <div className="text-center py-12">
        <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No quizzes available</h3>
        <p className="text-muted-foreground mb-6">
          We're generating quizzes from your document. This might take a few moments.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Quizzes</h2>
        <span className="text-sm text-muted-foreground">
          {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"} available
        </span>
      </div>

      <div className="grid gap-4">
        {quizzes.map((quiz: Quiz) => (
          <div
            key={quiz.id}
            className="p-4 rounded-lg border bg-card text-card-foreground"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{quiz.title}</h3>
              <span className="text-sm text-muted-foreground capitalize">
                {quiz.difficulty}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {quiz.total_questions} questions • {quiz.type}
            </p>
            {/* Add start quiz button and other functionality here */}
          </div>
        ))}
      </div>
    </div>
  )
} 