"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiService } from "@/services/api"
import { Loader2, BookOpen } from "lucide-react"

interface StudyNotesSectionProps {
  documentId: string
}

export function StudyNotesSection({ documentId }: StudyNotesSectionProps) {
  const { data: studyNotes, isLoading } = useQuery({
    queryKey: ["study-notes", documentId],
    queryFn: () => apiService.getStudyNotes(documentId),
  })

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Study Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Study Notes</CardTitle>
        <CardDescription className="text-gray-400">AI-generated study notes from your document</CardDescription>
      </CardHeader>
      <CardContent>
        {!studyNotes || studyNotes.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-16 w-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No study notes available</h3>
            <p className="text-gray-400 mb-6">Study notes will be generated automatically when you upload a document</p>
          </div>
        ) : (
          <div className="space-y-6">
            {studyNotes.map((note) => (
              <div key={note.id} className="space-y-4">
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
                  <p className="text-gray-300">{note.summary}</p>
                  <h3 className="text-lg font-semibold text-white mt-4 mb-2">Detailed Notes</h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{note.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
