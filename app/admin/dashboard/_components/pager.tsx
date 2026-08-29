"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ApiPagination } from "@/lib/api"
import { rangeLabel } from "../_utils/format"

interface Props {
  pagination: ApiPagination
  page: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

/**
 * Previous / next, and the sentence saying where you are.
 *
 * Deliberately not numbered page links. The two things an admin does with these tables are "look
 * at the newest" and "search for one account", and a row of numbers over a table that can run to
 * hundreds of pages is a control nobody uses taking up the space of one that says how many rows
 * there are.
 *
 * The buttons stay mounted and disable rather than disappearing at the ends, so the footer does
 * not change width as you page through it.
 */
export function Pager({ pagination, page, isLoading, onPageChange }: Props) {
  const { per_page: perPage, total, total_pages: totalPages } = pagination

  return (
    <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t border-border">
      <p className="text-xs text-muted-foreground font-serif">
        {rangeLabel(page, perPage, total)}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="border-border"
          disabled={isLoading || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-border"
          disabled={isLoading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  )
}
