import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Document } from "@/lib/types"
import { Calendar } from "lucide-react"

interface DocumentHeaderProps {
  document: Document
}

export function DocumentHeader({ document }: DocumentHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{document.title}</h1>
          <p className="text-gray-400 mb-4">{document.description}</p>
          <div className="flex items-center text-sm text-gray-400">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(document.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
