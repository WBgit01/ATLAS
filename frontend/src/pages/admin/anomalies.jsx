import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"

import { fetchAnomalies, resolveAnomaly } from "@/services/anomaly.service"
import { PageShell } from "@/components/layout/PageShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { toast } from "sonner"

const fieldClassName =
  "h-10 border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-2px_rgba(76,29,149,0.44)] focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-violet-400/50"
const headBase = "h-11 bg-violet-50/50 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"

const statusStyles = {
  open: "border-amber-200/80 bg-amber-50 text-amber-700",
  reviewed: "border-sky-200/80 bg-sky-50 text-sky-700",
  resolved: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  dismissed: "border-slate-200/80 bg-slate-50 text-slate-700",
}

export default function Anomalies() {
  const [status, setStatus] = useState("open")
  const [page, setPage] = useState(1)
  const [anomalies, setAnomalies] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchAnomalies({ status, page, limit: 20 })
      setAnomalies(res.anomalies || [])
      setTotal(res.total || 0)
    } catch (err) {
      toast.error(err.message || "Failed to load anomalies")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status, page])

  const handleResolve = async (id) => {
    setResolving(id)
    try {
      await resolveAnomaly(id, { status: "resolved", resolutionNotes: "Resolved from admin dashboard" })
      toast.success("Anomaly resolved")
      await load()
    } catch (err) {
      toast.error(err.message || "Failed to resolve anomaly")
    } finally {
      setResolving(null)
    }
  }

  return (
    <PageShell title="Anomalies" description="Review and resolve import and attendance anomalies.">
      <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
        <SelectTrigger className={cn(fieldClassName, "w-full sm:w-[200px]")}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="reviewed">Reviewed</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="dismissed">Dismissed</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-8 text-violet-600" /></div>
      ) : (
        <div className="flex flex-col">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={headBase}>Type</TableHead>
                <TableHead className={headBase}>Student</TableHead>
                <TableHead className={headBase}>Date</TableHead>
                <TableHead className={headBase}>Message</TableHead>
                <TableHead className={headBase}>Status</TableHead>
                <TableHead className={headBase}>Import</TableHead>
                <TableHead className={headBase} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {anomalies.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.student?.name || item.studentName || "—"}</TableCell>
                  <TableCell>{item.date || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.message}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[item.status] || statusStyles.open}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.importBatch?.fileName || "—"}</TableCell>
                  <TableCell>
                    {item.status === "open" && (
                      <Button size="sm" variant="outline" className="rounded-lg" disabled={resolving === item._id} onClick={() => handleResolve(item._id)}>
                        {resolving === item._id ? "..." : "Resolve"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {anomalies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    <AlertTriangle className="mx-auto mb-2 size-5 opacity-50" />
                    No anomalies found.
                  </TableCell>
                </TableRow>
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
            itemLabel="anomalies"
          />
        </div>
      )}
    </PageShell>
  )
}
