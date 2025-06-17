"use client"

import type React from "react"
import type { LoadingStep } from "@/components/ui/multi-step-loader"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/services/api"
import { Upload, FileText } from "lucide-react"
import { MultiStepLoader } from "@/components/ui/multi-step-loader"

interface ValidationErrors {
  [key: string]: string[]
}

export default function DocumentUploadPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  const uploadSteps: LoadingStep[] = [
    { id: "upload", text: "Uploading PDF...", status: "pending" },
    { id: "notes", text: "Generating AI Study Notes...", status: "pending" },
    { id: "flashcards", text: "Creating Flashcards...", status: "pending" },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    // Clear error when field is edited
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: [] })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        if (selectedFile.size <= 10 * 1024 * 1024) { // 10MB limit
      setFile(selectedFile)
          if (errors.files) {
            setErrors({ ...errors, files: [] })
          }
        } else {
          toast({
            title: "Error",
            description: "File size must not exceed 10MB",
            variant: "destructive",
          })
        }
    } else {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive",
      })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!file) {
      setErrors({ files: ["Please select a file"] })
      return
    }

    setIsLoading(true)
    setIsProcessing(true)
    setCurrentStep(0) // Start with upload step

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("files[]", file)

      // Step 1: Upload document
      const response = await apiService.uploadDocument(formDataToSend)
      setCurrentStep(1) // Move to study notes generation

      // Step 2: Generate study notes
      await apiService.generateStudyNotes(response.id)
      setCurrentStep(2) // Move to flashcards generation

      // Step 3: Generate flashcards
      await apiService.generateFlashcards(response.id)
      setCurrentStep(3) // Complete all steps

      toast({
        title: "Success",
        description: "Document uploaded and study materials generated successfully",
      })

      router.push(`/documents/${response.id}`)
    } catch (error: any) {
      setIsProcessing(false)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to upload document",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Upload Document</h1>
            <p className="text-gray-400">Upload a PDF to generate study materials automatically</p>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Document Details</CardTitle>
              <CardDescription className="text-gray-400">Provide information about your document</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-300">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter document title"
                    required
                    className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 ${
                      errors.title ? "border-red-500" : ""
                    }`}
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter document description"
                    rows={3}
                    className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 ${
                      errors.description ? "border-red-500" : ""
                    }`}
                  />
                  {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file" className="text-gray-300">PDF File</Label>
                  <div className={`border-2 border-dashed rounded-lg p-6 ${
                    errors.files ? "border-red-500 bg-red-500/5" : "border-gray-600 hover:border-purple-500/50"
                  }`}>
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <div className="flex text-sm text-gray-400 justify-center">
                        <label
                          htmlFor="file"
                          className="relative cursor-pointer rounded-md font-medium text-purple-400 hover:text-purple-300"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file"
                            name="file"
                            type="file"
                            accept=".pdf"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">PDF up to 10MB</p>
                      {file && <p className="mt-2 text-sm text-green-400">Selected: {file.name}</p>}
                      {errors.files && <p className="text-sm text-red-500 mt-2">{errors.files[0]}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <MultiStepLoader 
        loading={isProcessing}
        currentStep={currentStep}
        steps={uploadSteps}
        onComplete={() => {
          setIsProcessing(false)
          setCurrentStep(0)
        }}
      />
    </div>
  )
}
