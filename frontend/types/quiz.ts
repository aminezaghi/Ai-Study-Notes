export type QuizDifficulty = "easy" | "medium" | "hard"

export type QuizQuestion = {
  id: number
  document_id: number
  quiz_id: number
  question: string
  type: string
  options: string[]
  correct_answer: string
  explanation: string
  created_at: string
  updated_at: string
}

export type Quiz = {
  id: number
  document_id: number
  title: string
  type: string
  difficulty: QuizDifficulty
  total_questions: number
  created_at: string
  updated_at: string
  questions: QuizQuestion[]
}

export type QuizzesResponse = {
  quizzes: Quiz[]
  available_difficulties: QuizDifficulty[]
} 