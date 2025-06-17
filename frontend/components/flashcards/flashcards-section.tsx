"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiService } from "@/services/api"
import { Loader2, LayoutGrid } from "lucide-react"

interface FlashcardsSectionProps {
  documentId: string
}

export function FlashcardsSection({ documentId }: FlashcardsSectionProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const { data: flashcards, isLoading } = useQuery({
    queryKey: ["flashcards", documentId],
    queryFn: () => apiService.getFlashcards(documentId),
  })

  const handleNext = () => {
    if (flashcards && currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setShowAnswer(false)
    }
  }

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setShowAnswer(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Flashcards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Flashcards</CardTitle>
        <CardDescription className="text-gray-400">AI-generated flashcards from your document</CardDescription>
      </CardHeader>
      <CardContent>
        {!flashcards || flashcards.length === 0 ? (
          <div className="text-center py-8">
            <LayoutGrid className="h-16 w-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No flashcards available</h3>
            <p className="text-gray-400 mb-6">Flashcards will be generated automatically when you upload a document</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`rounded-lg p-8 transition-colors duration-300 ${
              showAnswer ? 'bg-purple-900/30' : 'bg-gray-900'
            }`}>
              <div className="text-center mb-6">
                <p className="text-gray-400">Card {currentCardIndex + 1} of {flashcards.length}</p>
              </div>
              <div 
                className="min-h-[200px] flex items-center justify-center cursor-pointer"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <div className="text-center">
                  <p className="text-xl text-white mb-4">
                    {showAnswer ? flashcards[currentCardIndex].answer : flashcards[currentCardIndex].question}
                  </p>
                  <p className="text-sm text-gray-400">Click to {showAnswer ? "show question" : "reveal answer"}</p>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button
                  onClick={handlePrevious}
                  disabled={currentCardIndex === 0}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                Previous
              </Button>
                <Button
                  onClick={handleNext}
                  disabled={currentCardIndex === flashcards.length - 1}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Next
              </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
