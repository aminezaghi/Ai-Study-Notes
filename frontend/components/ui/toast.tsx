"use client"

import { toast as sonnerToast } from "sonner"

export type ToastProps = {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: "default" | "destructive"
}

export type ToastActionElement = {
  label: string
  onClick: () => void
}

export function toast({ title, description, action, variant = "default" }: ToastProps) {
  sonnerToast[variant === "destructive" ? "error" : "success"]((
    <div className="grid gap-1">
      {title && <p className="font-semibold">{title}</p>}
      {description && <p className="text-sm opacity-90">{description}</p>}
      {action && (
        <button
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          onClick={action.onClick}
  >
          {action.label}
        </button>
      )}
    </div>
))
}
