"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export interface LoadingStep {
  id: string;
  text: string;
  status: "pending" | "loading" | "completed";
}

interface MultiStepLoaderProps {
  loading?: boolean;
  currentStep: number;
  onComplete?: () => void;
  steps?: LoadingStep[];
}

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
};

const CheckFilledIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export function MultiStepLoader({ 
  loading = false, 
  currentStep = 0, 
  onComplete,
  steps: customSteps 
}: MultiStepLoaderProps) {
  const [steps, setSteps] = useState<LoadingStep[]>(customSteps || [
    { id: "upload", text: "Uploading PDF...", status: "pending" },
    { id: "notes", text: "Generating AI Study Notes...", status: "pending" },
    { id: "flashcards", text: "Creating Flashcards ...", status: "pending" },
  ]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (!loading) {
      setSteps((prevSteps) =>
        prevSteps.map((step) => ({ ...step, status: "pending" }))
      );
      return;
    }

    setSteps((prevSteps) =>
      prevSteps.map((step, idx) => ({
        ...step,
        status: idx < currentStep ? "completed" : idx === currentStep ? "loading" : "pending",
      }))
    );

    if (currentStep >= steps.length) {
      onComplete?.();
    }
  }, [loading, currentStep, steps.length, onComplete]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="relative mx-auto flex w-full max-w-lg flex-col gap-4 bg-background p-6 shadow-lg sm:rounded-lg border">
          {/* Progress bar */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full w-full flex-1 bg-primary transition-all duration-500"
              style={{ transform: `translateX(-${100 - progress}%)` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isCurrent = index === currentStep;
              const isCompleted = index < currentStep;
              const isPending = index > currentStep;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 text-sm",
                    isCurrent && "text-primary",
                    isCompleted && "text-success",
                    isPending && "text-muted-foreground"
                  )}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {isCompleted && <CheckFilledIcon className="text-success" />}
                    {isCurrent && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isPending && <CheckIcon className="text-muted-foreground" />}
                  </div>
                  <div className="flex-1">{step.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 