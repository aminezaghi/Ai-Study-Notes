"use client"

import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { motion } from "framer-motion"
import { gsap } from "gsap"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Search, Filter, MoreVertical, Plus, Calendar, Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import { useDocuments, useDeleteDocument } from "@/hooks/use-documents"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const cardsRef = useRef<HTMLDivElement>(null)
  const { data: documents, isLoading } = useDocuments()
  const deleteDocument = useDeleteDocument()
  const { toast } = useToast()

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || doc.status === filterStatus
    return matchesSearch && matchesFilter
  })

  useLayoutEffect(() => {
    const cards = document.querySelectorAll('.document-card');
    if (filteredDocuments && filteredDocuments.length > 0 && cards.length > 0) {
      gsap.set(cards, { opacity: 0, y: 30 });
      gsap.to(cards, {
        duration: 0.6,
        y: 0,
        opacity: 1,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }
    return () => {
      if (cards.length > 0) {
        gsap.set(cards, { clearProps: "all" });
      }
    };
  }, [filteredDocuments]);

  const handleDelete = async (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      try {
        await deleteDocument.mutateAsync(id)
        toast({
          title: "Document deleted",
          description: "The document has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Failed to delete the document. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-2">Manage your uploaded documents and study materials.</p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter: {filterStatus === "all" ? "All" : filterStatus}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Documents</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("completed")}>Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("processing")}>Processing</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("failed")}>Failed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Documents Grid */}
      <div ref={cardsRef}>
        {filteredDocuments && filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <Card
                key={document.id}
                className="document-card group hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                        {document.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-3">{document.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/documents/${document.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(document.id, document.title)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(document.status)}>{document.status}</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FileText className="mr-1 h-4 w-4" />
                        {document.files?.length || 0} files
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(document.created_at).toLocaleDateString()}
                    </div>

                    <Link href={`/dashboard/documents/${document.id}`}>
                      <Button className="w-full bg-transparent" variant="outline">
                        View Document
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterStatus !== "all" ? "No documents found" : "No documents yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Upload your first PDF document to get started with AI-powered study materials."}
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Link href="/dashboard/upload">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
