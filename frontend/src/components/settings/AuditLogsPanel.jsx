import { useEffect, useState } from "react"

import { fetchAuditLogs } from "@/services/report.service"
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

const headBase =
  "h-11 bg-violet-50/50 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"

export function AuditLogsPanel() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetchAuditLogs({ page, limit: 20 })
        if (cancelled) return
        setLogs(res.logs || [])
        setTotal(res.total || 0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8 text-violet-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="-mx-1 min-w-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={headBase}>Time</TableHead>
              <TableHead className={headBase}>User</TableHead>
              <TableHead className={headBase}>Action</TableHead>
              <TableHead className={headBase}>Resource</TableHead>
              <TableHead className={headBase}>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id} className="border-b border-border/40">
                <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-sm">{log.user?.email || log.userEmail || "—"}</TableCell>
                <TableCell className="text-sm">{log.action}</TableCell>
                <TableCell className="text-sm">
                  {log.resource}
                  {log.resourceId ? ` (${log.resourceId})` : ""}
                </TableCell>
                <TableCell className="text-sm">{log.ipAddress || "—"}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / 20))}
        onPageChange={setPage}
        rangeStart={total === 0 ? 0 : (page - 1) * 20 + 1}
        rangeEnd={Math.min(page * 20, total)}
        totalItems={total}
        itemLabel="logs"
      />
    </div>
  )
}
