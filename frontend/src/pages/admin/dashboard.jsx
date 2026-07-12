import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  ChevronRight,
  Clock,
  FileText,
  Settings,
  Upload,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { fetchDashboardAnalytics } from "@/services/attendance.service"
import { fetchStudentFilters } from "@/services/student.service"
import { fetchUploadHistory, formatUploadTimestamp } from "@/services/upload.service"
import { PageShell } from "@/components/layout/PageShell"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

const RATE_STROKE = "#7c3aed"
const COLORS = ["#7c3aed", "#ef4444", "#f59e0b", "#10b981"]

const containerShadowClassName =
  "border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.44)] transition-shadow duration-200 hover:shadow-[0_4px_10px_-4px_rgba(76,29,149,0.54)]"

const innerShadowClassName =
  "border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-2px_rgba(76,29,149,0.44)]"

const containerClassName = cn("rounded-2xl p-4", containerShadowClassName)
const containerClassNameLg = cn("rounded-2xl p-5", containerShadowClassName)
const innerCardClassName = cn("rounded-xl", innerShadowClassName)
const fieldClassName =
  "h-10 border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-2px_rgba(76,29,149,0.44)] focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-violet-400/50"

const accentStyles = {
  default: { card: "from-violet-500 to-violet-600" },
  success: { card: "from-emerald-500 to-emerald-600" },
  info: { card: "from-sky-500 to-sky-600" },
  warning: { card: "from-amber-500 to-amber-600" },
}

const uploadStatusStyles = {
  success: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  failed: "border-red-200/80 bg-red-50 text-red-700",
  completed: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
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
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-white/80">{title}</p>
          <p className="mt-1 text-2xl font-bold leading-none tracking-tight text-white tabular-nums">{value}</p>
          {description && <p className="mt-1.5 truncate text-[11px] text-white/70">{description}</p>}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [department, setDepartment] = useState("")
  const [departments, setDepartments] = useState([])
  const [data, setData] = useState(null)
  const [recentUploads, setRecentUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const params = department ? { department } : {}
      const [analytics, filters, uploads] = await Promise.all([
        fetchDashboardAnalytics(params),
        fetchStudentFilters(),
        fetchUploadHistory(),
      ])
      setData(analytics)
      setDepartments(filters.departments || [])
      setRecentUploads((uploads.uploads || []).slice(0, 4))
    } catch (err) {
      setError(err.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [department])

  useEffect(() => {
    const socket = io("/", { path: "/socket.io" })
    socket.on("import:completed", () => {
      toast.success("Import completed. Dashboard updated.")
      load()
    })
    return () => socket.disconnect()
  }, [department])

  const totals = data?.totals || {}
  const breakdown = data?.attendanceBreakdown || []
  const monthlyTrends = data?.monthlyTrends || []

  const stats = useMemo(
    () => [
      {
        title: "Total Students",
        value: String(totals.totalStudents ?? 0),
        description: "Currently enrolled",
        icon: Users,
        accent: "default",
      },
      {
        title: "Present Days",
        value: String(totals.totalPresentDays ?? 0),
        description: "Total present days recorded",
        icon: CalendarCheck,
        accent: "success",
      },
      {
        title: "Hours Rendered",
        value: String(totals.totalHoursRendered ?? 0),
        description: "Cumulative service hours",
        icon: Clock,
        accent: "info",
      },
      {
        title: "At-Risk",
        value: String(data?.deficiencies?.length ?? 0),
        description: "Students below threshold",
        icon: AlertTriangle,
        accent: "warning",
      },
    ],
    [totals, data?.deficiencies]
  )

  const quickActions = [
    { key: "upload", label: "Upload logs", desc: "Import biometric attendance data", Icon: Upload, tone: "linear-gradient(145deg, rgba(4,120,87,0.95) 0%, rgba(16,185,129,0.88) 55%, rgba(52,211,153,0.72) 100%)", onClick: () => navigate("/admin/upload") },
    { key: "attendance", label: "Attendance", desc: "Review attendance records", Icon: CalendarCheck, tone: "linear-gradient(145deg, rgba(8,31,92,0.95) 0%, rgba(20,71,166,0.82) 55%, rgba(59,130,246,0.72) 100%)", onClick: () => navigate("/admin/attendance") },
    { key: "students", label: "Students", desc: "Browse student directory", Icon: ArrowUpRight, tone: "linear-gradient(145deg, rgba(124,58,237,0.95) 0%, rgba(139,92,246,0.82) 55%, rgba(167,139,250,0.72) 100%)", onClick: () => navigate("/admin/students") },
    { key: "settings", label: "Settings", desc: "Manage policy and thresholds", Icon: Settings, tone: "linear-gradient(145deg, rgba(71,85,105,0.95) 0%, rgba(100,116,139,0.82) 55%, rgba(148,163,184,0.72) 100%)", onClick: () => navigate("/admin/settings") },
  ]

  if (loading && !data) {
    return (
      <PageShell title="Dashboard" description="Overview of student attendance and service hours.">
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-8 text-violet-600" />
        </div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell title="Dashboard" description="Overview of student attendance and service hours.">
        <div className={cn("rounded-2xl p-6 text-center text-sm text-red-600", containerShadowClassName)}>
          Failed to load dashboard: {error}
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Dashboard"
      description="Overview of student attendance and service hours."
      toolbar={
        <Select value={department || "all"} onValueChange={(v) => setDepartment(v === "all" ? "" : v)}>
          <SelectTrigger className={cn(fieldClassName, "w-full sm:w-[220px]")}>
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className={cn(containerClassName, "lg:col-span-2")}>
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">Monthly attendance trends</p>
            <p className="text-xs text-slate-500">Present days and hours over time</p>
          </div>
          <ChartContainer
            id="dashboard-monthly-trend"
            config={{
              presentDays: { label: "Present days", color: RATE_STROKE },
              hours: { label: "Hours", color: "#0ea5e9" },
            }}
            className="aspect-auto h-[280px] w-full"
          >
            <AreaChart data={monthlyTrends}>
              <defs>
                <linearGradient id="presentTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RATE_STROKE} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={RATE_STROKE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="presentDays" stroke={RATE_STROKE} fill="url(#presentTrend)" />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className={containerClassName}>
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">Status breakdown</p>
            <p className="text-xs text-slate-500">Attendance distribution</p>
          </div>
          {breakdown.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">
              No attendance data yet.
            </div>
          ) : (
            <ChartContainer
              id="dashboard-breakdown"
              config={Object.fromEntries(breakdown.map((e, i) => [e.name, { label: e.name, color: COLORS[i % COLORS.length] }]))}
              className="aspect-auto h-[220px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%" paddingAngle={3}>
                  {breakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className={containerClassNameLg}>
          <p className="mb-3 text-sm font-semibold text-slate-900">Hours by month</p>
          <ChartContainer
            id="dashboard-hours-bar"
            config={{ hours: { label: "Hours", color: "#10b981" } }}
            className="aspect-auto h-[240px] w-full"
          >
            <BarChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className={containerClassNameLg}>
          <p className="mb-3 text-sm font-semibold text-slate-900">Department comparison</p>
          <ChartContainer
            id="dashboard-dept-bar"
            config={{ avgAttendance: { label: "Avg attendance %", color: RATE_STROKE } }}
            className="aspect-auto h-[240px] w-full"
          >
            <BarChart data={data?.departmentComparison || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgAttendance" fill={RATE_STROKE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div className={cn("lg:col-span-3", containerClassNameLg)}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Upload history</p>
              <p className="text-xs text-slate-500">Recent biometric log imports.</p>
            </div>
            <button type="button" onClick={() => navigate("/admin/upload")} className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700", innerCardClassName)}>
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {recentUploads.length === 0 ? (
            <div className={cn("p-3 text-sm text-muted-foreground", innerCardClassName, "bg-violet-50/20")}>
              No import history yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recentUploads.map((item) => (
                <button key={item.id} type="button" onClick={() => navigate("/admin/upload")} className={cn("group w-full p-3 text-left transition hover:-translate-y-0.5", innerCardClassName, "bg-violet-50/30")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.fileName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.recordCount} records · {formatUploadTimestamp(item.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", uploadStatusStyles[item.status] || uploadStatusStyles.completed)}>
                      {item.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={cn("lg:col-span-2", containerClassNameLg)}>
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">Quick actions</p>
            <p className="text-xs text-slate-500">Shortcuts to common admin tasks</p>
          </div>
          <div className="space-y-2">
            {quickActions.map(({ key, label, desc, Icon, tone, onClick }) => (
              <button key={key} type="button" onClick={onClick} className={cn("group flex w-full items-center gap-3 p-3 text-left", innerCardClassName, "bg-violet-50/30")}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundImage: tone }}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{desc}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
