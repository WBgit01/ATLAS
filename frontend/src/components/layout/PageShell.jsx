import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageHeader"

export function PageShell({
  title,
  description,
  descriptionAddon,
  actions,
  toolbar,
  children,
  className,
  contentClassName,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-4 py-4 md:px-5 md:py-5",
        className
      )}
    >
      <PageHeader title={title} description={description} descriptionAddon={descriptionAddon}>
        {actions}
      </PageHeader>

      {toolbar && <div>{toolbar}</div>}

      <div className={cn("flex flex-col gap-4", contentClassName)}>
        {children}
      </div>
    </div>
  )
}
