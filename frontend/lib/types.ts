export interface User {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  title: string
  description: string
  status: "pending" | "processing" | "completed" | "failed"
  upload_date: string
  file_path?: string
  file_size?: number
  created_at: string
  updated_at: string
}

export interface StudyNote {
  id: string
  document_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface Flashcard {
  id: string
  document_id: string
  question: string
  answer: string
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  document_id: string
  title: string
  type: "multiple_choice" | "true_false" | "fill_in_blanks"
  num_questions: number
  questions: Question[]
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  quiz_id: string
  question: string
  type: "multiple_choice" | "true_false" | "fill_in_blanks"
  options?: string[]
  correct_answer: string
  explanation?: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
