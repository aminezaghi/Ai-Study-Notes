import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useQuizzes, deleteQuiz } from "@/hooks/use-quizzes"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface RemoveQuizDialogProps {
  documentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RemoveQuizDialog({ documentId, open, onOpenChange }: RemoveQuizDialogProps) {
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([])
  const [isRemoving, setIsRemoving] = useState(false)
  const { data, isLoading } = useQuizzes(documentId)
  const queryClient = useQueryClient()

  const handleRemoveQuizzes = async () => {
    if (selectedQuizzes.length === 0) return

    setIsRemoving(true)
    let successCount = 0;
    let failureCount = 0;

    try {
      await Promise.all(
        selectedQuizzes.map(async (quizId) => {
          try {
            await deleteQuiz(documentId, quizId);
            successCount++;
          } catch (error) {
            console.error(`Failed to delete quiz ${quizId}:`, error);
            failureCount++;
          }
        })
      );

      // Show appropriate toast message based on results
      if (successCount > 0 && failureCount === 0) {
        toast.success(`Successfully removed ${successCount} ${successCount === 1 ? 'quiz' : 'quizzes'}`);
      } else if (successCount > 0 && failureCount > 0) {
        toast.warning(`Removed ${successCount} ${successCount === 1 ? 'quiz' : 'quizzes'}, but failed to remove ${failureCount}`);
      } else {
        toast.error("Failed to remove any quizzes");
      }

      // Refresh the quizzes data
      await queryClient.invalidateQueries({ queryKey: ["quizzes", documentId] });
      
      if (successCount > 0) {
        onOpenChange(false);
        setSelectedQuizzes([]);
      }
    } catch (error) {
      console.error("Failed to remove quizzes:", error);
      toast.error("An error occurred while removing quizzes");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCheckboxChange = (checked: boolean | string, quizId: string) => {
    setSelectedQuizzes(prev =>
      checked
        ? [...prev, quizId]
        : prev.filter(id => id !== quizId)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Quizzes</DialogTitle>
          <DialogDescription>
            Select the quizzes you want to remove. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : !data?.quizzes || data.quizzes.length === 0 ? (
            <p className="text-center text-muted-foreground">No quizzes found</p>
          ) : (
            <div className="space-y-3">
              {data.quizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`quiz-${quiz.id}`}
                    checked={selectedQuizzes.includes(quiz.id.toString())}
                    onCheckedChange={(checked) => handleCheckboxChange(checked, quiz.id.toString())}
                  />
                  <label
                    htmlFor={`quiz-${quiz.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {quiz.title} ({quiz.type}, {quiz.total_questions} questions)
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedQuizzes([]);
            }}
            disabled={isRemoving}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemoveQuizzes}
            disabled={selectedQuizzes.length === 0 || isRemoving}
          >
            {isRemoving ? (
              <>
                <LoadingSpinner className="mr-2" />
                Removing...
              </>
            ) : (
              `Remove ${selectedQuizzes.length} ${selectedQuizzes.length === 1 ? 'Quiz' : 'Quizzes'}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 