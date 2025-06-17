"use client"

import type React from "react"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

interface QuizGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
}

export function QuizGenerationModal({ isOpen, onClose, documentId }: QuizGenerationModalProps) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState("")
  const [numQuestions, setNumQuestions] = useState(5)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const generateQuizMutation = useMutation({
    mutationFn: (data: { title: string; type: string; num_questions: number }) =>
      apiService.generateQuiz(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", documentId] })
      toast({
        title: "Success",
        description: "Quiz generated successfully",
      })
      onClose()
      resetForm()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate quiz",
        variant: "destructive",
      })
    },
  })

  const resetForm = () => {
    setTitle("")
    setType("")
    setNumQuestions(5)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !type) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    generateQuizMutation.mutate({
      title,
      type,
      num_questions: numQuestions,
    })
  }

  const handleClose = () => {
    if (!generateQuizMutation.isPending) {
      onClose()
      resetForm()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate New Quiz</DialogTitle>
          <DialogDescription>Create a custom quiz based on your document content</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Quiz Title</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-type">Quiz Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select quiz type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="fill_in_blanks">Fill in Blanks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="num-questions">Number of Questions</Label>
            <Input
              id="num-questions"
              type="number"
              min="1"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number.parseInt(e.target.value))}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={generateQuizMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={generateQuizMutation.isPending}>
              {generateQuizMutation.isPending ? "Generating..." : "Generate Quiz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
