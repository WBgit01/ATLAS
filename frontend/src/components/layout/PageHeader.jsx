import { cn } from "@/lib/utils"

export function PageHeader({ title, description, descriptionAddon, children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span
            className="h-5 w-0.5 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
          <h1 className="truncate text-lg font-semibold leading-tight tracking-tight text-foreground md:text-xl">
            {title}
          </h1>
        </div>
        {(description || descriptionAddon) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-3">
            {description && (
              <p className="text-sm leading-snug text-muted-foreground">{description}</p>
            )}
            {descriptionAddon}
          </div>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 pl-2.5 sm:pl-0">
          {children}
        </div>
      )}
    </div>
  )
}
