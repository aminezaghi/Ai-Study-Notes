"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Brain, ChevronLeft, ChevronRight, Shuffle, HelpCircle, CheckCircle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

interface Flashcard {
  id: number
  document_id: number
  question: string
  answer: string
  created_at: string
  updated_at: string
}

interface FlashcardsTabProps {
  documentId: string
}

export function FlashcardsTab({ documentId }: FlashcardsTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const { data: response, isLoading } = useQuery({
    queryKey: ["flashcards", documentId],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${documentId}/flashcards`)
      return response.data as { flashcards: Flashcard[] }
    },
  })

  const flashcards = response?.flashcards

  const handleNext = () => {
    if (flashcards && currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleShuffle = () => {
    if (flashcards) {
      setCurrentIndex(Math.floor(Math.random() * flashcards.length))
      setIsFlipped(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No flashcards available</h3>
        <p className="text-muted-foreground mb-6">
          We're generating flashcards from your document. This might take a few moments.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Flashcards</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {flashcards.length}
          </span>
        </div>
      </div>

      <Card
        className={cn(
          "min-h-[300px] cursor-pointer transition-all duration-500",
          "hover:shadow-lg",
          isFlipped 
            ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800" 
            : "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800"
        )}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <CardContent className="p-6 min-h-[300px] flex flex-col items-center justify-center text-center gap-4">
          <div className="flex items-center justify-center mb-2">
            {isFlipped ? (
              <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <HelpCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            )}
          </div>
          <div className={cn(
            "text-xl transition-all duration-300",
            isFlipped 
              ? "text-blue-900 dark:text-blue-100" 
              : "text-orange-900 dark:text-orange-100"
          )}>
            {isFlipped ? flashcards[currentIndex].answer : flashcards[currentIndex].question}
          </div>
          <div className="text-sm text-muted-foreground mt-4">
            {isFlipped ? "Answer" : "Question"} • Click to flip
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 