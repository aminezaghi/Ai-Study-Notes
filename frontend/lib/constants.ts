export const API_ENDPOINTS = {
  // Auth
  REGISTER: "/register",
  LOGIN: "/login",
  LOGOUT: "/logout",
  USER: "/user",

  // Documents
  DOCUMENTS: "/documents",
  DOCUMENT: (id: string) => `/documents/${id}`,

  // Study Notes
  STUDY_NOTES: (documentId: string) => `/documents/${documentId}/notes`,

  // Flashcards
  FLASHCARDS: (documentId: string) => `/documents/${documentId}/flashcards`,
  DELETE_FLASHCARD: (documentId: string, flashcardId: string) => `/documents/${documentId}/flashcards/${flashcardId}`,

  // Quizzes
  QUIZZES: (documentId: string) => `/documents/${documentId}/quizzes`,
  QUIZ: (documentId: string, quizId: string) => `/documents/${documentId}/quizzes/${quizId}`,
  GENERATE_QUIZ: (documentId: string) => `/documents/${documentId}/quizzes/generate`,
  DELETE_QUIZ: (documentId: string, quizId: string) => `/documents/${documentId}/quizzes/${quizId}`,
} as const

export const DOCUMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const

export const QUIZ_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  TRUE_FALSE: "true_false",
  FILL_IN_BLANKS: "fill_in_blanks",
} as const

export const QUIZ_TYPE_LABELS = {
  [QUIZ_TYPES.MULTIPLE_CHOICE]: "Multiple Choice",
  [QUIZ_TYPES.TRUE_FALSE]: "True/False",
  [QUIZ_TYPES.FILL_IN_BLANKS]: "Fill in Blanks",
} as const
