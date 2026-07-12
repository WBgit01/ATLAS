import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, BarChart3, Search, UserCheck, Users } from "lucide-react"

import { fetchStudents, fetchStudentFilters } from "@/services/student.service"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/layout/PageShell"
import { TablePagination } from "@/components/ui/table-pagination"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"

const accentStyles = {
  default: { card: "from-violet-500 to-violet-600" },
  success: { card: "from-emerald-500 to-emerald-600" },
  info: { card: "from-sky-500 to-sky-600" },
  warning: { card: "from-amber-500 to-amber-600" },
}

const fieldClassName =
  "h-10 border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-2px_rgba(76,29,149,0.44)] focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-violet-400/50"

const headBase = "h-11 bg-violet-50/50 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
const cellBase = "px-3 py-3"

function StatCard({ title, value, description, icon: Icon, accent = "default" }) {
  const styles = accentStyles[accent] ?? accentStyles.default
  return (
    <div className={cn("min-h-[92px] rounded-xl bg-gradient-to-br p-4 shadow-md", styles.card)}>
      <div className="flex h-full items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <Icon className="size-4 text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-white/80">{title}</p>
          <p className="mt-1 text-2xl font-bold leading-none text-white tabular-nums">{value}</p>
          {description && <p className="mt-1.5 truncate text-[11px] text-white/70">{description}</p>}
        </div>
      </div>
    </div>
  )
}

export default function Students() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState("all")
  const [course, setCourse] = useState("all")
  const [yearLevel, setYearLevel] = useState("all")
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filterOptions, setFilterOptions] = useState({ departments: [], courses: [], yearLevels: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStudentFilters()
      .then(setFilterOptions)
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await fetchStudents({
          search: search || undefined,
          department: department !== "all" ? department : undefined,
          course: course !== "all" ? course : undefined,
          yearLevel: yearLevel !== "all" ? yearLevel : undefined,
          page,
          limit: 10,
        })
        if (cancelled) return
        setStudents(res.students || [])
        setTotal(res.total || 0)
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load students")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [search, department, course, yearLevel, page])

  const stats = useMemo(() => {
    const atRisk = students.filter((s) => (s.stats?.attendancePercentage ?? 100) < 75).length
    const avgAttendance = students.length
      ? Math.round(students.reduce((sum, s) => sum + (s.stats?.attendancePercentage ?? 0), 0) / students.length)
      : 0
    return [
      { title: "Total Students", value: String(total), description: "Matching current filters", icon: Users, accent: "default" },
      { title: "On Page", value: String(students.length), description: "Students in this view", icon: UserCheck, accent: "success" },
      { title: "Avg Attendance", value: `${avgAttendance}%`, description: "Current page average", icon: BarChart3, accent: "info" },
      { title: "At-Risk", value: String(atRisk), description: "Below 75% on this page", icon: AlertTriangle, accent: "warning" },
    ]
  }, [students, total])

  if (loading && students.length === 0) {
    return (
      <PageShell title="Students" description="Student directory and attendance records.">
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-8 text-violet-600" />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Students" description="Student directory and attendance records.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-500/80" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or student ID..."
            className={cn(fieldClassName, "pl-9")}
          />
        </div>
        <Select value={department} onValueChange={(v) => { setDepartment(v); setPage(1) }}>
          <SelectTrigger className={cn(fieldClassName, "w-full lg:w-[180px]")}><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {filterOptions.departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={course} onValueChange={(v) => { setCourse(v); setPage(1) }}>
          <SelectTrigger className={cn(fieldClassName, "w-full lg:w-[180px]")}><SelectValue placeholder="Course" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {filterOptions.courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={yearLevel} onValueChange={(v) => { setYearLevel(v); setPage(1) }}>
          <SelectTrigger className={cn(fieldClassName, "w-full lg:w-[160px]")}><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {filterOptions.yearLevels.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Empty className="border border-dashed border-red-200/60 bg-red-50/20 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Users /></EmptyMedia>
            <EmptyTitle>Failed to load students</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : students.length === 0 ? (
        <Empty className="border border-dashed border-violet-200/60 bg-violet-50/20 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Users /></EmptyMedia>
            <EmptyTitle>No students found</EmptyTitle>
            <EmptyDescription>Try adjusting your search or filter criteria.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex w-full min-w-0 flex-col">
          <div className="-mx-4 min-w-0 overflow-x-auto md:-mx-5">
            <div className="px-4 md:px-5">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-violet-100/80 hover:bg-transparent">
                    <TableHead className={headBase}>Student ID</TableHead>
                    <TableHead className={headBase}>Name</TableHead>
                    <TableHead className={headBase}>Department</TableHead>
                    <TableHead className={cn(headBase, "text-center")}>Present</TableHead>
                    <TableHead className={cn(headBase, "text-center")}>Absent</TableHead>
                    <TableHead className={cn(headBase, "text-center")}>Late</TableHead>
                    <TableHead className={cn(headBase, "text-right")}>Hours</TableHead>
                    <TableHead className={cn(headBase, "text-right")}>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow
                      key={student._id}
                      className="cursor-pointer border-b border-border/40 hover:bg-violet-50/50"
                      onClick={() => navigate(`/admin/students/${student._id}`)}
                    >
                      <TableCell className={cn(cellBase, "font-mono text-sm text-muted-foreground")}>{student.studentId}</TableCell>
                      <TableCell className={cn(cellBase, "font-medium")}>{student.name}</TableCell>
                      <TableCell className={cellBase}>{student.department || "—"}</TableCell>
                      <TableCell className={cn(cellBase, "text-center font-semibold text-emerald-600")}>{student.stats?.totalPresentDays ?? 0}</TableCell>
                      <TableCell className={cn(cellBase, "text-center font-semibold text-red-600")}>{student.stats?.totalAbsentDays ?? 0}</TableCell>
                      <TableCell className={cn(cellBase, "text-center font-semibold text-amber-600")}>{student.stats?.totalLateArrivals ?? 0}</TableCell>
                      <TableCell className={cn(cellBase, "text-right font-semibold tabular-nums")}>{student.stats?.totalHoursRendered ?? 0}h</TableCell>
                      <TableCell className={cn(cellBase, "text-right font-semibold tabular-nums")}>{student.stats?.attendancePercentage ?? 0}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <TablePagination
            page={page}
            totalPages={Math.max(1, Math.ceil(total / 10))}
            onPageChange={setPage}
            rangeStart={total === 0 ? 0 : (page - 1) * 10 + 1}
            rangeEnd={Math.min(page * 10, total)}
            totalItems={total}
            itemLabel="students"
          />
        </div>
      )}
    </PageShell>
  )
}
