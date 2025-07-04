import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Document } from "@/types"

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await apiClient.get("/documents")
      return response.data.documents as Document[]
    },
  })
}

export function useDocument(id: string | number) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${id}`)
      return response.data.document as Document
    },
    enabled: !!id,
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/documents/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
    },
  })
}
