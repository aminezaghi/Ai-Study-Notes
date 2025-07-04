import { create } from "zustand"

interface Document {
  id: number
  title: string
  description: string
  status: string
  created_at: string
  files: Array<{
    id: number
    original_filename: string
    page_count: number
  }>
}

interface DocumentState {
  documents: Document[]
  currentDocument: Document | null
  isLoading: boolean
  setDocuments: (documents: Document[]) => void
  setCurrentDocument: (document: Document | null) => void
  setLoading: (loading: boolean) => void
  addDocument: (document: Document) => void
  updateDocument: (id: number, updates: Partial<Document>) => void
  removeDocument: (id: number) => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocument: null,
  isLoading: false,
  setDocuments: (documents) => set({ documents }),
  setCurrentDocument: (document) => set({ currentDocument: document }),
  setLoading: (loading) => set({ isLoading: loading }),
  addDocument: (document) => set((state) => ({ documents: [...state.documents, document] })),
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc)),
    })),
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    })),
}))
