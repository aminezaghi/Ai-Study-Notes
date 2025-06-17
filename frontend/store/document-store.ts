import { create } from "zustand"
import { Document as BaseDocument } from "@/lib/types"

interface File {
  id: string
  document_id: string
  original_filename: string
  file_path: string
  page_count: number
  order: number
  created_at: string
  updated_at: string
}

interface StudyNote {
  id: string
  document_id: string
  content: string
  summary: string
  created_at: string
  updated_at: string
}

interface Flashcard {
  id: string
  document_id: string
  question: string
  answer: string
  created_at: string
  updated_at: string
}

interface QuizQuestion {
  id: string
  document_id: string
  quiz_id: string
  question: string
  type: "multiple_choice" | "true_false" | "fill_in_blanks"
  options: string[] | null
  correct_answer: string
  explanation: string
  created_at: string
  updated_at: string
}

export interface Document extends BaseDocument {
  user_id: string
  files: File[]
  study_notes?: StudyNote[]
  flashcards?: Flashcard[]
  quiz_questions?: QuizQuestion[]
}

interface DocumentState {
  documents: Document[]
  currentDocument: Document | null
  setDocuments: (documents: Document[]) => void
  setCurrentDocument: (document: Document | null) => void
  updateDocumentStatus: (id: string, status: Document["status"]) => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocument: null,
  setDocuments: (documents) => set({ documents }),
  setCurrentDocument: (document) => set({ currentDocument: document }),
  updateDocumentStatus: (id, status) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, status } : doc
      ),
      currentDocument:
        state.currentDocument?.id === id
          ? { ...state.currentDocument, status }
          : state.currentDocument,
    })),
}))
