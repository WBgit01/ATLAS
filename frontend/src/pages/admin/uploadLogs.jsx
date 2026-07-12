import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import {
  CheckCircle2,
  CloudUpload,
  FileText,
  History,
  X,
} from "lucide-react"

import { fetchUploadHistory, formatUploadTimestamp, uploadImportFile } from "@/services/upload.service"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/layout/PageShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

const ACCEPTED = ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const headBase = "h-11 bg-violet-50/50 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
const cellBase = "px-3 py-3"
const cardClassName = "rounded-2xl border-0 bg-white/85 p-5 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)]"

const statusStyles = {
  success: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  failed: "border-red-200/80 bg-red-50 text-red-700",
  completed: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  processing: "border-sky-200/80 bg-sky-50 text-sky-700",
}

export default function UploadLogs() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [createUnmatched, setCreateUnmatched] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const res = await fetchUploadHistory()
      setHistory(res.uploads || [])
    } catch (err) {
      toast.error(err.message || "Failed to load import history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
    const socket = io("/", { path: "/socket.io" })
    socket.on("import:completed", () => {
      toast.success("Import completed")
      setUploading(false)
      loadHistory()
    })
    socket.on("import:failed", (payload) => {
      toast.error(payload?.message || "Import failed")
      setUploading(false)
    })
    socket.on("import:started", () => setUploading(true))
    return () => socket.disconnect()
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      await uploadImportFile(file, createUnmatched)
      toast.success("File uploaded successfully")
      setFile(null)
      await loadHistory()
    } catch (err) {
      toast.error(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) setFile(dropped)
  }

  return (
    <PageShell title="Upload Logs" description="Upload attendance spreadsheets and review import history.">
      <div className={cardClassName}>
        <div className="mb-4 flex items-center gap-2">
          <CloudUpload className="size-5 text-violet-600" />
          <div>
            <p className="text-sm font-semibold">Upload attendance file</p>
            <p className="text-xs text-muted-foreground">Supported formats: .xls, .xlsx</p>
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
            dragOver ? "border-violet-400 bg-violet-50/50" : "border-violet-200/70 bg-violet-50/20"
          )}
        >
          <CloudUpload className="mb-3 size-10 text-violet-500" />
          <p className="text-sm font-medium">Drag and drop your spreadsheet here</p>
          <p className="mt-1 text-xs text-muted-foreground">or browse from your computer</p>
          <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-violet-50/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="size-5 shrink-0 text-violet-600" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setFile(null)}>
              <X className="size-4" />
            </Button>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Checkbox id="createUnmatched" checked={createUnmatched} onCheckedChange={(v) => setCreateUnmatched(!!v)} />
          <Label htmlFor="createUnmatched" className="text-sm font-normal text-muted-foreground">
            Create student records for unmatched entries
          </Label>
        </div>

        {uploading && (
          <div className="mt-4 space-y-2">
            <Progress value={66} className="h-2" />
            <p className="text-xs text-muted-foreground">Processing import...</p>
          </div>
        )}

        <Button
          type="button"
          disabled={!file || uploading}
          className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-[#9F00FF] to-[#7B00CC] text-white"
          onClick={handleUpload}
        >
          {uploading ? <Spinner className="size-4" /> : <CheckCircle2 className="size-4" />}
          {uploading ? "Uploading..." : "Upload and import"}
        </Button>
      </div>

      <div className={cardClassName}>
        <div className="mb-4 flex items-center gap-2">
          <History className="size-5 text-violet-600" />
          <div>
            <p className="text-sm font-semibold">Upload history</p>
            <p className="text-xs text-muted-foreground">Previous biometric log uploads</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-8 text-violet-600" />
          </div>
        ) : history.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No imports yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={headBase}>File</TableHead>
                <TableHead className={headBase}>Status</TableHead>
                <TableHead className={headBase}>Records</TableHead>
                <TableHead className={headBase}>Matched</TableHead>
                <TableHead className={headBase}>Anomalies</TableHead>
                <TableHead className={headBase}>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className={cn(cellBase, "font-medium")}>{item.fileName}</TableCell>
                  <TableCell className={cellBase}>
                    <Badge variant="outline" className={statusStyles[item.status] || statusStyles.completed}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={cellBase}>{item.recordCount ?? "—"}</TableCell>
                  <TableCell className={cellBase}>{item.matchedStudents ?? "—"}</TableCell>
                  <TableCell className={cellBase}>{item.anomaliesDetected ?? "—"}</TableCell>
                  <TableCell className={cellBase}>{formatUploadTimestamp(item.uploadedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PageShell>
  )
}
