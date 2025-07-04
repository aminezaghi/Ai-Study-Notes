"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { gsap } from "gsap"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Brain, Zap, FileText, Calendar, Download, ArrowLeft, MoreVertical, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useDocument } from "@/hooks/use-documents"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EnhancedStudyNotesTab } from "@/components/features/enhanced-study-notes-tab"
import { FlashcardsTab } from "@/components/features/flashcards-tab"
import { QuizzesTab } from "@/components/features/quizzes-tab"
import { RemoveQuizDialog } from "@/components/features/remove-quiz-dialog"
import { toast } from "sonner"
import { apiClient, deleteDocument } from "@/lib/api-client"

export default function DocumentDetailPage() {
  const params = useParams()
  const documentId = params.id as string
  const [activeTab, setActiveTab] = useState("enhanced-notes")
  const headerRef = useRef<HTMLDivElement>(null)
  const [removeQuizDialogOpen, setRemoveQuizDialogOpen] = useState(false)
  const [isGeneratingStudyNotes, setIsGeneratingStudyNotes] = useState(false)
  const [isGeneratingEnhancedNotes, setIsGeneratingEnhancedNotes] = useState(false)
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false)
  const [loadingOperation, setLoadingOperation] = useState<{
    type: "study-notes" | "enhanced-notes" | "flashcards" | null;
    progress: number;
    step: string;
  }>({
    type: null,
    progress: 0,
    step: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: document, isLoading, error, refetch } = useDocument(documentId)

  const handleRegenerateStudyNotes = async () => {
    try {
      setIsGeneratingStudyNotes(true)
      setLoadingOperation({
        type: "study-notes",
        progress: 0,
        step: "Starting study notes generation..."
      });

      const response = await apiClient.post(`/documents/${documentId}/notes/generate`)
      
      if (response.status === 200) {
        setLoadingOperation(prev => ({
          ...prev,
          progress: 30,
          step: "Processing document content..."
        }));

        toast.success("Study notes regeneration started", {
          description: "This might take a few moments. The page will update automatically.",
          duration: 5000,
        })

        // Start polling for updates
        const pollInterval = setInterval(async () => {
          const updated = await refetch()
          setLoadingOperation(prev => ({
            ...prev,
            progress: prev.progress < 90 ? prev.progress + 10 : prev.progress,
            step: "Generating study notes..."
          }));

          if (updated.data?.status === "completed") {
            clearInterval(pollInterval)
            setIsGeneratingStudyNotes(false)
            setLoadingOperation(prev => ({
              ...prev,
              progress: 100,
              step: "Study notes generated successfully!"
            }));
            
            // Wait a moment before closing the dialog
            setTimeout(() => {
              setLoadingOperation({ type: null, progress: 0, step: "" });
              toast.success("Study notes have been regenerated!")
            }, 1000);
          }
        }, 5000)
      } else {
        throw new Error(`Failed to regenerate study notes: ${response.statusText}`)
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "An unexpected error occurred"
      console.error("Failed to regenerate study notes:", {
        message: errorMessage,
        status: error?.response?.status,
        data: error?.response?.data
      })
      toast.error("Failed to regenerate study notes", {
        description: errorMessage
      })
      setIsGeneratingStudyNotes(false)
      setLoadingOperation({ type: null, progress: 0, step: "" });
    }
  }

  const handleGenerateEnhancedNotes = async () => {
    try {
      setIsGeneratingEnhancedNotes(true)
      setLoadingOperation({
        type: "enhanced-notes",
        progress: 0,
        step: "Starting enhanced notes generation..."
      });

      const response = await apiClient.post(`/documents/${documentId}/enhanced-notes/generate`)
      
      if (response.status === 200) {
        setLoadingOperation(prev => ({
          ...prev,
          progress: 30,
          step: "Processing document content..."
        }));

        toast.success("Enhanced notes generation started", {
          description: "This might take a few moments. The page will update automatically.",
          duration: 5000,
        })

        // Start polling for updates
        const pollInterval = setInterval(async () => {
          const updated = await refetch()
          setLoadingOperation(prev => ({
            ...prev,
            progress: prev.progress < 90 ? prev.progress + 10 : prev.progress,
            step: "Generating enhanced notes..."
          }));

          if (updated.data?.status === "completed") {
            clearInterval(pollInterval)
            setIsGeneratingEnhancedNotes(false)
            setLoadingOperation(prev => ({
              ...prev,
              progress: 100,
              step: "Enhanced notes generated successfully!"
            }));
            
            // Wait a moment before closing the dialog
            setTimeout(() => {
              setLoadingOperation({ type: null, progress: 0, step: "" });
              toast.success("Enhanced notes have been generated!")
            }, 1000);
          }
        }, 5000)
      } else {
        throw new Error(`Failed to generate enhanced notes: ${response.statusText}`)
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "An unexpected error occurred"
      console.error("Failed to generate enhanced notes:", {
        message: errorMessage,
        status: error?.response?.status,
        data: error?.response?.data
      })
      toast.error("Failed to generate enhanced notes", {
        description: errorMessage
      })
      setIsGeneratingEnhancedNotes(false)
      setLoadingOperation({ type: null, progress: 0, step: "" });
    }
  }

  const handleGenerateFlashcards = async () => {
    try {
      setIsGeneratingFlashcards(true)
      setLoadingOperation({
        type: "flashcards",
        progress: 0,
        step: "Starting flashcards generation..."
      });

      const response = await apiClient.post(`/documents/${documentId}/flashcards/generate`, {
        num_cards: 25 // Default to 25 cards
      })
      
      if (response.status === 200) {
        setLoadingOperation(prev => ({
          ...prev,
          progress: 30,
          step: "Processing document content..."
        }));

        toast.success("Flashcards generation started", {
          description: "This might take a few moments. The page will update automatically.",
          duration: 5000,
        })

        // Start polling for updates
        const pollInterval = setInterval(async () => {
          const updated = await refetch()
          setLoadingOperation(prev => ({
            ...prev,
            progress: prev.progress < 90 ? prev.progress + 10 : prev.progress,
            step: "Generating flashcards..."
          }));

          if (updated.data?.status === "completed") {
            clearInterval(pollInterval)
            setIsGeneratingFlashcards(false)
            setLoadingOperation(prev => ({
              ...prev,
              progress: 100,
              step: "Flashcards generated successfully!"
            }));
            
            // Wait a moment before closing the dialog
            setTimeout(() => {
              setLoadingOperation({ type: null, progress: 0, step: "" });
              toast.success("Flashcards have been generated!")
            }, 1000);
          }
        }, 5000)
      } else {
        throw new Error(`Failed to generate flashcards: ${response.statusText}`)
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "An unexpected error occurred"
      console.error("Failed to generate flashcards:", {
        message: errorMessage,
        status: error?.response?.status,
        data: error?.response?.data
      })
      toast.error("Failed to generate flashcards", {
        description: errorMessage
      })
      setIsGeneratingFlashcards(false)
      setLoadingOperation({ type: null, progress: 0, step: "" });
    }
  }

  const handleDeleteDocument = async () => {
    setIsDeleting(true)
    try {
      await deleteDocument(documentId)
      toast.success("Document deleted successfully")
      setDeleteDialogOpen(false)
      // Redirect to documents list
      window.location.href = "/dashboard/documents"
    } catch (error: any) {
      toast.error("Failed to delete document", {
        description: error?.response?.data?.message || error.message || "An error occurred."
      })
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    if (!isLoading && document && headerRef.current) {
      // Set initial states
      gsap.set(".document-header", { opacity: 0, y: 30 })
      gsap.set(".document-tabs", { opacity: 0, y: 20 })

      // Create timeline for animations
      const tl = gsap.timeline()

      // Animate header
      tl.to(".document-header", {
        duration: 0.8,
        y: 0,
        opacity: 1,
        ease: "power3.out",
      })

      // Animate tabs
      tl.to(".document-tabs", {
        duration: 0.8,
        y: 0,
        opacity: 1,
        ease: "power3.out",
      }, "-=0.4") // Start slightly before header animation finishes

      return () => {
        tl.kill()
      }
    }
  }, [document, isLoading])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Document not found</h2>
        <p className="text-muted-foreground mb-6">The document you're looking for doesn't exist or has been deleted.</p>
        <Link href="/dashboard/documents">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div ref={headerRef}>
        <div className="document-header">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/documents">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{document.title}</h1>
              <p className="text-muted-foreground mt-2">{document.description}</p>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={handleRegenerateStudyNotes}
                  disabled={isGeneratingStudyNotes}
                  className="flex items-center"
                >
                  {isGeneratingStudyNotes ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating Study Notes...
                    </>
                  ) : (
                    "Regenerate Study Notes"
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleGenerateEnhancedNotes}
                  disabled={isGeneratingEnhancedNotes}
                  className="flex items-center"
                >
                  {isGeneratingEnhancedNotes ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Enhanced Notes...
                    </>
                  ) : (
                    "Enhanced Study Notes"
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleGenerateFlashcards}
                  disabled={isGeneratingFlashcards}
                  className="flex items-center"
                >
                  {isGeneratingFlashcards ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Flashcards...
                    </>
                  ) : (
                    "Generate Flashcards"
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onSelect={() => setRemoveQuizDialogOpen(true)}
                  className="text-destructive"
                >
                  Remove Quiz
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  Delete Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Document Info */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Files</p>
                    <p className="text-lg font-semibold">{document.files?.length || 0}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-lg font-semibold">{new Date(document.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(document.status)}>{document.status}</Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Zap className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pages</p>
                    <p className="text-lg font-semibold">
                      {document.files?.reduce((total, file) => total + (file.page_count || 0), 0) || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="document-tabs">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enhanced-notes" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Enhanced Study Notes</span>
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Flashcards</span>
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Quizzes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enhanced-notes">
            <EnhancedStudyNotesTab documentId={documentId} />
          </TabsContent>

          <TabsContent value="flashcards">
            <FlashcardsTab documentId={documentId} />
          </TabsContent>

          <TabsContent value="quizzes">
            <QuizzesTab documentId={documentId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add the RemoveQuizDialog */}
      <RemoveQuizDialog
        documentId={documentId}
        open={removeQuizDialogOpen}
        onOpenChange={setRemoveQuizDialogOpen}
      />

      {/* Loading Dialog */}
      <Dialog open={loadingOperation.type !== null} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {loadingOperation.type === "study-notes" && "Generating Study Notes"}
              {loadingOperation.type === "enhanced-notes" && "Generating Enhanced Notes"}
              {loadingOperation.type === "flashcards" && "Generating Flashcards"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="py-4">
              <Progress value={loadingOperation.progress} className="h-2" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{loadingOperation.step}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
