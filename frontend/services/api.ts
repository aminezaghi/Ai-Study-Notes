import { useAuthStore } from "@/store/auth-store"
import { Document } from "@/store/document-store"
import { User } from "@/lib/types"

interface DocumentResponse {
  document: Document
}

interface DocumentsResponse {
  documents: Document[]
}

interface LoginResponse {
  access_token: string
  user: User
}

interface UserResponse {
  user: User
}

interface StudyNotesResponse {
  study_notes: any[]
}

interface FlashcardsResponse {
  flashcards: any[]
}

interface QuizResponse {
  quiz: any
}

interface QuizzesResponse {
  quizzes: any[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 

class ApiService {
  private getHeaders() {
    const token = useAuthStore.getState().token
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private getFormHeaders() {
    const token = useAuthStore.getState().token
    return {
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`
    
    try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    })

      const data = await response.json()

    if (!response.ok) {
        console.error('API Error:', {
          url,
          status: response.status,
          endpoint,
          response: data
        })
        
        throw new Error(data.message || 'An error occurred while making the request')
    }

      return data as T
    } catch (error: any) {
      console.error('API Request Failed:', {
        url,
        endpoint,
        error: error.message,
        details: error
      })
      throw error
    }
  }

  // Auth endpoints
  async register(data: { name: string; email: string; password: string; password_confirmation: string }) {
    return this.request<{ message: string }>("/register", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string }) {
    try {
      const response = await this.request<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify(data),
    })

      if (!response.access_token) {
        throw new Error("Invalid response: No access token received")
      }

      useAuthStore.getState().setToken(response.access_token)
      const userResponse = await this.request<UserResponse>("/user")
      
      return {
        token: response.access_token,
        user: userResponse.user
      }
    } catch (error: any) {
      console.error('Login Failed:', error)
      throw new Error(error.message || "Failed to login. Please check your credentials.")
    }
  }

  async logout() {
    return this.request<{ message: string }>("/logout", { 
      method: "POST",
      headers: this.getHeaders()
    })
  }

  async getUser() {
    const response = await this.request<UserResponse>("/user")
    return response.user
  }

  // Document endpoints
  async getDocuments() {
    const response = await this.request<DocumentsResponse>("/documents")
    return response.documents
  }

  async getDocument(id: string) {
    return this.request<DocumentResponse>(`/documents/${id}`)
  }

  async uploadDocument(formData: FormData) {
    const token = useAuthStore.getState().token
    const response = await fetch(`${API_BASE_URL}/api/documents`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data.document
  }

  async deleteDocument(id: string) {
    return this.request<{ message: string }>(`/documents/${id}`, { method: "DELETE" })
  }

  // Study notes endpoints
  async getStudyNotes(documentId: string) {
    const response = await this.request<StudyNotesResponse>(`/documents/${documentId}/notes`)
    return response.study_notes
  }

  async generateStudyNotes(documentId: string) {
    const response = await this.request<StudyNotesResponse>(`/documents/${documentId}/notes/generate`, {
      method: "POST",
    })
    return response.study_notes
  }

  // Flashcards endpoints
  async getFlashcards(documentId: string) {
    const response = await this.request<FlashcardsResponse>(`/documents/${documentId}/flashcards`)
    return response.flashcards
  }

  async generateFlashcards(documentId: string) {
    const response = await this.request<FlashcardsResponse>(`/documents/${documentId}/flashcards/generate`, {
      method: "POST",
      body: JSON.stringify({ num_cards: 20 })
    })
    return response.flashcards
  }

  // Quiz endpoints
  async getQuizzes(documentId: string) {
    const response = await this.request<QuizzesResponse>(`/documents/${documentId}/quizzes`)
    return response.quizzes
  }

  async getQuiz(documentId: string, quizId: string) {
    const response = await this.request<QuizResponse>(`/documents/${documentId}/quizzes/${quizId}`)
    return response.quiz
  }

  async generateQuiz(documentId: string, data: { 
    title: string;
    type: 'multiple_choice' | 'true_false' | 'fill_in_blanks';
    total_questions: number;
  }) {
    return this.request<QuizResponse>(`/documents/${documentId}/quizzes/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        title: data.title,
        type: data.type,
        num_questions: data.total_questions
      })
    })
  }
}

export const apiService = new ApiService()
