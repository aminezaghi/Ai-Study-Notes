import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function ProcessingStatus() {
  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Processing your document...</h3>
            <p className="text-muted-foreground">Study notes and flashcards will be available shortly.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
