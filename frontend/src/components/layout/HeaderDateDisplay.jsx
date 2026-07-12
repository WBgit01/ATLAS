import { format } from "date-fns"
import { CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils"

export function HeaderDateDisplay({ className }) {
  const today = new Date()

  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3",
        className
      )}
    >
      <CalendarDays className="size-4 shrink-0 text-primary" />
      <div className="hidden min-w-0 leading-tight sm:block">
        <p className="truncate text-xs font-medium text-foreground">
          {format(today, "EEEE, MMMM d, yyyy")}
        </p>
      </div>
      <p className="truncate text-xs font-medium text-foreground sm:hidden">
        {format(today, "MMM d, yyyy")}
      </p>
    </div>
  )
}
