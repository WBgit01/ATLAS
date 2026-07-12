import { useEffect, useState } from "react"
import { Search } from "lucide-react"

import { fetchAttendanceRecords } from "@/services/attendance.service"
import { PageShell } from "@/components/layout/PageShell"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { TablePagination } from "@/components/ui/table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const fieldClassName =
  "h-10 border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-2px_rgba(76,29,149,0.44)] focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-violet-400/50"
const headBase = "h-11 bg-violet-50/50 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetchAttendanceRecords({ page, limit: 20, search: search || undefined })
        if (cancelled) return
        setRecords(res.records || [])
        setTotal(res.total || 0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, search])

  return (
    <PageShell title="Attendance" description="Search and review attendance records across all students.">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-500/80" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by student name or ID..."
          className={cn(fieldClassName, "pl-9")}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-8 text-violet-600" /></div>
      ) : (
        <div className="flex flex-col">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={headBase}>Date</TableHead>
                <TableHead className={headBase}>Student</TableHead>
                <TableHead className={headBase}>Department</TableHead>
                <TableHead className={headBase}>Time In</TableHead>
                <TableHead className={headBase}>Time Out</TableHead>
                <TableHead className={headBase}>Status</TableHead>
                <TableHead className={headBase}>Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record._id}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.student?.name || "—"}</TableCell>
                  <TableCell>{record.student?.department || "—"}</TableCell>
                  <TableCell>{record.timeIn || "—"}</TableCell>
                  <TableCell>{record.timeOut || "—"}</TableCell>
                  <TableCell>{record.status}</TableCell>
                  <TableCell>{record.hoursRendered ?? 0}h</TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            totalPages={Math.max(1, Math.ceil(total / 20))}
            onPageChange={setPage}
            rangeStart={total === 0 ? 0 : (page - 1) * 20 + 1}
            rangeEnd={Math.min(page * 20, total)}
            totalItems={total}
            itemLabel="records"
          />
        </div>
      )}
    </PageShell>
  )
}
