import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, validateAnswer, type ValidateAnswerRequest, type ValidateAnswerResponse } from "@/lib/api-client"
import type {
  StudyNote,
  EnhancedStudyNote,
  Flashcard,
  Quiz,
  StudyNotesResponse,
  GenerateStudyNotesResponse,
  EnhancedNoteResponse,
  GenerateEnhancedNoteResponse,
  FlashcardsResponse,
  GenerateFlashcardsResponse,
  QuizzesResponse,
  QuizResponse,
  GenerateQuizResponse,
  ApiError,
  ValidationError,
} from "@/types"

// Study Notes
export function useStudyNotes(documentId: string | number) {
  return useQuery<StudyNotesResponse, ApiError>({
    queryKey: ["study-notes", documentId],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${documentId}/notes`)
      return response.data
    },
    enabled: !!documentId,
  })
}

export function useGenerateStudyNotes() {
  const queryClient = useQueryClient()

  return useMutation<GenerateStudyNotesResponse, ApiError, number>({
    mutationFn: async (documentId) => {
      const response = await apiClient.post(`/documents/${documentId}/notes/generate`)
      return response.data
    },
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ["study-notes", documentId] })
    },
  })
}

// Enhanced Study Notes
export interface Question {
  id: number
  enhanced_note_id: number
  type: "mcq" | "fill_blank" | "short_answer"
  question: string
  choices: string[] | null
  correct_answer: string
  order: number
  created_at: string
  updated_at: string
}

export interface Example {
  title: string
  description: string
}

export interface EnhancedNote {
  id: number
  document_id: number
  section_title: string
  key_points: string[]
  definitions: Record<string, string>
  examples: Example[]
  order: number
  created_at: string
  updated_at: string
  lesson_intro: string
  section_summary: string
  next_topic: string
  task: string
  explanation: string | null
  questions: Question[]
}

interface EnhancedNotesResponse {
  enhanced_notes: EnhancedNote[]
}

export function useEnhancedStudyNotes(documentId: string) {
  return useQuery<EnhancedNotesResponse>({
    queryKey: ["enhanced-notes", documentId],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${documentId}/enhanced-notes`)
      return response.data
    },
  })
}

export function useEnhancedStudyNote(documentId: string | number, noteId: string | number) {
  return useQuery<EnhancedNoteResponse, ApiError>({
    queryKey: ["enhanced-note", documentId, noteId],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${documentId}/enhanced-notes/${noteId}`)
      return response.data
    },
    enabled: !!documentId && !!noteId,
  })
}

interface GenerateEnhancedStudyNotesParams {
  documentId: number
  sectionTitle: string
}

export function useGenerateEnhancedStudyNotes() {
  const queryClient = useQueryClient()

  return useMutation<GenerateEnhancedNoteResponse, ApiError, GenerateEnhancedStudyNotesParams>({
    mutationFn: async ({ documentId, sectionTitle }) => {
      const response = await apiClient.post(`/documents/${documentId}/enhanced-notes/generate`, {
        section_title: sectionTitle,
      })
      return response.data
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ["enhanced-notes", documentId] })
    },
  })
}

interface DeleteEnhancedStudyNoteParams {
  documentId: number
  noteId: number
}

export function useDeleteEnhancedStudyNote() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, DeleteEnhancedStudyNoteParams>({
    mutationFn: async ({ documentId, noteId }) => {
      await apiClient.delete(`/documents/${documentId}/enhanced-notes/${noteId}`)
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ["enhanced-notes", documentId] })
    },
  })
}

// Flashcards
export function useFlashcards(documentId: string | number) {
  return useQuery<FlashcardsResponse, ApiError>({
    queryKey: ["flashcards", documentId],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${documentId}/flashcards`)
      return response.data
    },
    enabled: !!documentId,
  })
}

interface GenerateFlashcardsParams {
  documentId: number
  numCards: number
}

export function useGenerateFlashcards() {
  const queryClient = useQueryClient()

  return useMutation<GenerateFlashcardsResponse, ValidationError, GenerateFlashcardsParams>({
    mutationFn: async ({ documentId, numCards }) => {
      if (numCards > 50) {
        throw new Error("Number of cards cannot exceed 50")
      }
      const response = await apiClient.post(`/documents/${documentId}/flashcards/generate`, {
        num_cards: numCards,
      })
      return response.data
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ["flashcards", documentId] })
    },
  })
}

// Quizzes
export function useQuizzes(documentId: string | number) {
  return useQuery<QuizzesResponse, ApiError>({
    queryKey: ["quizzes", documentId],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${documentId}/quizzes`)
      return response.data
    },
    enabled: !!documentId,
  })
}

export function useQuiz(documentId: string | number, quizId: string | number) {
  return useQuery<QuizResponse, ApiError>({
    queryKey: ["quiz", documentId, quizId],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${documentId}/quizzes/${quizId}`)
      return response.data
    },
    enabled: !!documentId && !!quizId,
  })
}

interface GenerateQuizParams {
      documentId: number
      title: string
      type: "multiple_choice" | "true_false" | "fill_in_blanks"
      numQuestions: number
      difficulty?: "easy" | "medium" | "hard"
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient()

  return useMutation<GenerateQuizResponse, ValidationError, GenerateQuizParams>({
    mutationFn: async ({ documentId, title, type, numQuestions, difficulty }) => {
      const response = await apiClient.post(`/documents/${documentId}/quizzes/generate`, {
        title,
        type,
        num_questions: numQuestions,
        difficulty,
      })
      return response.data
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", documentId] })
    },
  })
}

interface DeleteQuizParams {
  documentId: number
  quizId: number
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, DeleteQuizParams>({
    mutationFn: async ({ documentId, quizId }) => {
      await apiClient.delete(`/documents/${documentId}/quizzes/${quizId}`)
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", documentId] })
    },
  })
}

export function useValidateAnswer() {
  return useMutation<ValidateAnswerResponse, ApiError, ValidateAnswerRequest>({
    mutationFn: async (data) => {
      return await validateAnswer(data)
    },
  })
}
