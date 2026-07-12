import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarCheck,
  CalendarDays,
  Clock,
  Loader2,
  Lock,
  Mail,
  MoreHorizontal,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  User,
  UserMinus,
} from "lucide-react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import {
  attendanceStatusLabels,
  formatDisplayDate,
  matchesAttendanceStatus,
} from "@/data/mockAttendance"
import { fetchStudentById, fetchStudentFilters, updateEnrollmentStatus, updateStudent } from "@/services/student.service"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/layout/PageShell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { TablePagination } from "@/components/ui/table-pagination"
import { usePagination } from "@/hooks/use-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

const recordStatusStyles = {
  present: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  late: "border-amber-200/80 bg-amber-50 text-amber-700",
  partial: "border-sky-200/80 bg-sky-50 text-sky-700",
  absent: "border-red-200/80 bg-red-50 text-red-700",
  incomplete: "border-sky-200/80 bg-sky-50 text-sky-700",
  early_departure: "border-amber-200/80 bg-amber-50 text-amber-700",
  flagged: "border-violet-200/80 bg-violet-50 text-violet-700",
}

const recordStatusLabels = {
  present: "Present",
  late: "Late",
  partial: "Partial",
  absent: "Absent",
  incomplete: "Incomplete",
  early_departure: "Early Out",
  flagged: "Flagged",
}

const headBase =
  "h-11 bg-violet-50/50 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"

const subHeadBase =
  "h-9 bg-violet-50/30 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80"

const cellBase = "px-3 py-3"

const fieldClassName =
  "h-10 border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-2px_rgba(76,29,149,0.44)] focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:shadow-[0_2px_6px_-2px_rgba(76,29,149,0.38)]"

const selectFieldClassName = cn(fieldClassName, "w-full !h-10")

const cardClassName =
  "rounded-xl border-0 bg-white/85 p-5 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)]"

const FIXED_COURSE = "Bachelor of Science in Nursing"

const enrollmentStatusStyles = {
  enrolled: { label: "Enrolled", className: "bg-emerald-500/10 text-emerald-700" },
  dropped: { label: "Dropped", className: "bg-red-500/10 text-red-700" },
  transferred: { label: "Transferred", className: "bg-sky-500/10 text-sky-700" },
}

const YEAR_LEVEL_OPTIONS = [
  { value: "1st Year", label: "1st Year" },
  { value: "2nd Year", label: "2nd Year" },
  { value: "3rd Year", label: "3rd Year" },
  { value: "4th Year", label: "4th Year" },
]

const YEAR_LEVEL_ALIASES = {
  first: "1st Year",
  second: "2nd Year",
  third: "3rd Year",
  fourth: "4th Year",
  "1st": "1st Year",
  "2nd": "2nd Year",
  "3rd": "3rd Year",
  "4th": "4th Year",
}

function normalizeYearLevel(value) {
  if (!value) return ""
  const trimmed = String(value).trim()
  return YEAR_LEVEL_ALIASES[trimmed.toLowerCase()] ?? trimmed
}

function getAttendanceColor(rate) {
  if (rate >= 85) return "bg-emerald-500"
  if (rate >= 75) return "bg-sky-500"
  return "bg-amber-500"
}

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function normalizeAttendanceRecord(record) {
  const dateStr =
    typeof record.date === "string"
      ? record.date.slice(0, 10)
      : new Date(record.date).toISOString().slice(0, 10)

  const amTimeIn = record.beforeNoonIn || record.timeIn || "—"
  const amTimeOut = record.beforeNoonOut || "—"
  const pmTimeIn = record.afterNoonIn || "—"
  const pmTimeOut = record.afterNoonOut || record.timeOut || "—"

  const hasAm = amTimeIn && amTimeIn !== "—"
  const hasPm = pmTimeIn && pmTimeIn !== "—"

  const deriveSessionStatus = (hasSession, isLate) => {
    if (!hasSession) return "absent"
    if (record.status === "absent") return "absent"
    if (record.status === "incomplete" || record.status === "early_departure") return "partial"
    if (record.status === "flagged") return "flagged"
    if (isLate || record.status === "late") return "late"
    return "present"
  }

  return {
    id: record._id,
    date: dateStr,
    amTimeIn: hasAm ? amTimeIn : "—",
    amTimeOut: hasAm ? amTimeOut || "—" : "—",
    pmTimeIn: hasPm ? pmTimeIn : "—",
    pmTimeOut: hasPm ? pmTimeOut || "—" : "—",
    amStatus: deriveSessionStatus(hasAm, record.isLate),
    pmStatus: deriveSessionStatus(hasPm, false),
    hours: record.hoursRendered ?? 0,
  }
}

function FormField({ label, htmlFor, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

function StatBlock({ label, value, valueClassName }) {
  return (
    <div className="rounded-lg bg-violet-50/50 px-4 py-3 text-center">
      <p className={cn("text-2xl font-bold tabular-nums", valueClassName)}>{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}

function TimeCell({ value }) {
  const isEmpty = value === "—"
  return (
    <span
      className={cn(
        "text-sm tabular-nums",
        isEmpty ? "text-muted-foreground/50" : "text-foreground/90"
      )}
    >
      {value}
    </span>
  )
}

function StatusBadge({ status }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize",
        recordStatusStyles[status] ?? recordStatusStyles.present
      )}
    >
      {recordStatusLabels[status] ?? attendanceStatusLabels[status] ?? status}
    </Badge>
  )
}

function filterStudentRecords(records, { search, status, date }) {
  const query = search.trim().toLowerCase()

  return records.filter((record) => {
    const matchesStatus = matchesAttendanceStatus(record, status)
    const matchesDate = !date || record.date === date
    const matchesSearch =
      !query ||
      [
        record.date,
        formatDisplayDate(record.date),
        record.amTimeIn,
        record.amTimeOut,
        record.pmTimeIn,
        record.pmTimeOut,
        recordStatusLabels[record.amStatus],
        record.amStatus,
        recordStatusLabels[record.pmStatus],
        record.pmStatus,
      ].some((field) => field?.toLowerCase().includes(query))

    return matchesStatus && matchesDate && matchesSearch
  })
}

function AttendanceRecordsFilterBar({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  dateValue,
  onDateChange,
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={statusValue} onValueChange={onStatusChange}>
          <SelectTrigger className={cn(fieldClassName, "!h-10 w-full sm:w-[160px]")}>
            <SlidersHorizontal className="size-3.5 text-violet-500/80" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-full sm:w-[160px]">
          <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-violet-500/80" />
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            className={cn(fieldClassName, "h-10 w-full pl-9 scheme-light")}
          />
        </div>
      </div>
      <div className="relative min-w-0 w-full sm:max-w-sm sm:flex-1 sm:ml-4 lg:max-w-md lg:flex-none">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-500/80" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by date or time..."
          className={cn(fieldClassName, "h-10 pl-9")}
        />
      </div>
    </div>
  )
}

function StudentAttendanceRecords({ records, totalCount }) {
  const pagination = usePagination(records)

  if (totalCount === 0) {
    return (
      <Empty className="border border-dashed border-violet-200/60 bg-violet-50/20 py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon"><CalendarCheck /></EmptyMedia>
          <EmptyTitle>No attendance records</EmptyTitle>
          <EmptyDescription>
            This student has no logged time in or time out entries yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (records.length === 0) {
    return (
      <Empty className="border border-dashed border-violet-200/60 bg-violet-50/20 py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon"><CalendarCheck /></EmptyMedia>
          <EmptyTitle>No attendance records found</EmptyTitle>
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
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="border-b border-violet-100/80 hover:bg-transparent">
                <TableHead rowSpan={2} className={cn(headBase, "pr-3 pl-4 align-middle text-left")}>
                  Date
                </TableHead>
                <TableHead colSpan={3} className={cn(headBase, "border-x border-violet-100/60 text-center")}>
                  AM
                </TableHead>
                <TableHead colSpan={3} className={cn(headBase, "border-x border-violet-100/60 text-center")}>
                  PM
                </TableHead>
                <TableHead rowSpan={2} className={cn(headBase, "pr-4 pl-3 align-middle text-right")}>
                  Hours
                </TableHead>
              </TableRow>
              <TableRow className="border-b border-violet-100/80 hover:bg-transparent">
                <TableHead className={cn(subHeadBase, "border-x border-violet-100/60 text-center")}>
                  Time In
                </TableHead>
                <TableHead className={cn(subHeadBase, "text-center")}>Time Out</TableHead>
                <TableHead className={cn(subHeadBase, "text-center")}>Status</TableHead>
                <TableHead className={cn(subHeadBase, "border-x border-violet-100/60 text-center")}>
                  Time In
                </TableHead>
                <TableHead className={cn(subHeadBase, "text-center")}>Time Out</TableHead>
                <TableHead className={cn(subHeadBase, "text-center")}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((record) => (
                <TableRow
                  key={record.id}
                  className="border-b border-border/40 transition-colors hover:bg-violet-50/30"
                >
                  <TableCell className={cn(cellBase, "pr-3 pl-4 text-sm tabular-nums text-foreground/90")}>
                    {formatDisplayDate(record.date)}
                  </TableCell>
                  <TableCell className={cn(cellBase, "border-x border-violet-50/80 text-center")}>
                    <TimeCell value={record.amTimeIn} />
                  </TableCell>
                  <TableCell className={cn(cellBase, "text-center")}>
                    <TimeCell value={record.amTimeOut} />
                  </TableCell>
                  <TableCell className={cn(cellBase, "text-center")}>
                    <StatusBadge status={record.amStatus} />
                  </TableCell>
                  <TableCell className={cn(cellBase, "border-x border-violet-50/80 text-center")}>
                    <TimeCell value={record.pmTimeIn} />
                  </TableCell>
                  <TableCell className={cn(cellBase, "text-center")}>
                    <TimeCell value={record.pmTimeOut} />
                  </TableCell>
                  <TableCell className={cn(cellBase, "text-center")}>
                    <StatusBadge status={record.pmStatus} />
                  </TableCell>
                  <TableCell className={cn(cellBase, "pr-4 pl-3 text-right")}>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {record.hours > 0 ? `${record.hours}h` : "—"}
                    </span>
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
        itemLabel="records"
      />
    </div>
  )
}

function StudentAttendanceSection({ records }) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [date, setDate] = useState("")

  const filteredRecords = useMemo(
    () => filterStudentRecords(records, { search, status, date }),
    [records, search, status, date]
  )

  return (
    <>
      {records.length > 0 && (
        <AttendanceRecordsFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          statusValue={status}
          onStatusChange={setStatus}
          dateValue={date}
          onDateChange={setDate}
        />
      )}
      <StudentAttendanceRecords records={filteredRecords} totalCount={records.length} />
    </>
  )
}

function StudentStatusMenu({ studentId, enrollmentStatus, onEnrollmentStatusChange }) {
  const isDropped = enrollmentStatus === "dropped"
  const isTransferred = enrollmentStatus === "transferred"
  const hasMarkedStatus = isDropped || isTransferred

  async function handleMarkAs(statusValue) {
    try {
      const res = await updateEnrollmentStatus(studentId, statusValue)
      if (res.student) {
        onEnrollmentStatusChange(statusValue, res.student)
        toast.success(
          statusValue === "enrolled"
            ? "Enrollment status removed"
            : `Student marked as ${statusValue}`
        )
      }
    } catch (err) {
      toast.error(err.message || "Failed to update enrollment status")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-lg text-muted-foreground hover:bg-violet-50 hover:text-violet-700"
          aria-label="Student status actions"
        >
          <MoreHorizontal className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        <DropdownMenuItem
          className="rounded-lg"
          disabled={isDropped}
          onClick={() => handleMarkAs("dropped")}
        >
          <UserMinus className="size-4" />
          Mark as Drop
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-lg"
          disabled={isTransferred}
          onClick={() => handleMarkAs("transferred")}
        >
          <ArrowRightLeft className="size-4" />
          Mark as Transferred
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-lg"
          disabled={!hasMarkedStatus}
          onClick={() => handleMarkAs("enrolled")}
        >
          <RotateCcw className="size-4" />
          Remove Status
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const emptyForm = {
  name: "",
  studentId: "",
  email: "",
  department: "",
  course: "",
  yearLevel: "",
}

function studentToForm(student) {
  return {
    name: student?.name ?? "",
    studentId: student?.studentId ?? "",
    email: student?.email ?? "",
    department: student?.department ?? "",
    course: FIXED_COURSE,
    yearLevel: normalizeYearLevel(student?.yearLevel),
  }
}

export default function StudentInfo() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState(null)
  const [records, setRecords] = useState([])
  const [trends, setTrends] = useState({ weekly: [], monthly: [] })
  const [form, setForm] = useState(emptyForm)
  const [filterOptions, setFilterOptions] = useState({ departments: [], courses: [], yearLevels: [] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchStudentFilters()
      .then(setFilterOptions)
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchStudentById(studentId)
        if (cancelled) return
        setStudent(data.student)
        setForm(studentToForm(data.student))
        setRecords(data.records || [])
        setTrends(data.trends || { weekly: [], monthly: [] })
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Failed to load student")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [studentId])

  const stats = student?.stats || {}
  const attendanceRate = stats.attendancePercentage ?? 0
  const backPath = location.state?.from ?? "/admin/students"

  const normalizedRecords = useMemo(
    () => records.map(normalizeAttendanceRecord),
    [records]
  )

  const hasChanges = useMemo(() => {
    if (!student) return false
    const original = studentToForm(student)
    const editableFields = ["studentId", "email", "department", "yearLevel"]
    return editableFields.some((key) => form[key] !== original[key])
  }, [form, student])

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateStudent(studentId, {
        studentId: form.studentId.trim() || undefined,
        email: form.email.trim() || undefined,
        department: form.department.trim() || undefined,
        course: FIXED_COURSE,
        yearLevel: form.yearLevel.trim() || undefined,
      })
      toast.success("Student information updated")
      const data = await fetchStudentById(studentId)
      setStudent(data.student)
      setForm(studentToForm(data.student))
      setRecords(data.records || [])
      setTrends(data.trends || { weekly: [], monthly: [] })
    } catch (err) {
      toast.error(err.message || "Failed to update student")
    } finally {
      setSaving(false)
    }
  }

  const departmentOptions = useMemo(() => {
    const options = new Set(filterOptions.departments || [])
    if (form.department) options.add(form.department)
    return Array.from(options)
  }, [filterOptions.departments, form.department])

  const yearLevelSelectValue = form.yearLevel || "__none__"
  const yearLevelSelectOptions = useMemo(() => {
    const options = [...YEAR_LEVEL_OPTIONS]
    if (
      form.yearLevel &&
      !options.some((option) => option.value === form.yearLevel)
    ) {
      options.unshift({ value: form.yearLevel, label: form.yearLevel })
    }
    return options
  }, [form.yearLevel])

  if (loading) {
    return (
      <PageShell title="Student Information" description="Loading student profile...">
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-8 text-violet-600" />
        </div>
      </PageShell>
    )
  }

  if (!student) {
    return (
      <PageShell title="Student Not Found" description="The requested student record could not be found.">
        <Empty className="border border-dashed border-violet-200/60 bg-violet-50/20 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon"><User /></EmptyMedia>
            <EmptyTitle>Student not found</EmptyTitle>
            <EmptyDescription>
              No student matches ID <span className="font-mono">{studentId}</span>.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Button variant="outline" asChild>
          <Link to={backPath}>
            <ArrowLeft className="size-4" />
            Back to list
          </Link>
        </Button>
      </PageShell>
    )
  }

  const programLine = [FIXED_COURSE, form.yearLevel].filter(Boolean).join(" · ")
  const currentEnrollmentStatus = student.enrollmentStatus ?? "enrolled"
  const enrollmentBadge = enrollmentStatusStyles[currentEnrollmentStatus] ?? enrollmentStatusStyles.enrolled

  function handleEnrollmentStatusChange(statusValue, updatedStudent) {
    setStudent(updatedStudent ?? { ...student, enrollmentStatus: statusValue })
  }

  return (
    <PageShell
      title="Student Information"
      description="Edit student profile, academic details, and review attendance summary."
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate(backPath)}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      }
    >
      <div className={cn(cardClassName, "flex flex-col gap-5 sm:flex-row sm:items-center")}>
        <Avatar className="size-20 border-2 border-violet-100">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-violet-600 text-xl font-semibold text-white">
            {getInitials(form.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{form.name || "Unnamed student"}</h2>
            <Badge className={enrollmentBadge.className}>{enrollmentBadge.label}</Badge>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{form.studentId || "—"}</p>
          <p className="mt-2 text-sm text-muted-foreground">{programLine}</p>
        </div>
        <StudentStatusMenu
          studentId={student._id}
          enrollmentStatus={currentEnrollmentStatus}
          onEnrollmentStatusChange={handleEnrollmentStatusChange}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cardClassName}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Student Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" htmlFor="student-name">
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="student-name"
                  value={form.name}
                  readOnly
                  aria-readonly="true"
                  className={cn(fieldClassName, "cursor-not-allowed bg-violet-50/40 pr-9 text-foreground/80")}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Locked — attendance imports match records by student name, not student ID.
              </p>
            </FormField>

            <FormField label="Student ID" htmlFor="student-id">
              <Input
                id="student-id"
                value={form.studentId}
                onChange={(e) => handleFormChange("studentId", e.target.value)}
                className={cn(fieldClassName, "font-mono")}
                placeholder="e.g. 2024-001"
              />
            </FormField>

            <FormField label="Email" htmlFor="student-email">
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-500/80" />
                <Input
                  id="student-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  className={cn(fieldClassName, "pl-9")}
                  placeholder="student@email.com"
                />
              </div>
            </FormField>

            <FormField label="Department" htmlFor="student-department">
              <Select value={form.department || "__none__"} onValueChange={(v) => handleFormChange("department", v === "__none__" ? "" : v)}>
                <SelectTrigger id="student-department" className={selectFieldClassName}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not set</SelectItem>
                  {departmentOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Course" htmlFor="student-course">
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="student-course"
                  value={FIXED_COURSE}
                  readOnly
                  aria-readonly="true"
                  className={cn(fieldClassName, "cursor-not-allowed bg-violet-50/40 pr-9 text-foreground/80")}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Locked — all students are enrolled in this program.
              </p>
            </FormField>

            <FormField label="Year level" htmlFor="student-year">
              <Select
                value={yearLevelSelectValue}
                onValueChange={(v) => handleFormChange("yearLevel", v === "__none__" ? "" : v)}
              >
                <SelectTrigger id="student-year" className={selectFieldClassName}>
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not set</SelectItem>
                  {yearLevelSelectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              disabled={saving || !hasChanges}
              onClick={handleSave}
              className="rounded-xl bg-violet-600 text-white hover:bg-violet-700"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save changes
            </Button>
          </div>
        </div>

        <div className={cardClassName}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Attendance Summary
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <StatBlock label="Present" value={stats.totalPresentDays ?? 0} valueClassName="text-emerald-600" />
            <StatBlock label="Absent" value={stats.totalAbsentDays ?? 0} valueClassName="text-red-600" />
            <StatBlock label="Late" value={stats.totalLateArrivals ?? 0} valueClassName="text-amber-600" />
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Attendance Rate</span>
              <span className="text-lg font-bold tabular-nums text-foreground">{attendanceRate}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-violet-100/80">
              <div
                className={cn("h-full rounded-full transition-all", getAttendanceColor(attendanceRate))}
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatBlock
              label="Hours Rendered"
              value={`${stats.totalHoursRendered ?? 0}h`}
              valueClassName="text-violet-600"
            />
            <StatBlock
              label="Remaining Hours"
              value={`${stats.remainingServiceHours ?? 0}h`}
              valueClassName="text-sky-600"
            />
          </div>
        </div>
      </div>

      {(trends.monthly?.length ?? 0) > 0 && (
        <div className={cardClassName}>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="size-4 text-violet-600" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly Hours Trend
            </h3>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9e5f5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center gap-2 pl-3">
          <CalendarCheck className="size-4 text-violet-600" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Attendance Records
          </h3>
        </div>
        <p className="mb-4 pl-3 text-sm text-muted-foreground">
          Daily time in and time out logs from biometric check-ins.
        </p>
        <StudentAttendanceSection records={normalizedRecords} />
      </div>
    </PageShell>
  )
}
