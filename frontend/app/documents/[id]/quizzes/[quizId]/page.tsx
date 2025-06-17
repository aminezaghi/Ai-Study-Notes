"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/header"
import { apiService } from "@/services/api"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"

interface Question {
  id: string
  question: string
  type: "multiple_choice" | "true_false" | "fill_in_blanks"
  options?: string[]
  correct_answer: string
  explanation?: string
}

interface Quiz {
  id: string
  title: string
  type: string
  questions: Question[]
}

export default function QuizTakingPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string
  const quizId = params.quizId as string

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ["quiz", documentId, quizId],
    queryFn: () => apiService.getQuiz(documentId, quizId),
  })

  const quiz: Quiz = data?.quiz

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = () => {
    if (!quiz) return

    let correctCount = 0
    quiz.questions.forEach((question) => {
      if (answers[question.id] === question.correct_answer) {
        correctCount++
      }
    })

    setScore(correctCount)
    setIsSubmitted(true)
  }

  const canSubmit = quiz?.questions.every((q) => answers[q.id]) || false

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading quiz...</div>
        </main>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">Failed to load quiz</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Document
          </Button>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            {isSubmitted && (
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {score}/{quiz.questions.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round((score / quiz.questions.length) * 100)}% correct
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {quiz.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {index + 1}
                  {isSubmitted && (
                    <span className="ml-2">
                      {answers[question.id] === question.correct_answer ? (
                        <CheckCircle className="inline h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="inline h-5 w-5 text-red-600" />
                      )}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent>
                {question.type === "multiple_choice" && question.options && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    disabled={isSubmitted}
                  >
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                        <Label
                          htmlFor={`${question.id}-${optionIndex}`}
                          className={`flex-1 ${
                            isSubmitted
                              ? option === question.correct_answer
                                ? "text-green-600 font-medium"
                                : answers[question.id] === option
                                  ? "text-red-600"
                                  : ""
                              : ""
                          }`}
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.type === "true_false" && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    disabled={isSubmitted}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id={`${question.id}-true`} />
                      <Label
                        htmlFor={`${question.id}-true`}
                        className={
                          isSubmitted
                            ? question.correct_answer === "true"
                              ? "text-green-600 font-medium"
                              : answers[question.id] === "true"
                                ? "text-red-600"
                                : ""
                            : ""
                        }
                      >
                        True
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id={`${question.id}-false`} />
                      <Label
                        htmlFor={`${question.id}-false`}
                        className={
                          isSubmitted
                            ? question.correct_answer === "false"
                              ? "text-green-600 font-medium"
                              : answers[question.id] === "false"
                                ? "text-red-600"
                                : ""
                            : ""
                        }
                      >
                        False
                      </Label>
                    </div>
                  </RadioGroup>
                )}

                {question.type === "fill_in_blanks" && (
                  <div className="space-y-2">
                    <Input
                      value={answers[question.id] || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Enter your answer"
                      disabled={isSubmitted}
                      className={
                        isSubmitted
                          ? answers[question.id] === question.correct_answer
                            ? "border-green-500"
                            : "border-red-500"
                          : ""
                      }
                    />
                    {isSubmitted && <p className="text-sm text-green-600">Correct answer: {question.correct_answer}</p>}
                  </div>
                )}

                {isSubmitted && question.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          {!isSubmitted ? (
            <Button onClick={handleSubmit} disabled={!canSubmit} size="lg">
              Submit Quiz
            </Button>
          ) : (
            <div className="flex space-x-4">
              <Button
                onClick={() => {
                  setAnswers({})
                  setIsSubmitted(false)
                  setScore(0)
                }}
                variant="outline"
              >
                Retake Quiz
              </Button>
              <Button onClick={() => router.back()}>Return to Document</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
