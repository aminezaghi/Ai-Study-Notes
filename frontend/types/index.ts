export interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: number
  user_id: number
  title: string
  description: string
  status: "processing" | "completed" | "failed"
  created_at: string
  updated_at: string
  files: DocumentFile[]
  study_notes?: StudyNote[]
  enhanced_notes?: EnhancedStudyNote[]
  flashcards?: Flashcard[]
  quiz_questions?: QuizQuestion[]
}

export interface DocumentFile {
  id: number
  document_id: number
  original_filename: string
  file_path: string
  page_count: number
  order: number
  created_at: string
  updated_at: string
}

export interface StudyNote {
  id: number
  document_id: number
  content: string
  summary: string
  created_at: string
  updated_at: string
}

export interface EnhancedStudyNote {
  id: number
  document_id: number
  section_title: string
  key_points: string[]
  definitions: Record<string, string>
  examples: Array<{
    title: string
    description: string
  }>
  order: number
  created_at: string
  updated_at: string
  questions?: NoteQuestion[]
}

export interface NoteQuestion {
  id: number
  enhanced_note_id: number
  type: "mcq" | "true_false" | "fill" | "short"
  question: string
  choices?: string[]
  correct_answer: string
  explanation?: string
  order: number
}

export interface Flashcard {
  id: number
  document_id: number
  question: string
  answer: string
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: number
  document_id: number
  title: string
  type: "multiple_choice" | "true_false" | "fill_in_blanks"
  total_questions: number
  difficulty?: "easy" | "medium" | "hard"
  created_at: string
  updated_at: string
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: number
  quiz_id: number
  question: string
  type: "multiple_choice" | "true_false" | "fill_in_blanks"
  options?: string[]
  correct_answer: string
  explanation?: string
  order: number
}

// API Response Types
export interface ApiResponse<T> {
  message?: string
  data: T
  errors?: Record<string, string[]>
}

export interface DocumentsResponse {
  documents: Document[]
}

export interface DocumentResponse {
  document: Document
}

export interface StudyNotesResponse {
  study_notes: StudyNote[]
  message?: string
}

export interface GenerateStudyNotesResponse {
  message: string
  study_notes: StudyNote[]
  stats: {
    total_files: number
    processed_files: number
    failed_files: number
  }
}

export interface EnhancedNotesResponse {
  enhanced_notes: EnhancedStudyNote[]
}

export interface EnhancedNoteResponse {
  enhanced_note: EnhancedStudyNote
}

export interface GenerateEnhancedNoteResponse {
  message: string
  enhanced_note: EnhancedStudyNote
  questions: NoteQuestion[]
}

export interface FlashcardsResponse {
  flashcards: Flashcard[]
}

export interface GenerateFlashcardsResponse {
  message: string
  flashcards: Flashcard[]
}

export interface QuizzesResponse {
  quizzes: Quiz[]
}

export interface QuizResponse {
  quiz: Quiz
}

export interface GenerateQuizResponse {
  message: string
  quiz: Quiz
}

// Error Types
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  error?: string
  status?: number
}

export interface ValidationError {
  message: string
  errors: Record<string, string[]>
}

export interface AuthError {
  message: string
  error: "unauthenticated" | "unauthorized"
}

export interface NotFoundError {
  message: string
  error: string
}

export interface ValidateAnswerRequest {
  question: string;
  correct_answer: string;
  user_answer: string;
  question_type: "fill_blank" | "short_answer";
}

export interface ValidateAnswerResponse {
  is_correct: boolean;
  confidence: number;
  feedback: string;
  similarity_score: number;
}
