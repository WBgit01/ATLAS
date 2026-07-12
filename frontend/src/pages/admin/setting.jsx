import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  Lock,
  Mail,
  Save,
  ScrollText,
  Settings2,
  Shield,
  User,
} from "lucide-react"

import { AuditLogsPanel } from "@/components/settings/AuditLogsPanel"
import { PageShell } from "@/components/layout/PageShell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { fetchSettings, saveSettings } from "@/services/report.service"
import { getUser } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const innerShadowClassName =
  "border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-2px_rgba(76,29,149,0.44)]"

const fieldClassName =
  "h-10 border-0 bg-white/85 shadow-[0_2px_6px_-2px_rgba(76,29,149,0.34)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-2px_rgba(76,29,149,0.44)] focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:shadow-[0_2px_6px_-2px_rgba(76,29,149,0.38)]"

const sectionNavItems = [
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "attendance", label: "Attendance Rules", icon: CalendarClock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "audit-logs", label: "Audit Logs", icon: ScrollText },
]

function getInitials(name) {
  return (name || "AD")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function SettingsNav({ activeSection, onChange }) {
  return (
    <nav
      className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 lg:mx-0 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
      aria-label="Settings sections"
    >
      {sectionNavItems.map((item) => {
        const isActive = activeSection === item.id
        const Icon = item.icon

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition lg:w-full",
              isActive
                ? "bg-violet-600 text-white shadow-[0_2px_8px_-2px_rgba(124,58,237,0.55)]"
                : cn(innerShadowClassName, "text-slate-600 hover:text-violet-700")
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function SettingsSection({ title, description, icon: Icon, tone, children }) {
  return (
    <section className={cn("rounded-2xl p-4 sm:p-5", innerShadowClassName)}>
      <div className="mb-1 flex items-start gap-3 border-b border-violet-100/80 pb-4">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-1 ring-black/5"
          style={{ backgroundImage: tone }}
          aria-hidden
        >
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <div className="divide-y divide-violet-100/70">{children}</div>
    </section>
  )
}

function SettingRow({ label, description, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-3 last:pb-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        {htmlFor ? (
          <Label htmlFor={htmlFor} className="text-sm font-semibold text-slate-900">
            {label}
          </Label>
        ) : (
          <p className="text-sm font-semibold text-slate-900">{label}</p>
        )}
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      <div className="w-full shrink-0 sm:w-auto sm:min-w-[200px] lg:min-w-[240px]">
        {children}
      </div>
    </div>
  )
}

function SaveBanner({ visible, message }) {
  if (!visible) return null

  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
      <Check className="size-4 shrink-0" />
      {message}
    </div>
  )
}

function AccountSettings({ settings, onChange, saved, onSave }) {
  return (
    <div className="space-y-4">
      <SaveBanner visible={saved} message="Account profile updated successfully." />

      <SettingsSection
        title="Profile"
        description="Your admin account details visible across ATL."
        icon={User}
        tone="linear-gradient(145deg, rgba(124,58,237,0.95) 0%, rgba(139,92,246,0.82) 55%, rgba(167,139,250,0.72) 100%)"
      >
        <div className="flex flex-col items-start gap-4 py-4 sm:flex-row sm:items-center">
          <Avatar className="size-16 rounded-2xl">
            <AvatarFallback className="rounded-2xl bg-violet-100 text-lg font-semibold text-violet-700">
              {getInitials(settings.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900">{settings.name}</p>
            <p className="text-sm text-slate-500">{settings.email}</p>
            <Badge className="mt-2 border-violet-200/80 bg-violet-50 text-violet-700">
              {settings.role || "Administrator"}
            </Badge>
          </div>
        </div>

        <SettingRow label="Full name" description="Displayed in the sidebar and audit logs." htmlFor="settings-name">
          <Input
            id="settings-name"
            value={settings.name}
            onChange={(e) => onChange("name", e.target.value)}
            className={fieldClassName}
          />
        </SettingRow>

        <SettingRow label="Email address" description="Used for login and system notifications." htmlFor="settings-email">
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-500/80" />
            <Input
              id="settings-email"
              type="email"
              value={settings.email}
              onChange={(e) => onChange("email", e.target.value)}
              className={cn(fieldClassName, "pl-9")}
            />
          </div>
        </SettingRow>

        <SettingRow label="Department" description="Your assigned college or office unit." htmlFor="settings-department">
          <Input
            id="settings-department"
            value={settings.department}
            onChange={(e) => onChange("department", e.target.value)}
            className={fieldClassName}
          />
        </SettingRow>
      </SettingsSection>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSave}
          className="h-10 rounded-xl bg-violet-600 px-5 text-white hover:bg-violet-700"
        >
          <Save className="size-4" />
          Save profile
        </Button>
      </div>
    </div>
  )
}

function SecuritySettings({ passwordForm, onPasswordChange, showPasswords, onTogglePassword, saved, onSave, isSaving, error }) {
  return (
    <div className="space-y-4">
      <SaveBanner visible={saved} message="Password updated successfully." />

      <SettingsSection
        title="Password & access"
        description="Keep your admin account secure with a strong password."
        icon={Shield}
        tone="linear-gradient(145deg, rgba(8,31,92,0.95) 0%, rgba(20,71,166,0.82) 55%, rgba(59,130,246,0.72) 100%)"
      >
        {error && (
          <div className="mt-3 rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <SettingRow label="Current password" htmlFor="current-password">
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-500/80" />
            <Input
              id="current-password"
              type={showPasswords.current ? "text" : "password"}
              value={passwordForm.current}
              onChange={(e) => onPasswordChange("current", e.target.value)}
              className={cn(fieldClassName, "pr-10 pl-9")}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => onTogglePassword("current")}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-violet-50 hover:text-violet-700"
            >
              {showPasswords.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </SettingRow>

        <SettingRow label="New password" description="Minimum 6 characters." htmlFor="new-password">
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-500/80" />
            <Input
              id="new-password"
              type={showPasswords.next ? "text" : "password"}
              value={passwordForm.next}
              onChange={(e) => onPasswordChange("next", e.target.value)}
              className={cn(fieldClassName, "pr-10 pl-9")}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => onTogglePassword("next")}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-violet-50 hover:text-violet-700"
            >
              {showPasswords.next ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </SettingRow>

        <SettingRow label="Confirm new password" htmlFor="confirm-password">
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-500/80" />
            <Input
              id="confirm-password"
              type={showPasswords.confirm ? "text" : "password"}
              value={passwordForm.confirm}
              onChange={(e) => onPasswordChange("confirm", e.target.value)}
              className={cn(fieldClassName, "pr-10 pl-9")}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => onTogglePassword("confirm")}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-violet-50 hover:text-violet-700"
            >
              {showPasswords.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Session"
        description="Manage how your admin session behaves."
        icon={Fingerprint}
        tone="linear-gradient(145deg, rgba(71,85,105,0.95) 0%, rgba(100,116,139,0.82) 55%, rgba(148,163,184,0.72) 100%)"
      >
        <SettingRow label="Two-factor authentication" description="Add an extra layer of security to your login.">
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <Badge variant="outline" className="border-amber-200/80 bg-amber-50 text-amber-700">
              Coming soon
            </Badge>
            <Switch disabled aria-label="Two-factor authentication" />
          </div>
        </SettingRow>

        <SettingRow label="Auto sign-out" description="Sign out after 30 minutes of inactivity.">
          <Switch defaultChecked aria-label="Auto sign-out after inactivity" />
        </SettingRow>
      </SettingsSection>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="h-10 rounded-xl bg-violet-600 px-5 text-white hover:bg-violet-700"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Update password
        </Button>
      </div>
    </div>
  )
}

function AttendanceSettings({ settings, onChange, saved, onSave, saving }) {
  return (
    <div className="space-y-4">
      <SaveBanner visible={saved} message="Attendance rules saved successfully." />

      <SettingsSection
        title="Service hours & thresholds"
        description="Policy values used for attendance calculations and reporting."
        icon={AlertTriangle}
        tone="linear-gradient(145deg, rgba(180,83,9,0.95) 0%, rgba(245,158,11,0.82) 55%, rgba(251,191,36,0.72) 100%)"
      >
        <SettingRow label="Default required service hours" htmlFor="defaultServiceHours">
          <Input
            id="defaultServiceHours"
            type="number"
            value={settings.defaultServiceHours}
            onChange={(e) => onChange("defaultServiceHours", Number(e.target.value))}
            className={fieldClassName}
          />
        </SettingRow>

        <SettingRow label="Working days per month" htmlFor="workingDaysPerMonth">
          <Input
            id="workingDaysPerMonth"
            type="number"
            value={settings.workingDaysPerMonth}
            onChange={(e) => onChange("workingDaysPerMonth", Number(e.target.value))}
            className={fieldClassName}
          />
        </SettingRow>

        <SettingRow
          label="At-risk threshold"
          description={`Students below ${settings.atRiskThreshold}% attendance are flagged as at-risk.`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>50%</span>
              <span className="rounded-md bg-violet-50 px-2 py-0.5 tabular-nums text-violet-700">
                {settings.atRiskThreshold}%
              </span>
              <span>100%</span>
            </div>
            <Slider
              value={[settings.atRiskThreshold]}
              min={50}
              max={95}
              step={1}
              onValueChange={([value]) => onChange("atRiskThreshold", value)}
              aria-label="At-risk attendance threshold"
            />
          </div>
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Time thresholds"
        description="Late arrival and early departure rules."
        icon={CalendarClock}
        tone="linear-gradient(145deg, rgba(4,120,87,0.95) 0%, rgba(16,185,129,0.88) 55%, rgba(52,211,153,0.72) 100%)"
      >
        <SettingRow label="Late arrival threshold" htmlFor="lateThreshold">
          <Input
            id="lateThreshold"
            value={settings.lateThreshold}
            onChange={(e) => onChange("lateThreshold", e.target.value)}
            className={fieldClassName}
            placeholder="HH:MM:SS"
          />
        </SettingRow>

        <SettingRow label="Early departure threshold" htmlFor="earlyDepartureThreshold">
          <Input
            id="earlyDepartureThreshold"
            value={settings.earlyDepartureThreshold}
            onChange={(e) => onChange("earlyDepartureThreshold", e.target.value)}
            className={fieldClassName}
            placeholder="HH:MM:SS"
          />
        </SettingRow>
      </SettingsSection>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="h-10 rounded-xl bg-violet-600 px-5 text-white hover:bg-violet-700"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save rules
        </Button>
      </div>
    </div>
  )
}

function NotificationSettings({ settings, onChange, saved, onSave, saving }) {
  return (
    <div className="space-y-4">
      <SaveBanner visible={saved} message="Notification preferences saved successfully." />

      <SettingsSection
        title="Alert categories"
        description="Choose which types of events generate in-app notifications."
        icon={Bell}
        tone="linear-gradient(145deg, rgba(124,58,237,0.95) 0%, rgba(139,92,246,0.82) 55%, rgba(167,139,250,0.72) 100%)"
      >
        <SettingRow
          label="At-risk student alerts"
          description="Notify when a student's attendance drops below the at-risk threshold."
        >
          <Switch
            checked={settings.notifyAtRisk}
            onCheckedChange={(value) => onChange("notifyAtRisk", value)}
            aria-label="At-risk student alerts"
          />
        </SettingRow>

        <SettingRow
          label="Attendance summaries"
          description="Notify for attendance summaries, low section rates, and daily check-ins."
        >
          <Switch
            checked={settings.notifyAttendance}
            onCheckedChange={(value) => onChange("notifyAttendance", value)}
            aria-label="Attendance summaries"
          />
        </SettingRow>

        <SettingRow
          label="System events"
          description="Notify for imports, uploads, and other platform activity."
        >
          <Switch
            checked={settings.notifySystem}
            onCheckedChange={(value) => onChange("notifySystem", value)}
            aria-label="System events"
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Delivery"
        description="How notifications reach administrators."
        icon={Mail}
        tone="linear-gradient(145deg, rgba(8,31,92,0.95) 0%, rgba(20,71,166,0.82) 55%, rgba(59,130,246,0.72) 100%)"
      >
        <SettingRow
          label="Email notifications"
          description="Send copies of in-app alerts to the admin email address."
        >
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <Badge variant="outline" className="border-amber-200/80 bg-amber-50 text-amber-700">
              Coming soon
            </Badge>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(value) => onChange("emailNotifications", value)}
              disabled
              aria-label="Email notifications"
            />
          </div>
        </SettingRow>
      </SettingsSection>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="h-10 rounded-xl bg-violet-600 px-5 text-white hover:bg-violet-700"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save preferences
        </Button>
      </div>
    </div>
  )
}

function AuditLogsSettings() {
  return (
    <div className="space-y-4">
      <SettingsSection
        title="System activity"
        description="Administrative actions and security events recorded by the platform."
        icon={ScrollText}
        tone="linear-gradient(145deg, rgba(71,85,105,0.95) 0%, rgba(100,116,139,0.82) 55%, rgba(148,163,184,0.72) 100%)"
      >
        <div className="py-3">
          <AuditLogsPanel />
        </div>
      </SettingsSection>
    </div>
  )
}

export default function Settings() {
  const authUser = getUser()
  const [searchParams] = useSearchParams()

  const [activeSection, setActiveSection] = useState(() => {
    const section = searchParams.get("section")
    return sectionNavItems.some((item) => item.id === section) ? section : "account"
  })
  const [accountSettings, setAccountSettings] = useState({
    name: authUser?.name ?? "Admin User",
    email: authUser?.email ?? "admin@cahs.edu",
    department: "College of Allied Health Sciences",
    role: authUser?.role ?? "admin",
  })
  const [attendanceSettings, setAttendanceSettings] = useState({
    defaultServiceHours: 400,
    workingDaysPerMonth: 22,
    lateThreshold: "08:00:00",
    earlyDepartureThreshold: "17:00:00",
    atRiskThreshold: 75,
  })
  const [notificationSettings, setNotificationSettings] = useState({
    notifyAtRisk: true,
    notifyAttendance: true,
    notifySystem: true,
    emailNotifications: false,
  })
  const [loadingPolicy, setLoadingPolicy] = useState(true)
  const [policyRows, setPolicyRows] = useState([])
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" })
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false })
  const [passwordError, setPasswordError] = useState("")
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const [savedState, setSavedState] = useState({
    account: false,
    security: false,
    attendance: false,
    notifications: false,
  })

  useEffect(() => {
    const section = searchParams.get("section")
    if (section && sectionNavItems.some((item) => item.id === section)) {
      setActiveSection(section)
    }
  }, [searchParams])

  useEffect(() => {
    async function loadPolicy() {
      setLoadingPolicy(true)
      try {
        const rows = await fetchSettings()
        setPolicyRows(rows || [])
        const byKey = Object.fromEntries((rows || []).map((r) => [r.key, r]))
        setAttendanceSettings((prev) => ({
          ...prev,
          defaultServiceHours: byKey.defaultServiceHours?.value ?? prev.defaultServiceHours,
          workingDaysPerMonth: byKey.workingDaysPerMonth?.value ?? prev.workingDaysPerMonth,
          lateThreshold: byKey.lateThreshold?.value ?? prev.lateThreshold,
          earlyDepartureThreshold: byKey.earlyDepartureThreshold?.value ?? prev.earlyDepartureThreshold,
          atRiskThreshold: byKey.atRiskThreshold?.value ?? prev.atRiskThreshold,
        }))
        setNotificationSettings((prev) => ({
          ...prev,
          notifyAtRisk: byKey.notifyAtRisk?.value ?? prev.notifyAtRisk,
          notifyAttendance: byKey.notifyAttendance?.value ?? prev.notifyAttendance,
          notifySystem: byKey.notifySystem?.value ?? prev.notifySystem,
          emailNotifications: byKey.emailNotifications?.value ?? prev.emailNotifications,
        }))
      } catch (err) {
        toast.error(err.message || "Failed to load attendance settings")
      } finally {
        setLoadingPolicy(false)
      }
    }
    loadPolicy()
  }, [])

  const activeSectionMeta = useMemo(
    () => sectionNavItems.find((item) => item.id === activeSection),
    [activeSection]
  )

  const flashSaved = (section) => {
    setSavedState((prev) => ({ ...prev, [section]: true }))
    window.setTimeout(() => {
      setSavedState((prev) => ({ ...prev, [section]: false }))
    }, 3000)
  }

  const handleAccountChange = (field, value) => {
    setAccountSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field, value) => {
    setNotificationSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleAttendanceChange = (field, value) => {
    setAttendanceSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
    if (passwordError) setPasswordError("")
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSavePassword = async () => {
    setPasswordError("")

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordError("Please fill in all password fields.")
      return
    }

    if (passwordForm.next.length < 6) {
      setPasswordError("New password must be at least 6 characters.")
      return
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("New password and confirmation do not match.")
      return
    }

    setIsSavingPassword(true)
    await new Promise((resolve) => window.setTimeout(resolve, 800))
    setIsSavingPassword(false)
    setPasswordForm({ current: "", next: "", confirm: "" })
    flashSaved("security")
  }

  const handleSaveAttendance = async () => {
    setSavingPolicy(true)
    try {
      const updated = policyRows.map((row) => {
        if (row.key === "defaultServiceHours") return { ...row, value: attendanceSettings.defaultServiceHours }
        if (row.key === "workingDaysPerMonth") return { ...row, value: attendanceSettings.workingDaysPerMonth }
        if (row.key === "lateThreshold") return { ...row, value: attendanceSettings.lateThreshold }
        if (row.key === "earlyDepartureThreshold") return { ...row, value: attendanceSettings.earlyDepartureThreshold }
        if (row.key === "atRiskThreshold") return { ...row, value: attendanceSettings.atRiskThreshold }
        return row
      })

      await saveSettings(updated.map((r) => ({ key: r.key, value: r.value, description: r.description })))
      setPolicyRows(updated)
      flashSaved("attendance")
    } catch (err) {
      toast.error(err.message || "Failed to save attendance rules")
    } finally {
      setSavingPolicy(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSavingNotifications(true)
    try {
      const notificationKeys = ["notifyAtRisk", "notifyAttendance", "notifySystem", "emailNotifications"]
      const existingKeys = new Set(policyRows.map((r) => r.key))
      const updated = [...policyRows]

      for (const key of notificationKeys) {
        const value = notificationSettings[key]
        const existing = updated.find((r) => r.key === key)
        if (existing) {
          existing.value = value
        } else {
          updated.push({ key, value, description: "" })
        }
      }

      await saveSettings(updated.map((r) => ({ key: r.key, value: r.value, description: r.description })))
      setPolicyRows(updated)
      flashSaved("notifications")
    } catch (err) {
      toast.error(err.message || "Failed to save notification preferences")
    } finally {
      setSavingNotifications(false)
    }
  }

  if (loadingPolicy && (activeSection === "attendance" || activeSection === "notifications")) {
    return (
      <PageShell title="Settings" description="Admin account and attendance rule configuration.">
        <div className="flex justify-center py-20">
          <Spinner className="size-8 text-violet-600" />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Settings"
      description="Admin account and attendance rule configuration."
      actions={
        <div className="hidden items-center gap-2 sm:flex">
          <Settings2 className="size-4 text-violet-500" />
          <span className="text-xs font-medium text-muted-foreground">
            {activeSectionMeta?.label}
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <SettingsNav activeSection={activeSection} onChange={setActiveSection} />

        <div className="min-w-0 flex-1">
          {activeSection === "account" && (
            <AccountSettings
              settings={accountSettings}
              onChange={handleAccountChange}
              saved={savedState.account}
              onSave={() => flashSaved("account")}
            />
          )}

          {activeSection === "security" && (
            <SecuritySettings
              passwordForm={passwordForm}
              onPasswordChange={handlePasswordChange}
              showPasswords={showPasswords}
              onTogglePassword={togglePasswordVisibility}
              saved={savedState.security}
              onSave={handleSavePassword}
              isSaving={isSavingPassword}
              error={passwordError}
            />
          )}

          {activeSection === "attendance" && (
            <AttendanceSettings
              settings={attendanceSettings}
              onChange={handleAttendanceChange}
              saved={savedState.attendance}
              onSave={handleSaveAttendance}
              saving={savingPolicy}
            />
          )}

          {activeSection === "notifications" && (
            <NotificationSettings
              settings={notificationSettings}
              onChange={handleNotificationChange}
              saved={savedState.notifications}
              onSave={handleSaveNotifications}
              saving={savingNotifications}
            />
          )}

          {activeSection === "audit-logs" && <AuditLogsSettings />}
        </div>
      </div>
    </PageShell>
  )
}
