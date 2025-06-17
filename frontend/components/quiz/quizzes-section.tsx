"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/services/api"
import { Loader2, BrainCircuit, Plus, Play } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Quiz, Question } from "@/lib/types"

interface QuizzesSectionProps {
  documentId: string
}

const quizTypes = {
  multiple_choice: "Multiple Choice",
  true_false: "True/False",
  fill_in_blanks: "Fill in the Blanks",
} as const

const generateQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["multiple_choice", "true_false", "fill_in_blanks"]),
  total_questions: z.coerce.number().int().min(1).max(50),
})

type GenerateQuizForm = z.infer<typeof generateQuizSchema>

export function QuizzesSection({ documentId }: QuizzesSectionProps) {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<GenerateQuizForm>({
    resolver: zodResolver(generateQuizSchema),
    defaultValues: {
      title: "",
      type: "multiple_choice",
      total_questions: 10,
    },
  })
  const generateMutation = useMutation({
    mutationFn: (data: GenerateQuizForm) => apiService.generateQuiz(documentId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", documentId] })
      toast({
        title: "Success",
        description: "Quiz generated successfully",
      })
      setIsGenerateDialogOpen(false)
      form.reset()
    },
    onError: (error: any) => {
      console.error("Quiz generation error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    },
  })
  const onSubmit = async (data: GenerateQuizForm) => {
    try {
      await generateMutation.mutateAsync(data)
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error("Form submission error:", error)
    }
  }

  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ["quizzes", documentId],
    queryFn: () => apiService.getQuizzes(documentId),
  })

  const { data: currentQuiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ["quiz", documentId, selectedQuiz],
    queryFn: () => selectedQuiz ? apiService.getQuiz(documentId, selectedQuiz) : null,
    enabled: !!selectedQuiz,
  })

  if (isLoadingQuizzes) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quizzes</CardTitle>
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Quizzes</CardTitle>
          <CardDescription className="text-gray-400">Test your knowledge with AI-generated quizzes</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          className="bg-purple-600 hover:bg-purple-700 mb-4"
          onClick={() => setIsGenerateDialogOpen(true)}
        >
              <Plus className="h-4 w-4 mr-2" />
              Generate Quiz
            </Button>

        {isGenerateDialogOpen && (
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogContent className="bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Generate New Quiz</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiz Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Enter quiz title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiz Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue placeholder="Select quiz type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {Object.entries(quizTypes).map(([value, label]) => (
                              <SelectItem 
                                key={value} 
                                value={value}
                                className="text-white hover:bg-gray-600"
                              >
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="total_questions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Questions</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={50}
                            {...field}
                            onChange={event => field.onChange(event.target.valueAsNumber)}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Quiz"
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}

        {!isGenerateDialogOpen && selectedQuiz && currentQuiz && (
          <Dialog open={!!selectedQuiz} onOpenChange={(open) => !open && setSelectedQuiz(null)}>
            <DialogContent className="bg-gray-800 text-white max-w-3xl">
              <DialogHeader>
                <DialogTitle>{currentQuiz.title}</DialogTitle>
              </DialogHeader>
              <QuizDialogContent quiz={currentQuiz} />
            </DialogContent>
          </Dialog>
        )}
        {!quizzes || quizzes.length === 0 ? (
          <div className="text-center py-8">
            <BrainCircuit className="h-16 w-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No quizzes yet</h3>
            <p className="text-gray-400 mb-6">Generate your first quiz to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-white">{quiz.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-purple-600">
                      {quizTypes[quiz.type as keyof typeof quizTypes]}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      {quiz.total_questions} questions
                    </span>
                  </div>
                </div>
                  <Button
                    variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-600"
                  onClick={() => setSelectedQuiz(quiz.id)}
                  >
                  <Play className="h-4 w-4 mr-2" />
                  Take Quiz
                  </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuizDialogContent({ quiz }: { quiz: Quiz }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const canSubmit = useMemo(
    () => quiz.questions.every((q: Question) => answers[q.id] && answers[q.id] !== ""),
    [quiz.questions, answers]
  )

  const handleSubmit = () => {
    let correctCount = 0
    quiz.questions.forEach((q: Question) => {
      if (answers[q.id] === q.correct_answer) correctCount++
    })
    setScore(correctCount)
    setIsSubmitted(true)
  }

  return (
    <div>
      {isSubmitted && (
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-green-400">
            {score}/{quiz.questions.length}
          </div>
          <div className="text-sm text-gray-400">
            Score: {Math.round((score / quiz.questions.length) * 100)}%
          </div>
        </div>
      )}
      <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
        {quiz.questions.map((question: Question, index: number) => {
          const userAnswer = answers[question.id] || ""
          const isCorrect = userAnswer === question.correct_answer
          return (
            <div key={question.id} className="space-y-4">
              <h4 className="text-lg font-medium">
                Question {index + 1}: {question.question}
                {isSubmitted && (
                  <span className="ml-2">
                    {isCorrect ? (
                      <span className="text-green-400">✔</span>
                    ) : (
                      <span className="text-red-400">✘</span>
                    )}
                  </span>
                )}
              </h4>
              <div className="space-y-2">
                {question.type === "multiple_choice" && question.options?.map((option: string, optionIndex: number) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      id={`option-${question.id}-${optionIndex}`}
                      value={option}
                      checked={userAnswer === option}
                      onChange={() => handleAnswerChange(question.id, option)}
                      className="text-purple-600 focus:ring-purple-500"
                      disabled={isSubmitted}
                    />
                    <Label
                      htmlFor={`option-${question.id}-${optionIndex}`}
                      className={`text-gray-300 ${isSubmitted ? (option === question.correct_answer ? "text-green-400 font-medium" : userAnswer === option ? "text-red-400" : "") : ""}`}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
                {question.type === "true_false" && (
                  <>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        id={`option-${question.id}-true`}
                        value="true"
                        checked={userAnswer === "true"}
                        onChange={() => handleAnswerChange(question.id, "true")}
                        className="text-purple-600 focus:ring-purple-500"
                        disabled={isSubmitted}
                      />
                      <Label
                        htmlFor={`option-${question.id}-true`}
                        className={`text-gray-300 ${isSubmitted ? (question.correct_answer === "true" ? "text-green-400 font-medium" : userAnswer === "true" ? "text-red-400" : "") : ""}`}
                      >
                        True
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        id={`option-${question.id}-false`}
                        value="false"
                        checked={userAnswer === "false"}
                        onChange={() => handleAnswerChange(question.id, "false")}
                        className="text-purple-600 focus:ring-purple-500"
                        disabled={isSubmitted}
                      />
                      <Label
                        htmlFor={`option-${question.id}-false`}
                        className={`text-gray-300 ${isSubmitted ? (question.correct_answer === "false" ? "text-green-400 font-medium" : userAnswer === "false" ? "text-red-400" : "") : ""}`}
                      >
                        False
                      </Label>
                    </div>
                  </>
                )}
                {question.type === "fill_in_blanks" && (
                  <input
                    type="text"
                    name={`question-${question.id}`}
                    id={`option-${question.id}`}
                    value={userAnswer}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className={`w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2 ${isSubmitted ? (isCorrect ? "border-green-500" : "border-red-500") : ""}`}
                    placeholder="Enter your answer"
                    disabled={isSubmitted}
                  />
                )}
              </div>
              {isSubmitted && !isCorrect && question.explanation && (
                <div className="mt-2 p-3 bg-blue-900/40 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-8 flex justify-center">
        {!isSubmitted ? (
          <Button onClick={handleSubmit} disabled={!canSubmit} size="lg">
            Submit Quiz
          </Button>
        ) : (
          <Button onClick={() => { setAnswers({}); setIsSubmitted(false); setScore(0); }} variant="outline">
            Retake Quiz
          </Button>
        )}
      </div>
    </div>
  )
}
