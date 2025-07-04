"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  FileText,
  GraduationCap,
  HelpCircle,
  Info,
  ListChecks,
  MessageCircle,
  Target,
  X,
  Check,
} from "lucide-react"
import { useEnhancedStudyNotes, type EnhancedNote, type Question, useValidateAnswer } from "@/hooks/use-study-materials"

interface QuestionState {
  answered: boolean
  selectedAnswer: string | null
  isCorrect: boolean
}

interface Example {
  title: string
  description: string
}

interface EnhancedStudyNotesTabProps {
  documentId: string
}

export function EnhancedStudyNotesTab({ documentId }: EnhancedStudyNotesTabProps) {
  const { data, isLoading } = useEnhancedStudyNotes(documentId)
  const [activeNote, setActiveNote] = React.useState<EnhancedNote | null>(null)
  const [activeTab, setActiveTab] = React.useState("overview")
  const [questionStates, setQuestionStates] = React.useState<Record<number, QuestionState & { feedback?: string; confidence?: number; similarity_score?: number }>>({})
  const validateAnswerMutation = useValidateAnswer()

  // Set the first note as active when data is loaded
  React.useEffect(() => {
    if (data?.enhanced_notes && data.enhanced_notes.length > 0) {
      setActiveNote(data.enhanced_notes[0])
    }
  }, [data])

  const handleAnswerSubmit = async (question: Question, answer: string) => {
    if (question.type === "fill_blank" || question.type === "short_answer") {
      validateAnswerMutation.mutate({
        question: question.question,
        correct_answer: question.correct_answer,
        user_answer: answer,
        question_type: question.type,
      }, {
        onSuccess: (result) => {
          setQuestionStates((prev) => ({
            ...prev,
            [question.id]: {
              answered: true,
              selectedAnswer: answer,
              isCorrect: result.is_correct,
              feedback: result.feedback,
              confidence: result.confidence,
              similarity_score: result.similarity_score,
            },
          }))
        },
        onError: () => {
          setQuestionStates((prev) => ({
            ...prev,
            [question.id]: {
              answered: true,
              selectedAnswer: answer,
              isCorrect: false,
              feedback: "Could not validate answer. Please try again.",
            },
          }))
        },
      })
    } else {
      setQuestionStates((prev) => ({
        ...prev,
        [question.id]: {
          answered: true,
          selectedAnswer: answer,
          isCorrect: answer.toLowerCase() === question.correct_answer.toLowerCase(),
        },
      }))
    }
  }

  const renderQuestion = (question: Question, index: number) => {
    const state = questionStates[question.id] || {
      answered: false,
      selectedAnswer: null,
      isCorrect: false,
    }

    const getAnswerFeedback = () => {
      if (!state.answered) return null
      if (question.type === "fill_blank" || question.type === "short_answer") {
        return (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {state.isCorrect ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-green-500">Correct!</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-red-500">Incorrect.</span>
                </>
              )}
            </div>
            {state.feedback && (
              <div className="text-sm text-muted-foreground">{state.feedback}</div>
            )}
            {typeof state.similarity_score === "number" && (
              <div className="text-xs text-gray-400">Similarity: {state.similarity_score}%</div>
            )}
          </div>
        )
      }
      return (
        <div className="mt-4 flex items-center gap-2">
          {state.isCorrect ? (
            <>
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-green-500">Correct!</span>
            </>
          ) : (
            <>
              <X className="h-5 w-5 text-red-500" />
              <span className="text-red-500">
                Incorrect. The correct answer is: {question.correct_answer}
              </span>
            </>
          )}
        </div>
      )
    }

    return (
      <Card key={index}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">Question {index + 1}</CardTitle>
            <Badge>{question.type}</Badge>
          </div>
          <CardDescription className="mt-2 text-base">
            {question.question}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {question.type === "mcq" && Array.isArray(question.choices) && (
            <div className="space-y-2">
              {question.choices.map((choice, choiceIndex) => {
                const isSelected = state.selectedAnswer === choice;
                const isCorrect = choice === question.correct_answer;
                const isAnswered = state.answered;
                // Determine button color classes
                let colorClass = "";
                if (isAnswered) {
                  if (isSelected && isCorrect) {
                    colorClass = "border-green-600 bg-green-500 text-white hover:bg-green-600";
                  } else if (isSelected && !isCorrect) {
                    colorClass = "border-red-600 bg-red-500 text-white hover:bg-red-600";
                  } else if (isCorrect) {
                    colorClass = "border-green-600 bg-green-500 text-white hover:bg-green-600";
                  }
                }
                return (
                  <Button
                    key={choiceIndex}
                    variant={
                      isSelected
                        ? isAnswered
                          ? isCorrect
                            ? "secondary"
                            : "destructive"
                          : "secondary"
                        : "outline"
                    }
                    className={cn(
                      "w-full justify-start",
                      colorClass
                    )}
                    onClick={() => {
                      if (!isAnswered) {
                        handleAnswerSubmit(question, choice)
                      }
                    }}
                    disabled={isAnswered}
                  >
                    {choice}
                  </Button>
                );
              })}
            </div>
          )}
          {question.type === "fill_blank" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Your answer..."
                  disabled={state.answered || validateAnswerMutation.isPending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !state.answered && !validateAnswerMutation.isPending) {
                      handleAnswerSubmit(question, e.currentTarget.value)
                    }
                  }}
                />
                <Button
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector("input")
                    if (input && !state.answered && !validateAnswerMutation.isPending) {
                      handleAnswerSubmit(question, input.value)
                    }
                  }}
                  disabled={state.answered || validateAnswerMutation.isPending}
                >
                  {validateAnswerMutation.isPending && state.selectedAnswer === null ? <LoadingSpinner size="sm" /> : "Submit"}
                </Button>
              </div>
              {getAnswerFeedback()}
            </div>
          )}
          {question.type === "short_answer" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Your answer..."
                  disabled={state.answered || validateAnswerMutation.isPending}
                  rows={4}
                />
                <Button
                  onClick={(e) => {
                    const textarea = e.currentTarget.parentElement?.querySelector("textarea")
                    if (textarea && !state.answered && !validateAnswerMutation.isPending) {
                      handleAnswerSubmit(question, textarea.value)
                    }
                  }}
                  disabled={state.answered || validateAnswerMutation.isPending}
                >
                  {validateAnswerMutation.isPending && state.selectedAnswer === null ? <LoadingSpinner size="sm" /> : "Submit"}
                </Button>
              </div>
              {getAnswerFeedback()}
            </div>
          )}
          {state.answered && !state.isCorrect && (
            <div className="mt-4">
              
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data?.enhanced_notes || data.enhanced_notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Study Notes Available</CardTitle>
          <CardDescription>
            There are no enhanced study notes available for this document yet.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Sidebar - Course Progress */}
      <Card className="col-span-3 h-[calc(100vh-300px)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Course Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-4">
              {/* Course Sections */}
              <div className="space-y-2">
                {data.enhanced_notes.map((note) => (
                  <Button
                    key={note.id}
                    variant={activeNote?.id === note.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 font-medium"
                    onClick={() => setActiveNote(note)}
                  >
                    <ChevronRight className="h-4 w-4" />
                    {note.section_title}
                  </Button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="col-span-9 space-y-6">
        {activeNote ? (
          <>
            {/* Course Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{activeNote.section_title}</CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {activeNote.lesson_intro}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="mt-1">
                    Section {activeNote.order + 1}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Course Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="key-points" className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Key Points
                </TabsTrigger>
                <TabsTrigger value="definitions" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Definitions
                </TabsTrigger>
                <TabsTrigger value="examples" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Examples
                </TabsTrigger>
                <TabsTrigger value="practice" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Practice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Course Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold">Introduction</h3>
                      <p className="mt-2 text-muted-foreground">{activeNote.lesson_intro}</p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-semibold">Summary</h3>
                      <p className="mt-2 text-muted-foreground">{activeNote.section_summary}</p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-semibold">Next Topic</h3>
                      <p className="mt-2 text-muted-foreground">{activeNote.next_topic}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="key-points" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5" />
                      Key Learning Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activeNote.key_points.map((point, index) => (
                        <div key={index} className="flex gap-3">
                          <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                          <p className="text-muted-foreground">{point}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="definitions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Key Terms and Definitions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {Object.entries(activeNote.definitions).map(([term, definition], index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-lg">{term}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">{definition}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Examples and Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      {activeNote.examples.map((example, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-lg">{example.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">{example.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="practice" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Practice Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {activeNote?.questions.map((question, index) => renderQuestion(question, index))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Task Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Your Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{activeNote.task}</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Study Notes Available</CardTitle>
              <CardDescription>
                There are no enhanced study notes available for this document yet.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}
