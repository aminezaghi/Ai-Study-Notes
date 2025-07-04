import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

interface Quiz {
  id: number
  document_id: number
  title: string
  type: string
  total_questions: number
  difficulty: string
  created_at: string
  updated_at: string
}

interface QuizzesResponse {
  quizzes: Quiz[]
}

export function useQuizzes(documentId: string) {
  return useQuery<QuizzesResponse>({
    queryKey: ["quizzes", documentId],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${documentId}/quizzes`)
      return response.data
    },
  })
}

export async function deleteQuiz(documentId: string, quizId: string) {
  const response = await apiClient.delete(`/documents/${documentId}/quizzes/${quizId}`)
  return response.data
} 