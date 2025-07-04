import axios, { AxiosError } from "axios"
import type { ApiError, ValidationError, AuthError, NotFoundError } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle auth errors and format error responses
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (!error.response) {
      return Promise.reject({
        message: "Network error occurred",
        error: "network_error",
        status: 0,
      } as ApiError)
    }

    const status = error.response.status
    const data = error.response.data

    // Handle authentication errors
    if (status === 401) {
      localStorage.removeItem("auth_token")
      return Promise.reject({
        message: "Unauthenticated",
        error: "unauthenticated",
        status: 401,
      } as AuthError)
    }

    // Handle validation errors
    if (status === 422) {
      return Promise.reject({
        message: data.message || "Validation failed",
        errors: data.errors || {},
        status: 422,
      } as ValidationError)
    }

    // Handle not found errors
    if (status === 404) {
      return Promise.reject({
        message: data.message || "Resource not found",
        error: data.error || "not_found",
        status: 404,
      } as NotFoundError)
    }

    // Handle other errors
    return Promise.reject({
      ...data,
      status,
    })
  },
)

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

export async function validateAnswer(data: ValidateAnswerRequest) {
  const response = await apiClient.post<ValidateAnswerResponse>("/validate-answer", data);
  return response.data;
}

export interface GenerateStudyMaterialsResponse {
  id: string;
  status: 'completed' | 'failed';
  error?: string;
}

export interface DocumentUploadResponse {
  document: {
    id: string;
    title: string;
    description?: string;
  };
}

export async function uploadDocument(formData: FormData) {
  const response = await apiClient.post<DocumentUploadResponse>("/documents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function generateStudyNotes(documentId: string) {
  const response = await apiClient.post<GenerateStudyMaterialsResponse>(`/documents/${documentId}/notes/generate`);
  return response.data;
}

export async function generateEnhancedStudyNotes(documentId: string) {
  const response = await apiClient.post<GenerateStudyMaterialsResponse>(`/documents/${documentId}/enhanced-notes/generate`);
  return response.data;
}

export async function generateFlashcards(documentId: string) {
  const response = await apiClient.post<GenerateStudyMaterialsResponse>(
    `/documents/${documentId}/flashcards/generate`,
    { num_cards: 25 }
  );
  return response.data;
}

export async function deleteDocument(documentId: string) {
  const response = await apiClient.delete(`/documents/${documentId}`);
  return response.data;
}

export async function verifyEmail({ user_id, verification_code }: { user_id: number; verification_code: string }) {
  const response = await apiClient.post("/verify-email", { user_id, verification_code });
  return response.data;
}

export async function resendVerificationCode({ user_id }: { user_id: number }) {
  const response = await apiClient.post("/resend-verification-code", { user_id });
  return response.data;
}
