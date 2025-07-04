"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { QuizzesResponse } from "@/types/quiz"
import { AxiosError } from "axios"

const DEFAULT_DATA: QuizzesResponse = {
  quizzes: [],
  available_difficulties: ["easy", "medium", "hard"]
}

export function useDocumentQuizzes(documentId: string) {
  const queryClient = useQueryClient()
  const queryKey = ["quizzes", documentId]

  return useQuery<QuizzesResponse>({
    queryKey,
    queryFn: async () => {
      try {
        console.log('Starting API request for quizzes, document ID:', documentId)
        console.log('Request URL:', `/documents/${documentId}/quizzes`)
        
        const response = await apiClient.get<QuizzesResponse>(`/documents/${documentId}/quizzes`)
        console.log('Raw API Response:', response)
        console.log('API Response data:', response.data)

        // Validate response structure
        if (!response.data) {
          console.error('No data in response')
          return DEFAULT_DATA
        }

        if (!Array.isArray(response.data.quizzes)) {
          console.error('Quizzes is not an array:', response.data)
          return DEFAULT_DATA
        }

        // Log each quiz
        response.data.quizzes.forEach((quiz, index) => {
          console.log(`Quiz ${index + 1}:`, {
            id: quiz.id,
            title: quiz.title,
            questions: quiz.questions?.length || 0
          })
        })

        return response.data
      } catch (error) {
        console.error("Error fetching quizzes:", error)
        if (error instanceof AxiosError && error.response) {
          console.error('Error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          })
        }
        throw error // Let React Query handle the error
      }
    },
    // Remove initialData to force the query to execute
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1, // Try once more if it fails
    enabled: Boolean(documentId) // Only run if we have a document ID
  })
} 