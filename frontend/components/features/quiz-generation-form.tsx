"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus } from "lucide-react"

type QuizType = "multiple_choice" | "true_false" | "fill_in_blanks"
type QuizDifficulty = "easy" | "medium" | "hard"

interface QuizGenerationFormProps {
  onSubmit: (data: {
    title: string
    type: QuizType
    numQuestions: number
    difficulty: QuizDifficulty
  }) => Promise<void>
  isGenerating: boolean
}

export function QuizGenerationForm({ onSubmit, isGenerating }: QuizGenerationFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    type: "multiple_choice" as QuizType,
    numQuestions: 10,
    difficulty: "medium" as QuizDifficulty
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Quiz
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate New Quiz</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter quiz title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Quiz Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: QuizType) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select quiz type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="fill_in_blanks">Fill in the Blanks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numQuestions">Number of Questions</Label>
            <Input
              id="numQuestions"
              type="number"
              min={1}
              max={20}
              value={formData.numQuestions}
              onChange={(e) => setFormData(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value: QuizDifficulty) => setFormData(prev => ({ ...prev, difficulty: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Generating Quiz...
              </>
            ) : (
              "Generate Quiz"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 