"use client"

import { useDocumentQuizzes } from "@/hooks/use-document-quizzes"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Brain, Plus, Play } from "lucide-react"
import type { Quiz } from "@/types/quiz"
import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useGenerateQuiz } from "@/hooks/use-study-materials"
import { useToast } from "@/hooks/use-toast"
import { QuizPlayer } from "@/components/features/quiz-player"
import { QuizGenerationForm } from "@/components/features/quiz-generation-form"

type QuizType = "multiple_choice" | "true_false" | "fill_in_blanks"
type QuizDifficulty = "easy" | "medium" | "hard"

interface QuizzesTabProps {
  documentId: string
}

export function QuizzesTab({ documentId }: QuizzesTabProps) {
  const queryClient = useQueryClient()
  const queryKey = ["quizzes", documentId]
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const generateQuiz = useGenerateQuiz()

  // Log component mount and document ID
  useEffect(() => {
    console.log('QuizzesTab mounted with document ID:', documentId)
  }, [documentId])

  const { data, isLoading, error, refetch } = useDocumentQuizzes(documentId)

  // Log data changes
  useEffect(() => {
    console.log('QuizzesTab data changed:', {
      isLoading,
      error,
      data,
      documentId
    })
  }, [data, isLoading, error, documentId])

  const handleGenerateQuiz = async (formData: {
    title: string
    type: QuizType
    numQuestions: number
    difficulty: QuizDifficulty
  }) => {
    try {
      setIsGenerating(true)
      await generateQuiz.mutateAsync({
        documentId: parseInt(documentId),
        title: formData.title,
        type: formData.type,
        numQuestions: formData.numQuestions,
        difficulty: formData.difficulty
      })
      toast({
        title: "Quiz generated",
        description: "A new quiz has been generated from your document.",
      })
      // Force refetch after generation
      await refetch()
    } catch (error) {
      console.error('Error generating quiz:', error)
      toast({
        title: "Failed to generate quiz",
        description: "There was an error generating the quiz. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz)
  }

  const handleCompleteQuiz = () => {
    toast({
      title: "Quiz completed",
      description: "Your quiz results have been saved.",
    })
    setActiveQuiz(null)
  }

  const handleExitQuiz = () => {
    setActiveQuiz(null)
  }

  // If a quiz is active, show the quiz player
  if (activeQuiz) {
    return (
      <QuizPlayer
        quiz={activeQuiz}
        onComplete={handleCompleteQuiz}
        onExit={handleExitQuiz}
      />
    )
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Handle error state
  if (error) {
    console.error('QuizzesTab error:', error)
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2 text-red-600">Error loading quizzes</h3>
        <p className="text-muted-foreground mb-6">
          There was an error loading your quizzes. Please try again.
        </p>
        <Button onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  // Ensure we have data
  const quizzes = data?.quizzes || []
  console.log('Rendering quizzes:', quizzes)
  const hasQuizzes = Array.isArray(quizzes) && quizzes.length > 0

  // Handle empty state
  if (!hasQuizzes) {
    return (
      <div className="text-center py-12">
        <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No quizzes available</h3>
        <p className="text-muted-foreground mb-6">
          Generate your first quiz from this document.
        </p>
        <QuizGenerationForm onSubmit={handleGenerateQuiz} isGenerating={isGenerating} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Quizzes</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"} available
          </span>
          <QuizGenerationForm onSubmit={handleGenerateQuiz} isGenerating={isGenerating} />
        </div>
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {quiz.total_questions} questions • {quiz.type}
              </p>
              <Button variant="outline" onClick={() => handleStartQuiz(quiz)}>
                <Play className="mr-2 h-4 w-4" />
                Start Quiz
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 