import { useEffect, useState } from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"

import { exportAttendanceExcel, exportAttendancePdf } from "@/services/report.service"
import { fetchStudentFilters } from "@/services/student.service"
import { PageShell } from "@/components/layout/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const cardClassName = "rounded-2xl border-0 bg-white/85 p-5 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)]"
const fieldClassName =
  "h-10 border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-2px_rgba(76,29,149,0.44)] focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-violet-400/50"

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export default function Reports() {
  const [department, setDepartment] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [departments, setDepartments] = useState([])
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchStudentFilters()
      .then((res) => setDepartments(res.departments || []))
      .catch(() => {})
  }, [])

  const params = {
    department: department !== "all" ? department : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }

  const handleExportExcel = async () => {
    setDownloading(true)
    try {
      const blob = await exportAttendanceExcel(params)
      downloadBlob(blob, "attendance-report.xlsx")
      toast.success("Excel report downloaded")
    } catch (err) {
      toast.error(err.message || "Excel export failed")
    } finally {
      setDownloading(false)
    }
  }

  const handleExportPdf = async () => {
    setDownloading(true)
    try {
      const blob = await exportAttendancePdf(params)
      downloadBlob(blob, "attendance-summary.pdf")
      toast.success("PDF report downloaded")
    } catch (err) {
      toast.error(err.message || "PDF export failed")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <PageShell title="Reports" description="Generate and export attendance reports.">
      <div className={cardClassName}>
        <div className="mb-4 flex items-center gap-2">
          <FileText className="size-5 text-violet-600" />
          <div>
            <p className="text-sm font-semibold">Export filters</p>
            <p className="text-xs text-muted-foreground">Choose a department and date range for your export</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className={fieldClassName}><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={cn(fieldClassName, "scheme-light")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End date</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={cn(fieldClassName, "scheme-light")} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button disabled={downloading} className="rounded-xl" onClick={handleExportExcel}>
            <FileSpreadsheet className="size-4" />
            Export Excel
          </Button>
          <Button disabled={downloading} variant="outline" className="rounded-xl" onClick={handleExportPdf}>
            <Download className="size-4" />
            Export PDF
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
