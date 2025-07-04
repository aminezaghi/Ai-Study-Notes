"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { uploadDocument, generateStudyNotes, generateEnhancedStudyNotes, generateFlashcards } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UploadFile {
  file: File
  id: string
  progress: number
  status: "pending" | "uploading" | "processing" | "completed" | "error"
  error?: string
}

interface ProcessingStep {
  id: string
  title: string
  description: string
  status: "pending" | "processing" | "completed" | "error"
  error?: string
}

interface LoadingOperation {
  step: string
  progress: number
  open: boolean
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    {
      id: "upload",
      title: "Document Upload",
      description: "Uploading your document to our servers",
      status: "pending"
    },
    {
      id: "study-notes",
      title: "Study Notes Generation",
      description: "Creating comprehensive study notes",
      status: "pending"
    },
    {
      id: "enhanced-notes",
      title: "Enhanced Study Notes",
      description: "Generating enhanced study materials with AI",
      status: "pending"
    },
    {
      id: "flashcards",
      title: "Flashcards Creation",
      description: "Creating interactive flashcards",
      status: "pending"
    }
  ])
  const { toast } = useToast()
  const router = useRouter()
  const [loadingOperation, setLoadingOperation] = useState<LoadingOperation>({
    step: "",
    progress: 0,
    open: false,
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending" as const,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: true,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const updateStepStatus = (stepId: string, status: ProcessingStep["status"], error?: string) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, error } : step
    ))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one PDF file to upload.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setLoadingOperation({
      step: "Uploading your document...",
      progress: 10,
      open: true,
    })

    try {
      setFiles(prev => prev.map(file => ({ ...file, status: "uploading" as const })))

      const formData = new FormData()
      files.forEach(fileItem => {
        formData.append("files[]", fileItem.file)
      })

      // Upload document
      const uploadResponse = await uploadDocument(formData)
      setLoadingOperation({
        step: "Generating study notes...",
        progress: 30,
        open: true,
      })
      const documentId = uploadResponse.document.id
      setFiles(prev => prev.map(file => ({ ...file, progress: 100, status: "completed" as const })))

      // Generate study notes
      try {
        await generateStudyNotes(documentId)
        setLoadingOperation({
          step: "Generating enhanced study notes...",
          progress: 55,
          open: true,
        })
      } catch (error: any) {
        setLoadingOperation({
          step: "Failed to generate study notes.",
          progress: 100,
          open: true,
        })
        throw error
      }

      // Generate enhanced study notes
      try {
        await generateEnhancedStudyNotes(documentId)
        setLoadingOperation({
          step: "Generating flashcards...",
          progress: 80,
          open: true,
        })
      } catch (error: any) {
        setLoadingOperation({
          step: "Failed to generate enhanced study notes.",
          progress: 100,
          open: true,
        })
        throw error
      }

      // Generate flashcards
      try {
        await generateFlashcards(documentId)
        setLoadingOperation({
          step: "All done! Redirecting...",
          progress: 100,
          open: true,
        })
      } catch (error: any) {
        setLoadingOperation({
          step: "Failed to generate flashcards.",
          progress: 100,
          open: true,
        })
        throw error
      }

      toast({
        title: "Processing complete!",
        description: "Your study materials have been generated successfully.",
      })
      setTimeout(() => {
        setLoadingOperation({ step: "", progress: 0, open: false })
        router.push(`/dashboard/documents/${documentId}`)
      }, 1500)
    } catch (error: any) {
      setFiles(prev => prev.map(file => ({ ...file, status: "error" as const, error: error.response?.data?.message || "Upload failed" })))
      setLoadingOperation({
        step: error.response?.data?.message || error.message || "Upload failed",
        progress: 100,
        open: true,
      })
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
      setTimeout(() => setLoadingOperation({ step: "", progress: 0, open: false }), 2000)
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="h-5 w-5 text-gray-400" />
      case "uploading":
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusText = (status: UploadFile["status"]) => {
    switch (status) {
      case "pending":
        return "Ready to upload"
      case "uploading":
        return "Uploading..."
      case "processing":
        return "Processing with AI..."
      case "completed":
        return "Completed"
      case "error":
        return "Error"
    }
  }

  const getStepIcon = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="h-5 w-5 text-gray-400" />
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-bold">Upload Documents</h1>
        <p className="text-muted-foreground mt-2">
          Upload your PDF documents and let AI transform them into interactive study materials.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6"
        >
          {/* File Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>Drag and drop your PDF files or click to browse.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600 font-medium">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">
                      Drag & drop PDF files here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">Supports multiple PDF files up to 10MB each</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* File List & Upload Progress */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Files</CardTitle>
                <CardDescription>
                  {files.length} file{files.length !== 1 ? "s" : ""} ready for upload
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((fileItem) => (
                    <div key={fileItem.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">{getStatusIcon(fileItem.status)}</div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">{getStatusText(fileItem.status)}</p>
                        </div>

                        {(fileItem.status === "uploading" || fileItem.status === "processing") && (
                          <Progress value={fileItem.progress} className="mt-2 h-1" />
                        )}

                        {fileItem.error && <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>}
                      </div>

                      {fileItem.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(fileItem.id)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Remove the old Processing Steps card and add the Dialog */}
      <Dialog open={loadingOperation.open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Processing Document</DialogTitle>
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

      {/* Upload Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
          className="min-w-[150px]"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Process
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
