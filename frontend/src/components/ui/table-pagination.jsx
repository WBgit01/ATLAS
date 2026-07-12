import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const paginationNavClassName =
  "h-8 gap-1.5 border-violet-200/80 px-3 text-violet-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"

const paginationPageActiveClassName =
  "size-8 border-violet-600 bg-violet-600 text-white shadow-sm hover:border-violet-700 hover:bg-violet-700 hover:text-white"

const paginationPageInactiveClassName =
  "size-8 border-violet-200/80 text-violet-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"

function getVisiblePages(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set([1, totalPages, page, page - 1, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("ellipsis")
    }
    result.push(sorted[i])
  }
  return result
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  rangeStart,
  rangeEnd,
  totalItems,
  itemLabel = "items",
  className,
}) {
  if (totalItems === 0) {
    return (
      <div
        className={cn(
          "border-t border-violet-100/80 px-4 pt-3 pb-1 text-xs text-muted-foreground md:px-5",
          className
        )}
      >
        No {itemLabel} to display
      </div>
    )
  }

  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-violet-100/80 px-4 pt-4 pb-1 sm:flex-row sm:items-center sm:justify-between md:px-5",
        className
      )}
    >
      <span className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">{rangeStart}</span>
        {rangeEnd > rangeStart && (
          <>
            –<span className="font-medium text-foreground">{rangeEnd}</span>
          </>
        )}{" "}
        of <span className="font-medium text-foreground">{totalItems}</span> {itemLabel}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Page <span className="font-medium text-violet-700">{page}</span> of{" "}
          <span className="font-medium text-violet-700">{totalPages}</span>
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(paginationNavClassName)}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Go to previous page"
          >
            <ChevronLeftIcon className="size-4 shrink-0" />
            Previous
          </Button>

          <div className="flex items-center gap-0.5">
            {visiblePages.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="flex size-8 items-center justify-center text-sm text-muted-foreground"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className={cn(
                    item === page ? paginationPageActiveClassName : paginationPageInactiveClassName
                  )}
                  aria-label={`Go to page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              )
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(paginationNavClassName)}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Go to next page"
          >
            Next
            <ChevronRightIcon className="size-4 shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  )
}
