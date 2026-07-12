import { useEffect, useMemo, useState } from "react"
import {
  Archive,
  ArchiveRestore,
  GraduationCap,
  Search,
  SlidersHorizontal,
  UserMinus,
} from "lucide-react"

import { fetchArchivedStudents, fetchArchiveSummary } from "@/services/archive.service"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/layout/PageShell"
import { TablePagination } from "@/components/ui/table-pagination"
import { usePagination } from "@/hooks/use-pagination"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusLabels = {
  graduated: "Graduated",
  transferred: "Transferred",
  dropped: "Dropped",
}

const statusStyles = {
  graduated: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  transferred: "border-sky-200/80 bg-sky-50 text-sky-700",
  dropped: "border-red-200/80 bg-red-50 text-red-700",
}

const fieldClassName =
  "h-10 border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-2px_rgba(76,29,149,0.44)] focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:shadow-[0_2px_6px_-2px_rgba(76,29,149,0.38)]"

const headBase =
  "h-11 bg-violet-50/50 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"

const cellBase = "px-3 py-3"

const accentStyles = {
  default: { card: "from-violet-500 to-violet-600" },
  success: { card: "from-emerald-500 to-emerald-600" },
  info: { card: "from-sky-500 to-sky-600" },
  warning: { card: "from-amber-500 to-amber-600" },
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getAttendanceColor(rate) {
  if (rate >= 85) return "bg-emerald-500"
  if (rate >= 75) return "bg-sky-500"
  return "bg-amber-500"
}

function filterArchived(students, { search, batch, status }) {
  const query = search.trim().toLowerCase()
  return students.filter((student) => {
    const matchesSearch =
      !query ||
      student.name.toLowerCase().includes(query) ||
      student.id.toLowerCase().includes(query)
    const matchesBatch = batch === "all" || student.batch === batch
    const matchesStatus = status === "all" || student.status === status
    return matchesSearch && matchesBatch && matchesStatus
  })
}

function StatCard({ title, value, description, icon: Icon, accent = "default", className }) {
  const styles = accentStyles[accent] ?? accentStyles.default
  return (
    <div className={cn("min-h-[92px] rounded-xl bg-gradient-to-br p-4 shadow-md", styles.card, className)}>
      <div className="flex h-full items-center gap-3">
        {Icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
            <Icon className="size-4 text-white" strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-white/80">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold leading-none tracking-tight text-white tabular-nums">
            {value}
          </p>
          {description && (
            <p className="mt-1.5 truncate text-[11px] text-white/70">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ArchiveFilterBar({
  searchValue,
  onSearchChange,
  batchValue,
  onBatchChange,
  statusValue,
  onStatusChange,
  batches,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={batchValue} onValueChange={onBatchChange}>
          <SelectTrigger className={cn(fieldClassName, "!h-10 w-full sm:w-[160px]")}>
            <SlidersHorizontal className="size-3.5 text-violet-500/80" />
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((batch) => (
              <SelectItem key={batch} value={batch}>
                {batch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusValue} onValueChange={onStatusChange}>
          <SelectTrigger className={cn(fieldClassName, "!h-10 w-full sm:w-[160px]")}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="graduated">Graduated</SelectItem>
            <SelectItem value="transferred">Transferred</SelectItem>
            <SelectItem value="dropped">Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="relative min-w-0 w-full sm:max-w-sm sm:flex-1 sm:ml-4 lg:max-w-md lg:flex-none">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-500/80" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or student ID..."
          className={cn(fieldClassName, "h-10 pl-9")}
        />
      </div>
    </div>
  )
}

function ArchiveTable({ students, totalCount, pagination }) {
  if (totalCount === 0) {
    return (
      <Empty className="border border-dashed border-violet-200/60 bg-violet-50/20 py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Archive />
          </EmptyMedia>
          <EmptyTitle>No archived records found</EmptyTitle>
          <EmptyDescription>
            Try adjusting your search or filter criteria.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="-mx-4 min-w-0 overflow-x-auto md:-mx-5">
        <div className="px-4 md:px-5">
          <Table className="table-fixed w-full min-w-0">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[28%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="border-b border-violet-100/80 hover:bg-transparent">
                <TableHead className={cn(headBase, "pr-3 pl-4 text-left")}>
                  Student ID
                </TableHead>
                <TableHead className={cn(headBase, "text-left")}>Student Name</TableHead>
                <TableHead className={cn(headBase, "text-center")}>Batch</TableHead>
                <TableHead className={cn(headBase, "text-center")}>Status</TableHead>
                <TableHead className={cn(headBase, "text-center")}>Archived On</TableHead>
                <TableHead className={cn(headBase, "pr-4 pl-3 text-right")}>
                  Final Attendance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow
                  key={student.id}
                  className="group border-b border-border/40 transition-colors hover:bg-violet-50/30"
                >
                  <TableCell
                    className={cn(cellBase, "pr-3 pl-4 font-mono text-sm text-muted-foreground")}
                  >
                    {student.id}
                  </TableCell>
                  <TableCell className={cn(cellBase, "font-medium text-foreground")}>
                    <span className="block truncate">{student.name}</span>
                  </TableCell>
                  <TableCell className={cn(cellBase, "text-center text-sm tabular-nums")}>
                    {student.batch}
                  </TableCell>
                  <TableCell className={cn(cellBase, "text-center")}>
                    <Badge
                      variant="outline"
                      className={cn("font-medium", statusStyles[student.status])}
                    >
                      {statusLabels[student.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(cellBase, "text-center text-sm text-muted-foreground")}>
                    {formatDate(student.archivedDate)}
                  </TableCell>
                  <TableCell className={cn(cellBase, "pr-4 pl-3")}>
                    <div className="ml-auto flex w-full max-w-36 flex-col items-stretch gap-1.5">
                      <span className="text-right text-sm font-semibold tabular-nums">
                        {student.finalAttendanceRate}%
                      </span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-100/80">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            getAttendanceColor(student.finalAttendanceRate)
                          )}
                          style={{ width: `${student.finalAttendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <TablePagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        rangeStart={pagination.rangeStart}
        rangeEnd={pagination.rangeEnd}
        totalItems={pagination.totalItems}
        itemLabel="archived records"
      />
    </div>
  )
}

export default function ArchivePage() {
  const [search, setSearch] = useState("")
  const [batch, setBatch] = useState("all")
  const [status, setStatus] = useState("all")
  const [allStudents, setAllStudents] = useState([])
  const [summary, setSummary] = useState({ total: 0, graduated: 0, transferred: 0, dropped: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      try {
        const [studentsRes, summaryRes] = await Promise.all([
          fetchArchivedStudents(),
          fetchArchiveSummary(),
        ])
        if (cancelled) return
        setAllStudents(studentsRes.students ?? [])
        setSummary(summaryRes.summary ?? { total: 0, graduated: 0, transferred: 0, dropped: 0 })
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load archive")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const batches = useMemo(
    () => [...new Set(allStudents.map((s) => s.batch).filter(Boolean))].sort().reverse(),
    [allStudents]
  )
  const filteredStudents = useMemo(
    () => filterArchived(allStudents, { search, batch, status }),
    [allStudents, search, batch, status]
  )
  const pagination = usePagination(filteredStudents)

  const stats = [
    {
      title: "Total Archived",
      value: String(summary.total),
      description: "All archived student records",
      icon: Archive,
      accent: "default",
    },
    {
      title: "Graduated",
      value: String(summary.graduated),
      description: "Completed the program",
      icon: GraduationCap,
      accent: "success",
    },
    {
      title: "Transferred",
      value: String(summary.transferred),
      description: "Moved to another school",
      icon: ArchiveRestore,
      accent: "info",
    },
    {
      title: "Dropped",
      value: String(summary.dropped),
      description: "Left before completing",
      icon: UserMinus,
      accent: "warning",
    },
  ]

  if (loading) {
    return (
      <PageShell title="Archive" description="Graduated students and archived attendance records.">
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-8 text-violet-600" />
        </div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell title="Archive" description="Graduated students and archived attendance records.">
        <Empty className="border border-dashed border-red-200/60 bg-red-50/20 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Archive /></EmptyMedia>
            <EmptyTitle>Failed to load archive</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Archive"
      description="Graduated students and archived attendance records."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <ArchiveFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        batchValue={batch}
        onBatchChange={setBatch}
        statusValue={status}
        onStatusChange={setStatus}
        batches={batches}
      />

      <ArchiveTable
        students={pagination.paginatedItems}
        totalCount={filteredStudents.length}
        pagination={pagination}
      />
    </PageShell>
  )
}
