"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy } from "lucide-react"
import type { Quiz, QuizQuestion } from "@/types/quiz"
import { cn } from "@/lib/utils"
import { useValidateAnswer } from "@/hooks/use-study-materials"

interface QuizPlayerProps {
  quiz: Quiz
  onComplete: () => void
  onExit: () => void
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[] | undefined | null): T[] {
  if (!Array.isArray(array)) {
    return []
  }
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function QuizPlayer({ quiz, onComplete, onExit }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [resultFeedback, setResultFeedback] = useState<Record<number, {
    isCorrect: boolean;
    feedback?: string;
    confidence?: number;
    similarity_score?: number;
  }>>({})
  const [resultsLoading, setResultsLoading] = useState(false)
  const validateAnswerMutation = useValidateAnswer()

  // Shuffle options for each question once when the component mounts
  const shuffledQuestions = useMemo(() => {
    if (!Array.isArray(quiz.questions)) {
      console.error('Quiz questions is not an array:', quiz.questions)
      return []
    }

    return quiz.questions.map(question => {
      if (!question) {
        console.error('Invalid question:', question)
        return null
      }

      const options = Array.isArray(question.options) ? question.options : []
      return {
        ...question,
        type: question.type || "multiple_choice",
        options: options,
        shuffledOptions: question.type === "fill_in_blanks" ? options : shuffleArray(options)
      }
    }).filter(Boolean) as (QuizQuestion & { shuffledOptions: string[] })[]
  }, [quiz.questions])

  // Handle empty quiz case
  if (shuffledQuestions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Error Loading Quiz</h3>
        <p className="text-muted-foreground mb-6">
          This quiz appears to be empty or invalid.
        </p>
        <Button onClick={onExit}>Exit Quiz</Button>
      </div>
    )
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  
  // Check if the current question has been answered
  const hasAnsweredCurrentQuestion = currentQuestion && selectedAnswers[currentQuestion.id] !== undefined

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return

    // Clear any previous answer for this question ID and set the new one
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }))
  }

  const handleFillBlankSubmit = (question: QuizQuestion, answer: string) => {
    setResultFeedback((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], pending: true }
    }))
    validateAnswerMutation.mutate({
      question: question.question,
      correct_answer: question.correct_answer,
      user_answer: answer,
      question_type: "fill_blank",
    }, {
      onSuccess: (result) => {
        setResultFeedback((prev) => ({
          ...prev,
          [question.id]: {
            isCorrect: result.is_correct,
            feedback: result.feedback,
            confidence: result.confidence,
            similarity_score: result.similarity_score,
            pending: false,
          },
        }))
      },
      onError: () => {
        setResultFeedback((prev) => ({
          ...prev,
          [question.id]: {
            isCorrect: false,
            feedback: "Could not validate answer. Please try again.",
            pending: false,
          },
        }))
      },
    })
    setSelectedAnswers((prev) => ({ ...prev, [question.id]: answer }))
  }

  const handleNext = () => {
    if (isLastQuestion) {
      handleFinishQuiz()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleFinishQuiz = async () => {
    setResultsLoading(true)
    // Prepare validation for fill_in_blanks
    const fillBlankQuestions = shuffledQuestions.filter(q => q.type === "fill_in_blanks")
    const feedback: Record<number, any> = {}
    // Validate all fill_in_blanks answers in parallel
    await Promise.all(
      fillBlankQuestions.map(async (q) => {
        const userAnswer = selectedAnswers[q.id] || ""
        try {
          const result = await validateAnswerMutation.mutateAsync({
            question: q.question,
            correct_answer: q.correct_answer,
            user_answer: userAnswer,
            question_type: "fill_blank",
          })
          feedback[q.id] = {
            isCorrect: result.is_correct,
            feedback: result.feedback,
            confidence: result.confidence,
            similarity_score: result.similarity_score,
          }
        } catch {
          feedback[q.id] = {
            isCorrect: false,
            feedback: "Could not validate answer. Please try again.",
          }
        }
      })
    )
    // For other questions, check correctness directly
    shuffledQuestions.forEach(q => {
      if (q.type !== "fill_in_blanks") {
        const userAnswer = selectedAnswers[q.id]
        feedback[q.id] = {
          isCorrect: userAnswer?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim(),
        }
      }
    })
    setResultFeedback(feedback)
    // Calculate score
    const correctAnswers = shuffledQuestions.filter(q => feedback[q.id]?.isCorrect).length
    setScore(correctAnswers)
    setShowResults(true)
    setResultsLoading(false)
  }

  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => prev - 1)
  }

  const renderAnswerInput = () => {
    if (!currentQuestion) return null

    // Generate a unique name for the radio group based on the question ID
    const radioGroupName = `question-${currentQuestion.id}`

    switch (currentQuestion.type) {
      case "multiple_choice":
        return (
          <RadioGroup
            value={selectedAnswers[currentQuestion.id] || ""}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {(currentQuestion.shuffledOptions || []).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${radioGroupName}-${option}`} />
                <Label htmlFor={`${radioGroupName}-${option}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "true_false":
        return (
          <RadioGroup
            value={selectedAnswers[currentQuestion.id] || ""}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${radioGroupName}-true`} />
              <Label htmlFor={`${radioGroupName}-true`} className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${radioGroupName}-false`} />
              <Label htmlFor={`${radioGroupName}-false`} className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        )

      case "fill_in_blanks":
        const feedback = resultFeedback[currentQuestion.id]
        // Remove all 'pending' logic, just check if feedback exists
        const answered = !!feedback
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={selectedAnswers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                placeholder="Type your answer here..."
                className="max-w-md"
                disabled={answered || resultsLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !answered && !resultsLoading) {
                    // Do nothing, answers are only checked at the end
                  }
                }}
              />
             
            </div>
            {answered && (
              <div className="mt-2">
                {feedback.isCorrect ? (
                  <span className="text-green-600 font-semibold">Correct!</span>
                ) : (
                  <span className="text-red-600 font-semibold">Incorrect.</span>
                )}
                {feedback.feedback && (
                  <div className="text-sm text-muted-foreground">{feedback.feedback}</div>
                )}
                {typeof feedback.similarity_score === "number" && (
                  <div className="text-xs text-gray-400">Similarity: {feedback.similarity_score}%</div>
                )}
              </div>
            )}
          </div>
        )

      default:
        return (
          <RadioGroup
            value={selectedAnswers[currentQuestion.id] || ""}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {(currentQuestion.shuffledOptions || []).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${radioGroupName}-${option}`} />
                <Label htmlFor={`${radioGroupName}-${option}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )
    }
  }

  if (showResults) {
    return (
      <div className="space-y-8">
        <Card className="p-6 text-center">
          <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-lg mb-4">
            You scored {score} out of {shuffledQuestions.length} ({Math.round((score / shuffledQuestions.length) * 100)}%)
          </p>
          <div className="space-y-6">
            {shuffledQuestions.map((question, index) => {
              const userAnswer = selectedAnswers[question.id]
              const feedback = resultFeedback[question.id]
              return (
                <div key={question.id} className="text-left">
                  <div className="flex items-start gap-2">
                    {feedback?.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">Question {index + 1}</p>
                      <p className="mb-2">{question.question}</p>
                      <p className="text-sm">
                        <span className="font-medium">Your answer: </span>
                        <span className={feedback?.isCorrect ? "text-green-600" : "text-red-600"}>
                          {userAnswer || "No answer provided"}
                        </span>
                      </p>
                      {!feedback?.isCorrect && (
                        <p className="text-sm">
                          <span className="font-medium">Correct answer: </span>
                          <span className="text-green-600">{question.correct_answer}</span>
                        </p>
                      )}
                      {feedback?.feedback && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Feedback: </span>
                          {feedback.feedback}
                        </p>
                      )}
                      {typeof feedback?.similarity_score === "number" && (
                        <div className="text-xs text-gray-400">Similarity: {feedback.similarity_score}%</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={onExit}>Exit Quiz</Button>
            <Button onClick={onComplete}>Save Results</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onExit}>Exit Quiz</Button>
        <span className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
        </span>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{currentQuestion?.question}</h2>
        {renderAnswerInput()}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!hasAnsweredCurrentQuestion || resultsLoading}
        >
          {isLastQuestion ? (resultsLoading ? "Checking Answers..." : "Finish Quiz") : "Next Question"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 