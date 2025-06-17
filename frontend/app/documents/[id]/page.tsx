"use client"

import { useEffect, useState } from "react"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { ModernHeader } from "@/components/layout/modern-header"
import { DocumentHeader } from "@/components/documents/document-header"
import { StudyNotesSection } from "@/components/study-notes/study-notes-section"
import { FlashcardsSection } from "@/components/flashcards/flashcards-section"
import { QuizzesSection } from "@/components/quiz/quizzes-section"
import { ProcessingStatus } from "@/components/documents/processing-status"
import { apiService } from "@/services/api"
import { useDocumentStore } from "@/store/document-store"
import type { Document } from "@/store/document-store"
import { Loader2, Trash2, CheckCircle2, XCircle, Clock, BookOpen, MoreVertical, LayoutGrid } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MultiStepLoader } from "@/components/ui/multi-step-loader"

interface DocumentResponse {
  document: Document
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const documentId = params.id as string
  const { setCurrentDocument, updateDocumentStatus } = useDocumentStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRegeneratingNotes, setIsRegeneratingNotes] = useState(false)
  const [isRegeneratingCards, setIsRegeneratingCards] = useState(false)
  const [regenerationStep, setRegenerationStep] = useState(0)
  const [showRegenerationLoader, setShowRegenerationLoader] = useState(false)
  const [regenerationType, setRegenerationType] = useState<"notes" | "flashcards" | null>(null)

  const { data, isLoading, error }: UseQueryResult<DocumentResponse, Error> = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => apiService.getDocument(documentId),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    enabled: true,
  })

  // Stop refetching when the document is completed or failed
  useEffect(() => {
    if (data?.document?.status === "completed" || data?.document?.status === "failed") {
      // The query will be disabled
      return;
    }
  }, [data?.document?.status]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await apiService.deleteDocument(documentId)
      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  const handleRegenerateStudyNotes = async () => {
    try {
      setIsRegeneratingNotes(true)
      setShowRegenerationLoader(true)
      setRegenerationType("notes")
      setRegenerationStep(0)
      
      await apiService.generateStudyNotes(documentId)
      
      // Wait for a short time to show the completion state
      setRegenerationStep(1)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Success",
        description: "Study notes regeneration started",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate study notes",
        variant: "destructive",
      })
    } finally {
      setIsRegeneratingNotes(false)
      setShowRegenerationLoader(false)
      setRegenerationStep(0)
      setRegenerationType(null)
    }
  }

  const handleRegenerateFlashcards = async () => {
    try {
      setIsRegeneratingCards(true)
      setShowRegenerationLoader(true)
      setRegenerationType("flashcards")
      setRegenerationStep(0)
      
      await apiService.generateFlashcards(documentId)
      
      // Wait for a short time to show the completion state
      setRegenerationStep(1)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Success",
        description: "Flashcards regeneration started",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate flashcards",
        variant: "destructive",
      })
    } finally {
      setIsRegeneratingCards(false)
      setShowRegenerationLoader(false)
      setRegenerationStep(0)
      setRegenerationType(null)
    }
  }

  useEffect(() => {
    if (data?.document) {
      setCurrentDocument(data.document)
      updateDocumentStatus(documentId, data.document.status)
    }
  }, [data, setCurrentDocument, updateDocumentStatus, documentId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <ModernHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            <span className="ml-2 text-gray-400">Loading document...</span>
          </div>
        </main>
      </div>
    )
  }

  if (error || !data?.document) {
    return (
      <div className="min-h-screen bg-gray-900">
        <ModernHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-red-400">Failed to load document. Please try again.</p>
          </div>
        </main>
      </div>
    )
  }

  const document = data.document
  const isProcessing = document.status === "pending" || document.status === "processing"
  const isCompleted = document.status === "completed"
  const isFailed = document.status === "failed"

  return (
    <div className="min-h-screen bg-gray-900">
      <ModernHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-6">
        <DocumentHeader document={document} />
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm rounded-full",
                isCompleted && "bg-green-500/10 text-green-500",
                isProcessing && "bg-yellow-500/10 text-yellow-500",
                isFailed && "bg-red-500/10 text-red-500"
              )}>
                {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                {isProcessing && <Clock className="h-4 w-4 animate-spin" />}
                {isFailed && <XCircle className="h-4 w-4" />}
                <span>
                  {isCompleted && "Completed"}
                  {isProcessing && "Processing"}
                  {isFailed && "Failed"}
                </span>
              </div>

              {isCompleted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end"
                    className="w-56 bg-gray-800 border-gray-700"
                  >
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                          onSelect={(e) => e.preventDefault()}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Document
                            </>
                          )}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-800 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Delete Document</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete this document? This action cannot be undone.
                            All associated study notes, flashcards, and quizzes will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <DropdownMenuItem
                      onClick={handleRegenerateStudyNotes}
                      disabled={isRegeneratingNotes}
                      className="focus:bg-gray-700"
                    >
                      {isRegeneratingNotes ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating Notes...
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Regenerate Study Notes
                        </>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleRegenerateFlashcards}
                      disabled={isRegeneratingCards}
                      className="focus:bg-gray-700"
                    >
                      {isRegeneratingCards ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating Cards...
                        </>
                      ) : (
                        <>
                          <LayoutGrid className="mr-2 h-4 w-4" />
                          Regenerate Flashcards
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {isProcessing && <ProcessingStatus />}

        {isFailed && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">Failed to process document. Please try again.</p>
          </div>
        )}

        {isCompleted && (
          <div className="space-y-8">
            <Tabs defaultValue="study-notes" className="sticky top-0 z-10 bg-gray-900 py-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="study-notes">Study Notes</TabsTrigger>
                <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              </TabsList>
              <TabsContent value="study-notes">
                <StudyNotesSection documentId={documentId} />
              </TabsContent>
              <TabsContent value="flashcards">
                <FlashcardsSection documentId={documentId} />
              </TabsContent>
              <TabsContent value="quizzes">
                <QuizzesSection documentId={documentId} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <MultiStepLoader
        loading={showRegenerationLoader}
        currentStep={regenerationStep}
        steps={[
          {
            id: "processing",
            text: regenerationType === "notes" 
              ? "Regenerating Study Notes..." 
              : "Regenerating Flashcards...",
            status: "pending"
          },
          {
            id: "complete",
            text: "Generation Complete!",
            status: "pending"
          }
        ]}
        onComplete={() => {
          setShowRegenerationLoader(false)
          setRegenerationStep(0)
          setRegenerationType(null)
        }}
      />
    </div>
  )
}
